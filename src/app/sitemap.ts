import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/trello/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return [
    {
      url: `${base}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
