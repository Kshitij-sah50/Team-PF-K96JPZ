# Part 1: Database foundation

Implemented Drizzle tables for users, preferences, badges, honor ledger,
locations, weather snapshots, Night Honor Scores, saved locations, event types,
celestial events, moon phases, location-specific moonrise/set times, ISS passes,
alerts, and observations. Existing Google OAuth user fields are preserved;
password login is not introduced.

All new timestamps use PostgreSQL `timestamptz`. Database constraints validate
coordinates, percentages, score components, event chronology, and alert state.
Composite uniqueness prevents duplicate source events, saved spots, badges,
and repeated observations of one event by one user.

Design adjustments:

- A score gets its location through its unique weather snapshot. This prevents
  mismatched location/snapshot pairs. Query through weather_snapshots using the
  location/forecast index. The coordinate B-tree index is a foundation; PostGIS
  and radius queries are deferred to the Watchtower implementation.
- Moonrise and moonset are stored per location and date. Global phase records
  cannot represent local rising times correctly. Lunar calendar fields are
  deferred pending the choice of a calendar convention.
- Honor totals are calculated from the ledger. Application writes must be
  append-only; database enforcement and transactional award services are deferred.
- Awarding an observation and its ledger entry must occur in one transaction in
  the future service layer. No points-award endpoint exists in this part.

## Local setup

From the repository root:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
docker compose up -d postgresdb
pnpm db:migrate
```

Migration generation does not connect to PostgreSQL. Migration application does.
Do not run the migration against a shared database without reviewing the SQL.

## Remaining parts

2. Watchtower API, weather integration, score calculation, and dashboard.
3. Celestial Scroll feeds, filtering, lunar display, and alert delivery.
4. Spirit Lens storage, restoration worker, detection, and comparison interface.
5. Authenticated saved places, observation awards, and Dojo dashboard.
6. Optional SkyView and transient-analysis features.

Part 1 added schema and migration. Part 2 now implements the Watchtower UI and
weather service; see the repository README for startup and verification.
