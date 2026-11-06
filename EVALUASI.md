# Initial Cryptographic Evaluation

Run `npm test` after `npm ci`. Runtime: Node.js 24 Web Crypto; browser integration is verified by `npm run test:e2e`. Test IDs are embedded in test names and linked in `docs/keterlacakan.md`.

| Scenarios | Goal                                                              | Critical |
| --------- | ----------------------------------------------------------------- | -------- |
| C-01–C-03 | Round trip, Unicode/empty boundary, fresh nonce/ciphertext        | No       |
| C-04/C-05 | Altered ciphertext/authentication tag rejected                    | Yes      |
| C-06/C-07 | Wrong key/session context rejected                                | Yes      |
| C-08/C-09 | Altered nonce, malformed/truncated/unsupported envelopes rejected | No       |
| C-10/C-11 | Non-exportable AES-256 key and required session context           | No       |
| V-01–V-04 | Valid draft, length constraints, source selection, consent        | No       |

Executed on 2026-10-13 with Node.js v24.13.0 and Vitest 5.0.4: **15/15 unit tests passed**, including **4/4 critical crypto tests**. Playwright 1.64.0 with Chromium 156.0.8078.4 passed **9/9 browser checks** at 390/768/1280 px, including local encryption and consent. Mutation failures are exceptions with no returned plaintext. Nonce sampling is a sanity check, not proof that collisions are impossible. See `docs/evidence/verification.md` for audit details and limitations.

Limitations: the library samples are plaintext synthetic fixtures; encryption protects a temporary draft only. No persistent vault, native capture, model, recovery, encrypted index, authorization layer, or locked-device protection has been tested. Future validation must include persistent key lifecycle, export/delete handling, permission revocation, and native storage boundaries.

## PemWeb Revision Status — 2026-10-13

The results above describe the earlier frontend and remain historical. The crypto implementation and C-01–C-11/V-01–V-04 regression tests are preserved, but the encryption UI and session-library routes are removed. Current Playwright checks validate PemWeb workflows, not browser crypto integration. The component must be reconnected and reverified before claiming integrated crypto readiness; see `docs/evidence/verification.md` for current regression results.

## Reconnected Workflow Evaluation — 2026-10-13

This later revision supersedes the disconnected status above. `/live/` verifies a validated prepared draft; `/upload/` verifies only an explicitly requested synthetic review. Both use `encryptAndVerifyArtifact` and the unchanged `session-encryption.ts` component. A successful result requires authenticated decryption and exact recovery; it is not a saved or locked record.

After `npm ci`, run `npm test -- tests/crypto` for the 21 crypto/component integration cases. Run `npm run check`, `npm run build`, and `npm run test:e2e` for full verification; first install Chromium with `npx playwright install chromium` and stop your own port-3000 preview server before E2E starts its managed server.

| Added scenarios     | Verified behavior                                                                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-01/W-02           | Exact live-draft and fixed-review payloads round-trip; only envelope/ID returned, no key/plaintext                                                                                                  |
| W-03                | Repeated operations use distinct keys, contexts, nonces, and ciphertext                                                                                                                             |
| W-04                | Invalid draft rejected before key generation                                                                                                                                                        |
| W-05 (three cases)  | Key generation, encryption, and decryption failures reject instead of returning success                                                                                                             |
| W-06/W-07           | Recovered-text mismatch and unavailable crypto fail closed                                                                                                                                          |
| W-08                | Draft snapshot remains unchanged by edits during asynchronous work                                                                                                                                  |
| Browser integration | Action gating, fresh results, keyboard-operated inspection, edit/reprepare/reset, late-result suppression, busy state, failure/retry, unavailable/insecure-context messages, and media independence |

Executed on Windows with Node.js 24.13.0, npm 11.6.2, Vitest 5.0.4, Next.js 16.4.0, Playwright 1.64.0, and Chromium 156.0.8078.4:

