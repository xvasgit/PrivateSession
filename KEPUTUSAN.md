# Engineering & Cryptographic Decisions

## ADR-001 — Shared Static Frontend

Use root Next.js App Router, React, TypeScript, and Tailwind for PAW and future desktop UI reuse. Build as a static export. Avoid server-dependent capture/inference/data storage: privacy-first operations belong on the user's device. Tauri is a candidate; no native shell or model stack is selected. A separate backend/database is not needed for the current Tugas 1 prototype.

## ADR-002 — Authenticated Local Session Encryption

Use standard Web Crypto AES-256-GCM with 128-bit authentication tags, CSPRNG-generated 96-bit nonces, and session-ID AAD. Ciphertext/tag and nonce serialize to hex. Nonce uniqueness per key is mandatory; random generation is appropriate for this limited demo, while production invocation limits/key lifecycle need explicit design.

Authenticated encryption protects confidentiality and detects mutation; encoding/plain hashes alone do not. Standard browser/Node Web Crypto keeps this component portable and avoids custom ciphers. No external crypto dependency is required. See [Web Crypto encryption documentation](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt).

## ADR-003 — Temporary Demo Keys, Durable Vault Deferred

Generate non-exportable keys per draft in memory; encrypt and authenticate a round trip, then discard the key reference. No key/plaintext persistence or network request occurs. This intentionally demonstrates a component, not a reusable encrypted storage system. Durable key management/recovery, encrypted search, native disk protection, and export authorization must be implemented and tested before real sessions.

Revision note (2026-10-13): these component decisions remain unchanged. The PemWeb revision disconnects encryption from the UI; current pages do not generate draft keys or invoke this workflow. Crypto reintegration is separate future work.

## ADR-004 — Reconnect Prepared Draft and Synthetic Review (2026-10-13)

The later crypto revision supersedes the disconnection status above. Reuse the unchanged AES-GCM helper through a typed workflow adapter and shared client preview. Prepared live drafts contain title/context/mode/source preferences/consent; sample reviews contain only the fixed analysis fixture. Media selection never enters the crypto payload.

Each operation creates a fresh key and kind-prefixed random artifact ID, seals JSON under the existing AAD namespace, decrypts, and compares the exact recovered string before returning only the ID/envelope. Keys are neither displayed nor persisted. API/authentication failures fail closed; unavailable Web Crypto produces a localhost/HTTPS hint. Reset/edit/reprepare invalidates pending UI results.

This meets the basic component integration goal without adding storage or recovery. Visible plaintext and synthetic fixtures remain accessible; it offers no locked-page or persistent-data protection. Real benefit for saved/exported meeting data requires a later durable key lifecycle. Identity, consent, and sharing authorization remain separate mechanisms. Parameters follow the [W3C AES-GCM API definition](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/#aes-gcm).
