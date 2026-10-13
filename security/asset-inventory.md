# Asset Inventory

| ID | Asset / owner | Sensitivity | Location / state | Protection |
|---|---|---|---|---|
| A-01 | Synthetic sessions / project | Public sample | `lib/sessions/mock-sessions.ts`; implemented | No real data; deliberately plaintext fixtures |
| A-02 | Session draft preferences / local user | Private in real use | P-01 browser memory; demo implemented | Local validation and AES-GCM demonstration; no persistence |
| A-03 | Temporary draft key / local user | Secret | P-02 memory; implemented | Non-exportable Web Crypto key; never logged/stored/sent |
| A-04 | Encrypted draft envelope / local user | Private metadata | P-01 memory; implemented | Authenticated ciphertext; discard on navigation/reload |
| A-05 | Microphone/system audio / participants | Highly sensitive | P-03/P-04; planned | Consent, source limits, visible recording, encrypted storage planned |
| A-06 | Screen frames/OCR / local user and bystanders | Highly sensitive | P-03/P-04; planned | Opt-in source, masking/minimization, retention controls planned |
| A-07 | Transcripts/answers/summaries / local user | Highly sensitive | P-04/D-01; planned | Local inference and authenticated vault encryption planned |
| A-08 | Durable vault key / local user | Secret | D-02; planned, no key exists | OS-backed key custody and recovery design required |
| A-09 | Local model/runtime / local user | Integrity critical | P-04/D-03; planned | Trusted downloads, integrity validation, least privilege planned |
| A-10 | Selected exports / local user/team lead | Sensitive | F-07; planned | Explicit scope/recipient preview; no automatic upload |
| A-11 | Source/dependencies / contributor | Integrity critical | Git root / `node_modules`; implemented | Lockfile, CI, ignore rules; dependencies are not security-audited yet |

No participant account, real recording, database, native application, or remote service has been provisioned. Data classification and durable key decisions must be revisited before capturing real meetings.
