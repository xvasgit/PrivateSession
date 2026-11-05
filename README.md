# PrivateSession

PrivateSession is a privacy-first meeting assistant for students and professionals. The intended product helps users retain live conversation context, review past recordings, and initialize context-specific AI workspaces. This foundation combines **PemWeb (PAW) Tugas 1** workflows with **Kriptografi Tugas 1** encryption demonstrations; KKSiber artifacts remain a separate design baseline.

## Current Tugas 1 Foundation

- **Overview (`/`):** feature descriptions and brief workflows; Live Transcription and Upload & Review are **In progress**, Contextual Workspaces is **Upcoming**.
- **Live Transcription (`/live/`):** validated title/context/consent form, selectable capture modes/sources, and an independent sample transcript with demo controls.
- **Upload & Review (`/upload/`):** local selection of one MP3/WAV/MP4/M4V/MOV file, explicit server-side metadata validation, error/removal states, and independent sample summaries, insights, follow-ups, and potential missed details.
- **Local encryption demos:** encrypt and verify a prepared live draft or the explicitly requested synthetic review using temporary keys; neither action saves or locks the visible text.
- Shared navigation with active indicators and an accessible informational **Sign In** dialog linking to the separate practicum demo; production accounts and durable saving remain upcoming.
- Reusable shell/navigation, cards, status badges, buttons, headings, fields, source selector, dialog, and sample-output components.

**This is an interactive UI demonstration, not a functioning recording or AI service.** No capture permissions, file-content reads, media uploads, inference, or MCP connections occur. **Validate selection** sends only filename and byte count; selection alone sends neither. Module 5 sends synthetic credentials/request fields to the same-origin server, sets an HttpOnly session cookie, and keeps requests in server memory. Live/upload previews reset on reload; Module 5 requests disappear on server restart. The separate Module 6 meeting lab persists manually entered synthetic metadata and encrypted transcript text in local PostgreSQL. Samples remain independent of inputs. Use only synthetic data. The fictional session library remains removed.

Planned workflow: choose consented sources → live transcript with timestamped screen context; or select a past recording → structured analysis and follow-ups. Upcoming workspaces will accept prompts, documents, images, and MCP connectors to ground a field-specific assistant. No workspace page is implemented yet.

## Local Development

Use Node.js 24 LTS and npm. In the local agent workspace, first enter `meeting-companion/`. In a standalone clone, use the clone root directly. Run these commands from the application repository root:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. Public UI workflows require no environment variables, model downloads, or database. For demo sign-in, configure the two synthetic lab variables described below.

| Command                           | Purpose                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                   | Lint, strict type checking, unit tests, and format check                                                                                    |
| `npm run build`                   | Build the Next.js application into `.next/`                                                                                                 |
| `npm start`                       | Run the built Next.js server on loopback port 3000                                                                                          |
| `npm test`                        | Run repeatable crypto and validation tests                                                                                                  |
| `npx playwright install chromium` | Install the E2E browser once                                                                                                                |
| `npm run test:e2e`                | After building, test navigation, setup, samples, encryption/reset/error flows, dialog accessibility, and privacy boundaries at three widths |
| `npm run audit:ui`                | Optional: with `npm start` running, regenerate nine screenshots, Lighthouse JSON reports, and a JSON audit manifest                         |

Current automated results are recorded in [evaluation](EVALUASI.md). The existing [Lighthouse PDF](docs/evidence/lighthouse/lighthouse-report.pdf) and `docs/evidence/viewports/` screenshots predate the new encryption controls; refresh visual/accessibility evidence for the final submission. Deleted JSON reports, audit manifest, and superseded evidence are not required to build or test. Automated results do not replace human accessibility review or individual demo preparation.

## Repository Layout

`app/` contains routes; `components/` contains reusable UI, including `encryption-preview.tsx`; `lib/workflows/` holds typed validation and synthetic previews; `lib/sessions/` retains legacy draft validation; `lib/crypto/` holds AES-GCM and the workflow adapter. `tests/` holds Vitest/Playwright checks; `security/` holds KKS artifacts; `docs/` holds requirements, architecture, traceability, and evidence. Git belongs to this application directory. In the local workspace, it is `meeting-companion/`; course instructions and agent files live in its parent, outside the repository. A standalone clone contains everything needed to build and test the UI.

