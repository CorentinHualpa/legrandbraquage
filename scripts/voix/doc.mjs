/**
 * LE DOCUMENT DE RELECTURE DES RÉPLIQUES.
 *
 * Coq relit les vingt répliques d'un coup et réécrit celles qui sonnent faux.
 * Le document est GÉNÉRÉ depuis `repliques.mjs`, jamais recopié à la main : une
 * liste tapée à côté des vraies phrases diverge à la première correction, et
 * c'est la version fausse qu'on relit.
 *
 * Il porte deux colonnes par réplique : le texte tel qu'il part au synthétiseur
 * (avec ses balises) et une ligne vide « Nouvelle version » à remplir. On relit
 * la version balisée parce que les balises SONT le jeu d'acteur : les enlever du
 * document ferait réécrire des phrases sans savoir où il souffle.
 *
 *   node scripts/voix/doc.mjs
 *
 * Écrit dans le dossier privé du projet, hors du dépôt (le dépôt est public).
 */
import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const { REPLIQUES, REACTIONS } = await import(pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "lib", "repliques.ts")).href);

const run = promisify(execFile);
const ici = dirname(fileURLToPath(import.meta.url));
const VOIX = join(ici, "..", "..", "public", "voix");
const CIBLE = process.env.CIBLE
  ?? "C:/Users/msi/Documents/MEGA/PRO/Cowork/Le-Grand-Braquage/REPLIQUES-COMMISSAIRE.md";

/** Ce que chaque réplique commente, pour relire en sachant ce qu'il y a à l'écran. */
const CONTEXTE = {
  deposition: "Arrivée sur la carte de saisie du salaire. Le champ est vide, il demande le montant.",
  tabac: "Carte des habitudes : combien de paquets par mois.",
  carburant: "Carte des habitudes : combien de pleins par mois.",
  alcool: "Carte des habitudes : combien de verres par semaine.",
  pris: "La pièce à conviction : les quatre lignes de prélèvement sur un salaire.",
  butin: "Le butin : ce que la somme volée aurait acheté, en objets.",
  temoin: "Le témoin : le même salaire dans l'autre statut, côte à côte.",
  liberation: "L'heure de libération : la date de l'année où on arrête de payer.",
  aparte: "L'aparté : il annonce les trois questions sur ce qu'on a reçu en face.",
  ecole: "Interrogatoire : à combien la personne estime l'école.",
  sante: "Interrogatoire : à combien elle estime la santé.",
  chomage: "Interrogatoire : à combien elle estime le chômage.",
  rendu: "Le rendu : ce que les prélèvements ont réellement financé pour elle.",
  bourse: "La bourse : où elle aurait placé l'argent si elle avait eu le choix.",
  verdict: "Le verdict : le tampon vient de tomber, coupable ou non.",
  avis: "L'édition de demain : la dernière carte, celle qu'on partage.",
  "signature-sous-smic": "Au clic sur « Signer la déposition », si le montant saisi est SOUS le net du SMIC.",
  "signature-jusqu-au-median": "Au clic sur « Signer », entre le SMIC et le salaire médian.",
  "signature-au-dessus": "Au clic sur « Signer », au-dessus du médian.",
  "signature-tres-haut": "Au clic sur « Signer », tout en haut de l'échelle.",
};

async function duree(nom) {
  const f = join(VOIX, `${nom}.mp3`);
  if (!existsSync(f)) return null;
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f,
  ]);
  return Number(stdout);
}

const lignes = [
  "# Les répliques du commissaire",
  "",
  "Vingt phrases : seize à l'arrivée sur une carte, quatre en réaction au montant saisi.",
  "Réécris ce qui sonne faux sous « Nouvelle version », laisse vide ce qui va.",
  "Je régénère ensuite les fichiers depuis ce document.",
  "",
  "## Trois règles qui ne se contournent pas",
  "",
  "**Aucun chiffre.** Les montants dépendent du salaire saisi : une phrase qui en",
  "prononce un devrait être synthétisée pour chaque visiteur. Le script refuse de",
  "générer une réplique qui en contient un. Un nombre écrit en toutes lettres passe",
  "(« quatre lignes », « tous les cinq ans ») : ce qui est interdit, c'est un MONTANT.",
  "",
  "**Les balises entre crochets ne se prononcent pas**, elles disent COMMENT dire,",
  "et c'est le seul vrai levier d'intonation du modèle. Sans elles il lit très bien,",
  "et à plat. Garde-les, déplace-les, ajoutes-en. Les utiles :",
  "",
  "⚠ Les balises restent en ANGLAIS : c'est le vocabulaire du modèle, `[rire]` ne",
  "produit rien et se retrouverait prononcé. Le texte, lui, est français.",
  "",
  "| Balise | Ce que ça fait |",
  "| --- | --- |",
  "| `[tired]` | fatigué, en fin de service : le registre par défaut du personnage |",
  "| `[dry]` | sec, sans affect : pour asséner un fait |",
  "| `[flat]` | plat, neutre : quand il constate |",
  "| `[scoffs]` | petit rire de mépris, une syllabe |",
  "| `[sarcastic]` | ironique, il appuie |",
  "| `[whispers]` | il baisse la voix, il se penche |",
  "| `[laughs]` | il rit franchement |",
  "| `[chuckles]` | il rit sous cape, plus court |",
  "| `[pause]` | un silence, plus long qu'une virgule |",
  "",
  "⚠ Un `[pause]` coûte une seconde et demie à deux secondes de fichier (mesuré",
  "en régénérant les quatre réactions avec, puis sans). Sur une phrase courte c'est",
  "un tiers de la durée : les réactions n'en portent aucun, les répliques d'arrivée",
  "les gardent parce qu'elles ont le temps.",
  "",
  "**La longueur compte.** Une réplique d'arrivée tient entre huit et quinze",
  "secondes ; au-delà on avance avant qu'il ait fini. Les quatre réactions à la",
  "signature tiennent entre quatre et sept secondes : la carte suivante arrive",
  "juste après avec sa propre phrase.",
  "",
];

for (const [titre, table] of [["Les seize répliques d'arrivée", REPLIQUES], ["Les quatre réactions à la signature", REACTIONS]]) {
  lignes.push(`## ${titre}`, "");
  for (const [nom, texte] of Object.entries(table)) {
    const d = await duree(nom);
    lignes.push(
      `### ${nom}${d ? `  (${d.toFixed(1)} s)` : "  (pas encore enregistrée)"}`,
      "",
      `*${CONTEXTE[nom] ?? ""}*`,
      "",
      "Actuel :",
      "",
      "```",
      texte,
      "```",
      "",
      "Nouvelle version :",
      "",
      "```",
      "",
      "```",
      "",
    );
  }
}

await writeFile(CIBLE, lignes.join("\n"), "utf8");
console.log(`${Object.keys(REPLIQUES).length + Object.keys(REACTIONS).length} répliques`);
console.log(CIBLE);
