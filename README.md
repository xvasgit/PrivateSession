# PrivateSession

PrivateSession keeps after-meeting transcripts and manual review notes together. The web application is the meeting library; a separate live companion and Contextual Workspaces remain planned.

## What works now

- **Overview:** the original three feature descriptions; Live Transcription and Upload & Review are In progress, Contextual Workspaces is Upcoming.
- **Meetings:** create, view, edit, and delete meeting records and transcript segments stored in PostgreSQL. Paste text manually; no transcription engine is invoked.
- **Manual reviews:** save optional summary, insights, and follow-ups together. These are user-written notes, not AI output or scheduled tasks.
- **Upload & Review:** select MP3/WAV/MP4/M4V/MOV and explicitly validate filename/size. File contents stay on-device; this does not upload a recording, create a meeting, or check codecs. The manual-transcript link opens meeting creation independently.
- **Live Transcription:** explains the planned companion capture/consent workflow; no device access or synthetic playback.
- **Accounts:** persistent email/password login, mandatory initial-password replacement, display-name/password management, and a private library per owner. Administrators create and activate/deactivate members without access to their private meeting content. Use synthetic information in this lab.

This revision replaces the practicum/demo interfaces with a persistent meeting workflow. It does not complete all Tugas 2 requirements or establish production readiness.

## Run locally

Use Node.js 24. From the outer agent workspace, enter `meeting-companion/`; from a standalone clone, use the clone root. For a new clone, copy `.env.example` to ignored `.env.local` and fill values privately. For an existing installation, preserve `.env.local` and add only missing settings; never overwrite its original encryption key:

- `DATABASE_URL`: owned local PostgreSQL development database, currently `privatesession_dev`.
- `SHADOW_DATABASE_URL`: a separate disposable migration database, currently `privatesession_shadow`; never point it at application data.
- `DATA_ENCRYPTION_KEY`: the original Base64-encoded 32-byte CSPRNG key. Do not change or regenerate an existing key: prior ciphertext depends on it. Keep a protected recovery copy outside Git.
- `BETTER_AUTH_SECRET`: a separate persistent CSPRNG secret (at least 32 characters); never reuse the content-encryption key. Generate locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64'))"` and put the output only in ignored local configuration.
- `BETTER_AUTH_URL`: exact application origin, such as `http://localhost:3000`; use the same hostname throughout the session.
- `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `LEGACY_MEMBER_PASSWORD`: initial synthetic account credentials. Passwords need 12–128 characters. Supply them privately, run bootstrap once, then remove these three bootstrap values after storing credentials securely. They are not runtime authentication configuration.

For a new installation, provision the two local databases and one persistent random key before seeding. Do not use real credentials or meeting information in tests. Public informational pages and metadata validation do not require database configuration.

```powershell
npm ci
npm run db:generate
npx prisma migrate deploy
npm run auth:bootstrap
npm run db:seed
npm run db:status
npm run dev -- --webpack
```

Use `http://localhost:3000/sign-in/` and sign in with the provisioned administrator or `legacy-lab@example.invalid`. Keep the same hostname throughout sign-in and navigation. PowerShell users can use `npm.cmd`/`npx.cmd` if execution policy blocks their `.ps1` shims. The normal `dev`/`build` scripts remain unchanged; Webpack is the local fallback for the recorded Turbopack worker failure.

Migration deploy applies committed migrations; `npm run db:migrate` is for authoring future migrations. Never reset an existing database. The accounts migration assigns existing records to the credential-free disabled legacy member, then enforces required ownership and per-owner code uniqueness. Bootstrap separately provisions the administrator and legacy credential; it never resets existing credentials or status. Existing IDs, ciphertext, review content, and encryption key remain unchanged. No account is publicly registered or automatically email-verified. Seed upserts preserve existing records; running seed deliberately restores missing seed fixtures.

## Try the revised workflow

1. Sign in, replace the initial password when prompted, and sign in again. Choose **New meeting** with a synthetic title and code unique within your library.
2. Add sequence `1` with synthetic transcript text. Edit it, reload, and confirm the saved text remains.
3. Open **Edit review**, enter summary/insights/follow-ups, and save. Reload to verify all three sections.
4. Save all review fields empty to clear them. Invalid input leaves current database content unchanged and retains form entries for correction.
5. Stop only your own server and start it again. Saved meetings and unexpired sessions remain. Signing out revokes the session even across subsequent restarts.
6. Confirm segment deletion or full meeting deletion explicitly. Deleting a nonempty meeting using the empty-only action is rejected; confirmed full deletion removes children and parent in one transaction.
7. Visit Upload & Review and select a recording. Metadata validation must not attach media or populate your meeting notes.

Screenshots are taken manually by the student. Historical screenshots are not evidence of this revision.

## Storage, privacy, and cryptography

Manual forms send text to the same-origin server for validation and storage. `MeetingSession` and its related `TranscriptSegment` records persist after restarts. Meeting title/code/creation time and segment ordering are plaintext metadata. Transcript and review content use AES-256-GCM with a fresh 12-byte CSPRNG IV and a 16-byte authentication tag appended to ciphertext, stored as BYTEA.

- Transcript AAD is `meeting-session:v1:transcript-segment:v1:<sessionId>:<sequence>`; existing records remain compatible.
- Review AAD is `meeting-session:v1:meeting-review:v1:<meetingId>`. Its encrypted JSON contains `version: 1`, `summary`, `insights`, and `followUps`; each field permits at most 10,000 characters.
- Both flows import the existing key as non-exportable. No key is generated automatically. Purpose-specific key derivation/rotation remains future work.
- Invalid keys, ciphertext, tags, IVs, identities, or review payloads fail closed. An unreadable saved review cannot be edited/cleared silently. Atomic review writes authenticate existing content before replacement.
- The server decrypts text for display: this is encryption at rest, not end-to-end encryption. It does not prove authorship/consent or prevent replay of older valid ciphertext at the same identity. Backups can retain deleted records.

