export type DaycareTemplate = "address_30" | "round_12" | "large_10";

export type DaycareLabelInput = {
  template: DaycareTemplate;
  bottles: number;
  cups: number;
  foodContainers: number;
  spareClothes: number;
  backupLabels: number;
  includeDateField: boolean;
  includeContentsField: boolean;
  includeAmountField: boolean;
  includePreparedTimeField: boolean;
  includeRoomField: boolean;
};

export type DaycareLabelResult = {
  status: "ready" | "review" | "fix";
  title: string;
  totalLabels: number;
  sheetsNeeded: number;
  labelsPerSheet: number;
  fieldCount: number;
  warnings: string[];
  checklist: string[];
  privacyNotes: string[];
  report: string;
};

export const daycareTemplateLabels: Record<DaycareTemplate, string> = {
  address_30: "30-up address labels",
  round_12: "2 in round labels",
  large_10: "Large write-on labels"
};

export const daycareLabelsPerSheet: Record<DaycareTemplate, number> = {
  address_30: 30,
  round_12: 12,
  large_10: 10
};

export const daycareSamples: Record<string, DaycareLabelInput> = {
  infantBottleDay: {
    template: "address_30",
    bottles: 4,
    cups: 1,
    foodContainers: 2,
    spareClothes: 2,
    backupLabels: 6,
    includeDateField: true,
    includeContentsField: true,
    includeAmountField: true,
    includePreparedTimeField: true,
    includeRoomField: false
  },
  toddlerCupDay: {
    template: "round_12",
    bottles: 0,
    cups: 3,
    foodContainers: 3,
    spareClothes: 1,
    backupLabels: 2,
    includeDateField: true,
    includeContentsField: true,
    includeAmountField: false,
    includePreparedTimeField: false,
    includeRoomField: true
  },
  missingFields: {
    template: "round_12",
    bottles: 5,
    cups: 2,
    foodContainers: 2,
    spareClothes: 0,
    backupLabels: 0,
    includeDateField: false,
    includeContentsField: true,
    includeAmountField: true,
    includePreparedTimeField: true,
    includeRoomField: true
  }
};

export function analyzeDaycareLabels(input: DaycareLabelInput): DaycareLabelResult {
  const bottles = clampCount(input.bottles);
  const cups = clampCount(input.cups);
  const foodContainers = clampCount(input.foodContainers);
  const spareClothes = clampCount(input.spareClothes);
  const backupLabels = clampCount(input.backupLabels);
  const labelsPerSheet = daycareLabelsPerSheet[input.template];
  const totalLabels = bottles + cups + foodContainers + spareClothes + backupLabels;
  const sheetsNeeded = Math.max(1, Math.ceil(totalLabels / labelsPerSheet));
  const fieldCount = [
    input.includeDateField,
    input.includeContentsField,
    input.includeAmountField,
    input.includePreparedTimeField,
    input.includeRoomField
  ].filter(Boolean).length;
  const warnings = buildWarnings(input, {
    bottles,
    totalLabels,
    backupLabels,
    fieldCount
  });
  const status = warnings.some((warning) => warning.startsWith("Fix:"))
    ? "fix"
    : warnings.length > 0
      ? "review"
      : "ready";
  const title =
    status === "ready"
      ? "Printable daycare label plan is ready for a sheet test."
      : status === "review"
        ? "Review the label fields before printing the sheet."
        : "Fix the missing label fields before printing.";
  const checklist = [
    `Print ${sheetsNeeded} sheet${sheetsNeeded === 1 ? "" : "s"} of ${daycareTemplateLabels[input.template]}.`,
    "Run one plain-paper alignment check before using waterproof or writable label stock.",
    "Use placeholder initials or a generic sample name while testing the layout.",
    "Pack a small backup strip of blank labels for hand-written corrections at drop-off.",
    "Ask the daycare for its exact required wording if it has a posted label policy."
  ];
  const privacyNotes = [
    "Do not enter a real child name, birth date, classroom assignment, allergy, medication, or medical note.",
    "This page is a printable label sheet and drop-off checklist only.",
    "It does not provide feeding, storage, medical, or daycare compliance advice."
  ];

  return {
    status,
    title,
    totalLabels,
    sheetsNeeded,
    labelsPerSheet,
    fieldCount,
    warnings,
    checklist,
    privacyNotes,
    report: buildReport({
      status,
      title,
      totalLabels,
      sheetsNeeded,
      labelsPerSheet,
      fieldCount,
      warnings,
      checklist,
      privacyNotes
    })
  };
}

function buildWarnings(
  input: DaycareLabelInput,
  counts: { bottles: number; totalLabels: number; backupLabels: number; fieldCount: number }
) {
  const warnings: string[] = [];

  if (counts.totalLabels <= 0) {
    warnings.push("Fix: add at least one bottle, cup, container, clothing, or backup label.");
  }

  if (counts.bottles > 0 && !input.includeDateField) {
    warnings.push("Fix: bottle labels usually need a visible date field for daily sorting.");
  }

  if ((counts.bottles > 0 || input.foodContainers > 0) && !input.includeContentsField) {
    warnings.push("Review: add a contents field if the item can be confused with another container.");
  }

  if (counts.bottles > 0 && !input.includeAmountField) {
    warnings.push("Review: bottle labels are easier to check when the amount field is available.");
  }

  if (input.template === "round_12" && counts.fieldCount > 3) {
    warnings.push("Review: 2 inch round labels can become crowded with more than three write-in fields.");
  }

  if (counts.backupLabels < 2 && counts.totalLabels >= 6) {
    warnings.push("Review: print at least two backup labels for day-of changes.");
  }

  return warnings;
}

function buildReport(result: Omit<DaycareLabelResult, "report">) {
  return [
    "Daycare bottle labels printable checklist",
    `Status: ${result.status}`,
    `Result: ${result.title}`,
    `Total labels: ${result.totalLabels}`,
    `Sheets needed: ${result.sheetsNeeded}`,
    `Labels per sheet: ${result.labelsPerSheet}`,
    `Write-in field count: ${result.fieldCount}`,
    "",
    "Warnings:",
    ...formatBullets(result.warnings),
    "",
    "Drop-off print checklist:",
    ...formatBullets(result.checklist),
    "",
    "Privacy and scope:",
    ...formatBullets(result.privacyNotes)
  ].join("\n");
}

function clampCount(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(99, Math.floor(value));
}

function formatBullets(values: string[]) {
  return values.length > 0 ? values.map((value) => `- ${value}`) : ["- none"];
}
