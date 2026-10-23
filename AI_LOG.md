# AI Usage Log

## 2026-10-13 — Codex Engineering Onboarding

- Tool / Agent: Codex (OpenAI coding agent), Core Software Engineer & Project Structure Maintainer.
- Purpose: Customized contributor initialization, multi-agent role registration, and Tugas 1 shared-repository planning.
- Prompt summary: Create `AGENTS.md` and root `.codex/` storage, read existing Markdown excluding assignment PDFs, preserve other agents' entries, and identify whether all courses can share a repository and its Git root.
- AI output: `AGENTS.md`, `.codex/config.toml`, `.codex/README.md`, `.codex/skills/README.md`, `.codex/monorepo-plan.md`, and additive Codex entries in `RULES.md` and `PROGRESS.md`.
- Changes / interpretation: Distinguished existing documentation from planned source/tooling; proposed conventions where no history exists; retained the current separate Git/scaffolding step.
- Agent verification: Compared the recommendation with all existing course summaries; checked official Codex configuration and skill discovery documentation; checked generated files, guide length, and preservation of existing shared entries. Runtime build/tests are unavailable before scaffolding.
- Human verification / edits: Pending user review; no student verification or implementation execution is claimed.

## 2026-10-13 — Markdown Extension Normalization

- Tool / Agent: Codex, Core Software Engineer & Project Structure Maintainer.
- Purpose / prompt: Explain root `AGENTS.md` placement and change uppercase Markdown extensions to lowercase.
- AI output: Four filename renames; matching course-document heading and monorepo-plan reference edits; appended progress and AI usage entries.
- Verification: Checked official instruction discovery documentation, filename inventory, and references. Preserved course content and historical log entries. No runtime tests were needed for these documentation changes.
- Human verification / edits: Pending user review.

## 2026-10-13 — Meeting Assistant Tugas 1 Foundation

- Tool / Agent: Codex, Core Software Engineer & Project Structure Maintainer.
- User prompt / scope: Initialize one project repository for all three courses' Tugas 1. User selected a consented, privacy-first desktop meeting assistant with on-device processing and encrypted local sessions.
- AI output: Root Git initialization, frontend/routes/components, synthetic fixtures, local Web Crypto AES-GCM component, 15 unit tests, 9 viewport browser checks, build/lint/format tooling, CI, architectural/course evidence documents, and KKS inventory/DFD/12 threats/five risks. Generated screenshots and Lighthouse JSON reports.
- Changes / rationale: Chose static export for future desktop frontend reuse; used standard Web Crypto with CSPRNG and session-bound AAD; kept the actual demo ephemeral and future native features explicitly planned. Preserved other agents' entries and excluded assignment PDFs from inspection.
- Verification / corrections: Lint/typecheck/format/build passed; 15 unit and 9 browser checks passed; all critical tests passed. Fixed an ambiguous E2E alert selector and selected ESLint 9 for current Next.js plugin compatibility. Three desktop Lighthouse Accessibility scores were 100. Production dependency audit reported zero vulnerabilities. See `docs/evidence/verification.md` and `EVALUASI.md`.
- Human verification / edits: Pending user review and oral-defense preparation. No student verification, native capability, hosted CI result, or production-vault security is claimed.

## 2026-10-13 — Static Export Verification Follow-up

- Tool / Agent: Codex, Core Software Engineer & Project Structure Maintainer.
- Purpose: Ensure browser checks exercise the built desktop-compatible static frontend.
- Output: Playwright now starts `npm start`; setup/evidence documentation records build-before-test ordering.
- Verification: 9/9 production-static browser checks passed after the earlier 9/9 development-server run. Initial local commit is `712679c`; human review and hosted publication remain pending.

## 2026-10-13 — Clean Repository Layout Migration

- Tool / Agent: Codex, Core Software Engineer & Project Structure Maintainer.
- User authorization / purpose: Separate Tugas 1 project deliverables from local course/agent instructions; restart local Git with one clean initial commit and preserve a recoverable backup.
- Output: Moved four course summaries and the assignment PDF directory into ignored `instructions/`; excluded agent directories and root guidance/progress; updated active local references and self-contained README collaboration guidance. Retained project code, tests, tooling, documentation, evidence, and this academic AI log.
- Preservation: Old Git metadata and both prior commits remain in a sibling backup outside the repository. Earlier entries and historical commit IDs are retained as an audit trail; those IDs refer to the backed-up original history.
- Verification: SHA-256 equality for all 19 moved files; prior log contents retained; no application/tooling changes; publishable documentation links and ignore boundaries checked. Lint/typecheck/formatting, 15 unit tests, static build, and nine browser checks passed. Windows sandbox build access required approved execution outside the sandbox.
- Human verification / remaining scope: User review pending. No GitHub remote, push, or milestone tag is created by this migration.

