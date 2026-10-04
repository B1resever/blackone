# ONE Store Build Runbook

ONE is structured as one global iOS and Android application. Download availability is independent from ride-service availability; active transportation markets are controlled by the ONE backend.

## Current release model

- Product: ONE
- Brand: BLACK ONE
- Legal operator: Open Skies Holdings LLC
- iOS bundle ID: com.blackone.one
- Android package: com.blackone.one
- Initial operating markets: South Florida and Buenos Aires
- Stage 1: scheduled reservations
- Stage 2: live dispatch after Stage 1 is stable
- Initial iOS release: phone-first

## External credentials required

These credentials must never be committed to GitHub.

### EAS / Expo

- EXPO_TOKEN in GitHub Actions
- EAS project initialized for apps/one-mobile
- app.json populated with expo.extra.eas.projectId
- EXPO_PUBLIC_ONE_API_URL configured in the EAS production environment

### Apple

- Apple Developer membership
- App Store Connect application record for com.blackone.one
- Apple signing credentials connected to EAS
- App privacy answers completed from the final production data flow

### Google

- Google Play Console application record for com.blackone.one
- Android signing/upload credentials connected to EAS
- Data Safety form completed from the final production data flow

## Backend production variables

Configure these only on the production backend:

- DATABASE_URL
- GOOGLE_MAPS_SERVER_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- ONE_ADMIN_API_TOKEN
- ONE_ALLOWED_ORIGINS
- ONE_PAYMENT_SUCCESS_URL
- ONE_PAYMENT_CANCEL_URL

## Database migrations

Apply every migration in order to the dedicated ONE production database:

1. 0001_one_core.sql
3. 0002_driver_applications.sql
4. 0003_auth_sessions.sql
5. 0004_driver_vehicle_class.sql
6. 0005_driver_compliance_push.sql
7. 0006_driver_fees.sql
8. 0007_payment_idempotency.sql
9. 0008_trip_safety_live.sql

Do not apply these migrations to AAA, CENTER + NODO, or any unrelated database.

## Production health checks

After backend deployment:

1. GET /one/api/health must return status ok.
3. GET /one/api/readiness must return HTTP 200 and ready=true.
4. If readiness returns HTTP 503, inspect the boolean integration map. It does not expose secret values.
5. Bootstrap the first ONE administrator once with POST /one/api/admin-bootstrap using the ONE_ADMIN_API_TOKEN. After that, daily ONE Ops access uses the administrator/dispatcher account session from /one-admin.html rather than exposing the master token.

## Functional acceptance test

Run one complete end-to-end test before spending store-review builds:

1. Sign in to /one-admin.html with an ONE administrator or dispatcher account.
2. Register a passenger ONE account.
3. Enter pickup and destination with address autocomplete.
4. Select market, date/time, passenger count and ONE vehicle category.
5. Confirm route and rate card.
6. Create a reservation and receive an ONE request code.
7. Complete Stripe test-mode payment.
8. Verify the Stripe webhook marks payment paid.
9. Submit a driver application.
10. Approve the driver and create the operational driver profile/vehicle.
11. Submit required driver compliance documents.
12. Approve license, insurance, registration and background check.
13. Set driver Available.
14. Assign only a compatible driver/vehicle from ONE Ops.
15. Confirm the passenger sees the assigned driver and vehicle.
16. Start driver foreground live-location sharing from ONE Driver.
17. Confirm the passenger sees the latest driver position in ONE Live Tracking.
18. Send messages both directions through Secure Trip Chat.
19. Move the driver to Arrived, verify the passenger ride code, then move to Passenger Onboard and Completed.
20. Verify push notifications reach passenger/driver on physical devices.
21. Verify driver platform fee ledger:
   - USA: 5% per completed paid trip until $25 monthly cap.
   - Argentina: first month fee exemption, then 10% per completed paid trip.
22. Verify cancellation flow.
23. Verify My Reservations synchronization on a second device.
24. Verify BLACK ONE support and emergency-call confirmation screens.
25. Verify in-app account deletion.

## Store build sequence

1. Run the manual GitHub workflow ONE Release Gate.
3. Resolve every BLOCKED item before continuing.
4. Run ONE Store Build with platform=ios or android for internal testing.
5. Test on physical iPhone and Android devices.
6. Create final screenshots from the tested binaries.
7. Complete store privacy/data declarations.
8. Submit internal builds:
   - TestFlight
   - Google Play internal testing
9. Complete final acceptance.
10. Run ONE Store Submit only after store records and credentials are ready.
11. Submit production release.

## Public URLs required before review

- Privacy: https://blackonetransportation.com/privacy.html
- Terms: https://blackonetransportation.com/terms.html
- Account/data deletion: https://blackonetransportation.com/delete-account.html
- Payment success: https://blackonetransportation.com/payment-success.html
- Payment cancelled: https://blackonetransportation.com/payment-cancelled.html

## Deployment discipline

- Vercel automatic deployment is restricted to main.
- Feature and pull-request branches must not consume Vercel Hobby build quota.
- Do not attach ONE to site-flow-research or any unrelated Vercel project.
