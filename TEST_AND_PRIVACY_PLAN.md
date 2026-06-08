# Test And Privacy Plan

## Required Local Commands

```powershell
npm run build
$env:BASE_URL='http://127.0.0.1:3012'; npm run smoke
$env:BASE_URL='http://127.0.0.1:3012'; $env:CANONICAL_BASE_URL='https://labelalignmenttool.com'; npm run seo-preflight
$env:BASE_URL='http://127.0.0.1:3012'; npm run privacy-smoke
```

Observed 2026-06-08:

- Build passed.
- Local smoke passed.
- Local SEO preflight passed with canonical target `https://labelalignmenttool.com`.
- Local privacy smoke passed.

## Temporary Vercel URL Checks

```powershell
$env:BASE_URL='https://012sheet-label-alignment-calibrator.vercel.app'; npm run smoke
$env:BASE_URL='https://012sheet-label-alignment-calibrator.vercel.app'; $env:CANONICAL_BASE_URL='https://labelalignmenttool.com'; npm run seo-preflight
$env:BASE_URL='https://012sheet-label-alignment-calibrator.vercel.app'; npm run privacy-smoke
```

Observed 2026-06-08:

- Temporary Vercel production smoke passed.
- Temporary Vercel production SEO preflight passed.
- Temporary Vercel production privacy smoke passed.

## Custom Domain Checks After Purchase

Target URLs after Cloudflare DNS and Vercel custom domain are configured:

```powershell
$env:BASE_URL='https://labelalignmenttool.com'; npm run smoke
$env:BASE_URL='https://labelalignmenttool.com'; $env:CANONICAL_BASE_URL='https://labelalignmenttool.com'; npm run seo-preflight
$env:BASE_URL='https://labelalignmenttool.com'; npm run privacy-smoke
```

Manual items after domain purchase:

- Add Vercel custom domain for `labelalignmenttool.com`.
- Configure Cloudflare DNS to Vercel as instructed by Vercel.
- Configure Cloudflare Email Routing for `support@labelalignmenttool.com`.
- Configure GSC and Bing site/sitemap submissions.
- Create GA4 property/data stream and Clarity project, then provide the two IDs for Vercel env setup.

## Manual Visual Checks

- Desktop: 1440 x 1100 full-page screenshot.
- Mobile: 390 x 1200 full-page screenshot.
- Verify the title, preset buttons, symptom buttons, drift inputs, grid preview, result panel, checklist, and support band do not overlap.

## Privacy Smoke Scope

The privacy smoke test:

- opens the calibrator
- selects a 2 inch round preset
- selects row drift
- verifies the no-single-offset result state
- clicks copy checklist
- checks for unexpected external requests
- checks that old sample tokens and raw geometry tokens do not appear in browser storage
- verifies privacy copy remains visible
