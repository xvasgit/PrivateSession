# Product Requirements

Product: PrivateSession (official name). Primary users: students and professionals; secondary users: team leads sharing selected summaries. No real personal information is used in this repository.

| ID | User need / acceptance criterion | Stage |
|---|---|---|
| UI-01 | Navigate Overview, Live Transcription, and Upload & Review at 390/768/1280 px with active indicators and no overflow | PemWeb UI implemented |
| UI-02 | Overview labels the two meeting features In progress and Contextual Workspaces Upcoming; no fictional saved history | Replaces retired library search |
| UI-03 | Live setup validates title 3–80 chars, optional context ≤500 chars, consent, and permitted audio sources; mode changes reset defaults | PemWeb UI implemented |
| UI-04 | Sample transcript starts empty, requires an explicit action, and supports demo pause/resume/stop/reset with timestamped speech/screen context | Synthetic preview only |
| UI-05 | Select one non-empty MP3/WAV/MP4/M4V/MOV, case-insensitively; show name/category/size and removal; no content reads/uploads | Metadata-only UI implemented |
| UI-06 | Independently request/reset synthetic summary, insights, follow-ups, and potential gaps; never attribute these to selected media | Synthetic preview only |
| UI-07 | Sign In opens an informational dialog with keyboard dismissal and focus return; no credentials or login state | Accounts/saving upcoming |
| CR-01 | Encrypt JSON with AES-256-GCM and a fresh 12-byte CSPRNG nonce | Integrated into prepared live draft and explicit synthetic review demos |
| CR-02 | Reject ciphertext/tag/nonce/key/context mutations without returning plaintext | Helper regression tests retained |
| CR-03 | Verify exact recovery using a temporary non-exportable key and kind-prefixed artifact context; expose only the envelope/ID | Workflow adapter implemented; no persistence or identity authentication |
| CR-04 | Gate actions, clear results on edit/reprepare/reset, ignore late completions, and show actionable failures | Shared client component; independent of media selection |
| PR-01 | Tell users clearly when nothing is recorded or saved | Tugas 1 implemented; not evidence of a native capture control |
| CAP-01 | Check microphone, system audio, and screen availability; start only after permission and consent; show recording state | Planned desktop integration |
| AI-01 | Transcribe locally, align screen OCR by timestamp, detect directed questions, stream answer suggestions | Planned local AI integration |
| AI-02 | Analyze past recordings and produce summary, insights, follow-ups, and possible missed details; refine live meeting transcripts | Planned AI integration |
| WS-01 | Initialize a scoped workspace from prompts, documents, images, and MCP connectors | Upcoming; no page or connector implemented |
| VAULT-01 | Persist encrypted sessions with durable key management and search without exposing plaintext indexes | Planned vault integration |
| LIFE-01 | Explicitly export/share selected content and delete sessions/indexes/derived artifacts | Planned; filesystem backup caveats must be documented |

All current state is in page memory and resets on reload. Online Meeting defaults to all three sources and requires microphone or system audio; Live Recording requires microphone, allows screen snapshots, and excludes system audio. File extension checks are not codec or content validation. UI previews do not satisfy CAP-01, AI-01/02, WS-01, or VAULT-01. Backend validation, processing, storage, and authentication remain future work.
