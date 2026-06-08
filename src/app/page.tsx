import type { Metadata } from "next";
import LabelAlignmentApp from "./LabelAlignmentApp";

export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function HomePage() {
  return <LabelAlignmentApp />;
}
