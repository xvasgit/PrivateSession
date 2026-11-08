# KKS Tugas 2 image scan baseline

[Before scan](image-scan-before.txt) — collected on 2026-11-08 at 18:36 WIB with Trivy 0.76.2, vulnerability database updated at `2026-11-08T06:39:21Z`. The scanner read the saved image archive, evaluated Debian and installed Node.js packages, and used no severity filters or vulnerability exclusions. This is baseline evidence for [R-01](../risk-register.md), prior to image remediation.

| Image detail              | Value                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| Local image tag           | `privatesession-kks:baseline`                                                                   |
| Application source        | `v0.2` (`1b1f2a3f5fcc9ea16c4b0472ae543f3e7e0ca8ed`), unchanged application and lockfile         |
| Linux image config digest | `sha256:8446c22cd467914f941a6fcf9b891cbe7dcc467f60528d9210439193c3bf838e`                       |
| Docker image index ID     | `sha256:3ebff6df0e6425fa7345b35c415f106ce3d2cca2e785b97b9b1a684f043f448c`                       |
| Base image                | `node:24-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9` |
| Runtime                   | `linux/amd64`, Debian 12.15, Node.js 24.22.2, Next.js 16.4.0                                    |
| Report SHA-256            | `e6c745faea86ba45362312530c5eb2e6a984a0f6f3c1980e9245cf42a486b9b6`                              |

Trivy counted **241 findings: 3 critical, 41 high, 109 medium, and 88 low**. There were 215 OS package findings and 26 Node.js package findings. Counts are scanner findings, not a count of unique CVE IDs across all packages.

| Critical finding      | Package  | Installed         | Fixed version in scan                   |
| --------------------- | -------- | ----------------- | --------------------------------------- |
| `CVE-2023-45853`      | `zlib1g` | `1:1.2.13.dfsg-1` | None listed for this base               |
| `GHSA-2464-fhr4-w9xw` | `next`   | `16.4.0`          | `16.4.1` on the installed major version |
| `GHSA-673q-mjm6-r5xr` | `next`   | `16.4.0`          | `16.4.1`                                |

The [baseline Dockerfile](../../Dockerfile.baseline) builds with npm 11.6.2 and Webpack. The newer npm bundled with the base rejected optional dependencies in the submitted lockfile, so the build uses the original npm CLI version without rewriting the repository lockfile. An interrupted npm download was retried using Docker's build cache. The [build context allowlist](../../.dockerignore) excludes environment files and unrelated workspace material.

The isolated startup check confirmed `GET /` returned HTTP 200 with PrivateSession content. It used no external network, database credentials, or published ports. Prisma generated its client but reported an OpenSSL detection warning on the slim base; this check did not exercise database connectivity. The baseline is not the hardened runtime. The container runtime checks, final scan, and final SBOM are separate evidence.

For comparison, retain this report and scan the remediated image using the same Trivy version and settings. If the vulnerability database is refreshed, record that change with the final scan. The original image archive and raw JSON are kept outside the Git repository in the workspace's `local-backups/kks-baseline-scan/` folder.

## After remediation — 2026-11-08

Both running images were verified against the exact scanned image IDs. Trivy 0.76.2 used the same cached vulnerability database and scanner settings as the before scan. No findings were excluded. Each CycloneDX SBOM was generated from the full package list in its corresponding scan result.

| Image               | Critical | High | Medium | Low | Evidence                                                                                              |
| ------------------- | -------: | ---: | -----: | --: | ----------------------------------------------------------------------------------------------------- |
| App baseline        |        3 |   41 |    109 |  88 | [Before scan](image-scan-before.txt)                                                                  |
| App hardened        |        0 |   54 |     87 |  65 | [After scan](image-scan-after.txt), [SBOM](sbom.cdx.json) (272 components)                            |
| PostgreSQL hardened |        0 |    0 |      1 |   0 | [PostgreSQL scan](postgres-scan-after.txt), [PostgreSQL SBOM](postgres-sbom.cdx.json) (54 components) |

The app moved to Next.js 16.4.5, which includes the fixes for the two Next.js advisories, and to a pinned Debian 13 base, which carries the zlib fix. The standalone runtime includes traced application dependencies and omits the build cache. The high-severity count increased on the changed package set; the result meets the zero-critical criterion and does not indicate that every finding was fixed.

The initial PostgreSQL Debian 13 candidate reported critical findings in `libxml2` and the Go standard library bundled in `gosu`. The final PostgreSQL recipe uses a pinned Alpine 3.24 base and omits the root-only `gosu` helper because the container starts directly as the database user. The rejected candidate's raw scan remains outside Git under `local-backups/kks-after-scan/db/`.

| Final image                            | Docker image index ID                                                     | Linux image config digest                                                 |
| -------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `privatesession-kks:hardened`          | `sha256:dcb45e29bb1bff1a2fa75ddf05920b7bfbd6f878c14924230b7666db6b70986e` | `sha256:0338c30e31fad2cbf801a221d63808ebfe21dc4f0a6e1d70f73d90dc45b1f433` |
| `privatesession-kks:postgres-hardened` | `sha256:61a93579e20f5818bdf928376531b576abbe08da4079e98a6056b5d45014f560` | `sha256:3a35396820d5d9531032986e29aa1c27d638af7db293c3834a13a450c7016cb3` |

See [runtime verification](../container/README.md) for observed container restrictions and the access test rerun.