- `npm run check`: lint, strict types, **44/44 unit tests**, and formatting passed. Includes all **11/11 original crypto tests**, **4/4 critical negative tests**, and **10/10 new adapter cases**.
- `npm run build`: static export passed for Overview, Live Transcription, and Upload & Review.
- Browser suite: **45/45 passed** (15 journeys at each of 390×844, 768×1024, and 1280×800). Privacy guards covered both encryption actions without capture, media reads, storage writes, external requests, or content-sending requests. Expanded results did not cause horizontal overflow; mobile live and desktop review panels were visually inspected.

Execution notes: the sandbox build failed at Windows path canonicalization; the approved build outside the sandbox passed. Port 3000 was occupied, so the existing server was left untouched. The full E2E suite passed using a temporary configuration on loopback port 3101, inheriting the same tests/projects and serving the same `out/` build. The temporary configuration was removed afterward; the normal command remains on port 3000. An initial temporary TypeScript config under `node_modules` was rejected by Node's type-stripping rules and replaced by JavaScript before the successful run.

The existing Lighthouse PDF and viewport evidence predate these controls and were not regenerated. Refresh them before claiming a current accessibility score; deleted JSON/audit/superseded artifacts were not restored. No fresh dependency audit, remote CI run, second-machine clean clone, persistence/key-recovery test, or release tag is claimed. Keys are temporary; original text remains accessible and JavaScript memory erasure is not guaranteed. Human review and individual explanation remain pending.

## Upload Metadata Validation — 2026-10-23

This increment applies Module 5's shared Zod 4 schema, Server Action, typed field errors, and React pending-state patterns to Upload & Review only. It does not implement authentication, cookies, record creation, media processing, or full Module 5 completion. Explicit validation transmits filename and byte count to the same-origin server; neither selecting a file nor sample/encryption actions transmit media contents.

- `npm run check`: lint, strict types, formatting, and **61/61 unit tests passed**, retaining existing crypto regression tests.
- Direct-action tests reject no selection, empty/unsupported/disguised filenames, missing/blank/whitespace/zero/negative/fractional/malformed/infinite/unsafe/hexadecimal sizes, and File-valued metadata. Category is derived rather than trusted; schema boundary checks retain the safe-integer ceiling without an arbitrary recording-size cap.
- `npm run build`: production Next.js runtime build passed on retry. The first attempt stopped after compilation with the installed framework's security warning.
- `npm run test:e2e`: default invocation could not start because port 3000 was occupied. The same suite with a temporary port-3101 configuration passed **72/72 tests**, at 390×844, 768×1024, and 1280×800; the existing server was not stopped.
- Browser checks cover explicit metadata-only submission, keyboard activation, server-tampered field errors, failure/retry, pending duplicate prevention, removal/replacement during submission, stale responses, samples, encryption, and privacy guards against media reads/transmission, external requests, and persistence.

No screenshots, Lighthouse reports, or historical assessment artifacts were regenerated. Existing evidence does not establish accessibility scores for these new controls. Metadata validation cannot prove authenticity, actual contents, or codec compatibility; filenames may disclose sensitive information.

Dependency status: `npm audit --omit=dev --json` reported the existing Next.js 16.4.0 dependency as vulnerable, including critical advisories, with 16.4.2 offered as a fix. Zod was not listed as vulnerable. A framework security upgrade and subsequent regression tests are still required before deployment; no automatic audit fix was applied. Historical static-export and no-metadata-transmission descriptions above are superseded for this increment. No Git publication or tags were changed.

## Removable Review-Request Practicum — 2026-10-27

Implemented a separate synthetic lab workflow rather than changing the public metadata picker. Four-field Zod validation, session → schema → semantic rule → insertion → revalidation → redirect, owner-scoped in-memory records, demo sign-in/logout, server-side session revocation, and optimistic proxy checks are now implemented. This is not production authentication, durable storage, encrypted record persistence, or media processing.

Executed results:

