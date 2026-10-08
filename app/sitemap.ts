import type { MetadataRoute } from "next";
import { systems } from "@/lib/data";
import { flatNav } from "@/lib/nav";

const SITE_URL = "https://ai-music-generation-thesis-review.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = new Set([
    "/",
    ...flatNav.map((item) => item.href),
    ...systems.map((system) => `/systems/${encodeURIComponent(system.id)}`),
  ]);

  return [...paths].map((path) => ({
    url: new URL(path === "/" ? "/" : `${path}/`, SITE_URL).toString(),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : path.startsWith("/systems/") ? 0.6 : 0.8,
  }));
}
