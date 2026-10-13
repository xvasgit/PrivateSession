# Owned Local Security Lab

## Scope & Environment

The current lab is this user's Windows development workspace running Node.js 24 and a loopback Next.js/static server at `127.0.0.1:3000`. Allowed validation in this initialization: unit tests, Playwright browser journeys, accessibility audits, and inspection of generated local files. Use synthetic data only. No OS hardening, port scanning, native capture, peer testing, or external penetration test is part of this setup.

Do not probe campus networks, public addresses, or third-party APIs. Record any future test's scope/tool/window before execution; stop if out-of-scope data or service disruption appears. Native models, capture capabilities, vault files, and OS permission settings are not present yet.

## Tugas 1 Evidence

- [Asset inventory](asset-inventory.md)
- [DFD and trust boundaries](dfd.md)
- [STRIDE threat model](threat-model.md)
- [Risk register and controls](risk-register.md)

The threat model describes both the actual synthetic prototype and the intended desktop architecture. Planned security controls are explicitly identified; document preparation does not demonstrate their effectiveness.

## PemWeb Revision Boundary — 2026-10-13

The inventory/DFD/STRIDE/risk documents are preserved as the earlier cross-course baseline. Their synthetic library and browser-encryption references are historical: those pages were removed in the PemWeb revision. Current UI has capture preferences, metadata-only media selection, explicit synthetic previews, and a mock Sign In dialog. No capture, media-content reads/uploads, persistent storage, authentication, MCP, or UI crypto integration is implemented. Updating the security model for real integrations is separate KKS work; this revision does not claim revalidated native controls.
