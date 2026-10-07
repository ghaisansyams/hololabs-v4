import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hololabs-web.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Dashboard dan jalur pratinjau tidak untuk mesin pencari.
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
