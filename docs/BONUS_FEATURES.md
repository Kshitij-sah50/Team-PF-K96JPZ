# Bonus features

## NASA SkyView

Spirit Lens can import 512px archival display JPEGs for a target name/J2000 position, one of DSS, 2MASS-J, or GALEX Near UV, and a field width of 0.05–2 degrees. No key is required. This is on-demand archive retrieval, not a telescope live stream. NASA's guide: https://skyview.gsfc.nasa.gov/current/docs/easy.html

The same-origin `/api/skyview` route calls a fixed NASA host, validates parameters, caps responses at 4 MB, times out at 45 seconds, limits concurrent upstream requests to three per process, and caches up to 20 fields for six hours per process. Provider errors produce an explicit retry message. The source query and retrieval time are retained in the restoration report. Restoring an imported image uses the existing local denoising pipeline. Survey coverage, observing dates, wavelengths, and credits vary; consult the survey/source links.

## Signal Observatory

At `/analysis`, import a CSV up to 1 MB with 12–2,000 rows. For light curves use `time_utc,flux,error`; for spectra use `wavelength_nm,flux,error`. The error column is optional; if present, provide a nonnegative uncertainty for every row. ISO times require an explicit timezone. Duplicate coordinates and missing values are rejected. Use consistent units and the same source, instrument, band and calibration.

Time candidates use a global median and robust scatter (1.4826 × MAD). Spectra use an 11-sample local median excluding the evaluated sample, then residual MAD. Supplied errors combine with scatter in quadrature. Absolute deviations over 3–10 sigma are flagged; zero uncertainty is reported as insufficient information rather than infinite significance. The plot and JSON export retain measurements and settings. Synthetic examples are labelled. These are screening heuristics, not confirmed transients or formal discovery significance; spectra alone do not establish variability.

## Honor journal

Event detail pages let users self-report an observation for 25 Honor Points, once per event, after its start and before the current time. The device-local ledger appears at `/dojo` and exports to JSON. Threshold badges: First Light 25, Night Guardian 100, Ronin Watcher 250. The total is derived from ledger entries. Browser Web Locks serialize updates across tabs when available. Storage errors are surfaced.

There is no authenticated ownership, server-side verification, shared leaderboard or cross-device sync yet. Local storage is editable by its owner. Clearing browser storage clears the journal; export important entries. The existing database's user/observation/honor tables remain available for a later authenticated implementation; no arbitrary public user-ID award endpoint is exposed.

```powershell
pnpm --filter web build
pnpm --filter @repo/database exec tsx --test ../../apps/web/lib/bonuses.test.ts
```
