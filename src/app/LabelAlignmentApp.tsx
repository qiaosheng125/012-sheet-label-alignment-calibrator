"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  Grid3X3,
  Printer,
  Ruler,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  diagnose,
  formatMeasurement,
  fromMm,
  makeCells,
  presets,
  toMm,
  validateGeometry,
  type SheetGeometry,
  type SheetPresetId,
  type SymptomType,
  type Unit,
} from "./lib/calibration";
import { trackSafeEvent } from "./lib/safe-analytics";

const presetOptions: Array<{
  id: SheetPresetId;
  label: string;
  note: string;
}> = [
  { id: "30up-address", label: "30-up address", note: "Letter sheet, 3 x 10 grid" },
  { id: "2in-round", label: "2 in round", note: "Product and candle labels" },
  { id: "half-sheet", label: "Half sheet", note: "Shipping inserts and large labels" },
  { id: "custom", label: "Custom", note: "Enter your sheet dimensions" },
];

const symptoms: Array<{
  id: SymptomType;
  label: string;
  note: string;
}> = [
  {
    id: "global_shift",
    label: "Whole sheet shifted",
    note: "Every label moved the same direction",
  },
  {
    id: "round_off_center",
    label: "Round labels off center",
    note: "Artwork sits high, low, left, or right",
  },
  {
    id: "row_drift",
    label: "Rows drift down",
    note: "Lower rows get worse than top rows",
  },
  {
    id: "clipped_edge",
    label: "Outer edge clipped",
    note: "Labels near an edge are cut off",
  },
  {
    id: "label_stock_only",
    label: "Label stock shifts",
    note: "Plain paper aligns, label stock does not",
  },
];

const customStart = presets["30up-address"];

