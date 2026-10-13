# Data Flow Diagram

## Current Versus Intended Scope

Current: P-01 UI, P-02 Web Crypto, synthetic D-00 fixtures, and a loopback server supplying frontend assets. F-01 is the user's consent/preferences input; F-02 encrypts draft JSON locally and returns an envelope. Everything else below is planned desktop architecture. Trust boundaries TB-1 and TB-2 are intended security boundaries, not implemented isolation in the browser prototype.

```mermaid
flowchart LR
  E01["E-01 User / consenting participants"]
  E02["E-02 OS devices and visible desktop"]
  E03["E-03 Explicit export recipient"]
  subgraph TB1["TB-1: UI / untrusted meeting content"]
    P01["P-01 UI and consent controller (current)"]
    P02["P-02 Web Crypto demo (current)"]
    D00["D-00 Synthetic fixtures (current)"]
  end
  subgraph TB2["TB-2: Native permission / processing boundary (planned)"]
    P03["P-03 Capture + restricted IPC (planned)"]
    P04["P-04 Local ASR / OCR / classifier / LLM (planned)"]
    P05["P-05 Vault / export controller (planned)"]
    D03["D-03 Local models (planned)"]
  end
  subgraph TB3["TB-3: Durable storage / key custody (planned)"]
    D01["D-01 Encrypted sessions + index (planned, CRYPTO)"]
    D02["D-02 OS-backed key custody (planned, SECRET)"]
  end
  E01 -->|"F-01 Consent / preferences"| P01
  D00 -->|"F-00 Sample summaries"| P01
  P01 -->|"F-02 Draft JSON"| P02
  P02 -->|"F-02 AES-GCM envelope (CRYPTO)"| P01
  P01 -->|"F-03 Scoped capture commands (planned)"| P03
  E02 -->|"F-04 Audio / frames (planned, sensitive)"| P03
  P03 -->|"F-05 Timestamped events (planned)"| P04
  D03 --> P04
  P04 -->|"F-06 Transcript / OCR / answers (planned)"| P01
  P04 --> P05
  D02 -->|"Key use (planned)"| P05
  P05 <-->|"Authenticated encrypted records (planned)"| D01
  P01 -->|"F-07 Explicit export selection (planned)"| P05
  P05 -->|"F-07 Selected export (planned)"| E03
```

TB-1 to TB-2 requires scoped IPC and OS capture permission checks; TB-2 to TB-3 requires least-privilege filesystem/key access and authenticated records. Both remain future controls. Plaintext audio/OCR remains sensitive in runtime memory even if disk storage is encrypted. No cloud inference edge exists by default; adding one requires a revised DFD and explicit user configuration.
