import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy for Browser-Local Label Calibration",
  description:
    "Privacy notes for Label Alignment Tool: no file upload, no artwork parsing, safe analytics events only, and local label sheet measurements.",
  alternates: {
    canonical: "/privacy"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function PrivacyPage() {
  return (
    <main className="contentShell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="/">
          <span>Label Alignment Tool</span>
        </a>
        <div className="navlinks">
          <a href="/">Calibrator</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>
      <article className="contentPage">
        <p className="eyebrow">Privacy</p>
        <h1>Browser-local label calibration</h1>
        <p>
          The calibrator does not upload artwork, PDFs, label images, customer addresses, or custom
          product data. Measurements are processed in the browser to generate the visible grid and
          checklist.
        </p>
        <section>
          <h2>Analytics boundary</h2>
          <p>
            If analytics are enabled, events use safe buckets such as selected preset, symptom type,
            result type, unit, and whether a custom sheet was used. Raw dimensions, copied checklist
            text, artwork, and contact messages are not sent through analytics events.
          </p>
        </section>
        <section>
          <h2>Contact data</h2>
          <p>
            Messages sent by email are handled by the user&apos;s email provider and our receiving mailbox.
            Please do not send customer addresses, order data, or private artwork unless it has been
            sanitized first.
          </p>
        </section>
      </article>
    </main>
  );
}