- `npm run check`: lint/types/format and **89/89 unit tests passed**, including 28 new practicum cases and all existing crypto/media regressions.
- `npm run build`: final production runtime build passed; protected demo pages are dynamic and the proxy is included. Earlier build/dev starts stopped at the existing Next.js security reminder and succeeded on retry. No framework upgrade was made.
- `PLAYWRIGHT_PORT=3101 npm run test:e2e` (PowerShell environment assignment): **96/96 production browser tests passed**, including 24 practicum cases across 390×844, 768×1024, and 1280×800.
- Development cookie/lifecycle browser test: **1/1 passed** on desktop using `PLAYWRIGHT_PORT=3102` and `PLAYWRIGHT_DEV=1`. Production keeps Secure enabled; development omits it. Both verify HttpOnly, SameSite=Lax, Path=/, eight-hour lifetime, rotation, logout deletion, and replay rejection without printing cookie values.

| Case / input                                         | Expected outcome                                    | Actual outcome and evidence                                                |
| ---------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| Title `ab`, HTML validation disabled                 | Server field error, no record                       | Passed in direct-action and all three browser projects                     |
| Forged meeting-type option, HTML validation disabled | Server enum error, no record                        | Passed in direct-action and all three browser projects                     |
| Missing confirmation, HTML validation disabled       | Server confirmation error, no record                | Passed in direct-action and all three browser projects                     |
| Blank/81-character title                             | Schema rejection                                    | Passed unit checks                                                         |
| 9/501-character context                              | Schema rejection                                    | Passed unit checks                                                         |
| Unchecked/malformed confirmation                     | Schema rejection                                    | Passed unit checks                                                         |
| Case-insensitive duplicate title                     | Semantic rejection; original record retained        | Passed store/action/browser checks                                         |
| Missing/forged session                               | No authorized mutation; protected pages redirect    | Passed action/proxy/browser checks                                         |
| Eight-hour expiry                                    | Session invalid; mutation rejected                  | Passed fake-clock store/action checks; not an eight-hour browser wait      |
| Cookie reused after logout or rotation               | Server rejects revoked identifier                   | Passed unit and browser checks                                             |
| Another owner's record ID                            | No record returned                                  | Passed store ownership check; malformed/unknown IDs also tested in browser |
| Unknown submitted owner field                        | Cannot override session owner                       | Passed schema/action checks                                                |
| Simulated storage/network failure                    | Generic error, retained fields, retry succeeds      | Passed unit/browser checks                                                 |
| Valid synthetic request                              | One temporary record, list refresh, detail redirect | Passed all browser projects                                                |

Testing found and fixed React's automatic select/checkbox reset after an action failure by preventing the form reset. Cookie-header inspection uses full response headers; logout assertions wait for the exact home URL. The shared dialog keyboard test now includes the added demo link.

Public privacy guards remain intact. Demo-specific checks allow only intended same-origin Server Action forms and the demo cookie; no file input, media-content read/transmission, external service, localStorage/sessionStorage writes, or IndexedDB use was observed. Test credentials are synthetic and supplied only to the managed test server.

Manual screenshots and the Module 5 technical document remain pending by request. README contains capture/redaction steps and later-removal boundaries. No screenshots, video, traces, HAR files, real credentials, unredacted cookie artifacts, or technical-document file were created. Historical evidence is unchanged. No Git staging, commits, pushes, or tags were performed. Existing framework vulnerabilities remain a deployment blocker.

## 2026-11-02 - Module 6 local database foundation

Implemented the student's MeetingSession/TranscriptSegment design with Prisma 7.10.1 and native PostgreSQL 18.4. Both dedicated loopback databases were verified empty before migration. The student's key configuration was corrected locally without displaying or replacing the key.

