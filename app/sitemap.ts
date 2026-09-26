import type { MetadataRoute } from "next";
import { getPublishedArticles, getPublishedConferences } from "@/lib/public-data";
import { siteConfig } from "@/lib/site";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [conferences, articles] = await Promise.all([
    getPublishedConferences(500).catch(() => []),
    getPublishedArticles(500).catch(() => []),
  ]);

  const staticRoutes = [
    "",
    "/conferences",
    "/articles",
    "/authors",
    "/for-authors",
    "/about",
    "/publication-ethics",
    "/peer-review-policy",
    "/plagiarism-policy",
    "/copyright-policy",
    "/retraction-correction-policy",
    "/ai-use-policy",
    "/privacy-policy",
    "/terms-of-use",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      changeFrequency:
        route === ""
          ? ("weekly" as const)
          : ("monthly" as const),
      priority: route === "" ? 1 : 0.7,
    })),

    ...conferences.map((c) => ({
      url: `${siteConfig.url}/conferences/${c.slug}`,
      lastModified: c.updatedAt || c.publicationDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    ...articles.map((a) => ({
      url: `${siteConfig.url}/articles/${a.slug}`,
      lastModified: a.updatedAt || a.publicationDate,
      changeFrequency: "yearly" as const,
      priority: 0.9,
    })),
  ];
}