/**
 * MET LES CINQ AMBIANCES AU MÊME NIVEAU.
 *
 * ⚠ Le défaut que ce script répare, et qui ne se voyait dans AUCUN réglage :
 * les fichiers sortis du générateur ne sont pas au même volume du tout. Mesuré
 * le 08/09/2026, en niveau moyen : la rue à -34 dB, le tribunal à -42,7. Onze
 * décibels d'écart, soit un rapport de trois et demi, entre deux pièces censées
 * être posées au même plan sonore. Baisser la nappe du tribunal de 0,15 à 0,12
 * dans le code « parce que le tribunal est plus feutré » revenait à corriger de
 * deux décibels un écart qui en faisait onze, dans le mauvais sens.
 *
 * Pire : une fois les multiplicateurs du module appliqués, les nappes sortaient
 * entre 33 et 44 dB SOUS la voix du commissaire. Un fond à moins trente de la
 * voix ne s'entend pas sur un portable, il ne s'entend même pas au casque. Tout
 * ce qui faisait la pièce vivante reposait donc sur les bruits de vie seuls,
 * ce qui explique qu'on ait passé une heure à resserrer leur cadence.
 *
 * On normalise le FICHIER plutôt que de compenser dans le code, pour que les
 * volumes de `src/lib/sons.ts` veuillent enfin dire quelque chose : « 0,5 »
 * doit être la même sensation d'une pièce à l'autre.
 *
 * `loudnorm` (EBU R128) plutôt qu'un simple gain : trois des cinq fichiers ont
 * déjà des crêtes à -0,2 dB, donc un gain les écrêterait. Le limiteur de
 * loudnorm tient le plafond pendant qu'il remonte le corps du son.
 *
 *   node scripts/sons/normaliser.mjs
 *
 * ⚠ Il RÉÉCRIT les fichiers de `public/sons`. À ne lancer qu'une fois : le
 * relancer sur un fichier déjà normalisé ne casse rien mais ne sert à rien.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ici = dirname(fileURLToPath(import.meta.url));
const SONS = join(ici, "..", "..", "public", "sons");

/**
 * -30 LUFS : très bas pour de la musique, juste pour un fond de pièce. La voix
 * du commissaire tourne autour de -18, ce qui laisse une douzaine de décibels
 * entre les deux. C'est l'écart au-delà duquel un fond cesse d'exister, et en
 * deçà duquel il commence à couvrir les consonnes.
 */
const CIBLE = { I: -30, TP: -2, LRA: 7 };

/**
 * LES BRUITS DE VIE, même traitement, même raison.
 *
 * ⚠ Le défaut était encore plus violent que sur les ambiances : la chaise
 * sortait à -14,7 dB de moyenne contre -35,2 pour le clavier court, soit VINGT
 * décibels d'écart entre deux bruits censés être au même plan. Multiplicateurs
 * appliqués, on entendait la chaise à -29,6 dB et le clavier à -50,6 : le même
 * réglage « 0,18 » et « 0,17 » donnait deux mondes différents (Coq,
 * 09/09/2026 : « la chaise elle est trop forte »).
 *
 * -26 LUFS et pas -30 comme les nappes : un bruit ponctuel est court, la mesure
 * intégrée le pénalise, et on le veut au même plan qu'une ambiance continue.
 */
const BRUITS = [
  "bruit-telephone",
  "bruit-tiroir",
  "bruit-chaise",
  "bruit-briquet",
  "bruit-clavier-court",
  "bruit-clavier-long",
  "bruit-clavier-mecanique",
];

const AMBIANCES = [
  "ambiance-commissariat",
  "ambiance-rumeur",
  "ambiance-scelles",
  "ambiance-tribunal",
  "ambiance-rue",
];

async function moyenne(fichier) {
  const { stderr } = await run("ffmpeg", ["-hide_banner", "-i", fichier, "-af", "volumedetect", "-f", "null", "-"])
    .catch((e) => e);
  return Number((stderr.match(/mean_volume: ([-\d.]+) dB/) ?? [])[1]);
}

for (const [nom, cible] of [
  ...AMBIANCES.map((n) => [n, CIBLE]),
  ...BRUITS.map((n) => [n, { ...CIBLE, I: -26 }]),
]) {
  const source = join(SONS, `${nom}.mp3`);
  const avant = await moyenne(source);
  const tampon = join(SONS, `_${nom}.mp3`);

  await run("ffmpeg", [
    "-y", "-i", source,
    "-af", `loudnorm=I=${cible.I}:TP=${cible.TP}:LRA=${cible.LRA}`,
    "-codec:a", "libmp3lame", "-q:a", "3", tampon,
  ], { maxBuffer: 1 << 24 });

  await rename(tampon, source);
  const apres = await moyenne(source);
  console.log(`${nom.padEnd(24)} ${avant.toFixed(1).padStart(6)} dB  ->  ${apres.toFixed(1).padStart(6)} dB`);
}
