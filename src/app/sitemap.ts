import type { MetadataRoute } from "next";
import { siteUrl } from "./site";

const routes = ["", "/barcode-print-check", "/daycare-bottle-labels", "/about", "/privacy", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(
      route === "/barcode-print-check" || route === "/daycare-bottle-labels"
        ? "2026-06-25"
        : "2026-06-08"
    ),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : route === "/barcode-print-check" || route === "/daycare-bottle-labels" ? 0.75 : 0.4
  }));
}
