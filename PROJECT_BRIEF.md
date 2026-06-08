# Label Alignment Tool - Project Brief

## Positioning

Label Alignment Tool is a browser-local calibration tool for people printing pre-cut label sheets at home or in a small office. It helps users diagnose sheet shift, row drift, clipped edges, and label-stock feed surprises before wasting sticker or address label stock.

## Why This Site Exists

The 012 Round2 opportunity review found repeated external pain around label sheet alignment: official printer adjustment documentation exists, but users still struggle to translate a visible drift into the next test. Community examples include whole-sheet misalignment, candle/product label centering problems, row drift, and label stock behaving differently from plain paper.

## P1 Promise

- Generate a printable label sheet calibration grid in the browser.
- Support common presets and custom sheet geometry.
- Convert measured X/Y drift into a next offset or print-setting test.
- Flag cases where a single offset is unsafe, such as progressive row drift or stock-feed behavior.
- Avoid artwork upload, customer data handling, and raw custom geometry telemetry.

## Explicit Non-Promises

- No guarantee that every printer, driver, tray, or label stock will align perfectly.
- No upload or analysis of private label artwork.
- No automatic printer-driver control.
- No exact clone of a specific label brand template library.
- No trademark-branded product positioning.

## Current Status

- lifecycle: Build, temporary Vercel production deployed
- site_id: 012
- product_name: Label Alignment Tool
- temporary_url: https://012sheet-label-alignment-calibrator.vercel.app
- recommended_domain: labelalignmenttool.com
- canonical_target_before_purchase: https://labelalignmenttool.com
- framework: Next.js static frontend
- core_dependency: none beyond React and lucide-react
- sample_gate: pass, 5/5 core samples and 1/1 guardrail accepted
- vercel_project_id: prj_aZA7e3DGAM8ySL7UxpSchNp2hHmP
- github_repo: https://github.com/qiaosheng125/012-sheet-label-alignment-calibrator

## Source Evidence

- Round2 opportunity card: `01_机会研究/opportunity_cards/2026-06-08_012_external_signal_l0_l2_round2.md`
- L3 review: `01_机会研究/l3_reviews/2026-06-08_012_sheet_label_alignment_calibrator_l3_launch_review.md`
- Risk card: `01_机会研究/risk_cards/risk_012_sheet_label_alignment_calibrator.md`
- Domain card: `01_机会研究/domain_cards/domain_012_sheet_label_alignment_calibrator.md`
- Build gate report: `01_机会研究/sample_packs/sheet_label_alignment_calibrator/build_gate_report.md`
