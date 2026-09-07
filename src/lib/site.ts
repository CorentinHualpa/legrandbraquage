/**
 * L'adresse du site, écrite UNE fois.
 *
 * Elle sert à trois endroits qui ne se voient pas les uns les autres : la base
 * des métadonnées, l'image de partage, et l'adresse imprimée sur l'avis de
 * recherche. Écrite trois fois, elle finit par diverger, et c'est l'avis de
 * recherche qui reste en arrière : il porterait un domaine mort sur une carte
 * faite pour être partagée.
 *
 * `NEXT_PUBLIC_SITE_URL` est lue à la COMPILATION, pas au démarrage. Sur un
 * déploiement, la poser avant de construire.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://braquage.revolutionagency.ai";

/** Le nom d'hôte seul, sans protocole : c'est ce qui s'imprime sur la carte. */
export const SITE_HOTE = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
