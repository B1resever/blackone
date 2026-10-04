# ONE — Store Privacy / Data Safety Working Record

This document is an implementation record for preparing Apple App Privacy and Google Play Data Safety answers. Final store disclosures must be checked against the actual production configuration immediately before submission.

## Data used by Stage 1

### Contact and account information

ONE may process:

- full name
- email
- phone number
- account/session identifiers
- language/locale

Purpose:

- create and authenticate ONE accounts
- communicate about reservations
- synchronize reservations across devices
- passenger/driver support

### Reservation and transportation data

ONE may process:

- pickup address/text
- destination address/text
- reservation date/time
- passenger count
- selected vehicle category
- trip status and operational events
- assigned driver and assigned vehicle

Purpose:

- create and operate transportation reservations
- dispatch compatible drivers/vehicles
- calculate route/rate information
- provide trip status and support

### Payment data

ONE stores payment status, amounts, currencies and provider transaction identifiers needed to operate the reservation and driver-fee ledger.

Card details are intended to be handled by Stripe and not stored directly in the ONE database.

### Driver information

Driver workflows may process:

- driver contact information
- license region
- vehicle make/model/year/plate
- vehicle category
- document type/number
- document expiration date
- compliance review status
- optional secure document URL
- background-check status/result marker
- driver availability

Purpose:

- driver onboarding
- transportation compliance
- dispatch eligibility
- safety/operations

### Device / notification data

If the user explicitly enables trip notifications, ONE stores the Expo push token and device platform needed to deliver operational notifications.

### Location

Stage 1 reservations use typed/selected addresses. The current mobile design does not require continuous device GPS collection.

If Stage 2 adds live driver/passenger GPS, Apple App Privacy and Google Data Safety must be updated before that version is submitted.

## Data sharing / processors

Production may use service providers for:

- hosting/serverless runtime
- Postgres/database
- Google Maps/Places/routing
- Stripe payment processing
- Expo push notifications
- Apple/Google application distribution

Review the final contracts/settings for each production provider before answering store forms.

## Account deletion

ONE supports in-app account deletion. The backend removes/neutralizes profile information while permitting retention of records that must remain for legal, financial, fraud-prevention, safety or transportation-recordkeeping obligations.

An external deletion page is also prepared at:

https://blackonetransportation.com/delete-account.html

## Advertising and tracking

Stage 1 code should not declare advertising tracking unless an advertising/analytics SDK that performs tracking is intentionally added.

Do not answer "tracking" questions based on future marketing plans; answer from the exact production binary submitted to the stores.
