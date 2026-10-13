# STRIDE Threat Model

Threat statements describe the intended product and identify applicability to the current prototype. DFD IDs come from `dfd.md`; risk ownership is local engineering/security review.

| ID | STRIDE | DFD element / asset | Specific threat | Stage / control plan |
|---|---|---|---|---|
| T-01 | Spoofing | F-03/P-03, A-05 | Injected UI code impersonates a consented capture command and activates a source | Planned: native consent/session capability checks; R-02/R-04 |
| T-02 | Information disclosure | F-04/P-03, A-05/A-06 | Screen capture includes a private chat or audio is retained beyond the chosen scope | Planned: explicit sources, visible indicator, preview/masking/retention; R-01 |
| T-03 | Repudiation | F-01/P-01, A-02 | User cannot reconstruct which sources/consent notice were active when capture began | Demo checkbox only; planned local consent/version/event record; R-02 |
| T-04 | Tampering | F-02/D-01, A-04/A-07 | Attacker alters ciphertext/tag or substitutes another session's record | Demo AEAD/AAD tested; planned vault enforcement; R-03 |
| T-05 | Information disclosure | D-02, A-08 | Vault key appears in logs/config/export, exposing stored meetings | Non-exportable temporary demo key; planned durable OS custody/log redaction; R-03 |
| T-06 | Elevation of privilege | P-03/P-05, A-07 | A broad native IPC command lets compromised UI read arbitrary local files | No native IPC yet; planned narrow allowlist/path scopes; R-04 |
| T-07 | Information disclosure | F-07, A-10 | Export includes full transcript/screens when only a summary was selected | No export yet; planned exact field preview and explicit recipient confirmation; R-01 |
| T-08 | Information disclosure | D-01, A-07 | Plaintext search indexes or temp files reveal notes despite encrypted records | Synthetic fixtures only; planned protected index/temp cleanup; R-03 |
| T-09 | Denial of service | P-04/D-01, A-05/A-06 | Frequent snapshots or long audio exhaust CPU/memory/disk and lose session data | No processing yet; planned bounded queues, quotas, backpressure and safe stop; R-05 |
| T-10 | Tampering | D-03/P-04, A-09 | Replaced model/runtime changes summaries or executes malicious code | No model yet; planned trusted distribution and integrity checks; R-04 |
| T-11 | Elevation of privilege | F-05/P-04/P-05, A-06/A-10 | Spoken/OCR instructions prompt the model to invoke exports or file access | No inference yet; planned treat captured text as data, no model capture/export authority; R-04 |
| T-12 | Spoofing | P-01/F-06, A-02/A-07 | UI labels a mock transcript or idle session as live recording, misleading consent decisions | Prototype labels synthetic/no-recording state; planned state machine and native status verification; R-02 |

The checkbox is not OS authorization; non-exportable keys do not defeat compromised same-origin scripts; AEAD does not protect unlocked runtime memory. Validate controls empirically as native functionality is introduced.
