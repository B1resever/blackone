# B1 LAB — Execution control / Control de ejecución
Status: COORDINATION REGISTERED; AGENTS NOT ACTIVATED; RELEASE NOT APPROVED.
Date: 2026-11-16

## Single delivery objective
Complete a real, secure and independently deployable flow: verified organization posts a job -> verified eligible professional receives offer -> atomic acceptance -> completion evidence -> reconciled sandbox commission -> organization can review history. No patient PHI in dispatch.

## Workstreams and dependency gates
1. TECH LEAD (#72): run CI/typecheck/tests, confirm migrations compile, preserve B1 transport, report failing tests.
2. BACKEND (#73): dedicated isolated database; RLS, tenant auth, idempotent API, transactional acceptance. Depends on 1.
3. APPLICATIONS (#74): center, professional and command center wired to live authenticated API. Depends on 2.
4. PAYMENTS (#75): test-only subscriptions/commissions, webhook reconciliation and refund/dispute cases. Depends on 2; real charges require approval.
5. OPERATIONS (#76): credential verification, zone and service eligibility, availability, completion dispute SOP. Parallel with 1-4.
6. COMPLIANCE/QA (#77): Florida healthcare/massage legal review, HIPAA/BAA assessment, security tests and release sign-off. Parallel, final release gate.

## Mandatory acceptance criteria
- Test and typecheck evidence from CI, not merely committed tests.
- Database migration actually applied and verified in a dedicated nonproduction environment.
- Real end-to-end request/accept/complete flow with synthetic data.
- Stripe sandbox end-to-end reconciliation and no live payment execution.
- Separate B1 LAB app and admin access; EN/ES; role-based access.
- Explicit legal/compliance go/no-go before launch.
- No publication or external spend without informed approval.

## Agent activation
GitHub issues do not constitute active autonomous agents. Each workstream remains UNASSIGNED until a real user/agent identity is connected, granted scoped permissions, and execution evidence is recorded. Do not assert Dots activation from this file.

## Known blockers
- Dedicated database and authenticated API not yet verified.
- CI run for new B1 LAB workflow not verified.
- Mobile build, live payments and publication not verified.
- No confirmed active Dot workers or paid staff.
