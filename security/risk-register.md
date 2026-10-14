# Risk Register — Evaluasi Risiko dan Rencana Kontrol

> **Reference Template:** Week 3 Lecture Slide — *Templat Tabel: security/risk-register.md*.  
> **Official Scoring Matrix:** Week 3 Lecture Slide 22 — *Risk Level: Likelihood × Impact (Skala resmi Tugas 1)*.  
> **Rule:** *Satu threat, satu baris.* Risk ID (`R-xx`) corresponds 1:1 with Threat ID (`T-xx`).

---

## 1. Official Risk Assessment Matrix (Slide 22)

Evaluation scale: **Likelihood (L)** from 1 to 5; **Impact (I)** from 1 to 5. Risk score is computed as $\text{Risk} = L \times I$.

| Risk Level | Score Range | Description & Mandatory Action (Slide 22) |
|---|---|---|
| **Very High (VH)** | **15 – 25** | *Tangani segera; wajib masuk risk prioritas* (Mandatory top priority; mitigate immediately). |
| **High (H)** | **8 – 14** | *Tangani pada tugas terdekat* (Address in the nearest upcoming milestone: Tugas 2 / Tugas 3). |
| **Moderate (M)** | **4 – 7** | *Rencanakan control; pantau* (Plan mitigation controls; monitor throughout development). |
| **Low (L)** | **1 – 3** | *Dapat diterima (accept) dengan alasan* (Acceptable residual risk with documented justification). |

---

## 2. Risk Register Table (All 14 Threats)

Sorted by risk score from highest to lowest. The **top 5 priority risks** are highlighted and mapped to upcoming course deliverables.

| Risk ID | Threat ID | Current Control | L | L Rationale (Product Condition) | I | I Rationale (Impact Details) | Risk | Response | Control Plan | Assignment |
|---|---|---|---|---|---|---|---|---|---|---|
| **R-01** ★1 | T-01 | Lockfile (`package-lock.json`) and automated `npm ci` in GitHub Actions. | 4 | Dependency tree contains 573 packages with build-time scripts; `npm audit` reports 10 dev vulnerabilities (9 high, including `serve-handler` and `compression`); no automated security audit step in CI. | 4 | Compromised build scripts or dependencies execute with full developer host privileges and can alter exported client bundles in `out/`. | **16 VH** | Mitigate | Integrate CycloneDX SBOM generation (`sbom.cdx.json`), enforce `npm audit --audit-level=high` in CI, and upgrade vulnerable server dependencies. | Tugas 2 |
| **R-06** ★2 | T-06 | Client-side mandatory HTML checkbox gating the "Prepare setup" action button. | 4 | Checkbox state is an ephemeral boolean in browser RAM; no timestamp, user identity, or cryptographic signature is captured or retained. | 4 | Inability to prove participant consent violates Indonesian Personal Data Protection law (UU 27/2022 Pasal 20 & 28), exposing the operator to statutory penalties once capture is enabled. | **16 VH** | Mitigate | Implement structured, tamper-evident consent records containing timestamp, session ID, and consent notice hash; enforce SIEM alert if capture starts without valid token. | Tugas 3B |
| **R-11** ★3 | T-11 | `.gitignore` excludes local `.env`; repository publishes only `.env.example`. | 3 | Public repository (`xvasgit/PrivateSession`); manual git commits by solo student developer without pre-commit hooks or automated leak prevention tools. | 5 | Accidental commit of private keys, tokens, or credentials into public GitHub history causes permanent compromise; commits are cached across GitHub forks. | **15 VH** | Mitigate | Integrate Gitleaks automated secrets scanning into GitHub Actions CI workflow, document secrets handling in `secrets.md`, and enable push protection. | Tugas 3A |
| **R-10** ★4 | T-10 | Solo developer account credentials; GitHub Actions permissions set to `contents: read`. | 2 | Requires compromising student personal GitHub credentials or developer machine access; repository currently lacks branch protection rules. | 5 | Attacker with write access can overwrite branch `main`, push unauthorized code evaluated across three courses, or relocate immutable academic milestone tags. | **10 H** | Mitigate | Enable mandatory GitHub two-factor authentication (2FA), configure branch protection on `main`, and restrict force-push / tag modifications. | Tugas 2 |
| **R-03** ★5 | T-03 | Server binds to loopback interface `127.0.0.1`; Playwright `reuseExistingServer: false` prevents silent port reuse. | 3 | Port 3000 is a standard Node.js development port; local port collision was empirically encountered during testing on 2026-10-13. | 3 | Confused student or tester may interact with another running application on the same port, entering confidential session metadata into the wrong service. | **9 H** | Mitigate | Implement startup port-conflict detection script, configure host firewall rules to restrict loopback access, and evaluate local TLS configuration. | Tugas 3A |
| **R-02** | T-02 | OS-level user permission model. | 2 | Requires pre-existing malware already executing on developer workstation; static `out/` bundle is regenerated fresh on each build. | 4 | Tampered client-side JavaScript could silently fake cryptographic verification badges or leak in-memory meeting metadata. | **8 H** | Mitigate | Execute host operating system security hardening and capture baseline Lynis audit log (`lynis-before.txt` → `lynis-after.txt`). | Tugas 2 |
| **R-07** | T-07 | Web Crypto non-exportable key (`extractable: false`), single-operation lifecycle, no third-party CDN scripts. | 2 | Statically compiled application contains zero third-party remote script tags; key handle reference is released after verification round trip. | 4 | Compromised script executing in the same origin could decrypt in-flight session envelopes before the temporary key handle is garbage collected. | **8 H** | Mitigate | Deploy strict Content Security Policy (CSP) headers disallowing unsafe-inline scripts and enforce Trusted Types. | Tugas 3A |
| **R-05** | T-05 | Standard browser renderer process isolation. | 3 | Browser extensions with `all_urls` or `<all_urls>` permissions are commonplace in typical user desktop environments. | 2 | Harvested data is limited to short meeting titles (3–80 chars), optional context (≤500 chars), and file names; no audio or video content is accessible. | **6 M** | Accept | Document requirement for clean, extension-free browser profile during testing and demonstration clinics. | Final Project |
| **R-09** | T-09 | File selection is purely metadata-only; zero file content is read or rendered. | 3 | Presenting or sharing application screens during video conference meetings is a primary intended use case of the product. | 2 | File names may reveal proprietary client or project names; file contents remain untouched on local storage. | **6 M** | Accept | Add optional UI privacy toggle allowing users to mask or redact file names from the display during active screen shares. | Final Project |
| **R-12** | T-12 | No audio or screen capture capability implemented in current web prototype; Playwright tests assert zero media API calls. | 1 | Audio/video capture APIs are not implemented in the running prototype; capability does not exist in code. | 5 | Inadvertent capture of sensitive bystander conversations or desktop background notifications violates user expectations. | **5 M** | Avoid | Enforce source-selection boundaries, visible desktop recording indicator, and explicit window capture boundaries before native release. | Final Project |
| **R-13** | T-13 | No persistent database or session storage implemented in current web prototype; memory resets completely on page reload. | 1 | Persistent storage does not exist in the running prototype; all data is volatile RAM state. | 5 | Unencrypted local search indexes or database files would expose all historical meeting records to any local process. | **5 M** | Avoid | Implement encrypted SQLite vault (`AES-256-GCM`), protected indexing, and automated encrypted backup/restore drill (`backup-restore.md`). | Tugas 3A / FP |
| **R-04** | T-04 | Server binds strictly to local loopback interface `127.0.0.1:3000`. | 2 | Exploitation requires local process access and specifically crafted premature connection aborts. | 2 | Denial of service is temporary and local; restarting `npm start` immediately restores service availability. | **4 M** | Mitigate | Replace or upgrade `serve` with hardened static delivery mechanism as part of Tugas 2 dependency remediation. | Tugas 2 |
| **R-14** | T-14 | No artificial intelligence or language model inference implemented in current web prototype. | 1 | Local inference capability does not exist in code; prototype uses fixed synthetic sample text. | 4 | Malicious prompt injection could attempt to trick local language model into reading unauthorized files or triggering exports. | **4 M** | Avoid | Architect inference engine with zero autonomous system execution privileges; treat captured OCR text strictly as untrusted data. | Final Project |
| **R-08** | T-08 | AES-256-GCM authenticated encryption with 128-bit authentication tag and session-bound AAD (`meeting-session:v1:<id>`). | 1 | Attack requires in-memory script injection; AES-GCM mathematically rejects tampered ciphertext or altered AAD (proven by tests C-04–C-09 and W-05/W-06). | 2 | Tampering immediately triggers decryption failure and displays error alert; no corrupted data is accepted as authentic. | **2 L** | Accept | Existing cryptographic controls are fully operational and verified by 21 automated regression and boundary tests. | — |

