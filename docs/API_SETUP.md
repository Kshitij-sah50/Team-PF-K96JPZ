# API setup for Tsukuyomi Watch

No API key is required for the features connected so far. Keep future secret keys
in the root `.env`, never in `NEXT_PUBLIC_` variables or Git.

## Connected in Parts 2 and 3

| Feature                                              | Provider and documentation                                                                                                       | Key / setup                                                                                                                                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloud cover, humidity, visibility, temperature, wind | [Open-Meteo Forecast API](https://open-meteo.com/en/docs)                                                                        | Public endpoint for prototyping; no key in the current integration. Review their usage terms before commercial deployment.                                                                   |
| Interactive location map                             | [OpenStreetMap](https://www.openstreetmap.org/)                                                                                  | The current embedded map needs no key. Preserve attribution. For a custom tile layer or substantial traffic, review the [tile policy](https://operations.osmfoundation.org/policies/tiles/). |
| Primary moon phases                                  | [US Naval Observatory API](https://aa.usno.navy.mil/data/api)                                                                    | No credential required by the endpoint. The optional `ID` is an application identifier, not a secret API key.                                                                                |
| Rocket launches                                      | [The Space Devs / Launch Library 2](https://thespacedevs.com/llapi), [API endpoint](https://ll.thespacedevs.com/2.3.0/launches/) | Public access allows 15 unauthenticated requests per hour according to the provider. Higher quotas require arranging access with The Space Devs.                                             |

Endpoint examples used by the application:

```text
https://api.open-meteo.com/v1/forecast?latitude=32.779&longitude=78.964&hourly=cloud_cover,relative_humidity_2m,visibility,temperature_2m,wind_speed_10m,is_day&forecast_days=3&timeformat=unixtime&timezone=GMT
https://aa.usno.navy.mil/api/moon/phases/date?date=2026-10-01&nump=8
https://ll.thespacedevs.com/2.3.0/launches/?net__gte=2026-10-01T00:00:00Z&net__lt=2026-11-01T00:00:00Z&ordering=net&limit=100&mode=normal
```

USNO returns the next eight primary phase instants. We retain only those in the
selected UTC month. This supplies phase dates, not daily lunar illumination or
a traditional Japanese lunisolar calendar. Launch Library supplies launch schedules,
not predictions of whether a launch is visible from the user's location.

The event service stores normalized events and per-month feed membership in
PostgreSQL, reuses successful requests for one hour, and cools down failed
requests for ten minutes. Upserts prevent duplicate events and update launch
times. Feed membership is replaced only on successful refresh, so removed events
stop appearing without deleting their historical records. Failed feeds retain
their saved snapshot and display an unavailable/stale status. Each launch fetch
is capped at 100 results, with a visible truncation warning. Browsing many months
can still exhaust the free launch quota; cache requests and arrange higher limits
before scaling to many users. In-process request deduplication is not a
distributed rate limiter.

## APIs and sources for future parts

| Feature                               | Where to get it                                                                                                                           | What you need                                                                                                                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ISS visible passes                    | [N2YO REST API](https://www.n2yo.com/api/)                                                                                                | Register at N2YO, sign in, open your profile, and generate a REST API key. The ISS catalog ID is `25544`; `visualpasses` needs observer latitude, longitude, altitude, and prediction days. This key is not consumed by the app yet. |
| Moonrise, moonset, daily illumination | [USNO Complete Sun and Moon Data](https://aa.usno.navy.mil/data/api)                                                                      | Location and date parameters; no API credential required. Convert provider timezone data carefully before storing UTC. Not connected yet.                                                                                            |
| Meteor showers                        | [International Meteor Organization 2026 calendar](https://www.imo.net/files/meteor-shower/cal2026.pdf)                                    | A published calendar, not a JSON API. Curate annual records with source attribution and uncertainty; do not assume identical peak instants every year. Not imported yet.                                                             |
| Eclipses                              | [NASA eclipse catalogs](https://eclipse.gsfc.nasa.gov/eclipse.html)                                                                       | Published tables/maps, not a general events JSON API. Curate dates and geographic visibility, or implement astronomical calculations. Not imported yet.                                                                              |
| NASA imagery and optional APOD/NeoWs  | [NASA API portal](https://api.nasa.gov/)                                                                                                  | Generate a NASA API key on that portal for APIs that require one. It is not a universal celestial-events key and is not needed by the current app.                                                                                   |
| AI image restoration                  | Your own inference worker, optionally hosted on [Hugging Face Inference Endpoints](https://huggingface.co/docs/inference-endpoints/index) | Select and evaluate an appropriate denoising/deblurring model, then deploy an inference endpoint or custom container. Hosting alone does not provide a validated astronomy restoration model. No restoration API is connected yet.   |

For Spirit Lens, prefer a conservative, non-generative restoration pipeline and
validate its effect on source positions and photometry. PSNR/SSIM against the
noisy input can measure similarity but do not prove that no details were
invented or that scientific accuracy improved. Object detection can run in the
same worker; it does not require an unrelated commercial API.

## What to obtain now

Nothing is needed to try the Watchtower, moon phases, and launch calendar after
database setup. For the next ISS integration, obtain an N2YO REST key and keep it
locally until the integration is added. A NASA key is optional for future NASA
features. No paid model endpoint is needed at this stage.

Calendar downloads contain a local calendar reminder 30 minutes before the event.
Delivery depends on the user's calendar application. Server-side email alerts,
background scheduling, and authenticated alert preferences are not implemented.