| Verification                               | Actual result                                                                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| db:validate / db:generate                  | Schema valid; Prisma Client 7.10.1 generated                                                                                 |
| Initial migration                          | 20261102152914_init_meeting_transcripts reviewed and applied to privatesession_dev, using separate privatesession_shadow     |
| Structure                                  | Two tables, SERIAL primary keys, unique sessionCode, unique (sessionId, sequence), BYTEA ciphertext/IV, RESTRICT foreign key |
| db:seed twice                              | Both runs succeeded; direct final count confirmed 2 synthetic sessions and 3 segments                                        |
| db:status                                  | One migration; schema up to date                                                                                             |
| db:verify in fresh processes               | Three segments authenticated and matched fixture text; ciphertext-only storage checked                                       |
| npm run check                              | Lint, types, formatting and 118/118 unit tests passed, including 29 new crypto/config cases                                  |
| Config with empty DB environment variables | Loads for client generation without credentials; migration checks still require development/shadow configuration             |
| Default npm run build                      | Failed at Turbopack CSS-worker process startup, both inside and outside sandbox                                              |
| npm run build -- --webpack                 | Production build passed; existing routes preserved                                                                           |
| Secret/generated exclusions                | .env.local and generated Prisma client ignored; manifest/lock dependencies match                                             |

The standalone seed owns its Prisma client and uses transactional upserts without overwriting existing records. The binary adapter reuses the unchanged AES-GCM helper, imports the persistent lab key, and binds AAD to session ID and sequence. Existing UI crypto demonstrations remain temporary. Fresh CLI processes demonstrate key reimport, not an application restart/recovery drill.

An auxiliary before/after seed snapshot command failed without logging contents; only the successful direct seeds, final counts and fresh-process decryption are claimed above. A lockfile-only offline npm refresh encountered an uncached optional package. No dependency upgrade was made for that issue; existing lockfile install-script metadata was updated and manifest/lock consistency verified.

This foundation does not complete Module 6: current pages do not use these tables. Database CRUD, ownership integration, safe user-facing Prisma errors, explicit RESTRICT/rollback proof, ten CRUD/relationship scenarios, manual screenshots and docs/praktikum/modul-06.md remain pending. No browser suite was rerun because UI behavior was unchanged. Default Turbopack build failure and the known Next.js vulnerability warning remain unresolved; no framework upgrade or build-script switch was made. No Git staging, commits, pushes, tags or automatic screenshots.


## 2026-11-02 - Module 6 meeting CRUD and transaction lab

Implemented the approved separate /meetings list/new/detail/edit workflow, segment CRUD, shared-account session protection, Zod validation, safe Prisma errors, encryption on writes, authenticated reads and confirmed transactional deletion. The existing schema, migration, seed fixtures, persistent key, Module 5 workflow and public media/privacy boundaries are preserved. This entry supersedes the foundation's pending-CRUD status without changing that historical record.

| Verification | Actual result |
| --- | --- |
| npm run check | Passed: ESLint, TypeScript, 146/146 unit tests in 10 files, Prettier |
| npm run db:status | Existing single migration is up to date; no migration/reset required |
| npm run db:test | 13/13 scenarios passed against privatesession_dev; unique synthetic fixtures cleaned up |
| npm run db:verify -- --seed-twice | Passed: two repeat seeds left IDs, counts, timestamps, ciphertext and IV unchanged; 2 fixture sessions / 3 segments authenticated in a fresh process |
| Default npm run build | Failed again at Turbopack CSS-worker process startup |
| npm run build -- --webpack | Final production build passed; four new dynamic meeting routes included |
| Full production browser suite | 111/111 passed at 390/768/1280 px on managed localhost:3101 with PLAYWRIGHT_DATABASE=1 |
| Final targeted browser check | 15/15 meeting cases passed after maximum-length title/code wrapping and stricter same-origin assertions |
| Documentation / exclusions | 12 relative document links resolve; local environment, generated client, dependencies, build and test output ignored |

Database scenarios cover session creation/read/update/empty deletion; encrypted segment creation/exact decryption/fresh-IV edit/deletion; actual P2002 duplicates; actual P2003 orphan/RESTRICT failures; P2025 stale records and mismatched child/parent identity; successful transactional deletion; and complete rollback. The rollback test deletes its fixture's children, deliberately throws, then compares all original IDs, timestamps and encrypted bytes. Last run before/after: 1 session / 1 segment; identical snapshot SHA-256 cd071c2e8815ae830cf0187accb8f9b33e00c035e94df2f257ad365a29a5f06c. This checksum is verification evidence, not encryption.

