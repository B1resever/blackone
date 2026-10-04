# ONE — External Release Blockers

Repository development can continue without these items, but the app cannot become a production store release until they are connected.

## 1. Vercel project permission

Current connected Vercel team access shows only the unrelated site-flow-research project. Creating the intended blackone project returned HTTP 403 permission denied.

Already fixed in code:
- only main triggers Vercel automatic deployments
- feature/PR branches no longer consume Hobby build quota

Still required:
- a Vercel account/team permission that can create or link B1resever/blackone as its own project

Do not repurpose site-flow-research.

## 2. Dedicated ONE database

A Neon project ID for ONE has not been positively identified through the active connection.

Still required:
- identify/create the dedicated ONE project/database
- apply migrations 0001 through 0006

Do not guess a project ID and do not apply migrations to AAA or CENTER + NODO.

## 3. Expo / EAS project

Still required:
- create/identify the ONE Expo project
- write its EAS projectId into app.json
- configure EXPO_TOKEN for store build workflows

## 4. Final mobile brand assets

Still required:
- 1024x1024 app icon
- Android adaptive icon
- splash artwork

The release gate deliberately blocks store builds until final app-icon configuration exists.

## 5. Store accounts

Still required:
- Apple Developer / App Store Connect access
- Google Play Console access

## 6. Production integrations

Still required:
- Google Maps production server key
- Stripe production secret and webhook secret
- ONE backend production URL
- admin token
- allowed origins
- payment return URLs

Use GET /one/api/readiness after deployment to verify the backend without exposing secret values.