The React/TypeScript/Tailwind UI is intended for reuse by a future desktop shell. This practicum branch uses a local Next.js runtime for routing and server-rendering exercises; a static export is no longer produced by the default build. Tauri is an architectural candidate, not an installed dependency. Local inference and capture adapters remain separate from the frontend. See [architecture](docs/arsitektur.md).

## Module 4 Practicum

`/about/` reuses the existing product description. `/upload/samples/` and its two detail pages demonstrate fictional review examples, nested layouts, templates, validated asynchronous route parameters, and a server-only data module. They do not restore the retired session library or save meeting data. Existing live/upload/encryption workflows are unchanged.

The [Module 4 technical document](docs/praktikum/modul-04.md) records checks and manual screenshot instructions. `/uji/lambat/` and `/uji/galat/` are temporary local fixtures retained until the student captures dev/production evidence; remove them and rebuild before completing the practicum. The existing KKS documents and earlier evaluation results describe the prior static-export baseline.

Module 4 screenshots are taken manually by the student. Playwright screenshot, video, and trace recording are disabled; do not use `audit:ui` for this module because it writes screenshots and replaces earlier audit evidence. In PowerShell environments that block `npm.ps1`, use `npm.cmd` and `npx.cmd` for the same commands.

## Module 5: Upload Metadata Validation (Partial)

Choose a recording to inspect its metadata, then select **Validate selection**. Zod 4 shares one schema between the picker and `app/upload/actions.ts`. The Server Action independently uses `safeParse`, returns typed field errors or validated metadata, and derives Audio/Video from the extension. Filenames require a supported final extension; sizes must be positive safe-integer byte counts. Missing, blank, fractional, malformed, negative, and zero sizes are rejected without an arbitrary recording-size limit.

`useActionState` provides pending and retry states. Replacing/removing a selection discards old responses; sample reviews and encryption remain independent. Explicit `FormData` contains only filename and size, never a `File`. The action does not log filenames or save data. Metadata validation cannot establish authenticity, actual file contents, or codec compatibility; client-provided metadata can be forged. Filenames can themselves reveal private information, so use synthetic names for demonstrations.

The public picker remains a stateless validation-only workflow. The separately removable practicum below implements demo sessions and record creation. Both require the Next.js runtime, not static hosting. See the latest [evaluation](EVALUASI.md) for executed checks and known dependency risks.

### Separate review-request practicum

Open **Upload & Review → Open the review-request practicum**, or `/demo-sign-in/`. Configure `DEMO_EMAIL` and `DEMO_PASSWORD` in ignored `.env.local` using a synthetic email and a lab-only password of at least eight characters. Blank variable names are supplied in `.env.example`; missing/invalid configuration fails closed. Never use personal credentials. Restart the local server after configuration changes.

The shared lab account creates temporary records at `/upload/practicum/new/` and lists them at `/upload/practicum/`. These are actual demo records, not fictional saved meetings. All users of the one configured account share its records; this is not production identity isolation. Each record contains a trimmed title (3–80), meeting type (Online Meeting/Lecture/Interview/Other), context (10–500), synthetic-data confirmation, server-derived owner, ID, and timestamp. No file is needed and no processing is scheduled.

The server checks session, Zod schema, and case-insensitive title uniqueness for the account before synchronously inserting. It then revalidates the list and redirects outside the mutation catch. The title rule is an educational semantic constraint, not a proposed restriction on real meetings. Controlled inputs and prevented automatic form reset retain entries after rejection/network failure.

`lib/practicum/` contains the schema and server-only in-memory stores; `components/practicum/` and the demo routes are separate from public workflows. Session identifiers use CSPRNG UUIDs, rotate on sign-in, expire after eight hours, and are revoked on logout. Cookie `private-session-demo` uses HttpOnly, SameSite=Lax, Path=/, Max-Age=28800, and Secure in production. The proxy checks presence only; every protected page/action verifies the session, and record access is scoped to its server-derived owner. Logout removes access, not records; server restart clears both stores. Do not deploy this single-process lab authentication as a production service.

