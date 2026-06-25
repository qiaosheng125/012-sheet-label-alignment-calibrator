export type Unit = "in" | "mm";

export type SheetPresetId =
  | "30up-address"
  | "2in-round"
  | "half-sheet"
  | "custom";

export type SymptomType =
  | "global_shift"
  | "round_off_center"
  | "row_drift"
  | "clipped_edge"
  | "label_stock_only";

export type SheetGeometry = {
  pageWidthMm: number;
  pageHeightMm: number;
  rows: number;
  columns: number;
  labelWidthMm: number;
  labelHeightMm: number;
  marginLeftMm: number;
  marginTopMm: number;
  gapHorizontalMm: number;
  gapVerticalMm: number;
};

export type Cell = {
  row: number;
  column: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
};

export type Diagnosis = {
  resultType:
    | "simple_offset"
    | "center_offset"
    | "scale_or_feed_warning"
    | "margin_or_paper_warning"
    | "stock_feed_warning";
  offsetXAdviceMm: number | null;
  offsetYAdviceMm: number | null;
  headline: string;
  summary: string;
  checklist: string[];
};

export const MM_PER_IN = 25.4;
const MAX_ROWS = 60;
const MAX_COLUMNS = 20;
const MAX_CELLS = 600;
const fieldLabels: Partial<Record<keyof SheetGeometry, string>> = {
  labelWidthMm: "Label width",
  labelHeightMm: "Label height",
  marginLeftMm: "Left margin",
  marginTopMm: "Top margin",
  gapHorizontalMm: "Column gap",
  gapVerticalMm: "Row gap",
};

export function toMm(value: number, unit: Unit) {
  return unit === "in" ? value * MM_PER_IN : value;
}

export function fromMm(value: number, unit: Unit) {
  return unit === "in" ? value / MM_PER_IN : value;
}

export const presets: Record<Exclude<SheetPresetId, "custom">, SheetGeometry> = {
  "30up-address": {
    pageWidthMm: 8.5 * MM_PER_IN,
    pageHeightMm: 11 * MM_PER_IN,
    rows: 10,
    columns: 3,
    labelWidthMm: 2.625 * MM_PER_IN,
    labelHeightMm: 1 * MM_PER_IN,
    marginLeftMm: 0.1875 * MM_PER_IN,
    marginTopMm: 0.5 * MM_PER_IN,
    gapHorizontalMm: 0.125 * MM_PER_IN,
    gapVerticalMm: 0,
  },
  "2in-round": {
    pageWidthMm: 8.5 * MM_PER_IN,
    pageHeightMm: 11 * MM_PER_IN,
    rows: 4,
    columns: 3,
    labelWidthMm: 2 * MM_PER_IN,
    labelHeightMm: 2 * MM_PER_IN,
    marginLeftMm: 0.5 * MM_PER_IN,
    marginTopMm: 0.5 * MM_PER_IN,
    gapHorizontalMm: 0.25 * MM_PER_IN,
    gapVerticalMm: 0.25 * MM_PER_IN,
  },
  "half-sheet": {
    pageWidthMm: 8.5 * MM_PER_IN,
    pageHeightMm: 11 * MM_PER_IN,
    rows: 2,
    columns: 1,
    labelWidthMm: 8 * MM_PER_IN,
    labelHeightMm: 5 * MM_PER_IN,
    marginLeftMm: 0.25 * MM_PER_IN,
    marginTopMm: 0.5 * MM_PER_IN,
    gapHorizontalMm: 0,
    gapVerticalMm: 0,
  },
};

export function validateGeometry(sheet: SheetGeometry) {
  const errors: string[] = [];
  if (!Number.isFinite(sheet.pageWidthMm) || sheet.pageWidthMm <= 0) {
    errors.push("Page width must be positive.");
  }
  if (!Number.isFinite(sheet.pageHeightMm) || sheet.pageHeightMm <= 0) {
    errors.push("Page height must be positive.");
  }
  if (!Number.isInteger(sheet.rows) || sheet.rows <= 0) {
    errors.push("Rows must be a positive whole number.");
  } else if (sheet.rows > MAX_ROWS) {
    errors.push(`Rows must be ${MAX_ROWS} or fewer.`);
  }
  if (!Number.isInteger(sheet.columns) || sheet.columns <= 0) {
    errors.push("Columns must be a positive whole number.");
  } else if (sheet.columns > MAX_COLUMNS) {
    errors.push(`Columns must be ${MAX_COLUMNS} or fewer.`);
  }
  if (
    Number.isInteger(sheet.rows) &&
    Number.isInteger(sheet.columns) &&
    sheet.rows > 0 &&
    sheet.columns > 0 &&
    sheet.rows * sheet.columns > MAX_CELLS
  ) {
    errors.push(`Total labels must be ${MAX_CELLS} or fewer.`);
  }
  const positiveFields: Array<keyof SheetGeometry> = ["labelWidthMm", "labelHeightMm"];
  for (const field of positiveFields) {
    if (!Number.isFinite(sheet[field]) || sheet[field] <= 0) {
      errors.push(`${fieldLabels[field]} must be positive.`);
    }
  }
  const numericFields: Array<keyof SheetGeometry> = ["marginLeftMm", "marginTopMm", "gapHorizontalMm", "gapVerticalMm"];
  for (const field of numericFields) {
    if (!Number.isFinite(sheet[field]) || sheet[field] < 0) {
      errors.push(`${fieldLabels[field]} must be zero or positive.`);
    }
  }

  const usedWidth =
    sheet.marginLeftMm * 2 +
    sheet.columns * sheet.labelWidthMm +
    (sheet.columns - 1) * sheet.gapHorizontalMm;
  const usedHeight =
    sheet.marginTopMm * 2 +
    sheet.rows * sheet.labelHeightMm +
    (sheet.rows - 1) * sheet.gapVerticalMm;

  if (usedWidth > sheet.pageWidthMm + 0.01) {
    errors.push("Label columns do not fit the page width.");
  }
  if (usedHeight > sheet.pageHeightMm + 0.01) {
    errors.push("Label rows do not fit the page height.");
  }

  return { valid: errors.length === 0, errors, usedWidth, usedHeight };
}

