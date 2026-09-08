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
import { fileURLToPath, pathToFileURL } from "node:url";

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

/*
 * ⚠ LES TEXTES NE SONT PLUS ICI. Ils vivent dans `src/lib/repliques.ts`, avec
 * la fonction qui les affiche dans la bulle : la bulle et la voix portaient
 * deux textes différents, écrits à des moments différents, et on lisait une
 * phrase en en entendant une autre. Une copie dans ce script redonnerait
 * exactement ce défaut à la première correction faite d'un seul côté.
 */
const { REPLIQUES, REACTIONS, TOUTES } = await import(pathToFileURL(join(racine, "src", "lib", "repliques.ts")).href);



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
