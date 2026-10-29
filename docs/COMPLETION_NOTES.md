# Remaining-feature implementation

## Celestial Scroll

Moon phases and launches are now joined by calculated solar/lunar eclipses and seasonal meteor observing windows. Eclipse maxima use Astronomy Engine; they describe global circumstances, not local contacts. Meteor entries explicitly use approximate recurring dates (±1 day) with a noon UTC placeholder, not fabricated annual peak instants. Annual IMO forecasts remain the authoritative planning reference.

The calendar defaults to an actual Japanese Kyūreki lunar month, with 29/30 days, previous/next lunar-month navigation, and explicit leap-month headings, using himekuri 2.0.0's Japanese lunisolar table. Events spanning two Gregorian months are fetched and filtered to the lunar interval. Small cell labels retain Gregorian civil dates, and a Gregorian view is available. The Japanese calendar convention is used; event filtering retains UTC civil dates. Known new-year and leap-month dates are tested.

ISS predictions use current CelesTrak TLEs, SGP4 propagation, spherical Earth/Sun angular occultation, station elevation ≥10° and observer Sun altitude below −6°. Only fully sunlit segments are shown, sampled every 20 seconds over the next three days for the selected Watchtower location. Elements older than three days are rejected. Updates, manoeuvres, refraction, observer elevation and weather limit accuracy. No magnitude is invented.

## Restoration and themes

Optional six-iteration Richardson–Lucy deconvolution follows AI denoising. The user controls the assumed Gaussian PSF (0.5–2px). Source cores and bounded luminance changes remain protected. This is a conventional deconvolution stage, not a second AI model. A known blurred source fixture verifies error reduction. Wrong PSFs can introduce ringing; inspect the slider before keeping an edit. Classification remains explicitly tentative: extended sources can be galaxies, nebulae or blended stars, and no catalogue identity is invented.

All four motif palettes (Ink Wash, Torii, Sakura, Katana) now have landscape artwork on Spirit Lens, event details, Signal Observatory and the Honor journal, in addition to the Watchtower. Light/dark choices remain shared across pages.

## Closed-app browser push

Persistent device subscriptions and alert jobs use migration `0004_amused_kingpin.sql`. Device access uses a random bearer token stored locally; only its hash is stored in the database. Users opt in, select event/moonrise lead times, list/cancel pending alerts and disable the device. Disabling deletes its jobs. This is anonymous device ownership; it is not account sign-in.

Configure locally once:

```powershell
pnpm db:migrate
node packages/services/alerts/generate-keys.cjs
# Restart API after generating keys.
```

The key script writes new credentials to the ignored root `.env` and refuses to overwrite existing credentials. For hosting, configure `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (a contact HTTPS URL or mailto URI), and a random `CRON_SECRET` on the API. Never expose private keys or CRON_SECRET as NEXT_PUBLIC variables. No external notification account or paid API key is required.

Run `node ops/push-cron.mjs` **every minute** on your scheduler, with `API_URL` and the same `CRON_SECRET`. It calls the protected delivery procedure. Use HTTPS in production. With Turbo, pass these server variables through your deployment environment or run the API command directly. Delivery claims prevent concurrent schedulers from normally processing the same job; provider failures retry up to three times, expired subscriptions are removed, and old jobs are pruned. A provider accepting a message just before a process crash can still cause a retry; the service worker's notification tag reduces duplicate visible notifications.

Delivery works only once credentials, migrations, a running API, and the periodic scheduler are configured. Browser/OS power saving or network policy may delay push. Browser support varies (Safari's Apple push endpoint is not enabled by this initial endpoint allowlist). Calendar reminders remain the fallback. No email delivery provider is connected.

## Remaining practical limits

The curated destination catalog is still small; no unverified Bortle ratings are added. Spirit Lens uses bounded 768px RGB working previews; full-resolution FITS/RAW science processing is not claimed. No model or PSNR/SSIM score can guarantee that every faint feature survives. Account-synced galleries and Honor journals require the separate authentication work; the functional current Honor journal stays device-local.
