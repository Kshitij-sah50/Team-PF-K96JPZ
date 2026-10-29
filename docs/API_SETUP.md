# API setup for Tsukuyomi Watch

No paid API account is needed for the connected astronomy features. Server push uses locally generated VAPID credentials; keep private keys and scheduler secrets in the ignored root `.env` or your hosting secret settings.

| Feature | Source | Setup |
| --- | --- | --- |
| Weather and city search | [Open-Meteo](https://open-meteo.com/) | Public endpoints; no key. Review usage terms before commercial scaling. |
| Scroll map | [Leaflet](https://leafletjs.com/) and [Natural Earth](https://www.naturalearthdata.com/) | Local country outlines; no map key. |
| Moon phases, rise and set | [US Naval Observatory](https://aa.usno.navy.mil/data/api) | No secret required. Location-specific daily data is cached. |
| Rocket launches | [Launch Library](https://thespacedevs.com/llapi) | Public access is rate-limited; month responses are cached. |
| Meteor observing windows | [International Meteor Organization](https://www.imo.net/calendar/) | Approximate recurring dates with explicit uncertainty; consult annual forecasts for precise maxima. |
| Eclipses | [Astronomy Engine](https://github.com/cosinekitty/astronomy) | Computed global maxima; no key. Local visibility and contacts are separate. |
| ISS passes | [CelesTrak](https://celestrak.org/) and [Satellite.js](https://github.com/shashwatak/satellite-js) | ISS TLEs (25544), one-hour cache, SGP4 visible-segment prediction. No N2YO key required. Stale elements produce an error. |
| Japanese lunar labels | [himekuri](https://github.com/kenjiyoshidahome2026-bit/himekuri) | MIT-licensed Kyūreki converter, including leap months. |
| Telescope image import | [NASA SkyView](https://skyview.gsfc.nasa.gov/current/docs/easy.html) | On-demand archival survey JPEGs, not a live camera; no NASA key. |
| AI restoration | [KAIR DnCNN](https://github.com/cszn/KAIR) | Bundled, verified model runs locally in a browser worker. Optional conventional Richardson–Lucy deblurring; no inference account. |
| Spectral/time analysis | Local CSV analysis | Import consistent measurements; candidates are not confirmed discoveries. |
| Background browser push | Web Push / VAPID | Generate keys locally and run the server scheduler every minute. See [completion notes](COMPLETION_NOTES.md). |

## Local push setup

Run `node packages/services/alerts/generate-keys.cjs` once, then restart the API. The script refuses to replace existing keys. Local keys have been generated during implementation. Run `pnpm exec dotenv -- node ops/push-cron.mjs --watch` with `API_URL=http://localhost:8000` for local continuous scheduling.

For production, set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and `CRON_SECRET` on the API. Schedule `node ops/push-cron.mjs` once per minute with `API_URL` and the same `CRON_SECRET`. Apply database migrations first. None of the private settings belongs in `NEXT_PUBLIC_` variables. Browser permission and supported browser push services are required. No real push receipt has been verified on a physical device yet.

Moonrise toasts still work while the app is open. Calendar exports delegate closed-app reminders to the user's calendar. Background push uses its own persistent subscription and job tables. Email delivery is not connected.

## Scientific scope

Restoration uses display previews, not calibrated FITS photometry. Source morphology supports star/galaxy candidates with brightness and size estimates; catalogue identities are not asserted. Similarity with a noisy input cannot prove scientific accuracy. The Night Honor Score currently excludes light pollution and moonlight, and the curated location catalog is intentionally small.