## 2026-10-13 — Separate Application Git Root from Agent Workspace

- Tool / Agent: Codex, Core Software Engineer & Project Structure Maintainer.
- User authorization / purpose: Move all application and Tugas 1 deliverables into `meeting-companion/`, keep agent/course material in the outer workspace, delete the obsolete outer Git metadata, and create one fresh inner initial commit.
- Output: Relocated the 65 project files and installed dependencies; removed obsolete local-guidance exclusions; configured Next.js `agentRules: false`; updated active workspace references and standalone/local README commands. Regenerated only disposable build/test caches. No application feature or public interface changed.
- Preservation / history: Course instructions, source, committed evidence, and prior log entries were preserved. Current outer history `30f2323` was deleted as requested; the earlier sibling backup holding the two original commits was left untouched. Historical entries retain their original paths and commit references.
- Verification: Lint/types/formatting, 15 unit tests, static build, and nine browser checks passed from the new app directory. Development returned HTTP 200 without generating app-local `AGENTS.md`. Documentation links, Git-root separation, secret/build exclusions, and source/instruction checksums were checked. Sandbox Windows path/socket restrictions required approved external verification.
- Human review / publication: Pending user review; no GitHub remote, push, or milestone tag is created by this migration.

## 2026-10-13 — PemWeb Feature-First UI Revision

- Tool / Agent: Codex, Core Software Engineer & Project Structure Maintainer.
- Purpose / brief prompt: Implement the approved three-page PemWeb revision with feature status, selectable live capture preferences, metadata-only recording selection, explicit synthetic previews, and mock Sign In; preserve crypto/KKS and leave Git to the user.
- Output used: Current routes/components, typed workflow validation and sample data, unit/browser tests, route audit configuration, and updated product requirements/architecture/traceability. Retired fictional library and encryption UI; preserved historical evidence separately.
- Adjustments: Samples stay independent of user input/media; no recording, uploads, media-content reads, storage, authentication, or MCP. Mode defaults and audio restrictions enforced; accessible native dialog supports Escape and focus return. Existing crypto helper/regression tests remain disconnected from the UI.
- Verification: Pending final checks, static build, browser scenarios, and refreshed nine-viewport/Lighthouse evidence. Stale generated Next.js type caches were removed; source files and historical log entries were preserved.
- Human verification: Student review and individual explanation remain pending. No staging, commits, tags, remotes, or pushes are part of this revision.
- Final agent verification: `npm run check` passed lint/types/formatting and 34/34 unit tests; `npm run build` exported the revised routes; `npm run test:e2e` passed 24/24 across three widths. Refreshed nine screenshots and three Lighthouse Accessibility 100 reports. Visually inspected desktop overview/upload and mobile live setup. Historical logs, archived evidence, crypto implementation/tests, and Git metadata preservation checked. Local bodyless HEAD navigation probes were confirmed in the trace and allowed by the corrected privacy assertion; device/media/storage guards remained unused. Sandbox Windows path restrictions required approved external build/browser/audit runs. See `docs/evidence/verification.md`; student verification is still pending.

## 2026-10-13 — Verification Evidence & Audit Re-verification

- Tool / Agent: Antigravity, Documentation Specialist & Knowledge Architect.
- Purpose / prompt: Re-verify `docs/evidence/verification.md` against actual repository artifacts and update it to reflect the user's manual addition of the visual Lighthouse report PDF and explicit client-side form validation tests.
- AI output: In-place text replacements inside `docs/evidence/verification.md` linking `lighthouse-report.pdf` alongside the programmatic JSON reports, and specifying the seven client-side form validation test criteria.
- Adjustments / rationale: Preserved existing structure and formatting; added no meta-confirmation notes within `verification.md`; verified all 34 unit tests, strict typecheck, ESLint, and Prettier formatting passing.
- Verification: `npm run check` and `npm run format:check` executed and verified passing.
- Human verification / edits: User independently provided and uploaded `lighthouse-report.pdf` to `docs/evidence/lighthouse/`.

## 2026-10-13 — Cryptography Reconnected to Revised Workflows

