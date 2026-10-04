# ONE — Google Play Console Setup

Use this file when creating the first Google Play record for ONE.

## App identity

- App name: ONE
- Package: com.blackone.one
- Version: 1.0.0
- Initial versionCode in repository: 2
- Category: Travel & Local
- Legal operator: Open Skies Holdings LLC
- Brand: BLACK ONE

## Store listing

Short description:
Professional transportation, scheduled your way.

Full description:
ONE is the BLACK ONE transportation app for scheduled professional rides.

Plan a ride in an active ONE market, enter pickup and destination details, select your vehicle category and submit your reservation from one streamlined experience.

Stage 1 focuses on scheduled transportation. Features include passenger accounts, reservation history, transparent quote handling, secure payment, verified driver and vehicle assignment, foreground live driver location during an assigned trip, secure passenger-driver chat, ride-code verification, trip-status updates and operational notifications.

Vehicle categories may include CONFORT, XL, SUV BLACK and ULTRA EXCLUSIVE depending on the active market.

ONE may be available to download in countries where transportation operations have not launched yet. Ride availability is controlled by the active operating markets shown inside the app.

## Public URLs

- Privacy policy: https://blackonetransportation.com/privacy.html
- Support: https://blackonetransportation.com/support.html
- Account deletion: https://blackonetransportation.com/delete-account.html
- Terms: https://blackonetransportation.com/terms.html

## App access

If Play Console asks whether parts of the app require login, choose restricted access and provide the dedicated ONE reviewer credentials from production.

Do not commit reviewer passwords to GitHub.

Review fixture:
- reservation: ONE-APP-REVIEW
- ride code: ONE246

## Data Safety working record

Use PRIVACY_DISCLOSURES.md as the working source, then confirm every answer against the exact production build.

Current Stage 1 may process:
- name
- email
- phone
- account/session identifiers
- pickup and destination
- trip details and events
- assigned driver/vehicle
- payment status and transaction identifiers
- driver compliance data
- push token
- driver foreground live location when explicitly enabled
- authenticated trip chat
- ride-code verification status

ONE does not intend to store card numbers directly.

## Permissions

Foreground location:
- driver only
- active assigned trip only
- initiated by user action
- no background location in Stage 1

Notifications:
- opt-in operational trip notifications

Camera/photos:
- not requested until native document upload is connected

Microphone:
- not requested in Stage 1

## Account deletion

In-app deletion:
My ONE -> Delete ONE account

External deletion page:
https://blackonetransportation.com/delete-account.html

## Testing tracks

Recommended order:
1. Internal testing
2. Closed testing if required by the account
3. Production after acceptance

## Before production

1. Upload signed Android App Bundle.
2. Complete Data Safety.
3. Complete content rating.
4. Complete app access instructions.
5. Confirm privacy and deletion URLs are public.
6. Test on physical Android device.
7. Confirm production backend passes ONE Production Smoke.
8. Select intended countries/regions.
9. Submit production release.
