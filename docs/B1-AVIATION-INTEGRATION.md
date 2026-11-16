# B1 Private Aviation integration

Status: development only. No aviation provider contracted, no live feed, no production deployment.

## Architecture

- Mobile: `apps/one-mobile/app/aviation-radar.tsx` -> `fetchAviationFeed()`.
- B1 API: `GET /one/api/aviation` -> `api/one/aviation.ts`.
- Vercel server secrets: `B1_AVIATION_PROVIDER_URL`, `B1_AVIATION_PROVIDER_TOKEN`.
- Mobile public endpoint: `EXPO_PUBLIC_B1_AVIATION_FEED_URL=https://<B1-host>/one/api/aviation` (never a vendor URL or secret).
- Current server expects a licensed B1-normalized upstream feed with `{source,updatedAt,flights:[{id,latitude,longitude,observedAt,...}]}` and Bearer authentication. Real vendors require adapter work to normalize their own API responses; this is NOT a ready-to-use FlightAware/FR24/ADS-B integration.
- Confirm rights for public redistribution, aircraft privacy/blocked-aircraft handling, geographic coverage and update frequency before activation.

## Launch gates

1. Select licensed data provider and verify commercial redistribution terms and price.
2. Implement provider-specific adapter server-side and tests; no credentials in mobile.
3. Configure Vercel production environment and mobile public B1 URL.
4. Run server/mobile typecheck, API tests, Android/iOS UI tests, and verify real positions and stale-data handling.
5. Review map-provider key and terms, capacity and rate limits, then merge PR and build.

Aircraft visibility does not imply availability for charter. Charter/empty legs need a separate verified operator integration.
