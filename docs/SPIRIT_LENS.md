# Spirit Lens — first part

Open `/spirit-lens` through the dashboard navigation. Import a PNG, JPEG, or WebP (up to 12 MB / 24 megapixels), or try the explicitly synthetic star-field demo. Choose Gentle or Balanced, restore, inspect the before/after slider, zoom and pan, and select object overlays. Download the restored PNG and JSON analysis report before leaving the tab.

Processing runs locally in a cancellable web worker using a pinned, hash-verified, MIT-licensed DnCNN model. No API key or image upload to a server is needed. The web dev/build scripts copy runtime assets from the installed ONNX package into `public/onnx`; generated assets are ignored by Git. Model provenance and license are in `apps/web/public/models/dncnn`.

This first part uses 8-bit display previews with a maximum edge of 768 pixels. Transparency is composited onto black. The original file is untouched. Cleanup changes only luminance, bounds channel changes, preserves RGB channel differences, and protects detected candidate regions. This is visual denoising using a general-photo model; it does not establish scientific accuracy or guarantee preservation of faint structures.

Detection uses conventional brightness/shape analysis on the original working preview. Stars and extended sources are candidates without catalogue identifications. Extended sources can include galaxies, nebulae, or blended stars. Reported positions, areas, and brightness use preview pixels and uncalibrated display values. PSNR/SSIM compare with the noisy input; noise and sharpness are estimates.

Optional bounded Richardson–Lucy deblurring is now available after AI denoising. See [completion notes](COMPLETION_NOTES.md) for the PSF controls and validation. Persistent image history/database storage, full-resolution/FITS/RAW support, and validated astronomical classifiers remain later parts.

Validation:

```powershell
pnpm --filter web check-types
pnpm --filter web build
pnpm --filter @repo/database exec tsx --test ../../apps/web/lib/spirit-lens/analysis.test.ts
```
