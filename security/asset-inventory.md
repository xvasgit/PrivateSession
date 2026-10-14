# Asset Identification and Valuation

> **Reference Template:** Week 2 Lecture Slide — *Asset Identification dan Valuation* (FIPS 199 Evaluation Standard).  
> **System:** PrivateSession (Tugas 1 running prototype & planned desktop architecture).

C, I, and A are evaluated as **H (High)**, **M (Moderate)**, or **L (Low)** based on the potential adverse impact if that security objective is lost, in accordance with FIPS PUB 199 guidelines.

---

## 1. Running Product Assets (Tugas 1 Implemented Scope)

| Asset | Category | Location | C | I | A | Rationale |
|---|---|---|---|---|---|---|
| **A-01** Live setup draft (title, context, capture preferences, consent flag) | Data | Browser memory on `/live/` (`D2`) | M | M | L | Title and context may contain sensitive project names, client identifiers, or proprietary discussion topics. Tampering alters what is verified or recorded. Loss on reload is by design for the ephemeral prototype. |
| **A-02** Temporary AES-256 draft key  | Data (Secret) | Web Crypto memory handle (`D3`) | **H** | **H** | L | Symmetric key used for AEAD demonstration. Key compromise allows instant decryption of captured draft envelopes. Tampering destroys decryption capability. Lives for milliseconds during a single operation. |
| **A-03** Encrypted draft envelope + artifact ID  | Data | Browser memory (`D2`) | L | **H** | L | Authenticated ciphertext (`AES-256-GCM`). Without the key, ciphertext leaks only approximate length. Integrity is paramount; bit modifications or tag corruption cause immediate decryption failure. |
| **A-04** Synthetic transcript & review fixtures | Data | `lib/workflows/samples.ts` bundled into `out/` (`D1`) | L | M | L | Public synthetic sample text. Confidentiality is low because data is fictitious. Integrity is moderate to prevent misleading sample analysis or corrupted demo workflows. |
| **A-05** Selected recording metadata (file name, size, MIME type) | Data | Browser memory on `/upload/` (`D2`) | M | L | L | File names often reveal meeting participants, dates, or confidential corporate projects. Integrity and availability are low because file contents are never read or uploaded by the application. |
| **A-06** PrivateSession web application | Software | Statically compiled bundle in `out/` served via `serve` on `127.0.0.1:3000` (`D1`, `P1`) | L | **H** | M | Source code is open in local lab. Tampering with client JavaScript enables cross-site scripting (XSS), exfiltration of in-memory drafts, or spoofed encryption verification status. |
| **A-07** Source code, lockfile & CI workflow | Software | Workspace directory (`D4`) and GitHub remote repository (`E3`) | L | **H** | M | Integrity determines whether clean, verified builds are compiled and whether automated tests pass. Tampered dependencies or CI scripts could compromise deployment and grading verification. |
| **A-08** Developer workstation host | Hardware / Host | Windows development machine, Node.js 24 environment | M | **H** | M | Host machine executing the server process, browser instance, and developer tools. Host compromise yields administrative access to all memory, source code, and local loopback traffic. |
| **A-09** Project secrets (`.env`, future signing keys) | Data (Secret) | Local `.env` file (git-ignored); public `.env.example` template | **H** | **H** | L | Accidental commit of secrets to the public GitHub repository results in permanent credential disclosure. Integrity is critical to ensure legitimate configuration parameters. |

---

## 2. Planned Desktop Architecture Assets (Future Milestones)

| Asset | Category | Location | C | I | A | Rationale |
|---|---|---|---|---|---|---|
| **A-10** Raw microphone audio & system audio streams | Data | Native capture buffer (`P5`, `F15`, `F16`) | **H** | **H** | M | Spoken voice and remote participant audio contain highly confidential conversations. Unauthorized interception violates Indonesian Personal Data Protection law (UU 27/2022). |
| **A-11** Screen frames & OCR visual buffer | Data | Native memory buffer (`P5`, `F15`, `F16`) | **H** | **H** | M | Visual captures may contain personal chat notifications, passwords, customer records, or background windows. Masking and minimization are required prior to local model analysis. |
| **A-12** Transcripts, action items & meeting summaries  | Data | Durable encrypted session vault (`D5`, `P7`) | **H** | **H** | M | Stored records of all completed meetings. Confidentiality and integrity must be preserved at rest through authenticated database encryption (`AES-256-GCM`). |
| **A-13** Durable vault master key  | Data (Secret) | OS-backed secure storage (`D6`: Windows DPAPI / Linux SecretService) | **H** | **H** | **H** | Master key protecting all archived meeting sessions. Compromise exposes every past session. Permanent key loss results in irrecoverable data loss. |
| **A-14** Local AI models & runtime weights | Software / Model | Local application directory (`D7`, `P6`) | L | **H** | M | On-device Whisper and LLM weights. Integrity is critical to prevent adversarial prompt manipulation, backdoor injection, or altered meeting summaries. |
| **A-15** Selected export packages | Data | User-designated export path (`E6`, `F21`) | M | **H** | L | Formatted Markdown or text archives created upon explicit user confirmation. Integrity ensures exports truthfully represent the discussed meeting topics. |

---

*C, I, A evaluated as H (High), M (Moderate), or L (Low) based on impact if that security property is compromised (FIPS PUB 199).*
