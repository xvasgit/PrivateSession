# PrivateSession — Owned Local Security Lab

## Scope & Environment

The current lab is this user's Windows development workspace running Node.js 24 and a loopback Next.js/static server at `127.0.0.1:3000`. Allowed validation in this initialization: unit tests, Playwright browser journeys, accessibility audits, and inspection of generated local files. Use synthetic data only. No OS hardening, port scanning, native capture, peer testing, or external penetration test is part of this setup.

Do not probe campus networks, public addresses, or third-party APIs. Record any future test's scope/tool/window before execution; stop if out-of-scope data or service disruption appears. Native models, capture capabilities, vault files, and OS permission settings are not present yet.

## Tugas 1 Deliverables (Lecture Slide Template Alignment)

All deliverables conform strictly to the official course templates from the Week 2 and Week 3 lecture materials:

- **[Asset Identification & Valuation](asset-inventory.md):** Formatted to the Week 2 slide template with FIPS 199 valuation (*Asset, Category, Location, C, I, A, Rationale*).
- **[Data Flow Diagram (Level 0)](dfd.md):** Features the standalone vector diagram [dfd.svg](dfd.svg) following Adam Shostack (2014) notation (*Process ellipse, Data Store parallel lines, External Entity rectangle, Data Flow arrows, and Trust Boundaries*).
- **[STRIDE Threat Model](threat-model.md):** Formatted to the Week 3 slide template with canonical threat statement syntax (*ID, Element, STRIDE, Threat statement, Affected asset*).
- **[Risk Register & Mitigation Plans](risk-register.md):** Formatted to the Week 3 slide template, scored against the official Slide 22 matrix (*Very High 15–25, High 8–14, Moderate 4–7, Low 1–3*), featuring 1:1 threat mapping and the top 5 priority risks.

## Prototype Boundary & Ethical Scope

The inventory, DFD, STRIDE threat model, and risk register establish the cross-course security baseline for PrivateSession Tugas 1. Current UI has selectable capture preferences, metadata-only media selection, explicit synthetic previews, an informational Sign In dialog, and ephemeral Web Crypto AES-256-GCM demonstrations on `/live/` and `/upload/`. No native OS audio/screen capture, media-content reads/uploads, persistent storage, authentication, or MCP connections are implemented. Updating the security model for real native integrations is future KKS work (Tugas 2 / Tugas 3); this baseline does not claim persistent or native vault controls.
