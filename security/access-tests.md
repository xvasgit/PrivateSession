# Application Access-Control Verification

Date: 2026-11-06. Product: PrivateSession accounts/ownership increment. Environment: owned Windows localhost, PostgreSQL 18, Prisma 7, Next.js 16.4.0, Better Auth 1.7.18. All identities and meeting text are synthetic. This document does not claim VM/container hardening or final Tugas 2 completion.

## Policy

| Operation                                                              | Active member | Active administrator | Initial-password / disabled / unauthenticated                           |
| ---------------------------------------------------------------------- | ------------- | -------------------- | ----------------------------------------------------------------------- |
| Own meetings, segments and encrypted review CRUD                       | Allow         | Allow                | Deny                                                                    |
| Another owner's meetings, segments or review                           | Deny          | Deny                 | Deny                                                                    |
| Own display-name and password update                                   | Allow         | Allow                | Initial-password user may only change password/sign out; otherwise deny |
| List identities, create member, activate/deactivate member             | Deny          | Allow                | Deny                                                                    |
| Edit roles/emails, impersonate, reset another password, delete account | Deny          | Deny                 | Deny                                                                    |

Ownership comes only from a verified session. Protected mutations recheck active status, password-replacement state and session expiry inside a transaction. They lock the actor and parent before mutation. Deactivation uses the same actor/target lock policy and revokes sessions. Missing and foreign records share the same unavailable response. Administrators have no content-access bypass. This protects access through the app; it does not prevent an operator with database and encryption-key access from decrypting data.

## Reproducible paired matrix

Create the separate `privatesession_auth_rehearsal` database under the same local PostgreSQL role and apply current migrations. Run `npm run test:access`. The script uses unique temporary identities and deletes only its fixtures. Every negative case below also compares meeting/segment state before and after rejection. Results recorded on 2026-11-06: **12 positive + 12 negative cases passed**.

| Pair | Positive action / expected result     | Negative action / expected result                   | Actual      |
| ---- | ------------------------------------- | --------------------------------------------------- | ----------- |
| 01   | Owner reads meeting                   | Another member reads it: unavailable                | Both passed |
| 02   | Owner updates meeting title           | Another member updates it: rejected, unchanged      | Both passed |
| 03   | Owner adds segment                    | Another member adds to that parent: rejected        | Both passed |
| 04   | Owner edits segment                   | Another member edits it: rejected                   | Both passed |
| 05   | Owner saves encrypted review          | Administrator edits member review: rejected         | Both passed |
| 06   | Administrator reads own empty library | Administrator reads member detail: unavailable      | Both passed |
| 07   | Member changes own display name       | Inject user ID/role into profile: rejected          | Both passed |
| 08   | Administrator creates member          | Member creates an account: rejected                 | Both passed |
| 09   | Administrator deactivates member      | Member changes another status: rejected             | Both passed |
| 10   | Active member session accepted        | Deactivated member's old session: rejected          | Both passed |
| 11   | Different owners use the same code    | Same owner duplicates code: rejected                | Both passed |
| 12   | Owner deletes a segment               | Administrator bulk-deletes member meeting: rejected | Both passed |

Additional executable checks cover wrong-password rejection without ending a valid session, required first-password replacement, all-session revocation after password change, changed signing-secret rejection, expiry/forgery, development cookie flags, and HTTP rate limiting. Browser tests cover actual forms and direct request tampering at 390/768/1280 px, blocked registration/admin endpoints, untrusted origins, deactivation/reactivation replay, production cookie flags, retry/pending UI, and media/privacy regressions. `node scripts/test-meeting-restart.mjs` verifies valid session/data persistence and revoked-cookie rejection across real owned-server restarts. See [dated evaluation](../EVALUASI.md) for final command results and limitations.

## Password and session evidence

