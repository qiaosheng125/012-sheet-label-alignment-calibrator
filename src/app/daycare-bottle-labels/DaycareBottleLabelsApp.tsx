"use client";

import {
  Baby,
  CheckCircle2,
  ClipboardCopy,
  Grid3X3,
  Printer,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  analyzeDaycareLabels,
  daycareSamples,
  daycareTemplateLabels,
  type DaycareLabelInput,
  type DaycareTemplate,
} from "../lib/daycare-labels";
import { trackSafeEvent } from "../lib/safe-analytics";

const initialInput: DaycareLabelInput = daycareSamples.infantBottleDay;

const templateOptions: Array<{ value: DaycareTemplate; label: string }> = [
  { value: "address_30", label: "30-up address" },
  { value: "round_12", label: "2 in round" },
  { value: "large_10", label: "Large write-on" },
];

function fieldValue(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}

function bucketLabels(count: number) {
  if (count <= 12) return "1_12";
  if (count <= 30) return "13_30";
  if (count <= 60) return "31_60";
  return "61_plus";
}

export default function DaycareBottleLabelsApp() {
  const [input, setInput] = useState<DaycareLabelInput>(initialInput);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const result = useMemo(() => analyzeDaycareLabels(input), [input]);

  function setNumber(key: keyof Pick<DaycareLabelInput, "bottles" | "cups" | "foodContainers" | "spareClothes" | "backupLabels">, value: string) {
    const nextInput = { ...input, [key]: Number(value) };
    const nextResult = analyzeDaycareLabels(nextInput);
    setInput(nextInput);
    trackSafeEvent("core_submit", {
      tool: "daycare_bottle_labels",
      label_status: nextResult.status,
      label_count_bucket: bucketLabels(nextResult.totalLabels),
      template_type: nextInput.template,
      has_date_field: nextInput.includeDateField,
    });
  }

  function setTemplate(template: DaycareTemplate) {
    const nextInput = { ...input, template };
    const nextResult = analyzeDaycareLabels(nextInput);
    setInput(nextInput);
    trackSafeEvent("core_submit", {
      tool: "daycare_bottle_labels",
      label_status: nextResult.status,
      label_count_bucket: bucketLabels(nextResult.totalLabels),
      template_type: template,
      has_date_field: nextInput.includeDateField,
    });
  }

  function setFlag(key: keyof Pick<
    DaycareLabelInput,
    "includeDateField" | "includeContentsField" | "includeAmountField" | "includePreparedTimeField" | "includeRoomField"
  >) {
    const nextInput = { ...input, [key]: !input[key] };
    const nextResult = analyzeDaycareLabels(nextInput);
    setInput(nextInput);
    trackSafeEvent("core_submit", {
      tool: "daycare_bottle_labels",
      label_status: nextResult.status,
      label_count_bucket: bucketLabels(nextResult.totalLabels),
      template_type: nextInput.template,
      has_date_field: nextInput.includeDateField,
    });
  }

  function loadSample(sampleKey: keyof typeof daycareSamples) {
    const sample = daycareSamples[sampleKey];
    const nextResult = analyzeDaycareLabels(sample);
    setInput(sample);
    trackSafeEvent("sample_loaded", {
      tool: "daycare_bottle_labels",
      sample_type: sampleKey,
      label_status: nextResult.status,
      label_count_bucket: bucketLabels(nextResult.totalLabels),
      template_type: sample.template,
      has_date_field: sample.includeDateField,
    });
  }

  async function copyChecklist() {
    let didCopy = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(result.report);
        didCopy = true;
      } catch {
        trackSafeEvent("core_error", { error_type: "clipboard_permission", tool: "daycare_bottle_labels" });
      }
    }
    if (!didCopy) {
      const fallback = document.createElement("textarea");
      fallback.value = result.report;
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
      window.setTimeout(() => setCopyStatus("idle"), 1800);
      return;
    }

    setCopyStatus("copied");
    trackSafeEvent("copy_checklist", {
      tool: "daycare_bottle_labels",
      label_status: result.status,
      label_count_bucket: bucketLabels(result.totalLabels),
      template_type: input.template,
      has_date_field: input.includeDateField,
    });
    trackSafeEvent("core_success", {
      tool: "daycare_bottle_labels",
      label_status: result.status,
      label_count_bucket: bucketLabels(result.totalLabels),
      template_type: input.template,
      has_date_field: input.includeDateField,
    });
    window.setTimeout(() => setCopyStatus("idle"), 1600);
  }

  return (
    <main className="shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="/">
          <Tags aria-hidden="true" />
          <span>Label Alignment Tool</span>
        </a>
        <div className="navlinks">
          <a href="/">Alignment grid</a>
          <a href="/barcode-print-check">Barcode check</a>
          <a href="/daycare-bottle-labels">Daycare labels</a>
          <a href="/privacy">Privacy</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>

      <section className="workspace barcodeWorkspace">
        <div className="intro">
          <p className="eyebrow">Daycare bottle labels</p>
          <h1>Plan printable bottle labels and a drop-off checklist.</h1>
          <p>
            Estimate label counts, sheet count, write-in fields, and a plain-paper
            test for daycare bottle, cup, container, and spare-clothing labels.
            Do not enter a real child name or sensitive daycare details.
          </p>
          <div className="trustRow" aria-label="Safety notes">
            <span><ShieldCheck aria-hidden="true" /> No child name</span>
            <span><Printer aria-hidden="true" /> Plain-paper test first</span>
            <span><Grid3X3 aria-hidden="true" /> Printable sheet plan</span>
          </div>
        </div>

        <div className="barcodeDesk daycareDesk">
          <section className="stepBlock barcodeInputPanel" aria-label="Daycare label setup">
            <div className="stepTitle">
              <Baby aria-hidden="true" />
              <div>
                <h2>1. Choose a printable label sheet</h2>
                <p>Use generic counts only. Keep names, allergies, medical notes, and room assignments out of this tool.</p>
              </div>
            </div>

            <label>
              <span>Template</span>
              <select value={input.template} onChange={(event) => setTemplate(event.target.value as DaycareTemplate)}>
                {templateOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="fieldGrid">
              <NumberField label="Bottles" value={input.bottles} onChange={(value) => setNumber("bottles", value)} />
              <NumberField label="Cups" value={input.cups} onChange={(value) => setNumber("cups", value)} />
              <NumberField label="Food containers" value={input.foodContainers} onChange={(value) => setNumber("foodContainers", value)} />
              <NumberField label="Spare clothes" value={input.spareClothes} onChange={(value) => setNumber("spareClothes", value)} />
              <NumberField label="Backup labels" value={input.backupLabels} onChange={(value) => setNumber("backupLabels", value)} />
            </div>

            <div className="daycareToggleGrid" aria-label="Write-in fields">
              <Toggle label="Date" active={input.includeDateField} onClick={() => setFlag("includeDateField")} />
              <Toggle label="Contents" active={input.includeContentsField} onClick={() => setFlag("includeContentsField")} />
              <Toggle label="Amount" active={input.includeAmountField} onClick={() => setFlag("includeAmountField")} />
              <Toggle label="Prepared time" active={input.includePreparedTimeField} onClick={() => setFlag("includePreparedTimeField")} />
              <Toggle label="Room/group" active={input.includeRoomField} onClick={() => setFlag("includeRoomField")} />
            </div>

            <div className="sampleButtons" aria-label="Load sample daycare label cases">
              <button type="button" onClick={() => loadSample("infantBottleDay")}>Infant bottles</button>
              <button type="button" onClick={() => loadSample("toddlerCupDay")}>Toddler cups</button>
              <button type="button" onClick={() => loadSample("missingFields")}>Missing fields</button>
            </div>
          </section>

          <section className={`resultPanel barcodeResultPanel daycareResultPanel ${result.status}`} aria-label="Daycare label checklist result">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Printable label plan</p>
                <h2>{result.title}</h2>
              </div>
              {result.status === "ready" ? <CheckCircle2 aria-hidden="true" /> : <Baby aria-hidden="true" />}
            </div>

            <div className="statusStrip">
              <strong>{statusLabel(result.status)}</strong>
              <span>{result.warnings.length} warnings</span>
            </div>

            <div className="metricGrid">
              <div>
                <Tags aria-hidden="true" />
                <span>Total labels</span>
                <strong>{result.totalLabels}</strong>
              </div>
              <div>
                <Grid3X3 aria-hidden="true" />
                <span>Sheets needed</span>
                <strong>{result.sheetsNeeded}</strong>
              </div>
              <div>
                <Printer aria-hidden="true" />
                <span>Labels per sheet</span>
                <strong>{result.labelsPerSheet}</strong>
              </div>
              <div>
                <Baby aria-hidden="true" />
                <span>Write-in fields</span>
                <strong>{result.fieldCount}</strong>
              </div>
            </div>

            <div className="findingGrid">
              <div>
                <h3>Warnings</h3>
                {result.warnings.length ? (
                  <ul>{result.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : (
                  <p>No blocking label-sheet issue from these generic counts.</p>
                )}
              </div>
              <div>
                <h3>Privacy boundary</h3>
                <ul>{result.privacyNotes.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>

            <div className="barcodeChecklist">
              <h3>Drop-off print checklist</h3>
              <ol>
                {result.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <p className="fieldHint">
                Template: {daycareTemplateLabels[input.template]}. This is a label sheet and drop-off checklist, not daycare compliance advice.
              </p>
              <button className="primaryButton" type="button" onClick={copyChecklist}>
                <ClipboardCopy aria-hidden="true" />
                {copyStatus === "copied" ? "Checklist copied" : copyStatus === "failed" ? "Copy failed" : "Copy checklist"}
              </button>
            </div>
          </section>
        </div>

        <section className="supportBand" aria-label="Daycare label check notes">
          <div>
            <h2>What this module checks</h2>
            <p>
              It plans printable label quantity, sheet count, write-in field crowding,
              backup labels, and the plain-paper alignment step.
            </p>
          </div>
          <div className="methodGrid">
            <div>
              <strong>Good for</strong>
              <span>Reusable daycare bottle labels, cup labels, food containers, spare clothing bags, and backup blanks.</span>
            </div>
            <div>
              <strong>Not collected</strong>
              <span>No child name, birth date, allergy, medication, classroom, daycare account, or private schedule.</span>
            </div>
            <div>
              <strong>Not advice</strong>
              <span>No feeding, storage, medical, or daycare compliance recommendation is provided.</span>
            </div>
            <div>
              <strong>Related tool</strong>
              <span>Use the alignment grid if labels print high, low, left, or right on the sheet.</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input type="number" min="0" step="1" value={fieldValue(value)} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "active" : ""} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

function statusLabel(status: "ready" | "review" | "fix") {
  if (status === "ready") return "Ready";
  if (status === "review") return "Review";
  return "Fix";
}