Use `http://localhost` for browser cookie checks in the local lab; production cookies stay Secure. A production lab server can be started with `npx next start --hostname localhost --port 3101`. Use HTTPS for non-local access. Do not disable Secure to work around host differences.

### Manual evidence capture (pending)

No Module 5 technical document or screenshots are generated by this increment. Capture only synthetic examples, mask cookie values before saving/sharing images, and do not export HAR files.

1. Sign in and create a synthetic request. Capture the detail status and updated list; show no generated analysis.
2. On the new-request page, set `document.querySelector('form:has(#demo-title)').noValidate = true` in DevTools. Submit three separate invalid cases: a two-character title; an unsupported option added to the meeting-type select through Elements; and an unchecked confirmation. Capture each server field error and record expected/actual results. Restore a valid form between cases.
3. Submit a duplicate title to show semantic rejection and retained values.
4. Inspect **Application → Cookies** and the sign-in POST's **Network → Response Headers → Set-Cookie**. Show HttpOnly, SameSite, Path and expiry; verify Secure in production and its absence in development. Mask the entire cookie value. `document.cookie` must not reveal the demo cookie.
5. With a valid form already open, change the cookie value to `forged`, then submit. Capture the session-rejection message. Reloading a protected route must lead to demo sign-in.
6. Sign in again; keep the cookie value only temporarily in local memory for this manual test. Log out and verify cookie deletion. Reinsert the old value through Application, then visit the protected list: sign-in is required. Do not paste the value into logs, documents, or screenshots.
7. Record any discrepancies rather than claiming success. Expiry and ownership isolation have automated coverage; server restart should also clear the temporary records/session in a manual demonstration.

Playwright supplies fresh synthetic test credentials to its managed server without writing an environment file. Use `$env:PLAYWRIGHT_PORT='3101'; npm run test:e2e` if port 3000 is busy. For development cookie verification, use another port and `$env:PLAYWRIGHT_DEV='1'; npm run test:e2e -- tests/e2e/practicum.spec.ts --grep "cookie flags" --project desktop`; remove the environment overrides afterward. Screenshots, video, and traces remain disabled.

### Later removal

After preserving the assessed revision, a separately authorized cleanup may remove the Module 5 request routes/store/forms/tests. Module 6 now shares demo sign-in, sessions, proxy and environment keys: retain those controls while the meeting lab exists, or replace them under a separate authentication plan. Keep public media validation and its privacy tests. Never remove session checks while leaving lab records exposed. Keep the submitted revision and evidence reproducible; no cleanup, commits, or tags are performed automatically.

## Module 6 Meeting Database Lab

The local PostgreSQL 18 lab uses `MeetingSession` → `TranscriptSegment`. Open **Upload & Review → Open the meeting database lab**, sign in with the synthetic demo account, then follow the Module 6 link from the practicum list. `/meetings/`, `/meetings/new/`, `/meetings/[id]/` and `/meetings/[id]/edit/` provide session CRUD; the detail page adds, edits and deletes manually entered synthetic segments. The original Module 5 request store remains separate and temporary.

Every page/action verifies the same demo session. The two-table design intentionally has no owner columns: everyone using the shared lab account sees the same database records. Records survive restart/logout; sign-in sessions expire or disappear on restart. This is not production authentication or multi-user isolation.

Session codes are trimmed, case-sensitive and 1–64 characters; titles are trimmed and 3–80. Sequence numbers are positive PostgreSQL integers; transcript text is nonblank, at most 10,000 characters and preserved without trimming. Existing segment parent/sequence values cannot be edited. Field errors, pending feedback, network retry, empty/not-found/database-unavailable states and authenticated-decryption failure messages are included.

Create dedicated local databases `privatesession_dev` and `privatesession_shadow`, owned by the lab login. The latter is disposable migration scratch space and must never point to application data. In ignored `.env.local`, configure `DATABASE_URL`, `SHADOW_DATABASE_URL`, and the persistent `DATA_ENCRYPTION_KEY`; `.env.example` contains blank keys only. Prisma CLI/seed load `.env.local` explicitly, with existing process variables taking precedence. Connections are restricted to loopback and dedicated non-system databases. No Docker installation is required when using native PostgreSQL.