function numberOrZero(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nudgeDirection(value: number, axis: "x" | "y") {
  if (value === 0) return "no movement";
  if (axis === "x") return value > 0 ? "right" : "left";
  return value > 0 ? "down" : "up";
}

export default function LabelAlignmentApp() {
  const [preset, setPreset] = useState<SheetPresetId>("30up-address");
  const [unit, setUnit] = useState<Unit>("in");
  const [symptom, setSymptom] = useState<SymptomType>("global_shift");
  const [isReady, setIsReady] = useState(false);
  const [shiftX, setShiftX] = useState("0.06");
  const [shiftY, setShiftY] = useState("-0.08");
  const [custom, setCustom] = useState({
    pageWidth: fromMm(customStart.pageWidthMm, "in").toFixed(2),
    pageHeight: fromMm(customStart.pageHeightMm, "in").toFixed(2),
    rows: String(customStart.rows),
    columns: String(customStart.columns),
    labelWidth: fromMm(customStart.labelWidthMm, "in").toFixed(3),
    labelHeight: fromMm(customStart.labelHeightMm, "in").toFixed(3),
    marginLeft: fromMm(customStart.marginLeftMm, "in").toFixed(3),
    marginTop: fromMm(customStart.marginTopMm, "in").toFixed(3),
    gapHorizontal: fromMm(customStart.gapHorizontalMm, "in").toFixed(3),
    gapVertical: fromMm(customStart.gapVerticalMm, "in").toFixed(3),
  });
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const sheet: SheetGeometry = useMemo(() => {
    if (preset !== "custom") return presets[preset];
    return {
      pageWidthMm: toMm(numberOrZero(custom.pageWidth), unit),
      pageHeightMm: toMm(numberOrZero(custom.pageHeight), unit),
      rows: numberOrZero(custom.rows),
      columns: numberOrZero(custom.columns),
      labelWidthMm: toMm(numberOrZero(custom.labelWidth), unit),
      labelHeightMm: toMm(numberOrZero(custom.labelHeight), unit),
      marginLeftMm: toMm(numberOrZero(custom.marginLeft), unit),
      marginTopMm: toMm(numberOrZero(custom.marginTop), unit),
      gapHorizontalMm: toMm(numberOrZero(custom.gapHorizontal), unit),
      gapVerticalMm: toMm(numberOrZero(custom.gapVertical), unit),
    };
  }, [custom, preset, unit]);

  const geometryValidation = useMemo(() => {
    return validateGeometry(sheet);
  }, [sheet]);

  const cells = useMemo(() => {
    if (!geometryValidation.valid) return [];
    return makeCells(sheet);
  }, [geometryValidation.valid, sheet]);

  const shiftXmm = toMm(numberOrZero(shiftX), unit);
  const shiftYmm = toMm(numberOrZero(shiftY), unit);
  const diagnosis = diagnose(symptom, shiftXmm, shiftYmm);
  const presetLabel = presetOptions.find((item) => item.id === preset)?.label || "Custom";

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    trackSafeEvent("calibration_generated", {
      preset,
      custom_sheet_used: preset === "custom",
      symptom_type: symptom,
      result_type: diagnosis.resultType,
      unit,
    });
    if (diagnosis.offsetXAdviceMm !== null || diagnosis.offsetYAdviceMm !== null) {
      trackSafeEvent("offset_calculated", {
        preset,
        custom_sheet_used: preset === "custom",
        symptom_type: symptom,
        result_type: diagnosis.resultType,
        has_offset: true,
        unit,
      });
    }
  }, [diagnosis.offsetXAdviceMm, diagnosis.offsetYAdviceMm, diagnosis.resultType, preset, symptom, unit]);

  const report = [
    `Label alignment check`,
    `Preset: ${presetLabel}`,
    `Symptom: ${symptoms.find((item) => item.id === symptom)?.label}`,
    `Result: ${diagnosis.headline}`,
    diagnosis.offsetXAdviceMm === null
      ? `Offset: no single global nudge recommended`
      : `Suggested X nudge: ${formatMeasurement(diagnosis.offsetXAdviceMm, unit)} (${nudgeDirection(diagnosis.offsetXAdviceMm, "x")})`,
    diagnosis.offsetYAdviceMm === null
      ? `Y nudge: review print settings first`
      : `Suggested Y nudge: ${formatMeasurement(diagnosis.offsetYAdviceMm, unit)} (${nudgeDirection(diagnosis.offsetYAdviceMm, "y")})`,
    `Next test:`,
    ...diagnosis.checklist.map((item) => `- ${item}`),
  ].join("\n");

  function selectPreset(nextPreset: SheetPresetId) {
    setPreset(nextPreset);
    trackSafeEvent("core_submit", {
      preset: nextPreset,
      custom_sheet_used: nextPreset === "custom",
      symptom_type: symptom,
      unit,
    });
    trackSafeEvent("preset_selected", {
      preset: nextPreset,
      custom_sheet_used: nextPreset === "custom",
    });
    if (nextPreset === "custom") {
      trackSafeEvent("custom_sheet_started", { custom_sheet_used: true });
    }
  }

  function selectSymptom(nextSymptom: SymptomType) {
    setSymptom(nextSymptom);
    trackSafeEvent("core_submit", {
      preset,
      custom_sheet_used: preset === "custom",
      symptom_type: nextSymptom,
      unit,
    });
    trackSafeEvent("symptom_selected", { symptom_type: nextSymptom });
  }

  function changeUnit(nextUnit: Unit) {
    if (nextUnit === unit) return;
    const convert = (value: string) => {
      const numeric = numberOrZero(value);
      return fromMm(toMm(numeric, unit), nextUnit).toFixed(nextUnit === "in" ? 3 : 1);
    };
    setCustom((current) => ({
      ...current,
      pageWidth: convert(current.pageWidth),
      pageHeight: convert(current.pageHeight),
      labelWidth: convert(current.labelWidth),
      labelHeight: convert(current.labelHeight),
      marginLeft: convert(current.marginLeft),
      marginTop: convert(current.marginTop),
      gapHorizontal: convert(current.gapHorizontal),
      gapVertical: convert(current.gapVertical),
    }));
    setShiftX(convert(shiftX));
    setShiftY(convert(shiftY));
    setUnit(nextUnit);
  }

  async function copyReport() {
    let didCopy = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(report);
        didCopy = true;
      } catch {
        trackSafeEvent("core_error", { error_type: "clipboard_permission" });
      }
    }
    if (!didCopy) {
      const fallback = document.createElement("textarea");
      fallback.value = report;
      fallback.setAttribute("readonly", "true");
      fallback.style.position = "fixed";
      fallback.style.left = "-9999px";
      document.body.appendChild(fallback);
      fallback.select();
      try {
        didCopy = document.execCommand("copy");
      } catch {
        didCopy = false;
      } finally {
        document.body.removeChild(fallback);
      }
    }
    if (!didCopy) {
      setCopyStatus("failed");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
      return;
    }
    setCopyStatus("copied");
    const eventParams = {
      preset,
      custom_sheet_used: preset === "custom",
      symptom_type: symptom,
      result_type: diagnosis.resultType,
      has_offset: diagnosis.offsetXAdviceMm !== null,
      unit,
    };
    trackSafeEvent("copy_report", eventParams);
    trackSafeEvent("copy_checklist", eventParams);
    trackSafeEvent("core_success", eventParams);
    window.setTimeout(() => setCopyStatus("idle"), 1600);
  }

  function printGrid() {
    const eventParams = {
      preset,
      custom_sheet_used: preset === "custom",
      symptom_type: symptom,
      result_type: diagnosis.resultType,
    };
    trackSafeEvent("download_report", eventParams);
    trackSafeEvent("download_or_print_grid", eventParams);
    trackSafeEvent("core_success", eventParams);
    window.print();
  }

  return (
    <main className="shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="/">
          <Grid3X3 aria-hidden="true" />
          <span>Label Alignment Tool</span>
        </a>
        <div className="navlinks">
          <a href="#calibrator">Calibrator</a>
          <a href="/barcode-print-check">Barcode check</a>
          <a href="/daycare-bottle-labels">Daycare labels</a>
          <a href="/about">About</a>
          <a href="/privacy">Privacy</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>

      <section className="workspace" id="calibrator">
        <div className="intro">
          <p className="eyebrow">Printable sheet calibration</p>
          <h1>Fix labels not lining up before you waste sticker sheets.</h1>
          <p>
            Pick a label sheet, print a plain-paper alignment grid, enter the drift you see, and get the
            next offset or print-setting test without uploading artwork.
          </p>
          <div className="trustRow" aria-label="Safety notes">
            <span><ShieldCheck aria-hidden="true" /> No file upload</span>
            <span><Printer aria-hidden="true" /> Plain-paper test first</span>
            <span><Ruler aria-hidden="true" /> Inch and mm support</span>
          </div>
          <ol className="quickWorkflow" aria-label="How to use Label Alignment Tool">
            <li>
              <strong>Print grid</strong>
              <span>Use plain paper at 100% / Actual size.</span>
            </li>
            <li>
              <strong>Overlay sheet</strong>
              <span>Hold it behind your label stock or compare against the sheet edge.</span>
            </li>
            <li>
              <strong>Measure drift</strong>
              <span>X is left/right. Y is up/down. Right and down are positive.</span>
            </li>
            <li>
              <strong>Run next test</strong>
              <span>Apply the nudge or setting checklist before using sticker stock.</span>
            </li>
          </ol>
          <div className="heroActionRow">
            <button className="primaryButton" type="button" disabled={!isReady} onClick={printGrid}>
              <Printer aria-hidden="true" />
              Print calibration grid
            </button>
            <a className="secondaryButton" href="/barcode-print-check">
              Barcode print check
            </a>
            <a className="secondaryButton" href="/daycare-bottle-labels">
              Daycare labels
            </a>
            <span>Start with plain paper so your label sheets stay unused until the test looks right.</span>
          </div>
        </div>

        <div className="calibrationDesk">
          <section className="controlColumn" aria-label="Calibration controls" aria-busy={!isReady}>
            <div className="stepBlock">
              <div className="stepTitle">
                <Settings2 aria-hidden="true" />
              <div>
                  <h2>1. Choose a label sheet preset</h2>
                  <p>Start with a common printable label layout or enter your own geometry.</p>
                </div>
              </div>
              <div className="presetGrid">
                {presetOptions.map((option) => (
                  <button
                    className={preset === option.id ? "presetButton active" : "presetButton"}
                    key={option.id}
                    type="button"
                    disabled={!isReady}
                    onClick={() => selectPreset(option.id)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.note}</span>
                  </button>
                ))}
              </div>
            </div>

            {preset === "custom" ? (
              <div className="stepBlock customBlock">
                <div className="inlineControl">
                  <span>Units</span>
                  <div className="segmented">
                    {(["in", "mm"] as Unit[]).map((nextUnit) => (
                      <button
                        key={nextUnit}
                        className={unit === nextUnit ? "active" : ""}
                        type="button"
                        disabled={!isReady}
                        onClick={() => changeUnit(nextUnit)}
                      >
                        {nextUnit}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="fieldGrid">
                  {[
                    ["pageWidth", "Page width"],
                    ["pageHeight", "Page height"],
                    ["rows", "Rows"],
                    ["columns", "Columns"],
                    ["labelWidth", "Label width"],
                    ["labelHeight", "Label height"],
                    ["marginLeft", "Left margin"],
                    ["marginTop", "Top margin"],
                    ["gapHorizontal", "Column gap"],
                    ["gapVertical", "Row gap"],
                  ].map(([key, label]) => (
                    <label key={key}>
                      <span>{label}</span>
                      <input
                        value={custom[key as keyof typeof custom]}
                        inputMode="decimal"
                        disabled={!isReady}
                        onChange={(event) =>
                          setCustom((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="stepBlock">
              <div className="stepTitle">
                <AlertTriangle aria-hidden="true" />
                <div>
                  <h2>2. Pick the symptom</h2>
                  <p>The result changes depending on the pattern you see.</p>
                </div>
              </div>
              <div className="symptomList">
                {symptoms.map((item) => (
                  <button
                    className={symptom === item.id ? "symptomButton active" : "symptomButton"}
                    key={item.id}
                    type="button"
                    disabled={!isReady}
                    onClick={() => selectSymptom(item.id)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="stepBlock">
              <div className="stepTitle">
                <Ruler aria-hidden="true" />
                <div>
                  <h2>3. Enter measured drift</h2>
                  <p>Measure how far the printed grid misses the label position. Right/down are positive; left/up are negative.</p>
                </div>
              </div>
              <div className="axisGuide" aria-label="Drift direction guide">
                <span>-X left</span>
                <span>+X right</span>
                <span>-Y up</span>
                <span>+Y down</span>
              </div>
              <div className="measurementRow">
                <label>
                  <span>X drift ({unit})</span>
                  <input value={shiftX} inputMode="decimal" disabled={!isReady} onChange={(event) => setShiftX(event.target.value)} />
                </label>
                <label>
                  <span>Y drift ({unit})</span>
                  <input value={shiftY} inputMode="decimal" disabled={!isReady} onChange={(event) => setShiftY(event.target.value)} />
                </label>
              </div>
              <p className="fieldHint">Example drift values are prefilled. Replace them with your own measurement after printing.</p>
            </div>
          </section>

          <section className="previewColumn" aria-label="Calibration preview and result">
            <div className="sheetPanel">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Calibration sheet</p>
                  <h2>{presetLabel}</h2>
                </div>
                <button className="iconButton" type="button" disabled={!isReady} onClick={printGrid} title="Print calibration grid">
                  <Printer aria-hidden="true" />
                </button>
              </div>

              {geometryValidation.valid ? (
                <div className="sheetWrap">
                  <div
                    className="labelSheet"
                    style={{
                      aspectRatio: `${sheet.pageWidthMm} / ${sheet.pageHeightMm}`,
                    }}
                  >
                    {cells.map((cell) => (
                      <span
                        className="labelCell"
                        key={`${cell.row}-${cell.column}`}
                        style={{
                          left: `${(cell.xMm / sheet.pageWidthMm) * 100}%`,
                          top: `${(cell.yMm / sheet.pageHeightMm) * 100}%`,
                          width: `${(cell.widthMm / sheet.pageWidthMm) * 100}%`,
                          height: `${(cell.heightMm / sheet.pageHeightMm) * 100}%`,
                        }}
                      >
                        {cell.row}.{cell.column}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="errorBox">
                  {geometryValidation.errors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="resultPanel">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Next test</p>
                  <h2>{diagnosis.headline}</h2>
                </div>
                <Sparkles aria-hidden="true" />
              </div>
              <p>{diagnosis.summary}</p>

              <div className="offsetCards">
                <div>
                  <span>X nudge</span>
                  <strong>
                    {diagnosis.offsetXAdviceMm === null
                      ? "Review settings"
                      : formatMeasurement(diagnosis.offsetXAdviceMm, unit)}
                  </strong>
                </div>
                <div>
                  <span>Y nudge</span>
                  <strong>
                    {diagnosis.offsetYAdviceMm === null
                      ? "Review settings"
                      : formatMeasurement(diagnosis.offsetYAdviceMm, unit)}
                  </strong>
                </div>
              </div>

              <ul className="checklist">
                {diagnosis.checklist.map((item) => (
                  <li key={item}>
                    <CheckCircle2 aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="actionRow">
                <button className="primaryButton" type="button" disabled={!isReady} onClick={copyReport}>
                  <ClipboardCopy aria-hidden="true" />
                  {copyStatus === "copied" ? "Checklist copied" : copyStatus === "failed" ? "Copy failed" : "Copy checklist"}
                </button>
                <button className="secondaryButton" type="button" disabled={!isReady} onClick={printGrid}>
                  <Printer aria-hidden="true" />
                  Print grid
                </button>
              </div>
            </div>
          </section>
        </div>

        <section className="supportBand" aria-label="Method notes">
          <div>
            <h2>What this tool checks</h2>
            <p>
              It turns a visible print drift into a next test. It does not upload label
              artwork, read customer data, or control your printer driver.
            </p>
          </div>
          <div className="methodGrid">
            <div>
              <strong>Good for</strong>
              <span>Global shift, round label drift, row drift, clipped edges, label-stock feed surprises.</span>
            </div>
            <div>
              <strong>Barcode labels</strong>
              <span>Use the barcode print check when scan failures may come from quiet zone, DPI, or barcode width.</span>
            </div>
            <div>
              <strong>Daycare labels</strong>
              <span>Plan bottle, cup, food container, clothing, and backup labels without entering child data.</span>
            </div>
            <div>
              <strong>Not a guarantee</strong>
              <span>Printers, paper stock, trays, and drivers vary. Always test on plain paper first.</span>
            </div>
            <div>
              <strong>Private by design</strong>
              <span>No upload and no raw custom geometry in analytics. Use safe buckets only.</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
