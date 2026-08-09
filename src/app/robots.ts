import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/trello/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login"],
      disallow: ["/api/", "/home", "/b/", "/auth/"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
