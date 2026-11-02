# B1 ONE — Technical Continuity (2026-11-01)

## Canonical project
- Repository: B1resever/blackone
- Production deployment: Vercel project blackone, domain b1reserve.com
- Mobile app: apps/one-mobile
- Expo owner: b1reserve
- Expo slug: blackonegroup
- EAS projectId: d25b749a-5ed8-4076-9e9c-bf107219e9cf
- iOS bundle ID and Android package: com.blackone.one
- Do not recreate the project or change its identity.

## Confirmed changes
- PR #67 (ONE preflight workflow) merged into main, commit 38f806e1b8360970dfa407e770f079c838552d95.
- Preflight checks passed.
- GitHub Actions workflow: .github/workflows/one-store-build.yml
- Store submit workflow: .github/workflows/one-store-submit.yml
- Mobile profiles: Android preview builds APK, production builds AAB; iOS store build configured.

## Build attempts (links authoritative)
- https://github.com/B1resever/blackone/actions/runs/41361681972 — failed at Expo authentication (EXPO_TOKEN absent).
- https://github.com/B1resever/blackone/actions/runs/41364580782 — Expo authentication passed, but Android credentials READ denied for scoped Runner token.
- https://github.com/B1resever/blackone/actions/runs/41366129084 — started after user updated GitHub Actions secret EXPO_TOKEN with a scoped Developer access token. Completed SUCCESS: repository release gate, npm ci, expo-doctor, TypeScript, production API smoke, EAS authentication, Android build all PASS. GitHub artifact one-build-android-preview confirmed.

## Confirmed Android APK (2026-11-01)
- EAS build ID: 1d3f4c52-69c4-42b7-9a71-aaf5ad4e6a4b
- Expo build status: Succeeded (preview/internal distribution, app 1.0.0 build 2, SDK 57)
- EAS build page: https://expo.dev/accounts/b1reserve/projects/blackonegroup/builds/1d3f4c52-69c4-42b7-9a71-aaf5ad4e6a4b
- Direct APK: https://expo.dev/artifacts/eas/J0AFs_DIL5CwN9QSNmsZEbwpgdf-58-FumWs2hEXlIo.apk
- APK installation on physical Android device and functional validation are NOT YET VERIFIED.
- This preview APK is not a Google Play production AAB. No store submission or publication confirmed.

## Credentials and security
- Repository secret name: EXPO_TOKEN. User confirmed updating it; never store token value in code, issues, chat, or this document.
- Expo account scoped to b1reserve, token role Developer.
- No need to recreate Expo account or repeat authentication unless a run explicitly shows a new authorization failure.
- Vercel production variables for Stripe/Maps/database were listed in production; never output secret values.
- Keep payments and bookings untouched during build diagnostics.

## Immediate next action
1. Install the confirmed preview APK on an Android device and test passenger/driver login, booking, quotes, maps, driver flow, permissions, notifications and operations against safe test accounts; do not create real charges.
2. Record actual test results and fix any failures before release.
3. Generate and test iOS TestFlight build using verified Apple signing credentials.
4. Generate tested production Android AAB and iOS store builds; submit only after store credentials, legal/compliance requirements and functionality checks are complete.
5. Do not claim App Store or Google Play publication until actual listings are approved/live.

## Customer requirement
The goal is a real installable ONE Passenger / ONE Driver app with B1 Operations and publication on Android/iOS. No mockups or AI images. Preserve existing reservations, pricing and brand.
