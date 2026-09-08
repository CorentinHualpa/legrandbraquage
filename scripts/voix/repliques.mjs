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
 * ⚠⚠ LE REGISTRE EST PARLÉ, pas écrit. Refonte du 09/09/2026 : la première
 * version sonnait « traduite de l'anglais » (Coq), et elle l'était par la forme
 * même si elle avait été écrite en français. Ce qui la trahissait : des phrases
 * complètes et bien construites, des négations en « ne... pas » entières, des
 * tournures qu'on écrit et qu'on ne dit pas (« Ce qui m'intéresse, c'est ce
 * qu'il y a dedans qui ne vous appartient pas »).
 *
 * Ce qui marche, c'est un flic qui CHARRIE : phrases courtes, « ne » qui saute,
 * « hein » et « du coup », une question directe, et une vanne par réplique. Le
 * modèle de référence est la ligne écrite par Coq lui-même :
 *
 *     « Et la caisse ? Plutôt écolo ou à frimer avec votre BM ? »
 *
 * ⚠ La vanne vise les braqueurs ou la situation, JAMAIS la personne assise en
 * face. Un trait d'humour sur un petit salaire se prend de travers et on perd
 * la personne pour les quinze cartes qui restent.
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
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ici = dirname(fileURLToPath(import.meta.url));
const racine = join(ici, "..", "..");
const SORTIE = process.env.SORTIE ?? join(racine, "public", "voix");
const TAMPON = join(SORTIE, "_brut");
/** L'empreinte du texte réellement synthétisé dans chaque fichier. Voir plus bas. */
const MANIFESTE = join(SORTIE, "_textes.json");

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

  /* Les trois habitudes : il note, il ne juge pas, il taquine. */
  /*
   * ⚠ Le « Bon. » d'ouverture n'est pas un tic, c'est une CHARNIÈRE. C'est la
   * seule carte qu'on atteint après une réaction du commissaire (celle au
   * montant signé), donc la seule où il reprend la parole après s'être déjà
   * exprimé. Sans ce mot, il attaque « Vous fumez ? » comme s'il venait
   * d'entrer dans la pièce, et les deux répliques se lisent comme deux
   * personnes. C'est aussi le mot qu'il dit à l'écran, dans la bulle.
   */
  tabac:
    "[tired] Bon. [pause] Vous fumez ? [scoffs] Vous en faites pas, la morale c'est pas mon service. "
    + "[flat] Combien de paquets ? Et comptez ceux que vous taxez aux collègues.",
  carburant:
    "[tired] Et la caisse ? [scoffs] Plutôt écolo, ou à frimer avec votre BM ? "
    + "[dry] Dites-moi juste combien de pleins.",
  alcool:
    "[dry] Et à boire ? [scoffs] Mentez pas, on est au commissariat, pas chez la belle-famille. "
    + "[flat] Combien de verres dans la semaine ?",

  /* La pièce à conviction : le mécanisme. Il explique, il ne s'emporte pas. */
  pris:
    "[tired] Bon. [pause] Vous voulez savoir comment ils s'y prennent ? "
    + "[dry] Quatre lignes. Quatre. [scoffs] Et sur votre fiche de paie, vous en voyez une.",
  butin:
    "[flat] Voilà le butin. [scoffs] C'est pas moi qui fixe les prix, hein. Moi je compte. "
    + "[dry] Et franchement, j'ai rarement vu un scellé aussi bien rempli.",

  /* Le témoin : le voisin. Registre d'interrogatoire, pas de démonstration. */
  temoin:
    "[dry] On a un témoin. [pause] Votre voisin. Même salaire que vous. "
    + "[sarcastic] Et pas du tout le même traitement. [scoffs] Regardez-moi ça.",

  /* L'horaire : le moment où il devient presque bavard. */
  liberation:
    "[tired] Regardez votre montre. [pause] Vous, vous bossez depuis janvier. Eux aussi. "
    + "[dry] Sauf qu'eux, ils s'arrêtent pile là. [flat] Tous les ans, à la minute près.",

  /* L'aparté : il se penche. C'est la réplique la plus basse du parcours. */
  aparte:
    "[whispers] Entre nous. [pause] Le magnéto tourne pas, vous inquiétez pas. "
    + "[tired] J'ai deux, trois questions qui sont pas dans le formulaire.",

  /* Les trois interrogatoires : école, santé, chômage. Ce qu'on a reçu en face. */
  ecole:
    "[dry] L'école. [scoffs] Gratuite, hein ? C'est ce qu'on dit. "
    + "[flat] Mettez un prix dessus, on verra bien.",
  sante:
    "[tired] La santé. [pause] Là non plus, personne vous a présenté la note. "
    + "[dry] Allez-y, chiffrez. Ça compte dans l'autre plateau.",
  chomage:
    "[flat] Le chômage. [pause] Vous y avez peut-être jamais touché. "
    + "[scoffs] Ça vous a pas empêché de le payer. [dry] Combien, à votre avis ?",

  /* Le rendu : il concède. Un commissaire honnête, c'est ce qui rend le reste crédible. */
  rendu:
    "[tired] Bon, soyons honnêtes. [pause] Ils vous ont pas tout pris pour rien. "
    + "[dry] Voilà ce qu'ils ont laissé. [scoffs] Des cambrioleurs qui repeignent le salon "
    + "avant de partir, faut le voir pour le croire.",

  /* La bourse : l'avocat du Braqueur demande la parole. Il s'agace un peu. */
  bourse:
    "[dry] Dernière question. [pause] Ce pognon, vous l'auriez mis où ? "
    + "[scoffs] Et me dites pas que vous y auriez pas touché, hein.",

  /* Le verdict : le tampon vient de tomber. Il ne triomphe pas, il constate. */
  verdict:
    "[flat] Voilà. [pause] Tampon. [dry] Je commente pas les verdicts. "
    + "[tired] Mais celui-là, vous voulez savoir d'où il sort.",

  /* L'édition de demain : la sortie. C'est la dernière chose qu'on entend. */
  avis:
    "[tired] C'est fini pour ce soir. [pause] Vous voulez porter plainte pour de vrai ? "
    + "[dry] C'est pas ici. [scoffs] C'est tous les cinq ans. Même guichet.",
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
  /*
   * Sous le SMIC : il ne prend pas de pincettes, mais il ne blague pas non plus
   * SUR la personne. La vanne vise toujours les braqueurs, jamais celui qui est
   * assis en face : à ce niveau de salaire, un trait d'humour se prend de
   * travers, et on perd la personne pour le reste du parcours.
   */
  "signature-sous-smic":
    "[tired] D'accord. Installez-vous. [dry] Même là-dedans, ils ont trouvé à se servir. [scoffs] Faut le faire.",

  /* Du SMIC au médian : le cas ordinaire, donc le ton le plus plat. */
  "signature-jusqu-au-median":
    "[flat] Bon. Le salaire de tout le monde. [scoffs] Et le braquage de tout le monde, du coup.",

  /* Au-dessus du médian. Formulation de Coq, gardée telle quelle. */
  "signature-au-dessus":
    "[scoffs] Ah. Pas mal. [sarcastic] Les braqueurs ont dû se régaler. [laughs]",

  /* Le haut du panier : la seule fois où il se penche vraiment. */
  "signature-tres-haut":
    "[whispers] Oh. [scoffs] Alors là. [tired] J'ai vu des braquages à main armée rapporter moins. "
    + "[dry] Et eux, ils ont pris vingt ans.",
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

/*
 * L'EMPREINTE DE CHAQUE TEXTE, écrite à côté des fichiers.
 *
 * ⚠ Sans elle, « est-ce que tout a bien été régénéré ? » n'a aucune réponse
 * vérifiable : un mp3 qui date de la version d'avant est un fichier parfaitement
 * valide, il joue, il dure le bon nombre de secondes, et il dit autre chose que
 * ce qui est écrit dans ce fichier. Le seul moment où ça se voit, c'est en
 * écoutant les vingt à la suite, donc trop tard.
 *
 * Le test `scripts/sons/test-vie.mjs` compare cette empreinte au texte courant
 * et refuse toute divergence.
 */
const empreintes = existsSync(MANIFESTE) ? JSON.parse(readFileSync(MANIFESTE, "utf8")) : {};
const empreinte = (t) => createHash("sha256").update(t).digest("hex").slice(0, 12);

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
  empreintes[nom] = empreinte(texte);
  console.log(`${nom.padEnd(14)} ${Number(stdout).toFixed(1).padStart(5)} s  ${cible}`);
}

await rm(TAMPON, { recursive: true, force: true });
await writeFile(MANIFESTE, `${JSON.stringify(empreintes, null, 2)}\n`, "utf8");
}