Browser cases exercise both entity workflows, field errors and retained inputs, real stale-form P2025, duplicates, confirmation bypass, network retry/pending feedback, missing/forged session rejection, invalid IDs, corrupt stored ciphertext and synthetic-only same-origin form/privacy checks. Existing Module 4/5, public workflows and crypto regression cases passed in the full suite. Final boundary check uses an 80-character unbroken title and 64-character code without horizontal overflow.

Earlier attempts encountered a test TypeScript union issue, an unresolved Vitest alias, an overly broad string assertion and ambiguous Playwright text/alert locators; these were corrected before the passing results. The sandbox Webpack attempt failed writing generated output (EPERM); the approved outside-sandbox build succeeded. Next.js also stopped builds to display its existing vulnerability notice; retries succeeded, but no framework upgrade was made and the deployment blocker remains. Default Turbopack remains unresolved.

No automated screenshots, video, trace or HAR files were captured. Student steps are in docs/evidence/module-06-capture-guide.md; the actual Module 6 technical document, manual evidence and personal explanation are still pending. No ownership isolation, production accounts, media processing or complete native encrypted vault is claimed. No Git staging, commit, push, branch or tag changes.


## 2026-11-05 — Meeting-library revision verification

This entry supersedes descriptions of active sample/practicum routes above; historical results remain unchanged. The current application uses a shared local sign-in, persistent meeting/transcript CRUD, encrypted manual summary/insight/follow-up notes, and metadata-only recording validation. It is not a complete Tugas 2 or production security release.

| Check | Actual result |
| --- | --- |
| Pre-migration backup | Custom PostgreSQL dump created outside the Git repository; pg_restore catalog verified. Original key unchanged. |
| Additive review migration | Applied successfully; two migrations up to date, client regenerated explicitly. |
| Existing data preservation | SHA-256 comparison of all original meeting/segment fields matched before/after migration and after all test cleanup. |
| npm run check | ESLint, TypeScript, 133/133 unit tests across 12 files and formatting passed. Retired demo UI tests replaced with current product tests; crypto regressions retained. |
| npm run build | Failed at the existing Turbopack CSS-worker startup. No default-script or dependency change. |
| npm run build -- --webpack | Production build passed; only current product routes remain. |
| npm run db:test | 13/13 real CRUD, constraint and rollback scenarios passed; own fixtures cleaned up. |
| Database-enabled production browser suite | 48/48 passed at 390/768/1280 widths using two workers on localhost:3101. Final run exited 0 outside the sandbox. |
| Restart regression script | Passed: transcript/review persisted across an actual owned server restart; old session rejected; new sign-in decrypted saved text. Own fixture/server cleaned up. |
| npm run db:verify | Failed because LAB-M06-REVIEW is absent; LAB-M06-LECTURE has two segments. This pre-existing fixture deletion was not repaired or hidden. No seed rerun. |

Browser cases verify encrypted review save/edit/clear, pending feedback, retry, server-side length rejection, tampered existing review refusal with unchanged bytes, corrupt transcript display, CRUD/stale-form errors, explicit destructive confirmation, logout/replay, metadata-only selection, removed-route 404s and responsive navigation. Unit crypto cases cover wrong keys, IV/tag/ciphertext mutations, AAD mismatch and authenticated malformed JSON. Tests do not claim KKS roles or private account isolation.

Initial browser failures were assertion issues (a broad alert locator also matched the Next.js announcer; a trailing-slash URL assertion did not wait for logout). These were corrected before the final passing run. Sandbox runs completed all corrected assertions but hung during process teardown; only their owned runners were stopped, and the full suite was repeated outside the sandbox. The restart script also initially matched a hidden textarea as well as visible transcript text; its locator was narrowed and the check rerun successfully.

No automatic screenshots, videos, traces or HAR files were captured. Student evidence and Module 4–6 documents remain untouched. Known framework vulnerability findings remain unresolved; no security upgrade was performed. Manual walkthrough is in README. No staging, commits, pushes, tags or branch switching occurred.


## 2026-11-06 — Persistent accounts and ownership verification

