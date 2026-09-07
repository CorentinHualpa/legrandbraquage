/**
 * Sonde de santé pour Railway. Elle ne touche à rien : pas de base, pas de
 * réseau, pas de calcul. Une sonde qui dépend de quelque chose finit par faire
 * échouer un déploiement parfaitement sain.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true });
}
