# ONE — Global Store Release Checklist

## Already prepared in the codebase

- Separate iOS and Android application identifiers
- Store-oriented EAS production profile
- International language framework
- English fallback for unsupported device languages
- Locale-aware money formatting utility
- Market-based service availability
- Worldwide-download architecture separate from operational coverage
- Accessibility labels on primary selectors
- Responsive React Native foundation

## Required before App Store / Google Play submission

### Brand assets
- Final 1024x1024 App Store icon
- Android adaptive icon
- Splash screen
- Phone screenshots for every store listing locale
- Optional tablet screenshots if tablet distribution remains enabled

### Legal and customer support
- Public privacy-policy URL
- Public terms-of-service URL
- Support URL and support email
- Account deletion inside the app if user accounts can be created
- Clear payment/refund/cancellation rules
- Driver and passenger safety terms

### Privacy and permissions
- Ask only for permissions that are necessary for an active feature
- Add precise location permission when live pickup/tracking is implemented
- Add notification permission when push notifications are implemented
- Add camera/photo permission only when document/photo upload is implemented
- Complete Apple privacy disclosures and Google Play Data Safety based on the final data flows

### International distribution
- App Store Connect: select the countries/regions where the binary may be downloaded
- Google Play Console: select the countries/regions where the production release may be downloaded
- Keep ride-service markets controlled by backend configuration rather than store country
- Add local taxes, pricing, consumer terms and transportation requirements before enabling rides in a new jurisdiction

### Production testing
- iPhone and iPad layout verification
- Android phone and tablet verification
- Low-bandwidth and offline-state tests
- Time-zone tests
- Currency/decimal formatting tests
- Right-to-left layout review before adding Arabic/Hebrew
- Store review build with no demo-only or dead controls

## Release strategy

1. Worldwide-capable binary
2. Service-enabled markets: South Florida + Buenos Aires
3. Add operational markets from backend configuration
4. Expand store languages without forking the application
