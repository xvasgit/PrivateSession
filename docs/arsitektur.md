# Architecture & Implementation Boundaries

## Current Implementation

One repository, one Next.js application served on local loopback, with a stateless metadata-validation Server Action and no public REST API. Overview (`/`), Live Transcription (`/live/`), and Upload & Review (`/upload/`) share a responsive shell with active navigation and an informational Sign In dialog. Server-rendered page shells contain narrowly scoped client components for forms, file selection, and sample controls.

`lib/workflows/` separates typed capture preferences, validation, metadata-only media checks, and fixed synthetic transcript/analysis fixtures from rendering. Setup validates consent and source restrictions without device APIs. File selection inspects only name/size and retains metadata; no content is read. Explicit sample actions are independent of inputs. Transcript playback uses a timer cleaned up on pause/stop/reset/unmount; all state is in memory and resets on reload.

There is no durable persistence, capture, media upload, inference, production authentication, or MCP integration. The prior library/setup routes remain retired; legacy draft validation remains regression-tested. The loopback Next.js server supplies assets, HTML, and React Server Component responses for navigation. Live fields, notes, and cryptographic operations remain in browser memory. Upload metadata leaves the browser only when the user explicitly chooses Validate selection. The separate practicum additionally sends synthetic credentials and request fields and uses a demo session cookie.

The picker and `app/upload/actions.ts` share a Zod 4 schema in `lib/workflows/media.ts`. Explicit FormData submits only filename and decimal byte count; the server parses sizes without blank-value coercion and independently validates both fields. The typed response contains errors or metadata with a derived media category. `useActionState` handles pending/failure/retry, while selection revisions suppress stale results after replacement/removal. No file contents are read, persisted, or logged by the action. Metadata validation is not authenticity, content, or codec validation. This public workflow remains independent of the practicum.

## Removable Module 5 Practicum

`lib/practicum/` holds a shared four-field Zod schema and server-only record/session stores. The demo routes use request-time session checks in every protected page and mutation, with a presence-only proxy as an optimistic convenience. A single environment-configured synthetic account owns its records; all users sharing those credentials share access. An opaque random cookie references an eight-hour server-side session, rotates on sign-in, and is revoked on logout. Secure is enabled in production; HttpOnly, SameSite=Lax, Path=/, and Max-Age=28800 are always applied.

Creation follows session → schema → per-owner case-insensitive title uniqueness → synchronous insertion → list revalidation → detail redirect. Only expected validation messages or generic failures reach the form. Controlled inputs suppress React's automatic reset to preserve select/checkbox state after failure. The initial list is empty and contains only created records; no file or AI result is involved.

The global process-local stores survive development module refresh but not server restart, scaling across processes, or deployment. Logout revokes the session but retains records until restart. This is removable educational infrastructure, not production identity/storage or encryption integration. Keep its records, routes, access controls, cookie handling, and tests together when later removing it. Technical-document writing and manual screenshots are deferred; see README for capture steps.

The shared `EncryptionPreview` client component invokes `lib/crypto/workflow-encryption.ts` after live setup validation or an explicit synthetic review request. The adapter snapshots only the relevant JSON, generates a temporary non-exportable key and kind-prefixed artifact ID, calls the unchanged AES-GCM helper, and authenticates/decrypts before requiring exact recovery. Only the encrypted envelope and artifact ID reach UI state; the key and recovered plaintext are not returned. The sample-review branch accepts no file metadata or contents.

Each preparation mounts a new verification instance. Editing a draft or resetting a sample unmounts it; pending results are ignored after unmount. Duplicate actions are disabled while busy, and failures return no success envelope. Verification is a demonstration: plaintext previews stay visible, key references expire after the operation without guaranteed memory erasure, and nothing is saved or recoverable later.

`npm run build` generates `.next/`; `npm start` runs Next.js on `127.0.0.1:3000`. Module 4 removes `output: "export"` to test request-time loading and server errors. Cache Components remain disabled. A future desktop build will need a separate compatibility decision for static assets or a local runtime; the prior static-export integration is not claimed to work unchanged. Tauri/native code has not been scaffolded; system audio and screen capture require platform-specific design, permissions, and tests.

## Module 4 Routing Extension

`/about/` repeats the established product description. `/upload/samples/` reads fixed fictional reviews from `lib/workflows/review-samples.server.ts`; its `server-only` marker rejects imports from client modules. The existing browser fixtures remain separate. Detail routes await `params`, validate positive safe integer IDs without leading zeroes, then look up the example or call `notFound()`. IDs 1 and 2 are prerendered by `generateStaticParams`; unknown IDs are validated by the runtime.

The sample layout preserves a temporary review workspace note across list/detail navigation. Its template remounts the current review note when the child segment changes. Neither note leaves browser memory or survives reload. Product loading/error fallbacks stay in the sample segment; temporary `/uji/` fixtures exercise a two-second response and an intentional server exception until manual evidence is captured. See [Module 4](praktikum/modul-04.md) for the pending cleanup and verification stages.

The KKS asset inventory, DFD, threats, risks, and historical evidence remain the submitted static-export baseline. Runtime rendering and explicit filename/size submission introduce server execution and metadata disclosure in the local lab; this is a documented delta, not a revalidated security assessment. No media contents, database, or external service are introduced.

## Intended Desktop Pipeline (Planned)

Consent and capture selection → visible capture controller → timestamped microphone/system-audio/screen events → on-device ASR/OCR → local question classifier and language model → answer overlay → post-session refinement → encrypted local vault → explicit export/share/delete.

Keep desktop permissions and filesystem access behind narrowly defined native commands. No model/provider is selected or downloaded. Future network access must be explicitly configured; cloud inference is not the default. A consent checkbox in the prototype does not implement OS permissions or participant notification.

## Proposed Module Contracts

- Capture adapter: takes consented source preferences; emits timestamped audio/frame events, availability, and stopped/recording states.
- Local inference adapter: consumes bounded events; emits timestamped transcript, OCR, question, and streamed answer events; supports cancellation/backpressure.
- Vault adapter: seals/opens envelopes under stable session IDs; owns durable key lifecycle, encrypted indexes, retention, export, and deletion.
- UI: shows capture/processing state and errors; invokes typed adapters rather than direct unrestricted OS access.

Persistent keys, durable storage, production authentication, secure IPC, signed exports, and full native lifecycle remain unimplemented. The session draft key is intentionally temporary and cannot secure a reusable vault.

## Upcoming Workflows

Past media will eventually pass through a validated processing adapter to transcription and structured analysis. Contextual Workspaces will initialize a field-scoped assistant from prompts, documents, images, and explicitly configured MCP tools. No providers, interfaces to external services, or persistent schemas are introduced by this UI revision. Production accounts and durable saving remain upcoming; the isolated lab session is not their implementation.

## Ownership

Codex maintains core code, contracts, test/build tooling, and engineering architecture. Antigravity maintains course documentation architecture and academic traceability. Security/crypto/QA agents retain their assigned roles and coordinate overlapping files. Shared onboarding does not change an agent's identity.
