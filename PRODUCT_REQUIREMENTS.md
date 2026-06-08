# Product Requirements

## Primary User

Home sellers, makers, candle label users, address-label users, and small offices printing pre-cut label sheets on consumer or office printers.

## Core Jobs

1. Choose a common label sheet preset or enter custom sheet geometry.
2. Print a plain-paper calibration grid before loading sticker stock.
3. Select the visible failure pattern.
4. Enter measured X/Y drift.
5. Get a conservative next test: template nudge, settings check, feed-path check, or margin/scaling warning.

## P1 Functional Requirements

- Provide common presets: 30-up address labels, 2 inch round labels, and half-sheet labels.
- Support custom page size, rows, columns, label size, margins, and gaps.
- Support inch and millimeter units.
- Render a proportional label sheet grid with row/column markers.
- Diagnose:
  - whole sheet shifted
  - round labels off center
  - rows drifting down
  - outer edge clipped
  - label stock shifting differently than plain paper
- Produce copyable checklist text.
- Provide a print-grid action.
- Block impossible custom geometry where rows or columns do not fit the page.

## P1 Non-Functional Requirements

- No file upload.
- No account, payment, waitlist, affiliate flow, or server API.
- Static routes: `/`, `/about`, `/privacy`, `/contact`, `/robots.txt`, `/sitemap.xml`.
- Desktop and mobile layouts must not overlap.
- Analytics must use safe buckets only.
- The product name must remain non-branded and avoid trademark ownership confusion.

## Event Taxonomy

Allowed analytics events:

- `preset_selected`
- `custom_sheet_started`
- `symptom_selected`
- `calibration_generated`
- `offset_calculated`
- `copy_checklist`
- `download_or_print_grid`
- `core_error`

Allowed event parameters:

- `preset`
- `custom_sheet_used`
- `symptom_type`
- `result_type`
- `unit`
- `has_offset`
- `error_type`

## Acceptance Criteria

- `npm run build` passes.
- `npm run smoke` passes locally and on the temporary Vercel URL.
- `npm run seo-preflight` passes with canonical target `https://labelalignmenttool.com`.
- `npm run privacy-smoke` passes locally and on the temporary Vercel URL.
- Manual desktop and mobile screenshots show no obvious overlap or unusable controls.