---

## 3. Top 5 Priority Risks Summary & Oral Defense Justification

In compliance with the Tugas 1 rubric (20 points for concrete control plans and defense articulation), the top 5 priority risks are justified below:

1. **R-01 (npm Supply-Chain & Dependency Vulnerabilities — Score: 16 VH):**  
   *Why Likelihood is 4:* The project relies on 573 npm packages. Current audit reveals 9 high-severity vulnerabilities in transitive server dependencies.  
   *How Control Lowers Risk:* Generating a CycloneDX SBOM (`sbom.cdx.json`) and enforcing an automated `npm audit` gate in CI during **Tugas 2** prevents vulnerable dependencies from entering the deployment pipeline.
2. **R-06 (Unprovable Participant Consent & Repudiation — Score: 16 VH):**  
   *Why Impact is 4:* Capturing audio without provable, auditable consent violates UU 27/2022 (PDP). A browser checkbox offers zero non-repudiation.  
   *How Control Lowers Risk:* Introducing cryptographic consent receipts (signed or MAC-bound event records) and detection rules alerting on capture without consent during **Tugas 3B** provides legally defensible auditability.
3. **R-11 (Public Repository Secrets Leakage — Score: 15 VH):**  
   *Why Impact is 5:* The repository is public on GitHub. An accidentally committed credential or private key cannot be un-seen once pushed.  
   *How Control Lowers Risk:* Adding automated Gitleaks scanning to GitHub Actions CI and establishing `security/secrets.md` during **Tugas 3A** blocks unauthorized secrets from ever entering the remote git tree.
4. **R-10 (Unauthorized Git Branch / Tag Tampering — Score: 10 H):**  
   *Why Impact is 5:* Academic evaluations across three courses depend on immutable Git milestone tags (`v0.1`, `sec-0.1`). Unauthorized alterations invalidate submissions.  
   *How Control Lowers Risk:* Enforcing GitHub branch protection rules on `main` and restricting tag manipulation during **Tugas 2** ensures the integrity of academic deliverables.
5. **R-03 (Loopback Port Collision & Service Squatting — Score: 9 H):**  
   *Why Likelihood is 3:* Port 3000 is shared by numerous web development frameworks. Collision on port 3000 was already observed during testing on 2026-10-13.  
   *How Control Lowers Risk:* Implementing startup port-conflict checks and host firewall boundaries during **Tugas 3A** guarantees traffic is routed strictly to the genuine PrivateSession application.
