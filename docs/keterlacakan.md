# Cross-Course Traceability

This table describes the current meeting-library increment. It does not declare any course submission complete. Historical Module 4–6 documents and screenshots remain unchanged.

| Requirement                                 | Product behavior                                            | Implementation                                             | Verification                                             |
| ------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| PAW: two related CRUD entities              | Meeting and transcript creation/read/update/delete          | Meeting routes, Server Actions, Prisma repository          | Database scenarios and meeting browser suite             |
| PAW: persistent server validation           | Title/code/segment/review errors are associated with fields | Shared Zod schemas and typed actions                       | Boundary, direct-action and tampered browser submissions |
| PAW: responsive integration                 | Shared navigation and real meeting detail sections          | Existing reusable components, three viewports              | Product-navigation and CRUD browser tests                |
| Kripto: authenticated product storage       | Transcripts and manual reviews stored encrypted             | AES-256-GCM, unchanged external key, distinct AAD contexts | Crypto tests and database ciphertext checks              |
| Kripto: fail closed                         | Invalid review cannot be silently replaced                  | Authenticate prior content inside locked transaction       | Tampering/no-write repository and browser tests          |
| Persistent session boundary                 | Unauthenticated/forged/expired/revoked sessions rejected    | Better Auth plus active-account/page/action checks         | Session tests, logout/replay browser case                |
| KKS: real roles and password hashing        | Member/Admin, owner-only content, salted scrypt             | Auth/account tables and protected data access              | Paired access cases and account browser tests            |
| KKS: OS/container hardening, scans and SBOM | Not part of this increment                                  | Existing security baseline retained                        | Separate work required                                   |
| Media and AI boundaries                     | Picker validates metadata; manual reviews are independent   | Upload metadata action, no processing endpoints            | Media privacy guards and navigation tests                |

Future live companion capture, recording storage, inference and MCP work must extend these controls. Current limitations and actual test outcomes are recorded in [EVALUASI.md](../EVALUASI.md).
