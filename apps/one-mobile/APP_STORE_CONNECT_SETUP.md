# ONE — App Store Connect Setup

Use this file when creating the first Apple App Store record for ONE.

## App identity

- App name: ONE
- Primary language: English (U.S.)
- Bundle ID: com.blackone.one
- SKU suggestion: ONE-IOS-001
- Version: 1.0.0
- Category: Travel
- Secondary category: Navigation or Lifestyle only if appropriate at submission time
- iPhone only for the initial release
- Legal operator: Open Skies Holdings LLC
- Brand: BLACK ONE

## Public URLs

- Support URL: https://blackonetransportation.com/support.html
- Privacy Policy URL: https://blackonetransportation.com/privacy.html
- Terms URL: https://blackonetransportation.com/terms.html
- Account deletion URL: https://blackonetransportation.com/delete-account.html

## Subtitle

Professional transportation, scheduled your way.

## Promotional text

Reserve professional transportation with BLACK ONE. Choose your market, schedule your ride, select the right vehicle category, follow reservation status, pay securely and stay connected to your trip.

## Description

ONE is the BLACK ONE transportation app for scheduled professional rides.

Plan a ride in an active ONE market, enter pickup and destination details, select your vehicle category and submit your reservation from one streamlined experience.

Stage 1 focuses on scheduled transportation. Features include passenger accounts, reservation history, transparent quote handling, secure payment, verified driver and vehicle assignment, foreground live driver location during an assigned trip, secure passenger-driver chat, ride-code verification, trip-status updates and operational notifications.

Vehicle categories may include CONFORT, XL, SUV BLACK and ULTRA EXCLUSIVE depending on the active market.

ONE may be available to download in countries where transportation operations have not launched yet. Ride availability is controlled by the active operating markets shown inside the app.

## Keywords

transportation,chauffeur,ride,reservation,airport,driver,car service,Miami,Buenos Aires

## App review access

Provide the dedicated ONE reviewer account credentials from the production environment directly in App Store Connect.

Do not store reviewer passwords in GitHub.

Review fixture:
- passenger review reservation: ONE-APP-REVIEW
- ride code: ONE246
- assigned vehicle class: SUV BLACK

Review notes are in APP_REVIEW_NOTES.md.

## Location permission explanation

ONE requests foreground location only when an assigned driver explicitly starts live location sharing for an active trip.

Stage 1:
- does not request background location
- does not continuously collect passenger GPS
- allows manual pickup and destination entry

## Notifications

Notifications are requested only after the user explicitly enables trip notifications from My ONE.

Use:
- reservation updates
- driver assigned
- driver arriving
- trip-state updates
- compliance status for drivers

## Account deletion

Account creation is available in ONE.

In-app deletion path:
My ONE -> Delete ONE account.

External deletion information:
https://blackonetransportation.com/delete-account.html

## Encryption

The Expo iOS configuration declares usesNonExemptEncryption=false for the current implementation.

Re-check this if custom cryptography beyond normal platform/network encryption is later added.

## Availability

Select only App Store territories that Apple permits for the account and where BLACK ONE wants the binary downloadable.

Ride service itself remains restricted by backend market activation.

## Before submission

1. Upload the signed production build.
2. Attach final iPhone screenshots from the tested build.
3. Add reviewer credentials.
4. Complete App Privacy from PRIVACY_DISCLOSURES.md and the actual production configuration.
5. Confirm support/privacy/delete-account URLs are live.
6. Complete age/content questions accurately.
7. Confirm payments, maps, notifications and production API are live.
8. Submit for review.
