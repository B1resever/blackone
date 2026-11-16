# B1 LAB — Foundation and execution gates

Status: DEVELOPMENT / NOT PRODUCTION READY
Date: 2026-11-16
Scope: medical service coordination, not patient transportation or direct clinical care.

## Product boundaries
- Institutional client creates an authorized home-service request.
- Credentialed professional accepts an assignment, shares location only during active duty with consent, checks in and out, and records operational completion.
- Institution receives an access-controlled operational report.
- No clinical-success claim based solely on a check-out button.
- B1 transportation data, production credentials, payment flows, and deployment remain unchanged.

## Phase 1: mobile phlebotomy
Workflow: institutional onboarding -> BAA determination -> service request -> qualification filters -> offer with expiry -> accept/reject -> re-offer -> navigation -> arrival confirmation -> procedure status -> sample custody where relevant -> operational report -> billing reconciliation.
Statuses: requested, credential_review, searching, offered, accepted, en_route, arrived, in_service, completed, unable_to_complete, cancelled, escalated.
Assignment is atomic; expired offers cannot be accepted; every transition produces an audit event.
Reassignment on rejection, timeout, cancellation, credential expiry or no-show; manual escalation when no eligible professionals remain.

## Credential gate
Identity verification, scope-of-practice evidence, applicable licensing/credential verification, exclusion screening, lawful background check with required authorizations, insurance, training, contractual acceptance, expiry monitoring. NPI is optional where not applicable and never a license substitute.
Never activate before compliance approval. Store verification provenance and date.

## Data boundaries
Tenant isolation, least privilege, encrypted PHI, audited access, minimal push/email notifications, retention policy, incident response, vendor BAAs as needed. GPS consent and only service-window tracking. No PHI in maps analytics or logs.

## Stripe reuse gate
Inventory existing Stripe code, environments, webhook verification, idempotency, merchant-of-record and payout model. No live charges or transfers until counsel approves pricing/referral structure and end-to-end tests pass. Never copy production keys.

## Next adjacent services (not yet approved for launch)
Specimen courier, mobile ECG, authorized vital-sign visits, RN/LPN visits. Each requires separate scope, credential, insurance, chain-of-custody and legal review.

## Release gates
1. Inspect B1 modules and dependencies.
2. Florida legal classification, HIPAA role, BAA and FCRA review.
3. Implement tenant-separated data and RBAC.
4. Verify credentials and dispatch with race-condition tests.
5. Verify check-in/out, incident escalation, custody and reporting.
6. Test Stripe in sandbox and reconcile.
7. Security review, operational acceptance and production approval.
No live patient data until security and legal gates pass.

## Commercial validation
Interview 30 institutional buyers and 40 professionals across Miami-Dade, Broward, Palm Beach. Collect demand, cancellation frequency, coverage windows, acceptable price, liability allocation. These are targets, not completed interviews.
