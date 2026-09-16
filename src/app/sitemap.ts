import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/** Les quatre pages qui existent vraiment. Le parcours vit entièrement sur `/`. */
export default function sitemap(): MetadataRoute.Sitemap {
  const maj = new Date();
  return [
    { url: SITE_URL, lastModified: maj, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/methode`, lastModified: maj, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/coulisses`, lastModified: maj, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/mentions-legales`, lastModified: maj, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/confidentialite`, lastModified: maj, changeFrequency: "yearly", priority: 0.1 },
  ];
}
