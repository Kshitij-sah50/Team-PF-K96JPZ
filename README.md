# Tsukuyomi Watch

A Japanese-inspired celestial guide built with Next.js, tRPC, Drizzle, and PostgreSQL.

## Implemented

- Part 1: database foundation for users, preferences, locations, weather, events, alerts, observations, and honor points.
- Part 2: Watchtower dashboard with a seeded destination catalog, browser geolocation, radius filtering, an interactive OpenStreetMap view, live nighttime forecasts, and a weather-only Night Honor Score.
- Part 3 (first slice): Celestial Scroll with USNO moon phases, Launch Library rocket launches, a month calendar, type/day filters, source health, database feed caching, and calendar reminder downloads.

Spirit Lens and the authenticated Dojo are future parts. ISS passes, meteor showers,
eclipses, daily moon data, and server-delivered alerts remain to be added to the Scroll.
See [API setup](docs/API_SETUP.md) for providers, signup links, key requirements,
and which integrations are currently connected.

## Local development

Requires Node.js 20.9 or newer, pnpm 9, and Docker (or PostgreSQL 15).

```powershell
pnpm install --frozen-lockfile
# Create .env from .env.example if you do not already have one.
Copy-Item .env.example .env
docker compose up -d postgresdb
pnpm db:migrate
pnpm --filter @repo/database db:seed
```

Run the API and web app in separate terminals, from the repository root:

```powershell
pnpm exec dotenv -- pnpm --filter @repo/api dev
```

```powershell
pnpm exec dotenv -- pnpm --filter web dev
```

Open http://localhost:3000. The API defaults to http://localhost:8000. Next.js proxies `/trpc` to the API, keeping requests on the same origin. Set server-side `API_URL` to change the proxy destination. If configuring `NEXT_PUBLIC_API_URL` instead, it must include the `/trpc` path and the API must allow your origin.

Google OAuth variables are optional for the Watchtower. Existing OAuth discovery is retained, but sign-in and authenticated user operations are not implemented yet. Do not overwrite an existing `.env` when following setup.

## Weather and scoring

The service requests hourly forecasts from [Open-Meteo](https://open-meteo.com/en/docs) with Unix timestamps, cloud cover, relative humidity, visibility, temperature, wind, and the day/night indicator. It selects the next future nighttime hour. Missing data or provider failures produce an error instead of synthetic conditions.

Weather snapshots and score components are written together in a database transaction. Cached responses remain valid for 30 minutes, provided the forecast hour has not passed. Concurrent requests for the same location share one fetch within an API process.

The initial score uses the project document's clear-sky, visibility, and dry-air weights: 40, 20, and 15 points. Visibility receives full credit at 20 km. Their sum is divided by 75 and scaled to 100. **Moonlight and light pollution are excluded**, and this is explicitly labelled in the dashboard. The score is a planning estimate, not a visibility guarantee. Provider night means sunset-to-sunrise, not astronomical darkness.

The four seeded destinations use approximate coordinates and no unverified Bortle ratings. Nearby filtering uses Haversine distance over a bounded catalog of up to 500 locations. PostGIS and a larger geographic catalog remain future work. The seed is idempotent and preserves existing records.

## Checks

```powershell
pnpm --filter web check-types
pnpm --filter web build
pnpm --filter @repo/api build
pnpm --filter @repo/database exec tsx --test ../services/watchtower/weather.test.ts
pnpm --filter @repo/database exec tsx --test ../services/celestial/providers.test.ts
pnpm exec tsc --noEmit -p packages/services
pnpm exec tsc --noEmit -p packages/trpc
pnpm exec tsc --noEmit -p packages/database
```

Tests cover score boundaries, weights, visibility caps, malformed/missing forecast data, nighttime selection, unit conversion, and geographic distance.

The local implementation was also checked against PostgreSQL: migrations, idempotent seed, nearby filtering, a live weather request, and a subsequent cache hit.

## Next parts

3. Complete the Celestial Scroll: ISS passes, meteor showers, eclipses, daily moon data, and server-side alerts. Primary phases, launches, date/type filters, and calendar export are implemented.
4. Spirit Lens: image storage, restoration worker, detection, comparison view.
5. Dojo: authenticated saved places, observations, transactional honor awards.
6. Optional NASA SkyView and transient analysis.

See [database implementation notes](packages/database/IMPLEMENTATION.md) for schema decisions.
