# STRIDE Threat Model

> **Reference Template:** Week 3 Lecture Slide — *Templat Tabel: security/threat-model.md*.  
> **Rule:** *Satu threat, satu baris.* Each statement follows the canonical form:  
> `[Threat source] can [action] against [element] via [method], resulting in [impact].`  
> **Tracing Guarantee:** Each threat identifier (`T-xx`) maps directly 1:1 to its risk register entry (`R-xx`).

---

## Threat Matrix

| ID | Element | STRIDE | Threat Statement | Affected Asset |
|---|---|---|---|---|
| **T-01** | F7 | **T** (Tampering) | Malicious dependency publisher or compromised upstream registry can inject unauthorized code into locked npm packages via manipulated dependency releases during `npm ci`, resulting in compromised build integrity and potential client data exfiltration. | A-06, A-07 |
| **T-02** | D1 | **T** (Tampering) | Unprivileged local malware running under the developer account can modify exported JavaScript bundles in `out/` via local file system writes before server startup, resulting in the execution of trojanized UI scripts that fake encryption verification. | A-06 |
| **T-03** | P1 | **S** (Spoofing) | Malicious local background process or conflicting developer server can squat on loopback port `127.0.0.1:3000` via premature socket binding before `npm start` executes, resulting in misleading the user into entering meeting titles and context into a spoofed interface. | A-01, A-06 |
| **T-04** | P1 | **D** (Denial of Service) | Local attacker or malfunctioning local client script can trigger repeated abnormal HTTP request terminations against `serve` 14.2.5 via the known unpatched `compression` middleware memory leak (GHSA-vc2v-76pw-4v95), resulting in server process crash and local demo unavailability. | A-06 |
| **T-05** | P2 | **I** (Information Disclosure) | Malicious or overprivileged browser extension possessing broad host permissions can inspect the live DOM tree of `P2` via injected content scripts, resulting in the unauthorized harvesting of meeting titles, discussion context, and selected recording file names. | A-01, A-05 |
| **T-06** | P2 | **R** (Repudiation) | Meeting participant can deny having given consent for live transcription capture via disputing unauthenticated browser checkbox state, resulting in inability to legally prove consent under Indonesian Personal Data Protection law (UU 27/2022). | A-01 |
| **T-07** | D3 | **I** (Information Disclosure) | Injected same-origin script or prototype pollution vulnerability can invoke `crypto.subtle.decrypt` with the live in-scope `CryptoKey` handle before operation disposal, resulting in unauthorized recovery of the plaintext session draft despite `extractable: false`. | A-02, A-03 |
| **T-08** | F13 | **T** (Tampering) | Compromised client-side script or browser memory manipulator can alter ciphertext bytes, authentication tag, or artifact ID via mutating state `D2` before verification completion, resulting in failed decryption or erroneous verification display. | A-03 |
| **T-09** | F2 | **I** (Information Disclosure) | Unauthorized observer or shared-screen participant can observe confidential file names displayed in the `/upload/` review interface via video conference screen broadcast, resulting in exposure of private business or legal meeting subjects. | A-05 |
| **T-10** | E3 | **E** (Elevation of Privilege) | Attacker with compromised personal GitHub access credentials or leaked access token can push unauthorized commits to branch `main` or manipulate release tags via direct git push without branch protection rules, resulting in deployment of unauthorized software. | A-07 |
| **T-11** | F9 | **I** (Information Disclosure) | Developer can inadvertently stage and commit plaintext API credentials or cryptographic keys into git history via uncurated `git add -A` commands, resulting in permanent public exposure of secrets on GitHub. | A-09 |
| **T-12** | P5 *(Planned)* | **I** (Information Disclosure) | Unconstrained desktop screen capture routine can record confidential background windows and personal notifications via full-display capture without window-scoping, resulting in inadvertent harvesting of bystander personal data. | A-11 |
| **T-13** | D5 *(Planned)* | **I** (Information Disclosure) | Malicious local user or unauthorized software with read access to the user profile can read unencrypted temporary working files or search indexes via direct file system access, resulting in complete exposure of past meeting transcripts. | A-12 |
| **T-14** | P6 *(Planned)* | **E** (Elevation of Privilege) | Malicious meeting participant or hostile presentation slide can inject adversarial prompt instructions via speech or OCR text frames, resulting in the local language model executing unauthorized file exports or data transmission commands. | A-12, A-15 |

---

*Notes: Threats T-01 through T-11 address the running prototype and its immediate toolchain. Threats T-12 through T-14 address planned native desktop capabilities, establishing security requirements for Tugas 2, Tugas 3, and Final Project.*
