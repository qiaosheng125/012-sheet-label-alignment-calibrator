# Technical Design

## Architecture

- Next.js app router static frontend.
- Browser-only calibration logic.
- No API routes.
- No user-uploaded files.
- No storage of custom sheet geometry.

## Core Modules

- `src/app/LabelAlignmentApp.tsx`: UI state, preset/custom sheet controls, diagnosis display, copy and print actions.
- `src/app/lib/calibration.ts`: geometry validation, label-cell generation, unit conversion, and symptom diagnosis.
- `src/app/lib/safe-analytics.ts`: safe event names and allowed analytics parameter keys.
- `scripts/smoke-check.mjs`: route and content smoke checks.
- `scripts/seo-preflight.mjs`: title, description, canonical, robots, and sitemap checks.
- `scripts/privacy-smoke.mjs`: browser-level interaction and privacy leak checks.

## Calibration Logic

The app stores all geometry internally in millimeters. User-facing input can be inch or millimeter. Unit switching converts existing values rather than reinterpreting them.

For a sheet geometry, the validator checks:

- positive page size
- positive integer rows and columns
- non-negative label size, margins, and gaps
- total used width fits page width
- total used height fits page height

For valid sheets, the app generates absolute label cells, then renders them as percentages against the page size.

## Diagnosis Logic

- Whole-sheet shift: recommend an opposite X/Y nudge.
- Round labels off center: recommend an opposite center nudge and safe-edge retest.
- Row drift: warn that scaling, paper size, media type, or feed behavior is more likely than a single offset.
- Clipped edge: warn about paper size, printable margins, borderless mode, and fit-to-page settings.
- Label-stock only shift: warn about media type, tray guides, sheet curl, and feed path.

## Privacy Boundary

The app does not upload or parse artwork, PDFs, customer addresses, orders, or product images. Event parameters are limited to preset names, symptom buckets, result type, unit, and offset presence. Raw custom dimensions and copied report text must not be sent to analytics.

## Known Limits

- The app cannot control printer drivers.
- It cannot prove a label-brand template is exact for every SKU.
- It does not replace physical plain-paper overlay testing.
- Progressive drift diagnosis is intentionally conservative because one global offset can make later rows worse.
