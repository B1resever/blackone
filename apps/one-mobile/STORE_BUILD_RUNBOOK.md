# ONE Store Build Runbook

ONE is structured for one global binary on iOS and Android while operating markets are enabled from backend configuration.

## Build prerequisites

The repository never stores store credentials or production secrets.

GitHub secret required for CI store builds:

- EXPO_TOKEN

EAS / Expo project configuration required before the first store build:

- Expo project ownership
- Apple Developer team access
- App Store Connect app record for bundle ID com.blackone.one
- Google Play Console app record for package com.blackone.one
- Apple signing credentials managed through EAS
- Android upload signing managed through EAS
- EXPO_PUBLIC_ONE_API_URL set to the production BLACK ONE domain

## Backend production variables

- DATABASE_URL
- GOOGLE_MAPS_SERVER_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- ONE_ADMIN_API_TOKEN
- ONE_ALLOWED_ORIGINS
- ONE_PAYMENT_SUCCESS_URL
- ONE_PAYMENT_CANCEL_URL

## Release sequence

1. Apply database migrations 0001 and 0002 to the ONE production database.
2. Configure production environment variables.
3. Verify GET /one/api/health.
4. Enter and activate approved rate cards in /one-rates.html.
5. Make a real test reservation.
6. Confirm route quote.
7. Complete Stripe test-mode payment.
8. Verify Stripe webhook updates payment status.
9. Submit and approve one driver application.
10. Assign the approved driver from ONE Ops.
11. Move the ride through assigned, en route, arrived, onboard and completed states.
12. Build internal iOS and Android binaries.
13. Test on physical iPhone and Android devices.
14. Create store screenshots from the tested build.
15. Complete Apple privacy and Google Data Safety disclosures using actual final data flows.
16. Submit to TestFlight / Play internal testing.
17. Submit production release after internal acceptance.

## Store URLs

- Privacy: https://blackonetransportation.com/privacy.html
- Terms: https://blackonetransportation.com/terms.html
- Account/data deletion: https://blackonetransportation.com/delete-account.html

## Current launch strategy

Stage 1: scheduled reservations.
Stage 2: live dispatch after scheduled operations are stable.
