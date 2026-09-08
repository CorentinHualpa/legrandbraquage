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

for (const nom of AMBIANCES) {
  const source = join(SONS, `${nom}.mp3`);
  const avant = await moyenne(source);
  const tampon = join(SONS, `_${nom}.mp3`);

  await run("ffmpeg", [
    "-y", "-i", source,
    "-af", `loudnorm=I=${CIBLE.I}:TP=${CIBLE.TP}:LRA=${CIBLE.LRA}`,
    "-codec:a", "libmp3lame", "-q:a", "3", tampon,
  ], { maxBuffer: 1 << 24 });

  await rename(tampon, source);
  const apres = await moyenne(source);
  console.log(`${nom.padEnd(24)} ${avant.toFixed(1).padStart(6)} dB  ->  ${apres.toFixed(1).padStart(6)} dB`);
}
