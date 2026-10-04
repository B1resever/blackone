# ONE — Global Store Release Checklist

## Repository-side foundation already prepared

- iOS bundle ID: com.blackone.one
- Android package: com.blackone.one
- EAS production build profile
- EAS production environment binding
- English / Spanish / Portuguese / French application language framework
- Worldwide-download architecture
- Backend-controlled service markets
- Passenger accounts and secure mobile sessions
- Synchronized reservation history
- Driver activation and driver trip controls
- Google Places address autocomplete through ONE API
- Stripe Checkout and webhook payment state
- Driver compliance and document review
- Driver availability control
- Driver/vehicle class compatibility for dispatch
- Secure passenger/driver trip chat
- Passenger ride-code verification before onboard
- Driver foreground live-location sharing and passenger live tracking
- BLACK ONE trip support / emergency call flow
- Push notification architecture
- USA $25 monthly driver cap logic
- Argentina launch fee model
- Privacy, terms and account deletion pages
- Secure ONE Command Center administrator/dispatcher login
- One-time master-token administrator bootstrap endpoint
- Automated release-readiness endpoint
- Manual ONE Release Gate
- Manual EAS store build workflow
- Manual EAS store submission workflow
- Vercel preview-build suppression

## External items still required before the first store binary

### Brand assets

- Final 1024x1024 ONE App Store icon
- Android adaptive foreground/background icon assets
- Final launch/splash artwork
- Final phone screenshots after physical-device acceptance

### Expo / EAS

- Create or identify the ONE Expo project
- Add expo.extra.eas.projectId to app.json
- Add EXPO_TOKEN to GitHub Actions
- Add EXPO_PUBLIC_ONE_API_URL to EAS production environment

### Production backend

- Dedicated ONE Neon project/database identified
- Migrations 0001 through 0008 applied
- Production backend deployed
- Production environment variables configured
- /one/api/readiness returns ready=true
- First ONE administrator bootstrapped and /one-admin.html login verified
- Production rate cards entered in ONE Rate Control

### Payments and maps

- Stripe production keys connected
- Stripe webhook endpoint registered
- Google Maps server key connected
- Places and routing verified for South Florida and Buenos Aires

### Apple

- Apple Developer account connected
- App Store Connect record created
- Signing credentials connected through EAS
- Privacy disclosures completed
- App Store territories selected
- Review contact/support information completed

### Google Play

- Google Play Console record created
- Android signing configured
- Data Safety completed
- Content rating completed
- Production countries/regions selected

## Permission strategy

Request permissions only when the user activates the related feature.

- Notifications: requested only after explicit opt-in from My ONE
- Location: requested only from the driver when the driver explicitly starts live trip sharing; no background location permission is requested in Stage 1
- Camera/photos: do not request until native document/photo upload is connected
- Microphone: not requested in Stage 1

## Release strategy

1. Finish external production connections.
2. Run ONE Release Gate.
3. Execute end-to-end production-like test.
4. Create internal iOS/Android builds.
5. Test on physical devices.
6. Prepare screenshots and final store forms.
7. TestFlight + Google Play internal testing.
8. Production submission.
