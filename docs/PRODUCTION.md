# Production deployment: Vercel + Render

The repository is prepared for deployment; a Git push is not confirmation that either hosting service has deployed successfully.

## Render API and database

Import `render.yaml` as a Blueprint from the repository root. It creates the API and PostgreSQL with the existing paid plans; review charges in Render before creating resources. Use Node 22 and the pinned pnpm 9.0.0. The pre-deploy command applies migrations (including persistent push jobs) and idempotently seeds destinations.

Set `BASE_URL` to the actual public HTTPS URL assigned to the API. The optional Google OAuth values may remain unset. For push, copy `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` from your private local `.env` into the API's secret settings; do not commit them. Render generates `CRON_SECRET`. Keep it private. Using the same VAPID keys preserves existing subscriptions.

Verify `/health` responds, then verify the browser can load destinations, forecasts and calendar events. API health alone does not verify database connectivity or external sources. Check Render deploy logs to confirm migrations and seed succeeded.

## Vercel web

Import the same GitHub repository with Root Directory `apps/web` and enable access to files outside that directory. Set server-side `API_URL` to the real Render HTTPS API URL **before deploying**. There is intentionally no guessed production API URL in Git. Do not use NEXT_PUBLIC_API_URL. Production validation rejects a missing/non-HTTPS API_URL instead of shipping a localhost proxy.

The build copies the pinned ONNX runtime assets automatically. Verify `/onnx/ort-wasm-simd-threaded.wasm`, `/models/dncnn/dncnn.onnx`, `/push-worker.js`, and the same-origin `/trpc` proxy respond on the deployed web domain. Test actual image restoration, SkyView import, search, lunar navigation and all four palettes on that domain. Push and geolocation need HTTPS and user permission.

## Push scheduler

Import `render.push.yaml` as a second, optional Blueprint (this creates a paid cron resource), or configure an existing scheduler to run `node ops/push-cron.mjs` every minute. Set `API_URL` to the public API URL and copy the API's exact `CRON_SECRET` into the scheduler's secret settings. The scheduler does not need DATABASE_URL or the VAPID private key.

After deployment, opt in from a real supported browser, schedule a future event/moonrise alert, close the page and confirm receipt. That device test is required before calling production push delivery verified. Delivery depends on OS/browser policy and network access.

## Access needed

Deployment requires authorized access to the Vercel project and Render workspace. The app's generated push secrets belong in hosting secret settings, never in chat, Git, or frontend environment variables. No production migrations should be run against an unidentified database URL.
