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
- https://github.com/B1resever/blackone/actions/runs/41366129084 — started after user updated GitHub Actions secret EXPO_TOKEN with a scoped Developer access token. At last verified check: repository release gate PASS, npm ci PASS, expo-doctor PASS, TypeScript PASS, production API smoke PASS, EAS authentication PASS, Android build IN PROGRESS. Recheck this run and its artifacts before making any claim that APK exists.

## Credentials and security
- Repository secret name: EXPO_TOKEN. User confirmed updating it; never store token value in code, issues, chat, or this document.
- Expo account scoped to b1reserve, token role Developer.
- No need to recreate Expo account or repeat authentication unless a run explicitly shows a new authorization failure.
- Vercel production variables for Stripe/Maps/database were listed in production; never output secret values.
- Keep payments and bookings untouched during build diagnostics.

## Immediate next action
1. Inspect GitHub Actions run 41366129084, especially Android build result and artifacts.
2. If successful, capture EAS build ID and APK artifact URL, then install/test on a physical Android phone.
3. If failed, inspect job logs, correct the specific error without changing unrelated production configuration, and rerun android preview only after the fix.
4. Once Android is tested, initiate iOS internal testing; only submit tested store builds with verified store credentials.
5. Do not claim App Store or Google Play publication until actual listings are approved/live.

## Customer requirement
The goal is a real installable ONE Passenger / ONE Driver app with B1 Operations and publication on Android/iOS. No mockups or AI images. Preserve existing reservations, pricing and brand.
