# Cross-Course Traceability

| Requirement | PAW Feature | Crypto Asset / Mechanism | KKS Threat / Risk | Verification |
|---|---|---|---|---|
| **UI-01** | Three responsive routes and navigation | No protected data in synthetic views | T-03 / R-03 (port collision / spoofing) | E2E navigation/overflow; viewport evidence |
| **UI-02** | Feature overview and status badges | Synthetic views only | T-03 / R-03 (port collision / spoofing) | E2E status/navigation; no saved-meeting claims |
| **UI-03 / PR-01** | Capture modes/preferences and explicit consent | Validated live draft can invoke ephemeral encryption | T-06 / R-06 (consent repudiation) | Live validation tests; E2E action gating; consent flag is not cryptographic proof |
| **UI-04 / UI-06** | Explicit synthetic transcript/analysis previews | Fixed fixture text, no user-media processing | T-03 / R-03 (prototype boundary) | E2E playback/reset and sample/file independence |
| **UI-05** | Local file metadata validation/removal | Media contents neither read nor encrypted | T-05 / R-05, T-09 / R-09 (file name disclosure) | Media unit tests; E2E rejection/removal/no outbound data |
| **UI-07** | Informational Sign In dialog | No credential/session storage | T-10 / R-10 (future auth planned) | E2E focus/dismissal and no persistence |
| **CR-01** | Live draft and synthetic review encryption actions | AES-256-GCM; CSPRNG nonce; non-exportable key | T-07 / R-07, T-08 / R-08 | C-01–C-03, C-10; W-01–W-03; browser round trips |
| **CR-02** | Fail-closed helper and UI errors | Ciphertext/tag authentication; artifact ID in session-bound AAD | T-08 / R-08 (ciphertext / tag tampering) | C-04–C-09, C-11; W-05/W-06; browser failure/retry |
| **CR-03 / CR-04** | Shared encryption preview and reset lifecycle | Temporary operation keys; snapshot inputs; no media contents or saved keys | T-07 / R-07, T-08 / R-08 | W-01–W-08; E2E keyboard, freshness, reset/stale results, unavailable crypto, and privacy guards |
| **CAP-01 / AI-01 / AI-02** | Desktop recording, transcript, answer overlay | Audio/screens/transcripts: planned encrypted vault | T-12 / R-12, T-14 / R-14 | Not implemented; native integration tests required |
| **VAULT-01 / LIFE-01** | Durable encrypted search/export/delete | Persistent keys, encrypted index, explicit sharing: planned | T-11 / R-11, T-13 / R-13 | Not implemented; storage and lifecycle tests required |

---

*Current evidence is for the Tugas 1 prototype (`v0.1` / `sec-0.1`). No row implies production readiness or native control verification. Security threat and risk identifiers align with the lecture slide templates in `security/`.*
