import type { Metadata } from "next";
import DaycareBottleLabelsApp from "./DaycareBottleLabelsApp";

export const metadata: Metadata = {
  title: "Daycare Bottle Labels",
  description:
    "Plan printable daycare bottle labels, cup labels, food container labels, spare clothing labels, and a drop-off checklist without collecting a child name.",
  alternates: {
    canonical: "/daycare-bottle-labels",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DaycareBottleLabelsPage() {
  return <DaycareBottleLabelsApp />;
}
