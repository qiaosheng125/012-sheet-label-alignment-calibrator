import type { Metadata } from "next";
import { supportEmail } from "../site";

export const metadata: Metadata = {
  title: "Contact Label Alignment Tool",
  description:
    "Send sanitized feedback about label sheet alignment presets, printer drift symptoms, and calibration workflow issues.",
  alternates: {
    canonical: "/contact"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function ContactPage() {
  return (
    <main className="contentShell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="/">
          <span>Label Alignment Tool</span>
        </a>
        <div className="navlinks">
          <a href="/">Calibrator</a>
          <a href="/barcode-print-check">Barcode check</a>
          <a href="/about">About</a>
          <a href="/privacy">Privacy</a>
        </div>
      </nav>
      <article className="contentPage">
        <p className="eyebrow">Contact</p>
        <h1>Send sanitized label alignment feedback</h1>
        <p>
          Use email for preset requests, printer workflow issues, and wording problems in the checklist.
          Keep examples sanitized: printer model, label layout, symptom pattern, and measured drift are
          enough for most reports.
        </p>
        <a className="mailButton" href={`mailto:${supportEmail}`}>
          {supportEmail}
        </a>
      </article>
    </main>
  );
}
