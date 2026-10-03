# ONE API

Backend foundation for the BLACK ONE / ONE iOS and Android application.

## Principle

The downloadable application and the operational transportation markets are separate. A single global app can exist in Apple App Store and Google Play while the backend controls where rides can actually be booked.

## Current API

- GET /api/health
- POST /api/quotes
- POST /api/reservations
- POST /api/create-payment-intent

The payment endpoint intentionally refuses to create a charge until a reservation has a confirmed server-side quote.

## Production stack

- Vercel Functions or equivalent Node runtime
- Neon / Lakebase Postgres
- Stripe
- Google Maps server APIs for route verification and distance/time
- Mobile app under apps/one-mobile

## Database

The initial schema is in db/migrations/0001_one_core.sql.

It is kept as migration code and should be tested on a Neon development branch before being applied to production.

## Important pricing rule

The API does not invent prices. Fare rules are stored per market and vehicle class. Until route verification and approved rate cards exist, /api/quotes returns a manual-confirmation state.

## Driver model

The schema supports the USA driver model already defined for ONE:

- $25 monthly cap
- or 5% per trip until the monthly $25 is reached
- once the cap is reached, no additional platform fee for the rest of that month

Argentina's 10% per-trip model can be represented by the same ledger without mixing passenger pricing with driver-platform fees.
