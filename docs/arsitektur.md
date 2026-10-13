# Architecture & Implementation Boundaries

## Current Implementation

One repository, one statically exported Next.js frontend, no API backend. Overview (`/`), Live Transcription (`/live/`), and Upload & Review (`/upload/`) share a responsive shell with active navigation and an informational Sign In dialog. Server-rendered page shells contain narrowly scoped client components for forms, file selection, and sample controls.

`lib/workflows/` separates typed capture preferences, validation, metadata-only media checks, and fixed synthetic transcript/analysis fixtures from rendering. Setup validates consent and source restrictions without device APIs. File selection inspects only name/size and retains metadata; no content is read. Explicit sample actions are independent of inputs. Transcript playback uses a timer cleaned up on pause/stop/reset/unmount; all state is in memory and resets on reload.

There is no persistence, capture, upload, inference, auth, or MCP integration. The prior library/setup routes remain retired; legacy draft validation remains regression-tested. A loopback server supplies frontend assets only.

The shared `EncryptionPreview` client component invokes `lib/crypto/workflow-encryption.ts` after live setup validation or an explicit synthetic review request. The adapter snapshots only the relevant JSON, generates a temporary non-exportable key and kind-prefixed artifact ID, calls the unchanged AES-GCM helper, and authenticates/decrypts before requiring exact recovery. Only the encrypted envelope and artifact ID reach UI state; the key and recovered plaintext are not returned. The sample-review branch accepts no file metadata or contents.

Each preparation mounts a new verification instance. Editing a draft or resetting a sample unmounts it; pending results are ignored after unmount. Duplicate actions are disabled while busy, and failures return no success envelope. Verification is a demonstration: plaintext previews stay visible, key references expire after the operation without guaranteed memory erasure, and nothing is saved or recoverable later.

`npm run build` generates `out/`. The [Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports) and [Tauri Next.js integration guide](https://v2.tauri.app/start/frontend/nextjs/) support this frontend shape. Tauri/native code has not been scaffolded; system audio and screen capture require platform-specific design, permissions, and tests.

## Intended Desktop Pipeline (Planned)

Consent and capture selection → visible capture controller → timestamped microphone/system-audio/screen events → on-device ASR/OCR → local question classifier and language model → answer overlay → post-session refinement → encrypted local vault → explicit export/share/delete.

Keep desktop permissions and filesystem access behind narrowly defined native commands. No model/provider is selected or downloaded. Future network access must be explicitly configured; cloud inference is not the default. A consent checkbox in the prototype does not implement OS permissions or participant notification.

## Proposed Module Contracts

- Capture adapter: takes consented source preferences; emits timestamped audio/frame events, availability, and stopped/recording states.
- Local inference adapter: consumes bounded events; emits timestamped transcript, OCR, question, and streamed answer events; supports cancellation/backpressure.
- Vault adapter: seals/opens envelopes under stable session IDs; owns durable key lifecycle, encrypted indexes, retention, export, and deletion.
- UI: shows capture/processing state and errors; invokes typed adapters rather than direct unrestricted OS access.

Persistent keys, durable storage, authentication, secure IPC, signed exports, and full native lifecycle remain unimplemented. The session draft key is intentionally temporary and cannot secure a reusable vault.

## Upcoming Workflows

Past media will eventually pass through a validated processing adapter to transcription and structured analysis. Contextual Workspaces will initialize a field-scoped assistant from prompts, documents, images, and explicitly configured MCP tools. No providers, interfaces to external services, or persistent schemas are introduced by this UI revision. Accounts and saving are upcoming, not simulated authentication.

## Ownership

Codex maintains core code, contracts, test/build tooling, and engineering architecture. Antigravity maintains course documentation architecture and academic traceability. Security/crypto/QA agents retain their assigned roles and coordinate overlapping files. Shared onboarding does not change an agent's identity.
