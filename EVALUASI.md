# Initial Cryptographic Evaluation

Run `npm test` after `npm ci`. Runtime: Node.js 24 Web Crypto; browser integration is verified by `npm run test:e2e`. Test IDs are embedded in test names and linked in `docs/keterlacakan.md`.

| Scenarios | Goal | Critical |
|---|---|---|
| C-01–C-03 | Round trip, Unicode/empty boundary, fresh nonce/ciphertext | No |
| C-04/C-05 | Altered ciphertext/authentication tag rejected | Yes |
| C-06/C-07 | Wrong key/session context rejected | Yes |
| C-08/C-09 | Altered nonce, malformed/truncated/unsupported envelopes rejected | No |
| C-10/C-11 | Non-exportable AES-256 key and required session context | No |
| V-01–V-04 | Valid draft, length constraints, source selection, consent | No |

Executed on 2026-10-13 with Node.js v24.13.0 and Vitest 5.0.4: **15/15 unit tests passed**, including **4/4 critical crypto tests**. Playwright 1.64.0 with Chromium 156.0.8078.4 passed **9/9 browser checks** at 390/768/1280 px, including local encryption and consent. Mutation failures are exceptions with no returned plaintext. Nonce sampling is a sanity check, not proof that collisions are impossible. See `docs/evidence/verification.md` for audit details and limitations.

Limitations: the library samples are plaintext synthetic fixtures; encryption protects a temporary draft only. No persistent vault, native capture, model, recovery, encrypted index, authorization layer, or locked-device protection has been tested. Future validation must include persistent key lifecycle, export/delete handling, permission revocation, and native storage boundaries.

## PemWeb Revision Status — 2026-10-13

The results above describe the earlier frontend and remain historical. The crypto implementation and C-01–C-11/V-01–V-04 regression tests are preserved, but the encryption UI and session-library routes are removed. Current Playwright checks validate PemWeb workflows, not browser crypto integration. The component must be reconnected and reverified before claiming integrated crypto readiness; see `docs/evidence/verification.md` for current regression results.

## Reconnected Workflow Evaluation — 2026-10-13

This later revision supersedes the disconnected status above. `/live/` verifies a validated prepared draft; `/upload/` verifies only an explicitly requested synthetic review. Both use `encryptAndVerifyArtifact` and the unchanged `session-encryption.ts` component. A successful result requires authenticated decryption and exact recovery; it is not a saved or locked record.

After `npm ci`, run `npm test -- tests/crypto` for the 21 crypto/component integration cases. Run `npm run check`, `npm run build`, and `npm run test:e2e` for full verification; first install Chromium with `npx playwright install chromium` and stop your own port-3000 preview server before E2E starts its managed server.

| Added scenarios | Verified behavior |
|---|---|
| W-01/W-02 | Exact live-draft and fixed-review payloads round-trip; only envelope/ID returned, no key/plaintext |
| W-03 | Repeated operations use distinct keys, contexts, nonces, and ciphertext |
| W-04 | Invalid draft rejected before key generation |
| W-05 (three cases) | Key generation, encryption, and decryption failures reject instead of returning success |
| W-06/W-07 | Recovered-text mismatch and unavailable crypto fail closed |
| W-08 | Draft snapshot remains unchanged by edits during asynchronous work |
| Browser integration | Action gating, fresh results, keyboard-operated inspection, edit/reprepare/reset, late-result suppression, busy state, failure/retry, unavailable/insecure-context messages, and media independence |

Executed on Windows with Node.js 24.13.0, npm 11.6.2, Vitest 5.0.4, Next.js 16.4.0, Playwright 1.64.0, and Chromium 156.0.8078.4:

- `npm run check`: lint, strict types, **44/44 unit tests**, and formatting passed. Includes all **11/11 original crypto tests**, **4/4 critical negative tests**, and **10/10 new adapter cases**.
- `npm run build`: static export passed for Overview, Live Transcription, and Upload & Review.
- Browser suite: **45/45 passed** (15 journeys at each of 390×844, 768×1024, and 1280×800). Privacy guards covered both encryption actions without capture, media reads, storage writes, external requests, or content-sending requests. Expanded results did not cause horizontal overflow; mobile live and desktop review panels were visually inspected.

Execution notes: the sandbox build failed at Windows path canonicalization; the approved build outside the sandbox passed. Port 3000 was occupied, so the existing server was left untouched. The full E2E suite passed using a temporary configuration on loopback port 3101, inheriting the same tests/projects and serving the same `out/` build. The temporary configuration was removed afterward; the normal command remains on port 3000. An initial temporary TypeScript config under `node_modules` was rejected by Node's type-stripping rules and replaced by JavaScript before the successful run.

The existing Lighthouse PDF and viewport evidence predate these controls and were not regenerated. Refresh them before claiming a current accessibility score; deleted JSON/audit/superseded artifacts were not restored. No fresh dependency audit, remote CI run, second-machine clean clone, persistence/key-recovery test, or release tag is claimed. Keys are temporary; original text remains accessible and JavaScript memory erasure is not guaranteed. Human review and individual explanation remain pending.
