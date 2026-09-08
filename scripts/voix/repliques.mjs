/**
 * LES RÉPLIQUES DU COMMISSAIRE, une par écran, pré-enregistrées.
 *
 * ⚠⚠ AUCUNE RÉPLIQUE NE DIT UN CHIFFRE, et ce n'est pas une coquetterie
 * d'écriture, c'est ce qui rend la chose possible. Les montants dépendent du
 * salaire saisi : une phrase qui les prononcerait devrait être synthétisée à la
 * volée, donc payée et attendue à chaque visiteur, et sur un canal qui n'existe
 * pas. Ici les fichiers sont fixes, générés une fois, servis comme des images.
 *
 * C'est aussi meilleur à l'écoute : le chiffre est déjà en gros à l'écran, et
 * un commissaire qui le relit devient une légende de capture d'écran. Il
 * commente, il ne récite pas.
 *
 * ⚠ La VOIX et le DÉBIT sont figés ici (Stéphane Martineau, Eleven v3, ×1.15,
 * validés à l'oreille le 08/09/2026 après comparaison de six prises). Les
 * balises entre crochets ne se prononcent pas : elles disent COMMENT dire, et
 * elles sont le seul vrai levier d'intonation du modèle. Sans elles il lit très
 * bien, et à plat.
 *
 *   node scripts/voix/repliques.mjs            (tout)
 *   node scripts/voix/repliques.mjs verdict    (une seule)
 *
 * Écrit `public/voix/<ecran>.mp3`. Les fichiers sont des LIVRABLES, on les
 * commite : la génération coûte des crédits et ne doit pas se rejouer au build.
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ici = dirname(fileURLToPath(import.meta.url));
const racine = join(ici, "..", "..");
const SORTIE = process.env.SORTIE ?? join(racine, "public", "voix");
const TAMPON = join(SORTIE, "_brut");

const VAULT = "C:/Users/msi/.secrets/api-keys.env";

/** Stéphane Martineau. « Chaleureuse, sérieuse et imposante », français, quarantaine. */
const VOIX = "CkNazXuHNoWK3cIbgCIg";
const MODELE = "eleven_v3";
/** 0 = « créatif » : le modèle joue. v3 ne prend que 0, 0.5 ou 1. */
const STABILITE = 0;
/** Accéléré APRÈS coup, en conservant la hauteur. v3 n'a pas de réglage de débit. */
const TEMPO = 1.15;

