# Engineering & Cryptographic Decisions

## ADR-001 — Shared Static Frontend

Use root Next.js App Router, React, TypeScript, and Tailwind for PAW and future desktop UI reuse. Build as a static export. Avoid server-dependent capture/inference/data storage: privacy-first operations belong on the user's device. Tauri is a candidate; no native shell or model stack is selected. A separate backend/database is not needed for the current Tugas 1 prototype.

## ADR-002 — Authenticated Local Session Encryption

Use standard Web Crypto AES-256-GCM with 128-bit authentication tags, CSPRNG-generated 96-bit nonces, and session-ID AAD. Ciphertext/tag and nonce serialize to hex. Nonce uniqueness per key is mandatory; random generation is appropriate for this limited demo, while production invocation limits/key lifecycle need explicit design.

Authenticated encryption protects confidentiality and detects mutation; encoding/plain hashes alone do not. Standard browser/Node Web Crypto keeps this component portable and avoids custom ciphers. No external crypto dependency is required. See [Web Crypto encryption documentation](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt).

## ADR-003 — Temporary Demo Keys, Durable Vault Deferred

Generate non-exportable keys per draft in memory; encrypt and authenticate a round trip, then discard the key reference. No key/plaintext persistence or network request occurs. This intentionally demonstrates a component, not a reusable encrypted storage system. Durable key management/recovery, encrypted search, native disk protection, and export authorization must be implemented and tested before real sessions.

Revision note (2026-10-13): these component decisions remain unchanged. The PemWeb revision disconnects encryption from the UI; current pages do not generate draft keys or invoke this workflow. Crypto reintegration is separate future work.

## ADR-004 — Reconnect Prepared Draft and Synthetic Review (2026-10-13)

The later crypto revision supersedes the disconnection status above. Reuse the unchanged AES-GCM helper through a typed workflow adapter and shared client preview. Prepared live drafts contain title/context/mode/source preferences/consent; sample reviews contain only the fixed analysis fixture. Media selection never enters the crypto payload.

Each operation creates a fresh key and kind-prefixed random artifact ID, seals JSON under the existing AAD namespace, decrypts, and compares the exact recovered string before returning only the ID/envelope. Keys are neither displayed nor persisted. API/authentication failures fail closed; unavailable Web Crypto produces a localhost/HTTPS hint. Reset/edit/reprepare invalidates pending UI results.