From the application root:

```powershell
npm ci
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:seed
npm run db:status
npm run db:verify
```

`npm ci` also generates the client through `postinstall`; the explicit generation command is retained for schema changes. Track `prisma/schema.prisma`, the migration directory, config, and seed sources. `generated/prisma/` is ignored and regenerated locally. Do not use reset commands against data you want to keep. The seed uses upserts, preserves existing rows, and authenticates every seeded segment. It initializes its own client so it can run outside Next.js without importing `server-only`.

`contentCiphertext` is binary ciphertext with its 16-byte authentication tag appended; `iv` is a fresh 12-byte nonce on creation and every text edit. AAD binds the format, numeric session ID, and immutable sequence. The server decrypts authenticated text for the signed-in detail view; this is encryption at rest, not end-to-end encryption. Titles, session codes, ordering, and timestamps remain plaintext. Database uniqueness covers session code and `(sessionId, sequence)`; the foreign key uses `Restrict`.

Ordinary deletion fails while segments exist. **Delete session and all segments** requires a separate confirmation and uses one transaction. Actions map real Prisma P2002/P2003/P2025 failures to safe messages, revalidate the meeting pages after success, and redirect outside the mutation catch. No raw database errors or submitted text are logged. Explicit lab forms transmit synthetic text to this local server; they never read or transmit selected recording contents.

Configure one Base64-encoded, cryptographically random 32-byte key once and retain it outside Git. Server operations import it as a non-exportable AES-GCM key; the seed and fresh-process verifier import the same configuration independently. Missing or malformed keys fail closed, and the application never silently replaces the key. Losing/changing it makes prior ciphertext unreadable. Protect a separate recovery copy; this local lab has no key rotation or automated recovery. The raw environment secret is still accessible to the server operator, and encryption does not prevent replay of older valid ciphertext at the same identity.

`db:verify` opens a new CLI process, authenticates seeded text and checks ciphertext-only storage. `npm run db:verify -- --seed-twice` additionally compares seed IDs, timestamps, counts, ciphertext and IV before/after two seed runs. No keys, credentials or transcript contents are printed.

Run the opt-in local database scenarios with `npm run db:test`. They target only `privatesession_dev`, create unique synthetic fixtures and clean up their own records. They test CRUD, P2002/P2003/P2025, identity binding, RESTRICT, transactional deletion and exact rollback. Failure injection exists only in the test script. Never point tests at the shadow database or use database reset commands.

After building, enable database browser cases explicitly in PowerShell:

```powershell
$env:PLAYWRIGHT_DATABASE='1'
$env:PLAYWRIGHT_PORT='3101'
npm run test:e2e -- --workers 2
Remove-Item Env:PLAYWRIGHT_DATABASE
Remove-Item Env:PLAYWRIGHT_PORT
```

Use a free port; the runner does not reuse an occupied server. Database browser cases are skipped by default, leaving ordinary UI tests independent of PostgreSQL. The known Turbopack worker failure can be bypassed locally with `npm run build -- --webpack`; the default build script is unchanged. The existing framework vulnerability remains a separate deployment blocker.

See the [Module 6 technical document](docs/praktikum/modul-06.md) and [actual evaluation](EVALUASI.md). The technical document embeds 18 student-captured screenshots and distinguishes historical tests from manual evidence. Its final transaction image shows confirmation before deletion; the completed transaction is supported by the database test output. Submission and Git publication remain the student's responsibility.

## Cryptographic Requirements

Encryption is intended to protect private meeting information when future storage/export exists. Today's integrations demonstrate the mechanism and verify recovery; the plaintext remains visible and synthetic fixtures remain in the build.

