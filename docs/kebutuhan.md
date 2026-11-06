# Product Requirements

Current revision: persistent meeting library with manual transcripts and review notes. Use synthetic data with the persistent account access. Historical practicum requirements are preserved in their submitted documents and Git history.

| ID         | Acceptance criterion                                                                                                              | Current scope                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| UI-01      | Overview, Meetings and Upload & Review navigation is keyboard accessible, active, and usable at 390/768/1280 px.                  | Implemented                               |
| UI-02      | Preserve three feature descriptions; two In progress and Contextual Workspaces Upcoming.                                          | Implemented                               |
| UI-05      | Validate MP3/WAV/MP4/M4V/MOV metadata only on explicit submission; reject invalid inputs, retain/retry, ignore stale results.     | No media upload/content reads             |
| MT-01      | Meeting title/code and transcript segments support full UI CRUD backed by PostgreSQL.                                             | Existing two-entity model retained        |
| MT-02      | Validate title 3–80, code 1–64, positive integer IDs/sequence, nonblank transcript up to 10,000 characters.                       | Server Zod plus field errors              |
| MT-03      | Optional summary, insights, follow-ups each permit 10,000 characters; save together, preserve newlines, clear when all empty.     | Manual notes, no AI or task automation    |
| MT-04      | Explicit deletion confirmation; nonempty parent restricted, confirmed full deletion atomic.                                       | Server enforcement                        |
| MT-05      | Save failures retain input; unavailable database and corrupt ciphertext never produce invented records or empty editable reviews. | Fail closed                               |
| CR-01      | Encrypt transcript and review text at rest using AES-256-GCM and fresh 12-byte IVs.                                               | Same original external key; versioned AAD |
| CR-02      | Reject tampering, wrong key/context, malformed payloads without revealing unauthenticated plaintext or changing stored review.    | Crypto/action/DB/browser checks           |
| ACCESS-01  | Verify durable sessions and active accounts on every protected page/action; expire/revoke cookies.                                | Owner-scoped access; synthetic lab data   |
| PR-01      | Explain text storage, plaintext metadata, server decryption, and metadata-only recording validation honestly.                     | Local synthetic testing                   |
| CAP-01     | Companion captures consented microphone/system audio/screen context.                                                              | Planned; explanatory web page only        |
| AI-01      | Transcription, live assistance and generated review content.                                                                      | Planned                                   |
| WS-01      | Field-specific assistants with prompts, files and MCP connectors.                                                                 | Upcoming, no page                         |
| ACCOUNT-01 | Persistent accounts, owner isolation, first-password change and limited member administration.                                    | Implemented                               |
| MEDIA-01   | Store uploaded recordings and attach them to meetings.                                                                            | Deferred                                  |

UI-03/04/06/07 and LAB-05 synthetic demo interfaces are retired. LAB-06 persistence and crypto evolve into MT-01–05 rather than remaining a separate lab. Server restart preserves valid sessions and PostgreSQL records. Revoked sessions remain rejected. This increment is not full Tugas 2 compliance or production readiness.
