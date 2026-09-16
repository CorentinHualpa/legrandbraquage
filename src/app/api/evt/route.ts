/**
 * La mesure d'audience du dossier, sans cookie, sans tiers, sans identifiant.
 *
 * Pourquoi elle existe : jusqu'au 15/09/2026, personne ne savait combien de
 * visiteurs ouvraient le site, combien allaient au bout, combien parlaient au
 * commissaire. Les seules traces étaient les logs HTTP de Railway, qui ne
 * voient PAS le passage d'une carte à l'autre (tout se joue dans le
 * navigateur) et qui tombent au bout de sept jours.
 *
 * Ce qu'elle enregistre : un nom d'étape pris dans une liste fermée, plus deux
 * étiquettes tout aussi fermées (le statut et l'issue). Rien qui vienne du
 * visiteur, rien qui permette de le reconnaître, pas même un identifiant
 * aléatoire. Un événement inconnu est JETÉ : sans ça, la première page venue
 * pourrait écrire ce qu'elle veut dans nos journaux.
 *
 * ⚠ La sortie est une ligne de journal, donc elle vit sept jours chez Railway.
 * Pour compter sur un mois, il faudra une table, et une table demande un
 * stockage : c'est le prochain cran, pas celui-ci.
 */

export const runtime = "nodejs";

/** Les seules étapes qu'on compte. En ajouter une, c'est l'écrire ici d'abord. */
const ETAPES = new Set([
  "couverture",
  "son-oui",
  "son-non",
  "deposition",
  "pris",
  "butin",
  "aparte",
  "rendu",
  "bourse",
  "verdict",
  "avis",
  "audition-ouverte",
  "partage",
  "partage-whatsapp",
  "partage-linkedin",
  "partage-image",
  "vers-coulisses",
  "vers-methode",
]);

const STATUTS = new Set(["salarie", "independant", "fonctionnaire", "tpe", ""]);
const ISSUES = new Set(["coupable", "non-lieu", "relaxe", ""]);

export async function POST(requete: Request) {
  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const { e, s, i } = (corps ?? {}) as { e?: unknown; s?: unknown; i?: unknown };
  if (typeof e !== "string" || !ETAPES.has(e)) return new Response(null, { status: 204 });

  const statut = typeof s === "string" && STATUTS.has(s) ? s : "";
  const issue = typeof i === "string" && ISSUES.has(i) ? i : "";

  // Une ligne, un objet, un préfixe : de quoi compter avec un grep.
  console.log(`EVT ${JSON.stringify({ e, s: statut, i: issue, t: new Date().toISOString() })}`);
  return new Response(null, { status: 204 });
}
