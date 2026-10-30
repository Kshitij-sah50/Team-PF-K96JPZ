# Five-minute demo and panel preparation

## Before the slot

Open https://tsukuyomi-watch.vercel.app and `/spirit-lens` to warm free hosting and model assets. Keep this deck's PDF available offline. Use the visibly labelled synthetic image demo or a permitted local image; do not depend on NASA retrieval. The screenshots are actual production evidence captured on 30 October 2026 IST. Keep `fixtures/light-curve.csv` and `fixtures/spectrum.csv` ready.

Verify network, screen zoom, audio-free flow and projector contrast. Choose a palette before the pitch; show alternatives briefly without spending the demonstration on theme settings. Do not expose deployment dashboards containing credentials.

## Spoken walkthrough

**0:00–0:30 — Problem.** “Finding a usable observing night means combining weather, place and event information. Then noisy images need careful inspection. Tsukuyomi Watch joins those decisions in one Japanese-inspired guide.”

**0:30–1:20 — Watchtower and Scroll.** Select Hanle or another catalogue marker. Show cloud/humidity/visibility and explain that the score is a weather-only forecast estimate. Search or use the map-area control. Navigate the lunar calendar, filter an event type and open internal details. Show calendar export. Explain that eclipse events are global and meteor windows approximate. If an upstream is unavailable, acknowledge it and use the captured screenshot rather than inventing a successful response.

**1:20–2:30 — Spirit Lens.** Load the explicitly labelled synthetic demo and run Gentle restoration. Explain browser-side DnCNN while it runs. Drag the comparison slider, zoom, toggle candidates and inspect the output metrics. “These are candidates and pixel measurements, not confirmed catalogue identities. Similarity compares the result to the noisy input, not to clean ground truth.” Show PNG/JSON export. Deblur is optional and assumes a PSF; avoid changing parameters live unless rehearsed.

**2:30–3:10 — Bonuses.** Point to SkyView archival import without relying on a live fetch. Load a labelled synthetic CSV in Signal Observatory and show the unusual measurement. “This flags a candidate for follow-up, not a discovery.” Open the Honor journal or a past event observation form. Points are local and self-reported. Do not log a false real observation just to obtain points.

**3:10–4:20 — Architecture and tests.** Use slides 5 and 10. Trace UI → tRPC/Zod → service → Drizzle/Neon; separately trace image → browser worker → bounded output. Show the 28/28 transcript and choose two edge cases to explain: missing night forecast and an invalid orbital element or image header. Frontend and API builds also pass.

**4:20–5:00 — Practical value and limits.** “The platform is live and feasible for a club-scale pilot. Next we need more locations, broader E2E and scientific validation, and reliable scheduled push delivery. We are ready to demonstrate the workflow while being explicit about uncertainty.” Return to the live application URL.

Slide 13 is a rehearsal aid; slides 14–17 are panel appendices. The main deck includes speaker notes throughout.

## Failure fallbacks

| Failure | Response |
| --- | --- |
| API waking / provider unavailable | Explain the dependency; use the real screenshot and move on. |
| NASA overloaded | Show archival-import controls and provenance; use the local image or labelled demo. |
| Slow AI / unsupported browser | Use the captured before/after and `assets/live-evidence.json`; do not imply the fallback just ran live. |
| Location permission denied | Search/select a curated place manually. |
| Notifications denied / scheduler absent | Show scheduling UI or calendar export. Do not claim delivery after app closure. |
| No past event in current filter | Navigate a past month; describe the journal without making an invented observation. |

## Questions every teammate should answer

**Why tRPC and Zod?** Shared TypeScript contracts reduce client/server drift; Zod validates untrusted input at runtime. Types alone do not secure provider data.

**Why a separate API?** Provider adapters, persistence and alert delivery have their own backend lifecycle. The browser uses the web app's same-origin proxy. SkyView has its own fixed-host Next.js route.

**What is the weather score?** Normalize cloud 40, visibility 20, humidity 15 to 100. Visibility caps at 20 km. For 50% cloud, 10 km visibility and 50% humidity the score is 50. No moon/light-pollution factor yet.

**What is AI here?** Pretrained DnCNN denoising executed by ONNX WASM in a browser worker. Richardson–Lucy deblur, morphology detection and MAD signal screening are conventional algorithms, not additional trained AI models.

**How do you avoid fake detail?** Use bounded blends, protected source regions and inspection tools; preserve provenance. These safeguards limit change but do not prove scientific fidelity for every source. Full scientific validation remains.

**What does SSIM prove?** It measures similarity to the original noisy preview. A high score alone does not prove accurate denoising. Use known clean/noisy benchmarks and source photometry for that.

**Are the galaxies confirmed?** No. Labels are morphological candidates; extended nebulae or blended stars can look similar. Brightness is uncalibrated preview pixel data.

**Are events exact?** Phases retain source UTC instants; launches can reschedule; eclipses show global maxima; meteor windows are approximate; ISS passes depend on fresh TLEs and sampled visibility assumptions.

**Does closed-app push work automatically?** The implementation persists jobs and supports Web Push. Delivery additionally requires a running minute scheduler, configured credentials, HTTPS, a compatible browser and permission. Physical production receipt is not verified by this audit.

**Can schedulers duplicate alerts?** Claim leases and attempts reduce concurrent processing; a crash after provider acceptance can still lead to retry. Notification tags reduce repeated visible notifications; do not promise exactly-once delivery.

**Where is Honor stored?** In device-local storage; users can export it. No authenticated cross-device sync or verified leaderboard exists.

**What is missing from testing?** CI, measured coverage, broad E2E, physical notification receipt, load/concurrency validation, a full accessibility audit and large scientific benchmarks. The current 28 cases cover selected business logic and edge cases.

**What is your innovation?** Joining planning and inspectable local restoration with a culturally coherent interaction flow. We did not invent the underlying model or orbital science.
