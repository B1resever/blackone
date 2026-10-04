# ONE — App Store & Google Play release record

## Identity

- App name: ONE
- Company / brand: BLACK ONE
- Legal operator: Open Skies Holdings LLC
- iOS bundle ID: com.blackone.one
- Android package: com.blackone.one
- Primary category: Travel / Transportation
- Initial operating markets: South Florida and Buenos Aires
- Download strategy: one international app; ride availability controlled by backend market configuration

## Listing positioning

ONE is a scheduled transportation platform for professional rides, transparent pricing, verified transportation providers, premium vehicle categories, reservation tracking, secure payment and trip support.

### Short description

Professional transportation, scheduled your way.

### Core vehicle categories

- CONFORT
- XL
- SUV BLACK
- ULTRA EXCLUSIVE

## Required public URLs

Publish these files on the production BLACK ONE domain before store submission:

- /privacy.html
- /terms.html
- /delete-account.html
- /support.html

## Apple review readiness

- Privacy policy accessible in App Store Connect and inside the app.
- Support URL points to /support.html with current BLACK ONE contact channels.
- Manual address entry remains available when location permission is declined.
- If account creation is enabled, account deletion must be available in-app.
- Only request device permissions when the related feature is active.
- Provide a working review account if reviewer-only account features exist.
- Test payment, reservation, cancellation, and support flows on a production-like review build.

## Google Play readiness

- Complete Data safety accurately from the final production data flow.
- Provide the privacy-policy URL in Play Console and in-app.
- If account creation is enabled, provide both in-app account deletion and the external deletion URL.
- Declare location collection accurately when live location ships.
- Meet current target API requirements for the submission date.
- Complete content rating before production release.

## Production permissions plan

Do not ask for permissions before the feature needs them.

- Location: foreground driver live-location sharing during an active assigned trip; no Stage 1 background location permission and no continuous passenger GPS.
- Notifications: booking confirmation, driver assigned, driver arriving, trip updates.
- Camera/photos: driver documents, profile image, optional trip documentation.
- Microphone: not requested unless a future feature has a clear user-facing need.

## Review notes

Stage 1 launches with scheduled reservations plus assigned-trip live safety tools. Stage 2 adds on-demand live dispatch. The app is internationally downloadable while actual ride service remains limited to activated markets.
