"use client";

import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  ClipboardCopy,
  Gauge,
  Printer,
  Ruler,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  barcodeSamples,
  runBarcodePreflight,
  symbologyLabel,
  type BarcodeInput,
  type Symbology,
} from "../lib/barcode-preflight";
import { trackSafeEvent } from "../lib/safe-analytics";

const initialInput: BarcodeInput = barcodeSamples.quietZoneFail;

function fieldValue(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}

function statusLabel(status: "pass" | "warn" | "fail") {
  if (status === "pass") return "Pass";
  if (status === "warn") return "Warn";
  return "Fail";
}

export default function BarcodePrintCheckApp() {
  const [input, setInput] = useState<BarcodeInput>(initialInput);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const result = useMemo(() => runBarcodePreflight(input), [input]);

  function setNumber(key: keyof BarcodeInput, value: string) {
    setInput((current) => ({ ...current, [key]: Number(value) }));
    trackSafeEvent("core_submit", {
      tool: "barcode_print_check",
      symbology: input.symbology,
      barcode_status: result.status,
    });
  }

  function setSymbology(value: Symbology) {
    setInput((current) => ({ ...current, symbology: value }));
    trackSafeEvent("core_submit", {
      tool: "barcode_print_check",
      symbology: value,
      barcode_status: result.status,
    });
  }

  function loadSample(sampleKey: keyof typeof barcodeSamples) {
    const sample = barcodeSamples[sampleKey];
    setInput(sample);
    trackSafeEvent("sample_loaded", {
      tool: "barcode_print_check",
      sample_type: sampleKey,
      symbology: sample.symbology,
    });
  }

  const report = [
    "Barcode print check",
    `Symbology: ${symbologyLabel(input.symbology)}`,
    `Result: ${statusLabel(result.status)} - ${result.title}`,
    "",
    "Measurements:",
    `- Left quiet zone minimum: ${result.measurements.leftQuietMinMm} mm`,
    `- Right quiet zone minimum: ${result.measurements.rightQuietMinMm} mm`,
    `- Total width needed: ${result.measurements.totalWidthNeededMm} mm`,
    `- X-dimension dots: ${result.measurements.xDimensionDots}`,
    "",
    "Issues:",
    ...(result.issues.length ? result.issues.map((item) => `- ${item}`) : ["- None"]),
    "",
    "Warnings:",
    ...(result.warnings.length ? result.warnings.map((item) => `- ${item}`) : ["- None"]),
    "",
    "Reprint checklist:",
    ...result.checklist.map((item) => `- ${item}`),
  ].join("\n");

  async function copyChecklist() {
    let didCopy = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(report);
        didCopy = true;
      } catch {
        trackSafeEvent("core_error", { error_type: "clipboard_permission", tool: "barcode_print_check" });
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
      window.setTimeout(() => setCopyStatus("idle"), 1800);
      return;
    }

    setCopyStatus("copied");
    trackSafeEvent("copy_checklist", {
      tool: "barcode_print_check",
      symbology: input.symbology,
      barcode_status: result.status,
    });
    trackSafeEvent("core_success", {
      tool: "barcode_print_check",
      symbology: input.symbology,
      barcode_status: result.status,
    });
    window.setTimeout(() => setCopyStatus("idle"), 1600);
  }

  return (
    <main className="shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="/">
          <Barcode aria-hidden="true" />
          <span>Label Alignment Tool</span>
        </a>
        <div className="navlinks">
          <a href="/">Alignment grid</a>
          <a href="/barcode-print-check">Barcode check</a>
          <a href="/daycare-bottle-labels">Daycare labels</a>
          <a href="/about">About</a>
          <a href="/privacy">Privacy</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>

      <section className="workspace barcodeWorkspace">
        <div className="intro">
          <p className="eyebrow">Barcode label print check</p>
          <h1>Check barcode label size before you print a batch.</h1>
          <p>
            Estimate quiet-zone, DPI, X-dimension, and label-fit risks for Code 128, UPC-A, and EAN-13 labels.
            This is a local print-risk checklist, not a barcode verifier or certification tool.
          </p>
          <div className="trustRow" aria-label="Safety notes">
            <span><ShieldCheck aria-hidden="true" /> No upload</span>
            <span><Printer aria-hidden="true" /> One-label test first</span>
            <span><Gauge aria-hidden="true" /> DPI and quiet-zone checks</span>
          </div>
        </div>

        <div className="barcodeDesk">
          <section className="stepBlock barcodeInputPanel" aria-label="Barcode label setup">
            <div className="stepTitle">
              <Printer aria-hidden="true" />
              <div>
                <h2>1. Enter the printed label geometry</h2>
                <p>Use millimeters from your label template or barcode export settings.</p>
              </div>
            </div>

            <label>
              <span>Barcode type</span>
              <select value={input.symbology} onChange={(event) => setSymbology(event.target.value as Symbology)}>
                <option value="code128">Code 128</option>
                <option value="upca">UPC-A</option>
                <option value="ean13">EAN-13</option>
              </select>
            </label>

            <div className="fieldGrid">
              <label>
                <span>Label width mm</span>
                <input type="number" min="0" step="0.1" value={fieldValue(input.labelWidthMm)} onChange={(event) => setNumber("labelWidthMm", event.target.value)} />
              </label>
              <label>
                <span>Label height mm</span>
                <input type="number" min="0" step="0.1" value={fieldValue(input.labelHeightMm)} onChange={(event) => setNumber("labelHeightMm", event.target.value)} />
              </label>
              <label>
                <span>Barcode width mm</span>
                <input type="number" min="0" step="0.1" value={fieldValue(input.symbolWidthMm)} onChange={(event) => setNumber("symbolWidthMm", event.target.value)} />
              </label>
              <label>
                <span>Barcode height mm</span>
                <input type="number" min="0" step="0.1" value={fieldValue(input.symbolHeightMm)} onChange={(event) => setNumber("symbolHeightMm", event.target.value)} />
              </label>
              <label>
                <span>X-dimension mm</span>
                <input type="number" min="0" step="0.01" value={fieldValue(input.xDimensionMm)} onChange={(event) => setNumber("xDimensionMm", event.target.value)} />
              </label>
              <label>
                <span>Printer DPI</span>
                <input type="number" min="0" step="1" value={fieldValue(input.printerDpi)} onChange={(event) => setNumber("printerDpi", event.target.value)} />
              </label>
              <label>
                <span>Left quiet zone mm</span>
                <input type="number" min="0" step="0.1" value={fieldValue(input.quietLeftMm)} onChange={(event) => setNumber("quietLeftMm", event.target.value)} />
              </label>
              <label>
                <span>Right quiet zone mm</span>
                <input type="number" min="0" step="0.1" value={fieldValue(input.quietRightMm)} onChange={(event) => setNumber("quietRightMm", event.target.value)} />
              </label>
            </div>

            <div className="sampleButtons" aria-label="Load sample barcode label cases">
              <button type="button" onClick={() => loadSample("quietZoneFail")}>Quiet-zone fail</button>
              <button type="button" onClick={() => loadSample("retailPass")}>Retail pass</button>
              <button type="button" onClick={() => loadSample("dpiRisk")}>203 DPI risk</button>
            </div>
          </section>

          <section className={`resultPanel barcodeResultPanel ${result.status}`} aria-label="Barcode print risk result">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Print risk report</p>
                <h2>{result.title}</h2>
              </div>
              {result.status === "pass" ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
            </div>

            <div className="statusStrip">
              <strong>{statusLabel(result.status)}</strong>
              <span>{result.issues.length} issues · {result.warnings.length} warnings</span>
            </div>

            <div className="metricGrid">
              <div>
                <Ruler aria-hidden="true" />
                <span>Left quiet min</span>
                <strong>{result.measurements.leftQuietMinMm} mm</strong>
              </div>
              <div>
                <Ruler aria-hidden="true" />
                <span>Right quiet min</span>
                <strong>{result.measurements.rightQuietMinMm} mm</strong>
              </div>
              <div>
                <Gauge aria-hidden="true" />
                <span>Width needed</span>
                <strong>{result.measurements.totalWidthNeededMm} mm</strong>
              </div>
              <div>
                <Printer aria-hidden="true" />
                <span>X dots</span>
                <strong>{result.measurements.xDimensionDots}</strong>
              </div>
            </div>

            <div className="findingGrid">
              <div>
                <h3>Issues</h3>
                {result.issues.length ? (
                  <ul>{result.issues.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : (
                  <p>No blocking print-risk issue from these inputs.</p>
                )}
              </div>
              <div>
                <h3>Warnings</h3>
                {result.warnings.length ? (
                  <ul>{result.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : (
                  <p>No extra warning from these inputs.</p>
                )}
              </div>
            </div>

            <div className="barcodeChecklist">
              <h3>Reprint checklist</h3>
              <ol>
                {result.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <button className="primaryButton" type="button" onClick={copyChecklist}>
                <ClipboardCopy aria-hidden="true" />
                {copyStatus === "copied" ? "Checklist copied" : copyStatus === "failed" ? "Copy failed" : "Copy checklist"}
              </button>
            </div>
          </section>
        </div>

        <section className="supportBand" aria-label="Barcode print check notes">
          <div>
            <h2>What this module checks</h2>
            <p>
              It catches common barcode label print risks before you run a batch: squeezed quiet zones,
              too-narrow bars at the selected DPI, and barcodes that no longer fit the label width.
            </p>
          </div>
          <div className="methodGrid">
            <div>
              <strong>Good for</strong>
              <span>Shopify, Etsy, POS, inventory, UPC, EAN, and Code 128 print setup checks.</span>
            </div>
            <div>
              <strong>Not a verifier</strong>
              <span>Retailer compliance and ISO grading require a hardware barcode verifier.</span>
            </div>
            <div>
              <strong>Still local</strong>
              <span>No barcode image upload, no scanner access, and no stored label data.</span>
            </div>
            <div>
              <strong>Related labels</strong>
              <span>Use daycare bottle labels for printable drop-off sheets and backup blank labels.</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
