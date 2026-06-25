import type { Metadata } from "next";
import BarcodePrintCheckApp from "./BarcodePrintCheckApp";

export const metadata: Metadata = {
  title: "Barcode Print Check",
  description:
    "Check barcode label quiet zones, X-dimension, DPI, and label-fit risk before printing a batch. Local barcode print preflight for label printers.",
  alternates: {
    canonical: "/barcode-print-check",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BarcodePrintCheckPage() {
  return <BarcodePrintCheckApp />;
}
