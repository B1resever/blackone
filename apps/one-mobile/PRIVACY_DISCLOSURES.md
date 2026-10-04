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

Stage 1 reservations use typed/selected addresses for pickup and destination.

For an active assigned trip, an authenticated driver may explicitly start foreground live-location sharing. ONE may then process:

- driver latitude/longitude
- location accuracy
- heading
- speed
- location timestamp
- reservation/driver identifiers needed to restrict the location to the assigned trip

Purpose:

- show the passenger the latest driver position
- coordinate pickup and active-trip operations
- support trip safety and operational review

Stage 1 does not request background location permission and does not continuously collect passenger GPS.

### Trip communications and safety

For an active reservation, ONE may process:

- authenticated passenger/driver chat messages
- ride-code verification state
- driver trip-status events
- support/emergency-flow interactions that occur inside the app

Purpose:

- pickup and trip coordination
- confirm the correct passenger/driver pairing
- trip safety and support

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