The pinned library uses scrypt with N=16384, r=16, p=1, a 64-byte result and a 16-byte CSPRNG salt; passwords are NFKC-normalized by the library. Repeated hashing produces different salted results, correct verification succeeds, and wrong passwords fail. Tests do not print hashes or credentials. Password hashing is separate from AES-GCM content encryption and the auth signing secret.

Cookies have HttpOnly, SameSite=Lax, Path=/ and an eight-hour lifetime; Secure is enabled in production. No cookie cache or automatic session extension is enabled. The database holds sensitive session tokens; never expose them as evidence. Login/password-change HTTP requests use persisted rate limits. The local direct-access configuration trusts no forwarded-IP header and uses a shared per-path bucket. Production proxy identity configuration remains separate infrastructure work.

## Manual screenshots — student capture only

No screenshots were captured automatically for this increment.

1. Start the app on localhost. Sign in with a newly created synthetic member and capture the required password-change page. Keep password fields/values out of the image. Complete the change and sign in again.
2. As the administrator, open **Manage accounts** and create a synthetic member. Capture its MEMBER/ACTIVE row and success message, with the initial-password field empty.
3. Use two separate browser profiles for members A and B. Create a meeting as A. Capture A's detail, then open the exact URL as B and capture the unavailable result. Repeat the denied detail as administrator; annotate the role and intended result.
4. Keep B signed in. Deactivate B from the administrator account; refresh B's meeting page and capture the sign-in redirect. Reactivate B and confirm a fresh sign-in is required.
5. Inspect DevTools → Application → Cookies for the auth cookie. Capture name/path/expiry/HttpOnly/SameSite/Secure; cover the entire value and any lower preview with a solid mask. Repeat with the owned production server for Secure. Never export HAR or capture credentials, hashes, or raw tokens.
6. For replay evidence, privately retain a synthetic cookie outside Git, sign out, restore that cookie in the same profile/origin and revisit Meetings. Capture rejection with the entire value masked. Delete the replay cookie/private note afterward.

## Risk traceability and separate KKS work

Preserve Tugas 1 IDs and assessments as historical. Current links are deliberately specific:

| Control                                                               | Tugas 1 linkage                                | Current interpretation / added risk                                                                                                      |
| --------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Owner-scoped content access and fail-closed decryption                | R-13 storage disclosure; R-08 record integrity | New R-15: cross-account access through object IDs; verified by pairs 01–06/12. Existing R-13 described a different storage architecture. |
| Slow hashes, initial-password replacement, revocable sessions         | R-11 credential/secret disclosure              | New R-16: account takeover or continued access after deactivation; R-11 alone originally covered repository leakage.                     |
| Server-owned roles and restricted administration                      | R-10 privilege/access integrity                | New R-17: app-role escalation; R-10 originally concerns Git permissions, so app tests do not claim to fix GitHub access controls.        |
| Ignored credentials, separate signing secret, protected recovery copy | R-11                                           | Local handling implemented; Git history scanning is separate work.                                                                       |

Next KKS baseline: start an owned Linux VM with a separate synthetic database; collect Lynis and initial image scans **before** changes. Then verify SSH key-only login/root rejection, Lynis ≥70, non-root services/containers, restricted capabilities, unpublished app/database ports behind a proxy, final image scans and CycloneDX SBOM. Map those results to R-01/R-02 and applicable updated risks. Do not scan external infrastructure or claim missing artifacts exist.

Known blockers: default Turbopack worker startup fails locally; Webpack is the tested alternative. The dependency audit still reports a critical Next.js finding; framework remediation and final KKS scans are pending. No deployment-readiness claim is made.

**2026-11-08 container rerun:** The hardened Docker image uses Next.js 16.4.5 and passed its final image scan with zero critical findings. The same 12 positive and 12 negative access cases passed in the tools container against a fresh synthetic database. See [container runtime verification](container/README.md) and [image scans](scans/README.md). This update supersedes the earlier critical-image blocker for these scanned lab images.
