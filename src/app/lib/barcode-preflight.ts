export type Symbology = "code128" | "upca" | "ean13";

export type BarcodeInput = {
  symbology: Symbology;
  valueLength: number;
  labelWidthMm: number;
  labelHeightMm: number;
  symbolWidthMm: number;
  symbolHeightMm: number;
  xDimensionMm: number;
  printerDpi: number;
  quietLeftMm: number;
  quietRightMm: number;
};

export type BarcodeResult = {
  status: "pass" | "warn" | "fail";
  title: string;
  issues: string[];
  warnings: string[];
  measurements: {
    leftQuietMinMm: number;
    rightQuietMinMm: number;
    totalWidthNeededMm: number;
    xDimensionDots: number;
  };
  checklist: string[];
};

const quietZoneX: Record<Symbology, { left: number; right: number; label: string }> = {
  code128: { left: 10, right: 10, label: "Code 128" },
  upca: { left: 9, right: 9, label: "UPC-A" },
  ean13: { left: 11, right: 7, label: "EAN-13" },
};

export const barcodeSamples: Record<string, BarcodeInput> = {
  quietZoneFail: {
    symbology: "code128",
    valueLength: 18,
    labelWidthMm: 38,
    labelHeightMm: 13,
    symbolWidthMm: 34,
    symbolHeightMm: 9,
    xDimensionMm: 0.25,
    printerDpi: 203,
    quietLeftMm: 1,
    quietRightMm: 1,
  },
  retailPass: {
    symbology: "upca",
    valueLength: 12,
    labelWidthMm: 50,
    labelHeightMm: 25,
    symbolWidthMm: 38,
    symbolHeightMm: 22,
    xDimensionMm: 0.33,
    printerDpi: 300,
    quietLeftMm: 4,
    quietRightMm: 4,
  },
  dpiRisk: {
    symbology: "code128",
    valueLength: 12,
    labelWidthMm: 40,
    labelHeightMm: 20,
    symbolWidthMm: 34,
    symbolHeightMm: 14,
    xDimensionMm: 0.15,
    printerDpi: 203,
    quietLeftMm: 2,
    quietRightMm: 2,
  },
};

function dotsForMm(mm: number, dpi: number) {
  return (mm / 25.4) * dpi;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function symbologyLabel(symbology: Symbology) {
  return quietZoneX[symbology].label;
}

export function runBarcodePreflight(input: BarcodeInput): BarcodeResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const required: Array<[keyof BarcodeInput, string]> = [
    ["labelWidthMm", "label width"],
    ["labelHeightMm", "label height"],
    ["symbolWidthMm", "barcode width"],
    ["symbolHeightMm", "barcode height"],
    ["xDimensionMm", "X-dimension"],
    ["printerDpi", "printer DPI"],
    ["quietLeftMm", "left quiet zone"],
    ["quietRightMm", "right quiet zone"],
  ];

  for (const [key, label] of required) {
    if (!Number.isFinite(input[key] as number) || (input[key] as number) <= 0) {
      issues.push(`Enter a ${label} greater than 0.`);
    }
  }

  const rules = quietZoneX[input.symbology];
  if (!rules) {
    issues.push("Choose Code 128, UPC-A, or EAN-13 for this first barcode label check.");
  }

  if (issues.length) {
    return {
      status: "fail",
      title: "More print geometry is needed",
      issues,
      warnings,
      measurements: {
        leftQuietMinMm: 0,
        rightQuietMinMm: 0,
        totalWidthNeededMm: 0,
        xDimensionDots: 0,
      },
      checklist: ["Enter complete label, barcode, quiet-zone, X-dimension, and DPI values before trusting the result."],
    };
  }

  const leftQuietMinMm = rules.left * input.xDimensionMm;
  const rightQuietMinMm = rules.right * input.xDimensionMm;
  const totalWidthNeededMm = input.symbolWidthMm + leftQuietMinMm + rightQuietMinMm;
  const xDimensionDots = dotsForMm(input.xDimensionMm, input.printerDpi);

  if (input.quietLeftMm < leftQuietMinMm) {
    issues.push(`Left quiet zone is ${input.quietLeftMm}mm; estimated minimum is ${round(leftQuietMinMm)}mm.`);
  }
  if (input.quietRightMm < rightQuietMinMm) {
    issues.push(`Right quiet zone is ${input.quietRightMm}mm; estimated minimum is ${round(rightQuietMinMm)}mm.`);
  }
  if (totalWidthNeededMm > input.labelWidthMm) {
    issues.push(`Barcode plus quiet zones needs ${round(totalWidthNeededMm)}mm, but the label is ${input.labelWidthMm}mm wide.`);
  }
  if (input.symbolHeightMm > input.labelHeightMm) {
    issues.push(`Barcode height is ${input.symbolHeightMm}mm, taller than the ${input.labelHeightMm}mm label.`);
  }
  if (xDimensionDots < 2) {
    issues.push(`X-dimension maps to ${round(xDimensionDots)} printer dots at ${input.printerDpi} DPI; bars may print too narrow.`);
  } else if (xDimensionDots < 3) {
    warnings.push(`X-dimension maps to ${round(xDimensionDots)} printer dots; test scan before printing a batch.`);
  }

  if (input.valueLength > 18 && input.symbology === "code128") {
    warnings.push("Long Code 128 values often need wider labels or a larger X-dimension.");
  }

  const status = issues.length ? "fail" : warnings.length ? "warn" : "pass";

  return {
    status,
    title:
      status === "pass"
        ? "Looks ready for a one-label scan test"
        : status === "warn"
          ? "Test scan before printing a batch"
          : "Fix these barcode print risks before wasting labels",
    issues,
    warnings,
    measurements: {
      leftQuietMinMm: round(leftQuietMinMm),
      rightQuietMinMm: round(rightQuietMinMm),
      totalWidthNeededMm: round(totalWidthNeededMm),
      xDimensionDots: round(xDimensionDots),
    },
    checklist: [
      `Use ${quietZoneX[input.symbology].label} with the entered dimensions.`,
      "Print at 100% scale with no fit-to-page resizing.",
      "Keep text, borders, and artwork out of the quiet zones.",
      "Print one label first and scan it with the actual checkout or inventory scanner.",
      "Use a hardware barcode verifier when certification or retailer compliance is required.",
    ],
  };
}