- Tool / Agent: Codex (OpenAI coding agent), Core Software Engineer & Project Structure Maintainer.
- Purpose / prompt: Execute the approved live-draft and sample-review encryption/verification plan and align README requirements, architecture, limitations, and demonstration steps.
- Component used / output: New `lib/crypto/workflow-encryption.ts`, shared `components/encryption-preview.tsx`, integration in live setup and upload review, adapter/browser tests, and engineering documentation. Existing `session-encryption.ts` API/envelope and C-01–C-11 tests remain unchanged.
- Design decisions: Snapshot validated draft fields or fixed sample analysis; use fresh non-exportable keys and kind-prefixed random artifact IDs; authenticate/decrypt and compare exact text before returning only ID/envelope. Reset/unmount suppresses stale completion; pending actions cannot duplicate. No selected file data is encrypted and original text remains visible. No persistence or identity/consent proof is claimed.
- Verification method: Checked installed Next.js client/static-export guidance and the [W3C AES-GCM specification](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/#aes-gcm). `npm run check` passed 44 unit tests plus lint/types/format; static build passed; full E2E suite passed 45 checks across three widths. Includes all 11 crypto regressions/four critical negative tests, 10 adapter cases, and browser lifecycle/error/privacy checks. Visually inspected expanded mobile-live and desktop-review results.
- Execution corrections: Windows sandbox path access required approved build execution outside the sandbox. Port 3000 was occupied, so a temporary JavaScript configuration served the same build on 3101 for E2E; existing server and permanent test configuration remained untouched. The temporary TypeScript variant was rejected by Node before switching to JavaScript.
- Evidence / preservation: Kept KKS/course artifacts, historical logs, original crypto source/tests, and the user's Lighthouse PDF. Did not restore deleted JSON/manifests/superseded evidence or regenerate submission audits; updated evaluation flags the required screenshot/PDF refresh. No staging, commits, tags, remotes, or pushes.
- Human verification / edits: Student review, oral explanation, evidence refresh, and release decisions remain pending; agent-run checks are not human verification or a production security assessment.

## 2026-10-13 — Official Name: PrivateSession

- Tool / Agent: Codex, Core Software Engineer & Project Structure Maintainer.
- Purpose / prompt: Rename the application from Meeting Companion to the user's official name, PrivateSession.
- Output: Updated shared header, Overview branding, page metadata, README, requirements, and outer guidance; synchronized npm manifest/lockfile name to `private-session`.
- Verification: `npm run check` passed lint/types/formatting and 44 unit tests; production build passed. Inspected all three exported HTML pages for the new title/header and checked package-name consistency. Existing behavior tests were reused; no new tests added for text changes.
- Preservation / human review: Historical logs, PDF/screenshots, directory name, and Git state remain unchanged. Human branding review and refreshed submission evidence remain pending.

## 2026-10-13 — GitHub Actions CI Failure Diagnosis & Lockfile Sync

- Tool / Agent: Antigravity, Documentation Specialist & Knowledge Architect.
- User prompt / purpose: Diagnose GitHub Actions CI failure ("Quality checks / verify (push) Failing after 6s") following remote push to `xvasgit/PrivateSession`.
- Diagnosis / output: Queried GitHub Actions runs API (run `38422297853`); identified Step 4 (`npm ci`) exiting with code 1 due to lockfile desynchronization (missing nested entries under `@tailwindcss/oxide-wasm32-wasi`).
- Verification / resolution: Ran `npm install --package-lock-only` to update `package-lock.json`; verified `npm ci --dry-run` and full `npm run check` (44/44 unit tests, TypeScript strict, ESLint, Prettier) passing 100%.
- Human verification / edits: Pending user confirmation to commit and push updated `package-lock.json`.

## 2026-10-14 — KKSiber Tugas 1 Deliverables Audit & Alignment

- Tool / Agent: Antigravity, Documentation Specialist & Knowledge Architect.
- User prompt / purpose: Check readiness and status of deliverables for KKSiber (Keamanan Komputasi dan Siber) Tugas 1.
- Audit / output: Audited `security/` deliverables against the official KKSiber Tugas 1 rubric (Asset Inventory, DFD with trust boundaries, STRIDE threat model >= 10 threats, Risk Register top 5). Aligned `security/asset-inventory.md` A-01 path to `lib/workflows/samples.ts` and updated `security/README.md` to reflect the active PrivateSession UI crypto integration.
- Verification: Prettier format check and git status verified. Prepared git tag `sec-0.1` instructions and Moodle submission template.
- Human verification / edits: Pending user creation and push of git tag `sec-0.1`.

## 2026-10-14 — KKSiber Slide Template Alignment & Vector DFD Implementation

- Tool / Agent: Antigravity, Documentation Specialist & Knowledge Architect.
- User prompt / purpose: Align KKSiber Tugas 1 deliverables strictly with the lecture slide templates provided by user (Asset Identification & Valuation columns with FIPS 199 C/I/A; Shostack 2014 DFD notation shapes; canonical STRIDE threat statements; and Risk Register matching Slide 22 official matrix: VH 15–25, H 8–14, M 4–7, L 1–3).
- Outputs created / updated:
  1. `security/asset-inventory.md`: Rewritten into the 7-column slide template (Asset, Category, Location, C, I, A, Rationale) with FIPS 199 valuation.
  2. `security/dfd.svg` & `security/dfd.md`: Created standalone vector SVG DFD Level 0 following Shostack (2014) notation with 3 running trust boundaries (TB1–TB3) and planned desktop extension boundary (TB4).
  3. `security/threat-model.md`: Rewritten into the 5-column slide template (ID, Element, STRIDE, Threat statement, Affected asset) using canonical syntax across 14 threats.
  4. `security/risk-register.md`: Rewritten into the 11-column slide template, scored against the Slide 22 matrix, featuring 1:1 threat-to-risk mapping and top 5 priority risks with concrete control plans.
  5. `docs/keterlacakan.md`: Synchronized cross-course traceability to the updated 1:1 threat/risk IDs.
- Verification: Validated SVG XML tree with Python; validated table column counts and 1:1 T-xx/R-xx mapping via automated Python script; verified `npm run check` (44/44 unit tests, strict typecheck, ESLint, Prettier) passing 100%.
- Human verification / edits: User provided slide images confirming the exact official risk scale.





## 2026-10-18 - Module 4 App Router practicum

- Tool / Agent: ChatGPT (Codex), Core Software Engineer.
- Purpose / brief prompt: Implement the approved Module 4 plan from PDF sections E/H while preserving PrivateSession product descriptions and goals; all screenshots are taken manually by the student; no Git writes.
- Output: About and synthetic review list/detail routes under Upload & Review; server-only fixtures; awaited and validated params; nested layout/template with temporary notes; accessible fallback files; temporary /uji fixtures; runtime configuration, navigation, E2E checks, technical document and text evidence. Updated only technical runtime guidance in README/architecture.
- Verification: Installed Next.js 16.4.0 guides; check passed (44 unit tests, lint, types, format); build passed after a genuine server-only negative compilation; 63 E2E passed at 390/768/1280 px; curl and dev/production DOM checks recorded in docs/praktikum/evidence/modul-04/. Screenshots/video/traces disabled.
- Corrections / rationale: Initial browser run had three selector failures from the extra Next.js alert announcer; scoped the selector to main and reran successfully. Sandbox teardown required stopping only identified test servers and running E2E outside the sandbox. A stalled stdin-based DOM probe was replaced with a temporary file-based check, then removed. No production behavior was changed to hide test failures.
- Boundaries / human verification: No assistance with the individual test in PDF section G; no capture, inference, media uploads, accounts, persistence, or changes to crypto APIs. Screenshot placeholders, Lighthouse/React DevTools verification, and Name/NIM remain for the student. The temporary negative import was restored after saving compiler output; instructions permit manual reproduction. /uji remains until manual captures are complete, followed by final cleanup/build. No staging, commits, pushes, merges, tags, or branch changes.


## 2026-10-18 - Module 4 manual evidence review

- Agent / tool: ChatGPT (Codex), Core Software Engineer.
- User request: Inspect screenshots, update the technical document, and assess React DevTools evidence and optional raw TXT retention.
- Reviewed and linked all 11 student images. Loading/error and server-only evidence are present; Link navigation, return-to-list, and client hooks need additional manual captures. Preserved student identity edits.
- Embedded essential historical check/build outputs and results so raw TXT evidence is optional. Checked PDF E.4/H and Markdown links/format. No screenshots created, files deleted, code changed, tests rerun, or Git writes performed. Student review and fixture cleanup/final testing remain pending.


### 2026-10-18 - Module 4 evidence scope correction

- Agent: Codex (Core Software Engineer). User requested removing optional A1 evidence. Rechecked the Module 4 PDF: viewport screenshots and Lighthouse are broader PAW milestone requirements, not Module 4 E/H deliverables. Removed A1 instructions, its verification row and pending checklist reference from modul-04.md. Preserved required Module 4 evidence and actual multi-viewport test results. No code or Git writes.


### 2026-10-18 - Updated Module 4 screenshot acceptance

- Agent: Codex - Core Software Engineer.
- Reviewed updated nav-link/layout-return and three new React DevTools images. Confirmed document-free Link navigation, retained layout note on return, and hooks for MainNavigation, ReviewNote and UploadReview. Linked all 14 manual images with evidence-specific captions.
- Removed reappearing A1/Lighthouse requirements and repaired truncated finalization checklist and duplicate table fragments in the current document. Preserved pending fixture cleanup, final tests and student Git publication. Validated formatting and image links; no application edits, screenshot capture, or Git writes.


### 2026-10-18 - Module 4 document after fixture removal

- Agent: Codex - Core Software Engineer.
- Updated modul-04.md at user request after confirming app/uji and its lab test were removed. Updated route table/tree and component classification; retained historical screenshots and the permanent server-only module/E2E test. Removed stale section references without restoring A1 or the deleted finalization checklist.
- Verification: reran production build successfully with no /uji routes; check passed lint, TypeScript, 44 unit tests and formatting. Embedded concise actual outputs required by section H. Clearly marked historical 63 E2E and HTTP results; no claim of a new browser or HTTP run. Checked 14 image links and document formatting. No source edits or Git writes.
