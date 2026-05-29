import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://revenueready.ai";

  return ["", "/privacy", "/terms", "/security"].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date("2026-05-29"),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
