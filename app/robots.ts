import type { MetadataRoute } from "next";

const SITE_URL = "https://rcfbethelacademy.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/connect",
        "/cbt",
        "/library",
        "/book",
        "/data",
        "/roadmap",
        "/preview",
        "/profile",
        "/verify",
        "/offline",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
