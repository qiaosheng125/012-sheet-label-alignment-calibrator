import type { MetadataRoute } from "next";
import { siteUrl } from "./site";

const routes = ["", "/about", "/privacy", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date("2026-06-08"),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.4
  }));
}
