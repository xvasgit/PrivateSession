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

## ADR-005 — Local Encrypted Transcript Database Foundation (2026-11-02)

Use the student's proposed MeetingSession/TranscriptSegment schema for the Module 6 local PostgreSQL 18 lab. Keep binary ciphertext plus its GCM tag in `contentCiphertext` and the 12-byte nonce in `iv`; do not persist transcript plaintext or encryption keys in these tables. The new adapter reuses the unchanged AES-GCM helper, whose AAD prefix wraps `transcript-segment:v1:<sessionId>:<sequence>`. Preserve numeric session/sequence identity for a stored segment. Existing browser demonstrations retain their per-operation temporary keys.

A dedicated server-only loader imports a persistent 32-byte Base64 lab key from ignored local environment configuration as a non-exportable CryptoKey. Standalone seed/verification entry points import the same key through the pure adapter, without importing Next.js server-only modules. Environment misconfiguration fails closed; no automatic key generation or replacement. Process restart reimports the configured original key. Key rotation/version migration is deferred; all lab records currently use one version-1 format and one configured key. The operator must retain the original key and a protected separate recovery copy.

This is encryption at rest against disclosure of database contents without the key. It does not protect against the running server/operator, plaintext metadata disclosure, or replay of an older valid ciphertext at the same identity. Random IVs suit this small synthetic lab; production key-use limits and nonce lifecycle need a separate design. Decryption failures return a generic message and no plaintext. The prototype has no per-user ownership columns; no database UI or multi-user authorization is claimed by this foundation.

Use a separate manually created shadow database for migrations, upsert seed data without overwriting existing rows, and keep the seed transactional. The foreign key uses Restrict to prepare the subsequent explicit deletion/rollback exercise; that full CRUD/rollback increment is not implemented here. PostgreSQL connections are restricted to the owned loopback lab. The earlier static-export decision describes the historical Tugas 1 baseline; current Next.js runtime and standalone database tooling are the lab execution model.

## ADR-006 — Shared-Account Meeting Lab and Explicit Transactions (2026-11-02)

The approved Module 6 increment adds independent /meetings routes, linked from Upload & Review and the authenticated practicum list. Preserve the two-table design without owner columns and reuse the single synthetic lab account; all people sharing it access the same records. Every page/action verifies the server session. Production ownership requires a separate schema/authentication design.

Persist only manually entered synthetic text. The server encrypts before storing and authenticates/decrypts for authorized rendering; this is at-rest encryption, with plaintext metadata and no protection against the running server/operator. Existing segment parent/sequence are immutable, and text edits receive fresh IVs. Public crypto demonstrations retain their independent ephemeral keys and never process selected media.

Keep onDelete: Restrict. Ordinary deletion demonstrates the constraint; a separate checkbox-confirmed operation deletes children and parent inside an interactive transaction. A deliberate throw exists only in the integration script to prove complete rollback. Safe Prisma errors support duplicate/relationship/stale-form recovery without exposing submitted values. Keep the current migration and original key; no resets or silent key regeneration.

Module 5 request cleanup must retain the shared session/sign-in/proxy infrastructure while this lab depends on it. The technical document follows implementation and manual evidence capture; no automatic screenshots or Git operations are part of this increment.
