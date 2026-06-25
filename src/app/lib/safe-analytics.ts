"use client";

type SafeEventName =
  | "core_submit"
  | "core_success"
  | "preset_selected"
  | "custom_sheet_started"
  | "symptom_selected"
  | "calibration_generated"
  | "offset_calculated"
  | "copy_report"
  | "copy_checklist"
  | "sample_loaded"
  | "download_report"
  | "download_or_print_grid"
  | "core_error";

type SafeParams = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

const allowedKeys = new Set([
  "preset",
  "custom_sheet_used",
  "symptom_type",
  "result_type",
  "unit",
  "has_offset",
  "error_type",
  "tool",
  "symbology",
  "barcode_status",
  "sample_type",
  "label_status",
  "label_count_bucket",
  "template_type",
  "has_date_field",
]);

export function trackSafeEvent(name: SafeEventName, params: SafeParams = {}) {
  const safeParams = Object.fromEntries(
    Object.entries(params).filter(([key]) => allowedKeys.has(key))
  );

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, safeParams);
  }

  if (typeof window !== "undefined" && window.clarity) {
    window.clarity("event", name);
  }
}
