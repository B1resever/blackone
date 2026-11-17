# B1 LAB — operating and technical baseline (2026-11-17)

Status: APPROVED PRODUCT SCOPE / DESIGN ONLY. Not deployed or verified end-to-end.

## Independence from B1 Transport
- B1 LAB is a separate product, deployment, database, Stripe configuration, authorization boundary and operational workflow.
- The existing GitHub monorepo may host reusable, reviewed infrastructure modules; no B1 Transport database, payment records, user accounts, production environment variables, or dispatch records are shared.
- All B1 LAB changes remain on `feature/b1-lab-foundation` until reviewed. Do not merge to `main` or change existing transport endpoints.

## Customers and roles
1. **Laboratory** (business): submits approved collection requests, specifies permitted service zone and time window, receives operational status and billing.
2. **Medical center** (business): submits requests for its authorized patients, manages its own staff, status and billing.
3. **Private patient** (consumer): requests a home collection; fulfillment requires a valid clinical order when applicable and a receiving laboratory able to process the specimen. Patient cannot independently prescribe testing.
4. **Phlebotomist** (professional): completes credential and scope verification, declares availability, accepts offers, confirms milestones, and follows chain-of-custody rules.
5. **B1 LAB operations**: verifies onboarding, dispatches, handles incidents, cancellations, reconciliations and audit logs.

## Booking and dispatch lifecycle
Draft -> eligibility review -> requested -> searching -> offered -> accepted -> en_route -> arrived -> in_service -> completed.
Exception paths: cancelled, unable_to_complete, escalated. A request is never marked completed solely because payment succeeded.

Minimum booking fields for the operational service: requester type and tenant, non-PHI reference, service zone, time window, specimen collection category (no diagnostic detail), lab fulfillment eligibility, pricing quote, and explicit consent/authorization references. Actual address, patient identity, clinical order, and specimen identifiers are PHI-sensitive and must live in a separate restricted data design, not in dispatch/audit metadata.

Eligibility gates before dispatch: approved requester or verified consumer account; applicable order verified; receiving lab confirmed; professional credential and authorized scope current; coverage, time window and pricing accepted.

Offer acceptance must be atomic. Reject competing acceptances; expire prior pending offers transactionally. Only authorized personnel can advance statuses, with immutable audit events.

## Payments
- Business clients: contracted invoicing or approved card-on-file policy (not yet decided).
- Consumers: show total price and cancellation policy before authorizing test payment.
- Stripe sandbox and production must have distinct accounts/keys, endpoints, webhook signing secrets, and databases.
- Signed webhooks are verified against raw payload; idempotent writes require a durable database. The existing B1 LAB sandbox handler is not evidence of an externally delivered webhook or database reconciliation.
- No live charges or new paid services without separate authorization.

## Security and compliance acceptance gates
- No PHI in logs, analytics, Stripe metadata, GitHub issues, or test fixtures.
- Verify HIPAA applicability, BAAs for all PHI processors, minimum necessary access, encryption, tenant isolation, audit trail, retention and incident-response procedures before real patient onboarding.
- Use synthetic test data only until privacy/security review passes.
- Professional credential verification, specimen handling, lab relationship and Florida-specific legal review are release gates, not assumptions.

## Milestones and verification
M1: implement role-specific APIs and isolated schema; run tests (PENDING).
M2: request creation, authorization and dispatch state-machine integration tests (PENDING).
M3: Stripe test-mode webhook delivered to isolated preview URL and reconciled in dedicated DB (PENDING).
M4: responsive interfaces for business, consumer, professional and operations roles (PENDING).
M5: security, compliance, user acceptance and controlled commercial release (PENDING).

Do not call B1 LAB published or operational until all applicable gates have verified evidence.