This meets the basic component integration goal without adding storage or recovery. Visible plaintext and synthetic fixtures remain accessible; it offers no locked-page or persistent-data protection. Real benefit for saved/exported meeting data requires a later durable key lifecycle. Identity, consent, and sharing authorization remain separate mechanisms. Parameters follow the [W3C AES-GCM API definition](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/#aes-gcm).

## ADR-005 — Local Encrypted Transcript Database Foundation (2026-11-02)

Use the student's proposed MeetingSession/TranscriptSegment schema for the Module 6 local PostgreSQL 18 lab. Keep binary ciphertext plus its GCM tag in `contentCiphertext` and the 12-byte nonce in `iv`; do not persist transcript plaintext or encryption keys in these tables. The new adapter reuses the unchanged AES-GCM helper, whose AAD prefix wraps `transcript-segment:v1:<sessionId>:<sequence>`. Preserve numeric session/sequence identity for a stored segment. Existing browser demonstrations retain their per-operation temporary keys.

A dedicated server-only loader imports a persistent 32-byte Base64 lab key from ignored local environment configuration as a non-exportable CryptoKey. Standalone seed/verification entry points import the same key through the pure adapter, without importing Next.js server-only modules. Environment misconfiguration fails closed; no automatic key generation or replacement. Process restart reimports the configured original key. Key rotation/version migration is deferred; all lab records currently use one version-1 format and one configured key. The operator must retain the original key and a protected separate recovery copy.

This is encryption at rest against disclosure of database contents without the key. It does not protect against the running server/operator, plaintext metadata disclosure, or replay of an older valid ciphertext at the same identity. Random IVs suit this small synthetic lab; production key-use limits and nonce lifecycle need a separate design. Decryption failures return a generic message and no plaintext. The prototype has no per-user ownership columns; no database UI or multi-user authorization is claimed by this foundation.

Use a separate manually created shadow database for migrations, upsert seed data without overwriting existing rows, and keep the seed transactional. The foreign key uses Restrict to prepare the subsequent explicit deletion/rollback exercise; that full CRUD/rollback increment is not implemented here. PostgreSQL connections are restricted to the owned loopback lab. The earlier static-export decision describes the historical Tugas 1 baseline; current Next.js runtime and standalone database tooling are the lab execution model.

## ADR-006 — Shared-Account Meeting Lab and Explicit Transactions (2026-11-02)

The approved Module 6 increment adds independent /meetings routes, linked from Upload & Review and the authenticated practicum list. Preserve the two-table design without owner columns and reuse the single synthetic lab account; all people sharing it access the same records. Every page/action verifies the server session. Production ownership requires a separate schema/authentication design.

Persist only manually entered synthetic text. The server encrypts before storing and authenticates/decrypts for authorized rendering; this is at-rest encryption, with plaintext metadata and no protection against the running server/operator. Existing segment parent/sequence are immutable, and text edits receive fresh IVs. Public crypto demonstrations retain their independent ephemeral keys and never process selected media.

Keep onDelete: Restrict. Ordinary deletion demonstrates the constraint; a separate checkbox-confirmed operation deletes children and parent inside an interactive transaction. A deliberate throw exists only in the integration script to prove complete rollback. Safe Prisma errors support duplicate/relationship/stale-form recovery without exposing submitted values. Keep the current migration and original key; no resets or silent key regeneration.

Module 5 request cleanup must retain the shared session/sign-in/proxy infrastructure while this lab depends on it. The technical document follows implementation and manual evidence capture; no automatic screenshots or Git operations are part of this increment.


## ADR-007 — Meeting Library and Encrypted Manual Review (2026-11-05)

Replace the practicum/sample UI with the meeting library, retaining the existing local single-account gate under local-auth and /sign-in. Preserve the cookie/environment names and eight-hour process-local session semantics; no production password-hash, ownership or RBAC claim. Submitted practicum documents and screenshots are historical, while their obsolete routes are removed. Live capture becomes an informational companion page; recording selection still submits metadata only.

Store summary, insights and follow-ups as a single version-1 encrypted JSON review in two nullable MeetingSession BYTEA fields, rather than introducing an unfinished task/workspace model. Both fields must be null or valid-length populated together. Reuse the original external AES-256-GCM key, fresh 12-byte CSPRNG IV, appended 128-bit tag and review-specific AAD `meeting-session:v1:meeting-review:v1:<id>`. Existing transcript ciphertext/AAD remains compatible. Purpose-specific keys/rotation remain deferred and must not silently invalidate existing records.

Review saves lock the parent row inside a transaction and authenticate any previous review before replacement or clearing. Schema-invalid or unauthenticated stored content blocks editing rather than becoming an empty form; text/key/database failures leave prior bytes unchanged. All three fields save together, whitespace-only values normalize to empty, and all-empty clears both encrypted columns. Metadata remains plaintext; the server/operator can decrypt content and valid-ciphertext replay is not prevented. Preserve the original key and protected database backup outside Git.


## ADR-008 — Persistent Accounts and Owner-Scoped Meetings (2026-11-06)

Replace the shared process-local gate with pinned Better Auth 1.7.18, its Prisma adapter and PostgreSQL-backed accounts/sessions. Use the maintained library's salted scrypt password handling and signed HttpOnly/SameSite=Lax cookies, Secure in production, with an absolute eight-hour lifetime. Disable cookie caching and session renewal. Keep the persistent authentication signing secret separate from the unchanged content-encryption key. Logout revokes its session; successful password changes and account deactivation revoke all sessions. Restart preserves valid database sessions. Native credential HTTP endpoints retain database rate limiting; forwarded-IP headers are not trusted in this loopback configuration, so counters share a per-path bucket. Reverse-proxy identity configuration is deferred.

Provision one initial administrator and the synthetic legacy member through an explicit, repeat-safe local script; there is no public registration. Initial credentials require replacement before meeting/admin access. Members update their own display name/password; administrators create members and activate/deactivate them. Email/role changes, impersonation, account deletion and resetting another account's password remain unavailable. Administrators have no private-content bypass. Return sanitized authentication responses without bearer tokens.

Preserve original IDs, relationships, timestamps, ciphertext, IVs, key and migration history. The transactional accounts migration creates a disabled credential-free legacy member, assigns existing meetings explicitly to it, then requires ownership and per-owner code uniqueness. Bootstrap adds credentials separately. Mutations derive identity from the verified session, recheck active status/session/initial-password restrictions inside the transaction, and enforce parent ownership before content operations. Deactivation and mutations lock the relevant user rows. Missing and inaccessible records have the same response. Seed and tests scope lookups/cleanup by owner.

Before development migration, restore the external PostgreSQL dump into the dedicated rehearsal database, rehearse migration rollback and compare original-field checksums. Retain protected local configuration recovery copies outside Git; Windows DPAPI copies depend on the same Windows user and are not portable exports. Bootstrap must preserve existing credentials/status when rerun. Password hashing does not replace AES-GCM and does not make server-readable content end-to-end encrypted. Purpose-separated content keys, Linux/container hardening, dependency remediation and production recovery remain separate work.