Authentication uses Better Auth 1.7.18 and persistent PostgreSQL sessions. Its session cookie is HttpOnly, SameSite=Lax, Path=/, Secure in production, with an eight-hour absolute lifetime and no cookie cache or automatic extension. Old demo cookies are rejected. Logout revokes the current session; password changes and deactivation revoke all sessions. Reactivation requires fresh sign-in. Passwords use independently salted scrypt (N=16384, r=16, p=1, 64-byte derived hash, 16-byte random salt); the library applies NFKC normalization. Password hashes and bearer session tokens are sensitive authentication records and must never appear in screenshots, logs, or Git.

Members manage only their own meetings and profile. Administrators create members and control member status; they cannot impersonate members, reset existing passwords, assign roles, delete accounts, or bypass ownership. First-login password replacement is server-enforced. Public registration, email changes, email delivery/recovery, and social login are disabled. Account email/name, ownership, role/status and session metadata are plaintext database fields. Authentication is not end-to-end encryption.

Credential requests use the library HTTP handler with same-origin protection and database rate limits (10 sign-in attempts / 10 seconds, 5 password changes / 10 seconds). In this loopback lab, untrusted forwarded-IP headers are ignored and counters are shared; configure trusted proxy identity deliberately during the separate infrastructure increment. Only sign-in, sign-out, session lookup and password change are exposed under `/api/auth/`; account administration uses protected Server Actions.

No microphone/screen capture, media storage, AI requests, MCP, or client-side storage of meeting text is implemented. Keep the original key and database backup private; never commit `.env.local`, passwords, cookies, or real meeting data.

## Verification commands

| Command                             | Purpose                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `npm run check`                     | Lint, types, unit tests, formatting                                                  |
| `npm test -- tests/crypto`          | Current crypto and retained historical adapter regression tests                      |
| `npm run build`                     | Default production build; current local Turbopack failure remains recorded           |
| `npm run build -- --webpack`        | Local production build fallback                                                      |
| `npm start`                         | Serve the production build on loopback                                               |
| `npm run db:test`                   | Real CRUD, relationship and transaction checks using isolated synthetic fixtures     |
| `npm run db:verify`                 | Verify expected seed content with the original key in a fresh process                |
| `npm run db:verify -- --seed-twice` | Compare existing fixture records across repeated seed runs                           |
| `npm run test:e2e`                  | Public navigation, persistent accounts, ownership and metadata tests at three widths |

After building and installing Chromium with `npx playwright install chromium`, enable database browser cases:

```powershell
$env:PLAYWRIGHT_DATABASE='1'
$env:PLAYWRIGHT_PORT='3101'
npm run test:e2e -- --workers 2
Remove-Item Env:PLAYWRIGHT_DATABASE
Remove-Item Env:PLAYWRIGHT_PORT
```

Use a free port; tests never reuse an occupied server. Database tests create uniquely identified synthetic records and clean up only their own fixtures. Run `node scripts/test-meeting-restart.mjs` after building to verify persistence across a restart using its own loopback server and synthetic fixture; it verifies the session and saved text survive restart, then checks that logout/replay remains rejected after another restart and cleans up. See [actual results and limitations](EVALUASI.md). The previously recorded framework vulnerability remains unresolved; no upgrade or deployment claim is included here.

Run `npm run test:access` for the paired access-control matrix. It uses the owned, separately created `privatesession_auth_rehearsal` database (same local role/connection, separate database name) with current migrations. The user initially creates it in pgAdmin; tests never reset a database. It creates and removes only its own synthetic accounts/meetings. For manual account/cookie evidence, follow [the access test document](security/access-tests.md).

## Tugas 2 test evidence

- [PemWeb CRUD and validation results](docs/testing/pemweb-tugas-2.md): eight CRUD scenarios, two relationship scenarios, three Zod rejection cases, and links to the student's screenshots. Database and browser results are distinguished from visible UI evidence.
- [Cryptography scenario and result matrix](docs/testing/crypto-tugas-2.md): current transcript/review protection, tampering and wrong-key rejection, IV/AAD tests, no-write checks, and a dated focused test run.

These documents describe the current working revision. The final commit and `v0.2` tag remain the student's responsibility.

## Source and historical submissions

`app/` holds routes/actions, `components/` shared UI, `lib/meetings/` validation/repositories, `lib/auth/` authentication and authorization, `lib/crypto/` encryption helpers, and `prisma/` schema/migrations/seed. `security/` retains the KKS baseline; access-control evidence is in [security/access-tests.md](security/access-tests.md); infrastructure hardening remains separate work.

The [Module 4](docs/praktikum/modul-04.md), [Module 5](docs/praktikum/modul-05.md), and [Module 6](docs/praktikum/modul-06.md) documents and student screenshots are historical submissions. Their demo routes and code references describe those revisions, not today's interface. Use Git history (`e170f42`, `5ca0b5f`, `a91cbc0`) when reproducing them. Submitted tags remain unchanged. Retained demo crypto helpers/fixtures are regression-only and are not imported by the current UI.

See [requirements](docs/kebutuhan.md), [architecture](docs/arsitektur.md), [traceability](docs/keterlacakan.md), [decisions](KEPUTUSAN.md), and [AI log](AI_LOG.md). The user controls all Git publication and eventual `v0.2` / `sec-0.2` tagging.
