/**
 * Le côté navigateur de la mesure : une ligne envoyée, jamais attendue.
 *
 * `sendBeacon` part même si la page se ferme dans la seconde, ne bloque rien et
 * n'attend aucune réponse. Absent (vieux navigateur, mode restreint), on ne
 * tente RIEN d'autre : une mesure ne doit jamais ralentir un parcours ni faire
 * apparaître une erreur dans la console de quelqu'un qui lit un dossier.
 *
 * Ce qui part est écrit dans `src/app/api/evt/route.ts`, et le serveur refuse
 * tout ce qui n'y figure pas.
 */

export type Etape =
  | "couverture"
  | "son-oui"
  | "son-non"
  | "deposition"
  | "pris"
  | "butin"
  | "aparte"
  | "rendu"
  | "bourse"
  | "verdict"
  | "avis"
  | "audition-ouverte"
  | "partage"
  | "partage-whatsapp"
  | "partage-linkedin"
  | "partage-image"
  | "vers-coulisses"
  | "vers-methode";

/** Une étape n'est comptée qu'UNE fois par visite : on mesure un parcours, pas des rendus React. */
const vues = new Set<string>();

export function mesurer(e: Etape, extra?: { statut?: string; issue?: string }) {
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;
  const cle = `${e}|${extra?.statut ?? ""}|${extra?.issue ?? ""}`;
  if (vues.has(cle)) return;
  vues.add(cle);
  try {
    const corps = JSON.stringify({ e, s: extra?.statut ?? "", i: extra?.issue ?? "" });
    navigator.sendBeacon("/api/evt", new Blob([corps], { type: "application/json" }));
  } catch {
    // Une mesure qui échoue est une mesure perdue, pas un incident.
  }
}
