# EL OJO — Communications Command Center
Version 1.0 | 2026-11-03 | Planning and isolated foundation

## Scope
Central business communications with tenant/project isolation, human handoff, audited routing and bilingual support.

## Security gates
- No live WhatsApp activation, outbound messages, Telnyx migration or vendor purchase.
- Personal number +1 305-850-1737 must never be connected.
- Business candidate +1 305-853-9424 requires ownership, AAA legacy isolation, Meta eligibility and coexistence verification.
- Never import AAA patient conversations or clinical information.
- No automatic cross-project data sharing.
- NODO Facility is technical internal operations only; NODO Property Manager remains inactive.
- Family Game automated minor messaging remains disabled.
- Sensitive actions require human approval.
- Verify webhook signatures, deduplicate events, and record consent before production.

## Rollout gates
1. Audit Telnyx, Meta and Kapso compatibility, cost and number ownership.
2. Establish identity and approved channel; test iPhone coexistence.
3. Build authenticated gateway, inbox, RBAC and audit.
4. Connect Granelli Property, NODO Applications, B1, Facility and approved Research independently.
5. Run functional, privacy, bilingual, outage and security tests.
6. Explicit production approval.

## Repository isolation
This foundation lives on feature/el-ojo-communications-foundation and does not enable integrations or change production routes.