This entry supersedes the previous shared-account access limitation. It does not supersede the recorded framework vulnerability, complete all Tugas 2 work, or claim deployment readiness. The student restored the missing seed before this increment; current seed verification now passes.

| Check | Actual result |
| --- | --- |
| Preservation and restore rehearsal | Custom PostgreSQL dump/catalog and protected local configuration backups retained outside Git. Restored original data into the separately created `privatesession_auth_rehearsal`; migration/rollback rehearsal preserved original fields before applying to development. |
| Accounts migration | Applied as the third migration with required legacy ownership and per-owner code uniqueness; original 3 meeting / 4 segment contents retained. |
| Final preservation and bootstrap | Original meeting/segment SHA-256 matches after tests. Repeat bootstrap leaves account credentials/status unchanged; original encryption key retained. |
| `npm run check` | ESLint, TypeScript, 145/145 unit tests across 12 files, and formatting passed. Crypto regression tests retained. |
| `npm run db:test` | 13/13 real CRUD, relationship, duplicate, stale-record and rollback scenarios passed; synthetic fixtures cleaned up. |
| `npm run db:verify -- --seed-twice` | Two fixture meetings / three authenticated segments verified. Repetition preserved IDs/counts/timestamps/ciphertext/IV and fresh-process decryption succeeded. |
| `npm run test:access` | 12 positive and 12 negative access cases passed. Additional password, session-expiry/forgery/revocation, changed-secret, development-cookie and actual HTTP 429 checks passed. |
| `npm run build` | Existing default Turbopack CSS-worker failure persists. |
| `npm run build -- --webpack` | Production build passed. Next.js first interrupted compilation with its existing vulnerability notice; retry exited 0. No framework upgrade. |
| Database-enabled production browser suite | 63/63 passed at 390/768/1280 px with two workers on owned localhost:3101. Includes final rate-limit configuration. |
| Actual restart regression | Passed on the final production build: session, transcript and review survive a real owned-server restart; logout-revoked cookie remains rejected after another restart. |
| Dependency audit | 14 findings: 9 moderate, 4 high, 1 critical. The critical Next.js finding remains a deployment blocker; audit JSON retained outside Git, no automated dependency upgrades. |

The access matrix is documented in [security/access-tests.md](security/access-tests.md). Browser checks cover initial password replacement, own-profile changes, administrator provisioning/status restrictions, owner-only content including direct Server Action tampering, blocked unused auth endpoints/untrusted origins, production cookies, replay rejection, pending/retry behavior and existing metadata-only media boundaries. Negative access checks compare content state before/after denial. Successful role tests do not demonstrate OS hardening or remove the running server/operator's ability to decrypt stored content.

Verification exposed and corrected an auth-handler trailing-slash mismatch and a library option that disabled rate limiting along with IP tracking. The final handler normalizes the routed URL; the local configuration ignores forwarding headers while retaining the library's shared fallback bucket. Test-only locator/React form-tampering issues were corrected, and the complete suite passed afterward. One empty synthetic administrator left by an interrupted earlier browser run was identified by exact fixture ID/name/email/timestamp and removed without touching the provisioned administrator or legacy records.

No automated screenshots, video, trace or HAR were captured. Student screenshots and historical practicum documents remain unchanged; new manual evidence is still student work. No staging, commits, pushes, tags or branch changes. Linux baseline scans, hardening, SBOM, final three-course evidence and dependency remediation remain separate work.


## 2026-11-06 — Tugas 2 evidence consolidation

Current assessment matrices are [PemWeb CRUD/validation](docs/testing/pemweb-tugas-2.md) and [cryptography scenarios/results](docs/testing/crypto-tugas-2.md). The former maps eight CRUD and two relationship cases to student screenshots and the recorded owner-aware database run; it does not claim new manual database inspections.

During documentation, npm test -- tests/crypto tests/database/review.test.ts --reporter=verbose passed 44/44 tests across five files (23:45 local time, exit 0). The twelve documented crypto scenario groups are a separate denominator. This run uses in-memory data and mocked repository calls; earlier real-database/browser/restart evidence remains separately dated. No database mutations or screenshot edits were performed.
