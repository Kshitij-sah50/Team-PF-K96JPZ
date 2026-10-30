# Judging presentation

- `Tsukuyomi-Watch-Judging-Deck.pptx`: editable 16:9 PowerPoint, 17 slides, speaker notes on every slide.
- `Tsukuyomi-Watch-Judging-Deck.pdf`: portable viewing and offline fallback.
- `READINESS.md`: rubric assessment, requirement mapping, evidence and remaining gaps.
- `DEMO_GUIDE.md`: five-minute script, fallbacks and panel Q&A.
- `test-results.txt`: fresh 28-test transcript.
- `assets/`: actual production screenshots and one synthetic-image browser run's measurements.
- `fixtures/`: small labelled synthetic CSVs for reproducible demonstrations.

Use slides 1–12 for the main presentation, slide 13 for rehearsal and slides 14–17 for technical questions. Main content, diagrams and tables are editable shapes/text. Screenshots are intentionally embedded images of actual UI. The slides do not include secrets or invented user/accuracy claims.

## Rebuild the PowerPoint

Requires Node and `pptxgenjs@4.0.1`. Keep presentation tooling separate from application dependencies:

```powershell
npm install --prefix "$env:TEMP/tsukuyomi-presentation-tools" --no-audit --no-fund pptxgenjs@4.0.1
$env:PPTXGENJS_PATH = Join-Path $env:TEMP 'tsukuyomi-presentation-tools/node_modules/pptxgenjs'
node docs/presentation/build-deck.cjs
```

Optional screenshot refresh requires installed Edge and network access. It uses an isolated temporary browser profile, not the user's signed-in browser. Fresh results can differ; update numeric claims in the deck/report if recapturing:

```powershell
node docs/presentation/capture-demo.mjs
```

On Windows with PowerPoint installed, export the PDF and slide PNG previews in the background:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File docs/presentation/export-deck.ps1
```

Generated `preview/` files are review aids and excluded from Git. Open the PPTX in PowerPoint's Notes view for the talk track. The audit date is 30 October 2026 IST; application source reviewed was `8e07eb7`.

Run `python docs/presentation/verify-deck.py` to check slide/notes counts, package integrity and shape bounds. This supplements visual review; it does not measure text overflow or application test coverage.
