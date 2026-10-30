# Judging readiness review

Audit: **30 October 2026 (IST)**. Application source: **8e07eb7**. Presentation-only changes follow that revision.

**Verdict: ready for a controlled hackathon demonstration, with material limits to explain.** The four core modules and bonus prototypes are implemented, the public application works in the audited flows, all 28 automated test cases pass, and both production builds pass. This does not establish exhaustive test coverage, scientific accuracy, broad user impact or always-on production reliability. A judging score cannot be guaranteed.

Live application: https://tsukuyomi-watch.vercel.app

Repository: https://github.com/PECathon-2026/Team-PF-K96JPZ

## Rubric review

| Criterion | Marks | Evidence | Preparation / gap |
| --- | ---: | --- | --- |
| Innovation | 15 | Connected place → time → image workflow; local bounded AI; lunar navigation; four Japanese motif palettes | Present the integration as the contribution. DnCNN, SGP4 and the astronomy algorithms are established methods. |
| System design / codebase knowledge | 20 | Next.js UI, typed tRPC contracts, Zod validation, domain services, Drizzle/Neon, browser worker, provider adapters | Rehearse a complete request trace. Every teammate should understand cache, validation, privacy and persistence boundaries. The deck alone cannot demonstrate team knowledge. |
| Problem understanding | 15 | Weather ranking/map, cosmic events, local restoration/object candidates, before/after zoom/overlays | Explain forecast vs measurement, approximate event timing, tentative classification and bounded preview processing. |
| Test cases | 20 | Fresh 28/28 test run across eight files; frontend/API builds; production browser evidence | No measured coverage or automated CI workflow. Broader E2E, concurrent delivery, physical push receipt, accessibility and scientific benchmark evidence remain. |
| Impact / feasibility | 15 | Live deployment; browser inference; public data adapters and bounded input sizes | Six-place Indian catalogue; no adoption, savings, observing-success or cost/load study. Plan an astronomy-club pilot. |
| Presentation | 15 | Editable 17-slide deck, speaker notes, PDF, real screenshots, five-minute script and Q&A | Rehearse. Use slides 1–12 as the main narrative, slide 13 as a timing guide and slides 14–17 for questions. |

The 20 marks for design and 20 for tests deserve particular attention: show the architecture and the actual test transcript, then demonstrate the behavior those tests protect.

## Problem-statement coverage

| Requirement | Implemented behavior | Qualification |
| --- | --- | --- |
| Weather and Night Honor Score | Open-Meteo nighttime forecast; validated cloud/humidity/visibility; bounded weighted score | Next future provider-night hour, not a live sensor. Score currently excludes moonlight and light pollution. |
| Interactive nearby map/search | Leaflet ancient-scroll map, four marker motifs, place / map-area search, nearby ranking | Six curated Indian destinations; approximate map outlines are not a navigation map. |
| Event tracker and lunar filtering | Moon phases, launches, calculated eclipses, approximate meteor windows, selected-site ISS panel, internal details, calendar export | Global eclipse maxima are not local contacts. Meteor dates are approximate with noon UTC placeholders. Launches can change; stale orbital elements are rejected. |
| Moonrise / event alerts | In-app information, calendar export, persistent browser-push subscription/jobs and service worker | Closed-app delivery needs HTTPS, browser permission, VAPID credentials, an active API and a minute scheduler. An always-on production scheduler / physical receipt is not verified by this audit. Safari endpoint not enabled. |
| AI restoration | Actual pretrained DnCNN inference locally; bounded blending; optional Richardson–Lucy deblur | RGB preview ≤768px. No full-resolution FITS/RAW or 16-bit PNG processing. Safeguards reduce risk; they do not prove every faint feature survives. |
| Star / galaxy info | Original-preview source detection; size/brightness/morphology; tentative galaxy candidates | Uncalibrated pixel measurements, not magnitudes or confirmed astronomical identities. Nebulae or blends can resemble galaxies. |
| Dojo visualization | Before/after slider, zoom, pan, candidate overlays, PNG / JSON downloads inside Spirit Lens | The separate `/dojo` page is the local Honor journal. No account-synced image history. |
| Theme requirements | Ink Wash, Torii, Sakura, Katana; light/dark; moon cues; motifs; translations and reduced-motion styles | These are shared feature-page themes, not four separate apps. |
| SkyView bonus | On-demand NASA archival survey JPEG import with provenance | Not a live telescope stream; provider overload/unavailability is possible. |
| Spectral/time analysis bonus | CSV light-curve and spectral outlier screening, charts and report | Median/MAD heuristics; candidates are not discoveries or formal calibrated significance. |
| Honor Points bonus | Self-reported past observations, 25 points per event, badges, JSON export | Device-local and editable by its owner. No verified global leaderboard, auth or cross-device sync. |

## Fresh verification evidence

