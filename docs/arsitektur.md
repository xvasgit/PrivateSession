# Architecture and Implementation Boundaries

## Current application

One local Next.js application uses App Router, Server Actions, Zod 4, Prisma 7 and PostgreSQL. Public Overview, Upload & Review, Live Transcription explanation and About pages share a responsive shell. `/sign-in/` authenticates a persistent account; `/meetings/` supplies the library, creation, detail and metadata editing. The library authentication HTTP boundary is `/api/auth/`; no companion import API exists.

Meeting actions verify the session, validate input, perform repository operations, revalidate pages and redirect outside mutation catch blocks. Review saves return a success message after revalidation. Inputs remain after rejection/network failure. Prisma P2002/P2003/P2025 map to safe errors; raw database fields and secrets are not logged.

## Persistence and encryption

`MeetingSession` has many `TranscriptSegment` children. IDs, case-sensitive session codes unique within an owner, compound `(sessionId, sequence)` uniqueness and the Restrict FK are preserved. Segment identity stays fixed on text edits. Delete-all uses one interactive transaction; ordinary deletion is rejected when children exist.

The additive review migration adds nullable `reviewCiphertext` and `reviewIv` to the parent. A database check requires both null or both present with a 12-byte IV and at least a 16-byte ciphertext/tag. Existing records start with no review; no seed overwrite or key rotation occurs.

The encrypted review payload is `{ version: 1, summary, insights, followUps }`. Every string is limited to 10,000 characters; whitespace-only fields normalize to empty, otherwise text is preserved. All-empty saves set both columns null. Review writes lock the parent row within a transaction, authenticate any current review, and then replace both fields atomically. Invalid stored content blocks editing and clearing, including submissions from a stale form.

The server imports the original Base64 32-byte key as non-exportable AES-256-GCM. Both transcript and review flows use fresh CSPRNG 12-byte IVs and 128-bit tags. Review AAD is `meeting-session:v1:meeting-review:v1:<id>`; transcript AAD is unchanged. Review JSON is validated again after authenticated decryption. This is server-readable encryption at rest, not end-to-end encryption or replay protection. Purpose-separated keys and rotation remain deferred.

## Access and privacy

Better Auth 1.7.18 uses the existing Prisma client with User, credential Account, Session, Verification and RateLimit tables. User role/status/initial-password flags are server-owned. A separate signing secret protects library cookies; password hashes use the library's salted scrypt. Sessions have an absolute eight-hour lifetime, survive restarts, and are checked against the database without cookie caching. Current account status is rechecked on every protected request. Logout removes its session; deactivation/password changes revoke all sessions.

Member and administrator share the same owner-only meeting policy. Administration exposes identity/status management only. No impersonation, role editing, existing-password reset, account deletion or member-content access is implemented. Profiles edit name/password, not email. Initial-password users may change password or sign out, but cannot read or mutate meetings/admin data. Library credential endpoints remain rate-limited HTTP operations, with strict origin/path boundaries and server Zod validation.

Meeting mutations lock/recheck the actor's user and session inside a transaction, then lock and require the owner-scoped parent. Deactivation uses the same user lock and revokes sessions. Child identity and ownership are verified through the parent before encryption/decryption/mutation. Pages scope queries to the authenticated owner; inaccessible and missing records share the same response. Proxy only assists missing-cookie navigation.

The additive migration creates a disabled credential-free `legacy-lab-member`, explicitly backfills every ownerless meeting, sets the required owner FK with Restrict, and changes uniqueness to `(ownerId, sessionCode)`. Bootstrap separately provisions initial credentials. Seed lookups and fixture cleanup include the owner. Existing IDs, timestamps, AAD, ciphertext, IV and key remain unchanged.

Text is sent intentionally to the same-origin server when forms are saved. Recording validation sends only filename/size; no file contents are read, uploaded or attached. Client storage, device capture and external AI requests are not used. Meeting metadata remains plaintext. Deletion removes live database records, not historical backups.

## Deferred companion and historical demos

The planned live companion will perform device capture and live assistance separately from this web library. No engine, synchronization contract or integration endpoint is implemented in this increment. Contextual Workspaces remains an Overview description.

The temporary request practicum and sample routes/UI have been removed. Original crypto workflow helpers and their fixtures remain for regression testing, not normal UI use. Submitted practicum documents/screenshots describe historical commits. The current Next configuration retains `agentRules: false` and a server runtime; static export is not enabled.
