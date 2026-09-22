import type { MetadataRoute } from "next";
import { getAllBarbers } from "@/lib/data/barbers";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/services`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/barbers`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/book`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/about`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.5 },
  ];

  const barbers = await getAllBarbers();
  const barberRoutes: MetadataRoute.Sitemap = barbers.map((barber) => ({
    url: `${siteUrl}/barbers/${barber.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...barberRoutes];
}