| Product asset                                             | Security objectives                           | Priority | Mechanism and current scope                                                               |
| --------------------------------------------------------- | --------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| Prepared title, context, source preferences, consent flag | Confidentiality, integrity, data authenticity | Medium   | AES-256-GCM round trip on `/live/`; temporary draft only                                  |
| Review summary, insights, follow-ups, possible gaps       | Confidentiality, integrity, data authenticity | High     | AES-256-GCM round trip on `/upload/`; fixed synthetic review only                         |
| Speech transcript and timestamped screen/OCR context      | Confidentiality, integrity, data authenticity | High     | Planned authenticated vault encryption; current transcript preview is not encrypted       |
| Original audio/video, screen images, workspace documents  | Confidentiality, integrity, data authenticity | High     | Planned encrypted storage and key lifecycle; selected media is neither read nor encrypted |

Here, data authenticity means authentication under the encryption key. It does not prove a speaker's identity, participant consent, authorship, or permission to share. Consent, account authentication, and export authorization require separate controls.

### Try the integrated component

1. On `/live/`, enter a synthetic title/context, choose valid sources, confirm consent, then **Prepare setup → Encrypt and verify draft**. Editing any input or preparing again clears the verification.
2. On `/upload/`, choose **Try sample analysis → Encrypt and verify sample review**. A file is not required. Selecting/removing one does not change the review or its encryption input; **Reset sample analysis** clears the result.
3. Wait for **Demo verified**, then optionally open **Inspect encrypted demo result**. Repeating the action creates a fresh key, artifact ID, and nonce. Failures show an error without a verified result. Use a supported browser on localhost or HTTPS.

### Input → Process → Output

- **Input:** `workflow-encryption.ts` snapshots `{kind, data}` JSON from validated `LiveSetup` fields or fixed `sampleAnalysis`. It generates a non-exportable AES-256 key with `crypto.subtle.generateKey` and a kind-prefixed ID using `crypto.randomUUID()`.
- **Process:** `session-encryption.ts` encodes JSON as UTF-8 bytes, creates a fresh 12-byte nonce via CSPRNG `crypto.getRandomValues`, and uses AES-GCM with a 128-bit tag. AAD is UTF-8 `meeting-session:v1:<artifactId>`, binding ciphertext to that context. Decryption authenticates before returning UTF-8 text; the adapter requires an exact match to the input. Reusing a nonce with the same key is forbidden.
- **Output:** only `{artifactId, envelope}` reaches UI state. The version-1 envelope contains `algorithm: "AES-256-GCM"`, `nonceHex`, and `ciphertextHex` (ciphertext followed by the 16-byte tag). UTF-8 and hex are encodings, not encryption. No key or decrypted text is returned by the adapter.

The key exists only for one operation and its reference is released afterward; JavaScript does not guarantee memory erasure. Results cannot be reopened later. This is not encrypted persistence, a lock screen, key recovery, or protection from scripts that can access the original page data. Real capture, media processing, and workspace encryption remain planned. The helper's public interface and envelope format are unchanged. See [decisions](KEPUTUSAN.md) and the [W3C Web Crypto AES-GCM specification](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/#aes-gcm).

After `npm ci` on Node.js 24, run all crypto component/adapter scenarios with one command:

```powershell
npm test -- tests/crypto
```

The original C-01–C-11 scenarios include four critical rejection tests (changed ciphertext/tag, wrong key/context). W-01–W-08 cover workflow payloads, temporary keys, fresh operations, validation, failures, availability, and snapshots. See [evaluation](EVALUASI.md) for executed results. For the full application, run `npm run check`, `npm run build`, then `npm run test:e2e`.

## Collaboration & Milestones

Use strict TypeScript, two-space indentation, ESLint/Prettier, and Conventional Commits. Include verification results and screenshots for UI changes in pull requests. Record AI assistance in [AI_LOG.md](AI_LOG.md). Never commit secrets or real meeting data. Keep capture visibly consented and security tests within the [owned local lab](security/README.md).

PAW/Kripto target the same `v0.1`; KKS targets `sec-0.1`; all share final `v1.0`. Review requirements, test results, refreshed accessibility evidence, and individual demo readiness before freezing a submission. This revision creates no commits, tags, or remotes; the user controls staging and committing. UI consent and mock Sign In are not production security controls.
