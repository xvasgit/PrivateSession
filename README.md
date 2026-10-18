# PrivateSession

PrivateSession is a privacy-first meeting assistant for students and professionals. The intended product helps users retain live conversation context, review past recordings, and initialize context-specific AI workspaces. This foundation combines **PemWeb (PAW) Tugas 1** workflows with **Kriptografi Tugas 1** encryption demonstrations; KKSiber artifacts remain a separate design baseline.

## Current Tugas 1 Foundation

- **Overview (`/`):** feature descriptions and brief workflows; Live Transcription and Upload & Review are **In progress**, Contextual Workspaces is **Upcoming**.
- **Live Transcription (`/live/`):** validated title/context/consent form, selectable capture modes/sources, and an independent sample transcript with demo controls.
- **Upload & Review (`/upload/`):** metadata-only selection of one MP3/WAV/MP4/M4V/MOV file, error/removal states, and independent sample summaries, insights, follow-ups, and potential missed details.
- **Local encryption demos:** encrypt and verify a prepared live draft or the explicitly requested synthetic review using temporary keys; neither action saves or locks the visible text.
- Shared navigation with active indicators and an accessible informational **Sign In** dialog; accounts and saving remain upcoming.
- Reusable shell/navigation, cards, status badges, buttons, headings, fields, source selector, dialog, and sample-output components.

**This is an interactive UI demonstration, not a functioning recording or AI service.** No capture permissions, file-content reads, uploads, inference, authentication, MCP connections, or persistent storage occur. Samples appear only through explicit actions and are never attributed to the selected file or capture preferences. State resets on reload. Use synthetic details when demonstrating the forms. The fictional session library and its routes have been removed.

Planned workflow: choose consented sources → live transcript with timestamped screen context; or select a past recording → structured analysis and follow-ups. Upcoming workspaces will accept prompts, documents, images, and MCP connectors to ground a field-specific assistant. No workspace page is implemented yet.

## Local Development

Use Node.js 24 LTS and npm. In the local agent workspace, first enter `meeting-companion/`. In a standalone clone, use the clone root directly. Run these commands from the application repository root:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. No environment variables, model downloads, or database are required for this UI revision.

| Command | Purpose |
|---|---|
| `npm run check` | Lint, strict type checking, unit tests, and format check |
| `npm run build` | Build the Next.js application into `.next/` |
| `npm start` | Run the built Next.js server on loopback port 3000 |
| `npm test` | Run repeatable crypto and validation tests |
| `npx playwright install chromium` | Install the E2E browser once |
| `npm run test:e2e` | After building, test navigation, setup, samples, encryption/reset/error flows, dialog accessibility, and privacy boundaries at three widths |
| `npm run audit:ui` | Optional: with `npm start` running, regenerate nine screenshots, Lighthouse JSON reports, and a JSON audit manifest |

Current automated results are recorded in [evaluation](EVALUASI.md). The existing [Lighthouse PDF](docs/evidence/lighthouse/lighthouse-report.pdf) and `docs/evidence/viewports/` screenshots predate the new encryption controls; refresh visual/accessibility evidence for the final submission. Deleted JSON reports, audit manifest, and superseded evidence are not required to build or test. Automated results do not replace human accessibility review or individual demo preparation.

## Repository Layout

`app/` contains routes; `components/` contains reusable UI, including `encryption-preview.tsx`; `lib/workflows/` holds typed validation and synthetic previews; `lib/sessions/` retains legacy draft validation; `lib/crypto/` holds AES-GCM and the workflow adapter. `tests/` holds Vitest/Playwright checks; `security/` holds KKS artifacts; `docs/` holds requirements, architecture, traceability, and evidence. Git belongs to this application directory. In the local workspace, it is `meeting-companion/`; course instructions and agent files live in its parent, outside the repository. A standalone clone contains everything needed to build and test the UI.

The React/TypeScript/Tailwind UI is intended for reuse by a future desktop shell. This practicum branch uses a local Next.js runtime for routing and server-rendering exercises; a static export is no longer produced by the default build. Tauri is an architectural candidate, not an installed dependency. Local inference and capture adapters remain separate from the frontend. See [architecture](docs/arsitektur.md).

## Module 4 Practicum

`/about/` reuses the existing product description. `/upload/samples/` and its two detail pages demonstrate fictional review examples, nested layouts, templates, validated asynchronous route parameters, and a server-only data module. They do not restore the retired session library or save meeting data. Existing live/upload/encryption workflows are unchanged.

The [Module 4 technical document](docs/praktikum/modul-04.md) records checks and manual screenshot instructions. `/uji/lambat/` and `/uji/galat/` are temporary local fixtures retained until the student captures dev/production evidence; remove them and rebuild before completing the practicum. The existing KKS documents and earlier evaluation results describe the prior static-export baseline.

Module 4 screenshots are taken manually by the student. Playwright screenshot, video, and trace recording are disabled; do not use `audit:ui` for this module because it writes screenshots and replaces earlier audit evidence. In PowerShell environments that block `npm.ps1`, use `npm.cmd` and `npx.cmd` for the same commands.

## Cryptographic Requirements

Encryption is intended to protect private meeting information when future storage/export exists. Today's integrations demonstrate the mechanism and verify recovery; the plaintext remains visible and synthetic fixtures remain in the build.

| Product asset | Security objectives | Priority | Mechanism and current scope |
|---|---|---|---|
| Prepared title, context, source preferences, consent flag | Confidentiality, integrity, data authenticity | Medium | AES-256-GCM round trip on `/live/`; temporary draft only |
| Review summary, insights, follow-ups, possible gaps | Confidentiality, integrity, data authenticity | High | AES-256-GCM round trip on `/upload/`; fixed synthetic review only |
| Speech transcript and timestamped screen/OCR context | Confidentiality, integrity, data authenticity | High | Planned authenticated vault encryption; current transcript preview is not encrypted |
| Original audio/video, screen images, workspace documents | Confidentiality, integrity, data authenticity | High | Planned encrypted storage and key lifecycle; selected media is neither read nor encrypted |

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
