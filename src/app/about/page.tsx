import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Label Alignment Tool",
  description:
    "How Label Alignment Tool helps label sheet users test print drift, sheet offsets, row drift, and label-stock feed problems before using sticker stock.",
  alternates: {
    canonical: "/about"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function AboutPage() {
  return (
    <main className="contentShell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="/">
          <span>Label Alignment Tool</span>
        </a>
        <div className="navlinks">
          <a href="/">Calibrator</a>
          <a href="/privacy">Privacy</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>
      <article className="contentPage">
        <p className="eyebrow">About</p>
        <h1>About Label Alignment Tool</h1>
        <p>
          Label Alignment Tool is a browser-local calibration bench for printable label sheets. It helps
          users turn visible print drift into a plain-paper test plan before loading expensive sticker stock.
        </p>
        <section>
          <h2>What it is built for</h2>
          <p>
            The tool covers common alignment failure patterns: a whole sheet shifted in one direction,
            round labels printing off center, rows drifting more as they move down the page, clipped
            outer edges, and label stock feeding differently than plain paper.
          </p>
        </section>
        <section>
          <h2>What it does not promise</h2>
          <p>
            It cannot guarantee a printer, driver, sheet brand, or tray will behave perfectly. The safest
            workflow is to print the grid at 100% or Actual size, compare it against the label sheet, then
            make one small setting change at a time.
          </p>
        </section>
      </article>
    </main>
  );
}
