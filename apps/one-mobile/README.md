# ONE Mobile

Native mobile foundation for BLACK ONE.

## Distribution model

The application is being structured so the binary can be distributed internationally through Apple App Store and Google Play. Download availability and transportation-service availability are intentionally separate:

- App download: worldwide, subject to Apple/Google country availability and legal/compliance restrictions.
- Ride operations: enabled only in markets where BLACK ONE has activated operations.
- Initial service markets: South Florida and Buenos Aires.
- New countries can be added without publishing a separate app.

## Current foundation

- Expo / React Native
- Expo Router
- TypeScript strict mode
- iOS and Android identifiers
- EAS store build profiles
- Automatic device-language detection with EN / ES / PT / FR selector and English fallback
- Locale-aware currency utility
- Global-download messaging separated from local ride availability
- Market configuration for South Florida and Buenos Aires
- Rider booking, driver model and safety starter screens
- BLACK ONE / ONE dark + fluorescent-cyan design system

## Next production modules

1. Authentication and rider / driver roles
2. Scheduled reservation engine
3. Vehicle selection and quote engine
4. Maps, pickup/drop-off autocomplete and route distance
5. Stripe payment authorization/capture and driver payout workflow
6. Driver onboarding and verification
7. Live trip state and GPS tracking
8. In-app chat, ride code and support
9. Push notifications
10. Privacy controls, permissions and production telemetry
11. Store icon, splash screen, screenshots and listing copy
12. Privacy policy, terms, support URL and account-deletion flow
13. TestFlight and Google Play internal testing
14. Store review and worldwide territory activation

## Store identifiers

- iOS bundle identifier: `com.blackone.one`
- Android package: `com.blackone.one`

These should be confirmed before the first production submission.

## Important

Publishing the app globally does not automatically authorize passenger transportation in every country. Operational markets must remain controlled independently from App Store / Google Play download territories.