export function makeCells(sheet: SheetGeometry): Cell[] {
  return Array.from({ length: sheet.rows * sheet.columns }, (_, index) => {
    const row = Math.floor(index / sheet.columns);
    const column = index % sheet.columns;
    return {
      row: row + 1,
      column: column + 1,
      xMm: sheet.marginLeftMm + column * (sheet.labelWidthMm + sheet.gapHorizontalMm),
      yMm: sheet.marginTopMm + row * (sheet.labelHeightMm + sheet.gapVerticalMm),
      widthMm: sheet.labelWidthMm,
      heightMm: sheet.labelHeightMm,
    };
  });
}

export function diagnose(
  symptom: SymptomType,
  shiftXmm: number,
  shiftYmm: number
): Diagnosis {
  if (symptom === "global_shift") {
    return {
      resultType: "simple_offset",
      offsetXAdviceMm: -shiftXmm,
      offsetYAdviceMm: -shiftYmm,
      headline: "Use a measured template nudge before loading label stock.",
      summary:
        "The whole sheet appears to move together, so a small opposite-direction nudge is the first test.",
      checklist: [
        "Print the calibration grid at 100% or Actual size.",
        "Confirm the paper size matches the label sheet.",
        "Apply the suggested nudge, then repeat on plain paper.",
      ],
    };
  }
  if (symptom === "round_off_center") {
    return {
      resultType: "center_offset",
      offsetXAdviceMm: -shiftXmm,
      offsetYAdviceMm: -shiftYmm,
      headline: "Move the artwork opposite the measured center drift.",
      summary:
        "Round labels expose small center shifts quickly. Test the opposite nudge on plain paper first.",
      checklist: [
        "Use a plain-paper overlay before loading label stock.",
        "Move artwork opposite the measured drift.",
        "Keep important content away from the circular edge.",
      ],
    };
  }
  if (symptom === "row_drift") {
    return {
      resultType: "scale_or_feed_warning",
      offsetXAdviceMm: null,
      offsetYAdviceMm: null,
      headline: "Progressive drift is usually not a one-nudge problem.",
      summary:
        "If lower rows drift more than top rows, scaling, page size, or feed behavior is more likely than one global offset.",
      checklist: [
        "Do not fix progressive drift with one simple offset.",
        "Disable Fit to page or Shrink to printable area.",
        "Recheck paper size, printer scaling, media type, and sheet feed.",
      ],
    };
  }
  if (symptom === "clipped_edge") {
    return {
      resultType: "margin_or_paper_warning",
      offsetXAdviceMm: null,
      offsetYAdviceMm: null,
      headline: "Clipped edges point to paper size, margins, or scaling.",
      summary:
        "A template can be aligned and still clip if the print dialog changes size or printable margins.",
      checklist: [
        "Confirm Letter or A4 is correct.",
        "Disable Fit to page unless the template requires it.",
        "Check printable margins and borderless mode.",
      ],
    };
  }
  return {
    resultType: "stock_feed_warning",
    offsetXAdviceMm: null,
    offsetYAdviceMm: null,
    headline: "When label stock behaves differently, check the feed path.",
    summary:
      "If plain paper aligns but labels do not, stock thickness and feed settings can change the result.",
    checklist: [
      "Set media type to Labels or Heavy paper when available.",
      "Use the recommended tray or manual feed path.",
      "Check sheet curl, tray guides, and stock thickness.",
    ],
  };
}

export function formatMeasurement(valueMm: number, unit: Unit) {
  const value = fromMm(valueMm, unit);
  return `${value >= 0 ? "+" : ""}${value.toFixed(unit === "in" ? 3 : 1)} ${unit}`;
}