export const REPLIQUES = {
  /** Écran 2. La seule qui a été validée mot pour mot par Coq. */
  deposition:
    "[tired] Asseyez-vous. [pause] Nom, prénom... [scoffs] laissez tomber, ça n'intéresse personne. "
    + "[sarcastic] Ce qui m'intéresse, MOI, c'est combien vous palpez par mois. "
    + "[whispers] Écrivez-le là. [dry] Sur le procès-verbal.",

  /* Les trois habitudes : il note, il ne juge pas. C'est ça qui met mal à l'aise. */
  tabac:
    "[dry] Vous fumez. [pause] Je ne vous fais pas la morale, ça ne m'intéresse pas. "
    + "[flat] Ce qui m'intéresse, c'est ce qu'il y a dedans qui ne vous appartient pas.",
  carburant:
    "[tired] Le plein. [pause] Vous croyez payer de l'essence. "
    + "[dry] Regardez ce que vous payez vraiment, et à qui.",
  alcool:
    "[dry] Un verre. [scoffs] Même chose. "
    + "[flat] À chaque fois que vous vous faites plaisir, quelqu'un passe à la caisse avec vous.",

  /* La pièce à conviction : le mécanisme. Il explique, il ne s'emporte pas. */
  pris:
    "[tired] Bon. [pause] Vous allez me demander comment on vous l'a pris. "
    + "[dry] Quatre lignes. Quatre. Et vous n'en voyez qu'une sur votre fiche de paie.",
  butin:
    "[flat] Voilà le butin. [pause] Ce n'est pas moi qui fixe les prix, "
    + "[dry] c'est le marché. Moi je compte.",

  /* Le témoin : le voisin. Registre d'interrogatoire, pas de démonstration. */
  temoin:
    "[dry] On a un témoin. [pause] Votre voisin. Même salaire que vous, "
    + "[sarcastic] et pas du tout le même traitement. [flat] Regardez.",

  /* L'horaire : le moment où il devient presque bavard. */
  liberation:
    "[tired] Regardez votre montre. [pause] Vous, vous bossez depuis janvier. "
    + "[dry] Eux, ils encaissent depuis janvier. Et ils s'arrêtent pile à cette heure-là, "
    + "chaque année. [flat] Réglés comme une horloge.",

  /* L'aparté : il se penche. C'est la réplique la plus basse du parcours. */
  aparte:
    "[whispers] Entre nous. [pause] Éteignez rien, ça ne s'enregistre pas. "
    + "[tired] J'ai des questions qui ne sont pas dans le formulaire.",

  /* Les trois interrogatoires : école, santé, chômage. Ce qu'on a reçu en face. */
  ecole:
    "[dry] L'école. [pause] Vous n'avez rien payé, vous croyez. "
    + "[flat] Mettez un prix dessus. On verra après si le compte y est.",
  sante:
    "[tired] La santé. [pause] Là aussi, personne ne vous a présenté la note. "
    + "[dry] Faites-le. Ça compte dans l'autre plateau.",
  chomage:
    "[flat] Le chômage. [pause] Vous n'en avez peut-être jamais eu besoin. "
    + "[dry] Ça reste quelque chose qu'on vous a vendu. Chiffrez-le.",

  /* Le rendu : il concède. Un commissaire honnête, c'est ce qui rend le reste crédible. */
  rendu:
    "[tired] Alors, soyons justes. [pause] Ils ne vous ont pas tout pris pour rien. "
    + "[dry] Voilà ce qu'ils ont laissé. Je vous l'ai dit, ils ne sont pas si mauvais.",

  /* La bourse : l'avocat du Braqueur demande la parole. Il s'agace un peu. */
  bourse:
    "[dry] Dernière question. [pause] Si vous aviez eu le choix, ce pognon, vous l'auriez mis où ? "
    + "[scoffs] Et ne me sortez pas que vous n'y auriez pas touché.",

  /* Le verdict : le tampon vient de tomber. Il ne triomphe pas, il constate. */
  verdict:
    "[flat] Voilà. [pause] Le tampon est mis. "
    + "[dry] Je ne commente pas les verdicts. [tired] Mais celui-là, vous voulez savoir d'où il sort.",

  /* L'édition de demain : la sortie. C'est la dernière chose qu'on entend. */
  avis:
    "[tired] C'est fini pour ce soir. [pause] Si vous voulez porter plainte pour de vrai, "
    + "[dry] c'est pas ici. [flat] C'est tous les cinq ans. Même guichet.",
};

/**
 * LES RÉACTIONS À LA SIGNATURE DE LA DÉPOSITION.
 *
 * Les seules répliques qui dépendent de ce que la personne a saisi. Elles ne
 * disent toujours AUCUN chiffre : ce qui change, c'est le REGISTRE. Le montant
 * est déjà écrit en gros sur le procès-verbal, le commissaire n'a pas à le
 * relire, il a à réagir.
 *
 * ⚠ Elles doivent rester COURTES (quatre à sept secondes). Elles se jouent juste
 * avant que la carte suivante n'arrive avec sa propre réplique : plus longues,
 * elles retiendraient tout le parcours à chaque signature.
 *
 * ⚠ Un `[pause]` coûte une seconde et demie à deux secondes de fichier, mesuré
 * en régénérant les quatre avec puis sans. Sur une réplique de cinq secondes
 * c'est un tiers de la durée, pour un silence que personne n'a demandé. Les
 * réactions n'en portent donc AUCUN ; les répliques d'arrivée, qui ont le temps,
 * le gardent.
 *
 * Les bornes sont celles que le site affiche déjà ailleurs (le mur de l'avis de
 * recherche, les repères sous le champ de saisie) : le net du SMIC 2026 et le
 * salaire médian. La borne haute est éditoriale, elle ne prétend rien mesurer.
 */
