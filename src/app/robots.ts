import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * `robots.txt` et `sitemap.xml` répondaient 404 depuis la mise en ligne, et le
 * site n'était lié depuis nulle part : les moteurs n'avaient aucune raison de
 * le trouver, et la seule chose qui sortait sur son nom était le dépôt GitHub.
 *
 * ⚠ `/api/avis` est exclu : c'est une image calculée à la demande, un robot qui
 * l'explore ferait tourner le rendu pour rien. Les métadonnées la donnent déjà
 * aux réseaux, qui la lisent par la balise et pas par le sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
