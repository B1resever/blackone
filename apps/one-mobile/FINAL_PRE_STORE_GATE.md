# ONE — Final Pre-Store Gate

ONE must not be submitted to Apple or Google until every item below is complete.

## Code / build

- [x] App version is 1.0.0
- [x] iOS bundle ID is com.blackone.one
- [x] Android package is com.blackone.one
- [x] Mobile TypeScript validation passes
- [x] API TypeScript validation passes
- [x] Expo Doctor passes after current app configuration
- [x] Production build profile uses store distribution
- [x] Store submission workflow exists
- [x] Production smoke test exists
- [x] Store icon / adaptive icon / splash are configured
- [x] In-app account deletion exists
- [x] Public support/privacy/terms/deletion pages exist
- [x] App-review fixture endpoint exists
- [x] App-review notes exist

## Production infrastructure

- [ ] Dedicated ONE Neon project positively identified
- [ ] Migrations 0001 through 0009 applied to ONE only
- [ ] ONE production Vercel project connected with proper permission
- [ ] ONE_PRODUCTION_URL configured in GitHub Actions
- [ ] EXPO_PUBLIC_ONE_API_URL configured for EAS production
- [ ] DATABASE_URL configured in production
- [ ] GOOGLE_MAPS_SERVER_KEY configured in production
- [ ] STRIPE_SECRET_KEY configured in production
- [ ] STRIPE_WEBHOOK_SECRET configured in production
- [ ] ONE_ADMIN_API_TOKEN configured in production
- [ ] ONE_ALLOWED_ORIGINS configured in production
- [ ] ONE_PAYMENT_SUCCESS_URL configured
- [ ] ONE_PAYMENT_CANCEL_URL configured
- [ ] /one/api/readiness returns ready=true
- [ ] /one/api/markets returns South Florida and Buenos Aires active
- [ ] ONE Production Smoke passes

## Expo / EAS

- [ ] ONE Expo project created or identified
- [ ] expo.extra.eas.projectId added to app.json
- [ ] EXPO_TOKEN configured in GitHub Actions
- [ ] iOS production signing connected
- [ ] Android production signing connected
- [ ] Production iOS build succeeds
- [ ] Production Android build succeeds

## Functional acceptance

- [ ] New passenger registration tested
- [ ] Passenger login tested
- [ ] Pickup/drop-off autocomplete tested
- [ ] South Florida quote tested
- [ ] Buenos Aires quote tested
- [ ] Stripe test payment tested
- [ ] Reservation confirmation tested
- [ ] My Reservations tested
- [ ] Driver application tested
- [ ] Driver approval tested
- [ ] Driver compliance reviewed
- [ ] Driver availability tested
- [ ] Compatible driver assignment tested
- [ ] Push notification tested on physical iPhone
- [ ] Push notification tested on physical Android
- [ ] Live driver location tested
- [ ] Secure trip chat tested
- [ ] Ride code verified
- [ ] Trip completed end-to-end
- [ ] USA driver fee ledger verified
- [ ] Argentina fee model verified
- [ ] Cancellation tested
- [ ] Account deletion tested

## Apple

- [ ] Apple Developer membership active
- [ ] App Store Connect app record created
- [ ] Bundle ID registered/available
- [ ] Support URL entered
- [ ] Privacy Policy URL entered
- [ ] App Privacy completed
- [ ] Reviewer credentials entered
- [ ] Screenshots uploaded
- [ ] Description/subtitle/keywords entered
- [ ] Pricing/availability configured
- [ ] Build selected
- [ ] Submitted for review

## Google Play

- [ ] Play Console app record created
- [ ] App signing configured
- [ ] Store listing entered
- [ ] Privacy policy entered
- [ ] Data Safety completed
- [ ] App access instructions entered
- [ ] Content rating completed
- [ ] Screenshots uploaded
- [ ] Countries/regions selected
- [ ] Internal test accepted
- [ ] Production release submitted