- **28 passed, 0 failed, 0 skipped**: transcript in `test-results.txt`. These are test cases, each potentially containing multiple assertions; not a measured coverage statistic.
- `pnpm --filter web build`: optimized Next.js 16.1.0 build passed, including TypeScript and page generation.
- `pnpm --filter @repo/api build`: tsup API build passed.
- Production browser check: six map markers, rendered lunar calendar, completed synthetic Spirit Lens restoration, plotted synthetic signal example. Screenshots in `assets/`.
- Lens run: labelled synthetic **444 × 330** input; **15.8 seconds**, **41 candidates**, input-similarity SSIM **0.975**, PSNR **41.6 dB**, estimated noise **8.6 → 6.5**, maximum channel edit **6/255**. Source timestamp and displayed measurements: `assets/live-evidence.json`. Runtime is one device/browser example, not a performance guarantee. Similarity to noisy input is not clean-reference accuracy.
- Existing device-ownership PostgreSQL integration is separate historical evidence, **not rerun in this audit**. Do not include it in the 28 or imply a physical notification was received.

Reproduce automated cases from the repository root:

```powershell
pnpm --filter @repo/database exec tsx --test ../services/watchtower/weather.test.ts ../services/watchtower/moon.test.ts ../services/celestial/providers.test.ts ../services/celestial/calculated.test.ts ../services/alerts/alerts.test.ts ../../apps/web/lib/spirit-lens/analysis.test.ts ../../apps/web/lib/spirit-lens/deblur.test.ts ../../apps/web/lib/bonuses.test.ts
pnpm --filter web build
pnpm --filter @repo/api build
```

| Test file | Cases | Selected boundary / failure coverage |
| --- | ---: | --- |
| `packages/services/watchtower/weather.test.ts` | 4 | Score 0/100, visibility saturation, malformed/null/day-only forecast, future hour selection, date-line distance |
| `packages/services/watchtower/moon.test.ts` | 3 | UTC phase, polar missing rise/set, bad data, observer timezone and past/day/night reminders |
| `packages/services/celestial/providers.test.ts` | 4 | Year rollover/leap February, invalid dates, provider IDs, pagination, ICS escaping and UTF-8 folding |
| `packages/services/celestial/calculated.test.ts` | 5 | Known eclipse, estimated meteor windows, lunar new year/leap month, invalid TLE, bounded predicted ISS segments |
| `packages/services/alerts/alerts.test.ts` | 2 | Unsafe endpoint/SSRF rejection; invalid scheduler credentials rejected before database access |
| `apps/web/lib/spirit-lens/analysis.test.ts` | 5 | Reflection, RGB/alpha/source preservation, flat-sky rejection, invalid/oversized/high-bit-depth input, tentative morphology |
| `apps/web/lib/spirit-lens/deblur.test.ts` | 1 | Error reduction on a known synthetic blurred-source fixture |
| `apps/web/lib/bonuses.test.ts` | 4 | Injected time/spectral features, zero scatter, invalid CSV, duplicate/future observations and badge totals |

## Codebase walkthrough

1. `apps/web/app` and `apps/web/components`: routes, feature UI and user interaction.
2. `packages/trpc/server/routes`: typed API procedures and request validation. `apps/api/src/server.ts`: Express transport.
3. `packages/services/watchtower`: place ranking, forecast and lunar adapters. `weather.ts` owns the score formula.
4. `packages/services/celestial`: provider normalization, feed membership/cache, eclipse/meteor calculations, Kyūreki and ISS predictions.
5. `packages/database/models` and `packages/database/drizzle`: persistent schema and five migrations. Current active behavior must be distinguished from foundation user/Honor tables.
6. `apps/web/lib/spirit-lens`: input checks, model settings, worker inference, conservative image processing, metrics and candidate extraction.
7. `apps/web/lib/transient-analysis.ts` and `honor-journal.ts`: local bonus logic.
8. `packages/services/alerts`, `apps/web/public/push-worker.js`, `ops/push-cron.mjs`: anonymous-device ownership, jobs, delivery and scheduling.

## Priorities before the judging slot

1. Rehearse the five-minute path in `DEMO_GUIDE.md`; each teammate should explain their code and one failure case.
2. Warm the public app and model. Keep the PDF/screenshots, local image and CSV fixtures available.
3. If demonstrating closed-app push, configure an actual periodic production scheduler and verify receipt on the physical browser beforehand. Otherwise demonstrate scheduling and calendar export and disclose the remaining delivery prerequisite.
4. Future engineering: CI and broader E2E; provider outage/permission/offline tests; concurrent delivery and load tests; full accessibility review; astronomy benchmark with source photometry; more destinations; authenticated sync.

No production secrets are needed for the presentation. Never put database URLs, VAPID private keys or scheduler credentials into slides or screenshots.
