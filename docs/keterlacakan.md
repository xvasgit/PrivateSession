# Cross-Course Traceability

| Requirement | PAW feature | Crypto asset / mechanism | KKS threat / risk | Verification |
|---|---|---|---|---|
| UI-01 | Three responsive routes and navigation | No protected data in synthetic views | T-12 misleading state | E2E navigation/overflow; viewport evidence |
| UI-02 | Feature overview and status; retired library search | Synthetic views only | T-12 misleading state | E2E status/navigation; no saved-meeting claims |
| UI-03 / PR-01 | Capture modes/preferences and explicit consent | Validated live draft can invoke ephemeral encryption | T-01/T-02 / R-02 | Live validation tests; E2E action gating; consent flag is not cryptographic proof |
| UI-04 / UI-06 | Explicit synthetic transcript/analysis previews | Fixed fixture text, no user-media processing | T-12 misleading state | E2E playback/reset and sample/file independence |
| UI-05 | Local file metadata validation/removal | Media contents neither read nor encrypted | T-12 misleading state | Media unit tests; E2E rejection/removal/no outbound data |
| UI-07 | Informational Sign In dialog | No credential/session storage | Future authorization remains planned | E2E focus/dismissal and no persistence |
| CR-01 | Live draft and synthetic review encryption actions | AES-256-GCM; CSPRNG nonce; non-exportable key | T-04/T-05 / R-03 | C-01–C-03, C-10; W-01–W-03; browser round trips |
| CR-02 | Fail-closed helper and UI errors | Ciphertext/tag authentication; artifact ID in session-bound AAD | T-04 / R-03 | C-04–C-09, C-11; W-05/W-06; browser failure/retry |
| CR-03 / CR-04 | Shared encryption preview and reset lifecycle | Temporary operation keys; snapshot inputs; no media contents or saved keys | T-05/T-12 / R-03 | W-01–W-08; E2E keyboard, freshness, reset/stale results, unavailable crypto, and privacy guards |
| CAP-01 / AI-01 / AI-02 | Desktop recording, transcript, answer overlay | Audio/screens/transcripts: planned encrypted vault | T-01/T-02/T-09/T-11 / R-01/R-02/R-04/R-05 | Not implemented; native integration tests required |
| VAULT-01 / LIFE-01 | Durable encrypted search/export/delete | Persistent keys, encrypted index, explicit sharing: planned | T-05/T-06/T-07/T-08/T-10 / R-03/R-04 | Not implemented; storage and lifecycle tests required |

Current evidence is for the Tugas 1 prototype. No row implies production readiness or native control verification.

The KKS model remains a preserved earlier baseline; its references to library fixtures and the crypto UI are historical, not the current frontend. WS-01/MCP and actual upload analysis remain upcoming. See `security/README.md` for the revision boundary.
