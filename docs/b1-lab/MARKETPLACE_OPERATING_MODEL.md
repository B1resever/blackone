# B1 LAB — Marketplace operating model (owner direction, 2026-11-16)

Status: PRODUCT REQUIREMENTS APPROVED IN PRINCIPLE; legal/regulatory review pending. This document supersedes any B1 LAB analogy to a rideshare driver onboarding workflow.

## Parties and service
- B1 LAB: technology marketplace, discovery, matching, job offers, acceptance, completion record, platform billing.
- Requester: medical center, laboratory or other authorized organization; creates a work order specifying permitted service, location, time and agreed compensation.
- Professional: independent provider who chooses whether to accept a job and arranges their own transportation.
- A job is a **service assignment**, never a passenger ride.
- No car registration, driver's license or auto insurance requirement for general professional enrollment. Transportation mode is not tracked or mandated.
- Do not claim marketplace status alone eliminates healthcare, privacy, labor, insurance, licensing or agency obligations.

## Minimal professional enrollment
1. First and last name.
2. Identity document and identity verification.
3. Profession, applicable license or qualification and issuing authority; check official primary source where possible.
4. Authorization/scope for selected services, with credential expiry when applicable.
5. Contact email/phone, coverage area, availability and agreement acceptance.
6. Additional legal requirements only when specifically justified for the service and jurisdiction.
Collect only necessary data; protect identity documents with restricted access and retention rules. No patient PHI in general job listing.

## Job lifecycle
created -> offered -> accepted -> in_progress -> completed
Alternate outcomes: declined, expired, canceled, disputed.
Completion must be acknowledged by the requester or processed through a documented dispute policy; a provider's tap alone is not incontrovertible proof of clinical service.

## Revenue model
- Monthly professional subscription (amount TBD, billing terms TBD).
- Percentage commission per completed job (rate TBD, payer and collection mechanics TBD).
- Define separately whether requester or professional is merchant of record, who invoices whom, and how refunds/chargebacks work.
- No charges or Stripe live transactions without explicit owner authorization and legal review.
- Do not assume Stripe Connect or direct split payments is approved; evaluate payment architecture and compliance first.

## Credential and service safeguards
- An ID and professional credential are the baseline, not a blanket permission to perform any task.
- Massage, injections, nursing, specimen collection and ECG each require service-specific verification and potentially medical orders or additional business licenses.
- Do not require professional liability insurance universally unless legally/contractually necessary; determine by service and applicable law.
- A waiver cannot eliminate non-waivable statutory responsibilities. Independent-contractor classification is fact-specific.

## UI/UX acceptance
- Rename ride/trip/driver/vehicle language to job/service/professional throughout B1 LAB.
- Show proposed compensation, service type, location and time before acceptance.
- Professional controls acceptance; no forced dispatch.
- Business confirms completion; both sides can report incidents/disputes.
- 24/7 means request intake at any time; professional coverage shown only if verified.
- B1 LAB brand tokens from docs/b1-lab/BRAND_SYSTEM.md.
- English and Spanish.

## Technical scope boundary
- Isolated B1 LAB branch and data namespace.
- Existing dispatch schema and tests are preliminary and need revision for independent job marketplace.
- No deployment, database migration or payment activation is implied by this specification.