export const REACTIONS = {
  /* Sous le SMIC : il ne prend pas de pincettes, il ne plaint pas non plus. */
  "signature-sous-smic":
    "[tired] D'accord. Installez-vous. [dry] Parce que même là-dessus, ils ont trouvé de quoi se servir.",

  /* Du SMIC au médian : le cas ordinaire, donc le ton le plus plat. */
  "signature-jusqu-au-median":
    "[flat] Bon. Un salaire comme il en passe trente par jour ici. [dry] Et trente fois, le même montage.",

  /* Au-dessus du médian : il se réveille un peu. */
  "signature-au-dessus":
    "[scoffs] Ah. Pas mal. [sarcastic] Ce qu'on vous prend est bon aussi.",

  /* Le haut du panier : la seule fois où il se penche vraiment. */
  "signature-tres-haut":
    "[whispers] Oh. Alors là. [tired] J'ai vu des braquages rapporter moins que ça. [dry] Avec une arme.",
};

export const TOUTES = { ...REPLIQUES, ...REACTIONS };

/*
 * Rien ne se génère à l'IMPORT. `scripts/voix/doc.mjs` lit les textes d'ici pour
 * fabriquer le document de relecture : sans cette garde, ouvrir le document
 * relancerait seize synthèses payantes.
 */
const lanceDirectement = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (lanceDirectement) {
// La clé ne se lit QUE quand on génère pour de bon.
const cle = (readFileSync(VAULT, "utf8").match(/^ELEVENLABS_API_KEY=(.+)$/m) ?? [])[1]?.trim();
if (!cle) throw new Error(`ELEVENLABS_API_KEY absent de ${VAULT}`);

const demandes = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TOUTES);

await mkdir(SORTIE, { recursive: true });
await mkdir(TAMPON, { recursive: true });

for (const nom of demandes) {
  const texte = TOUTES[nom];
  if (!texte) {
    throw new Error(`Réplique inconnue : « ${nom} ». Connues : ${Object.keys(TOUTES).join(", ")}`);
  }
  // Une réplique qui contiendrait un chiffre ne peut PAS être pré-enregistrée :
  // elle dépend du salaire saisi. Le refus est ici plutôt que dans un commentaire.
  if (/\d/.test(texte.replace(/\[[a-z]+\]/g, ""))) {
    throw new Error(`« ${nom} » contient un chiffre : une réplique fixe ne peut pas en dire.`);
  }

  const r = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOIX}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": cle, "content-type": "application/json" },
      body: JSON.stringify({
        text: texte,
        model_id: MODELE,
        voice_settings: { stability: STABILITE, similarity_boost: 0.85, use_speaker_boost: true },
      }),
    },
  );
  if (!r.ok) throw new Error(`${nom} : ${r.status} ${(await r.text()).slice(0, 200)}`);

  const brut = join(TAMPON, `${nom}.mp3`);
  await writeFile(brut, Buffer.from(await r.arrayBuffer()));
  const cible = join(SORTIE, `${nom}.mp3`);
  // `atempo` conserve la hauteur : la voix va plus vite sans rajeunir. Un
  // `asetrate` la monterait dans les aigus et lui enlèverait vingt ans.
  await run("ffmpeg", [
    "-y", "-i", brut, "-filter:a", `atempo=${TEMPO}`,
    "-codec:a", "libmp3lame", "-q:a", "3", cible,
  ]);
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", cible,
  ]);
  console.log(`${nom.padEnd(14)} ${Number(stdout).toFixed(1).padStart(5)} s  ${cible}`);
}

await rm(TAMPON, { recursive: true, force: true });
}
