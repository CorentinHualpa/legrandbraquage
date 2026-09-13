/**
 * LA PORTE, À TROIS VOLUMES, POUR JUGER À L'OREILLE.
 *
 * On ne règle pas un son en lisant des nombres : c'est écrit en tête de
 * `mix.mjs`, et ça s'est vérifié trois fois sur ce dossier. Ce script rend UN
 * fichier où la porte se joue trois fois de suite, à trois volumes, sur
 * l'ambiance du commissariat et juste après une réplique du commissaire, qui
 * est l'échelle de tout le reste.
 *
 *   node scripts/sons/porte-comparer.mjs
 *   VOLUMES=0.07,0.04,0.023 node scripts/sons/porte-comparer.mjs
 */
import { mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ici = dirname(fileURLToPath(import.meta.url));
const SONS = join(ici, "..", "..", "public", "sons");
const VOIX = join(ici, "..", "..", "public", "voix", "deposition.mp3");
const SORTIE = join(ici, "_mix");

const VOLUMES = (process.env.VOLUMES ?? "0.07,0.04,0.023").split(",").map(Number);
const DECOR = 0.15; // ambiance-commissariat, valeur de sons.ts
const VOIX_V = 2.2; // l'échelle : la voix ne bouge jamais
const PAS = 7; // secondes entre deux portes
const DUREE = 4 + VOLUMES.length * PAS;

await mkdir(SORTIE, { recursive: true });

/* La porte arrive 900 ms après la réplique, comme sur la carte. */
const entrees = [
  ["-stream_loop", "-1", "-i", join(SONS, "ambiance-commissariat.mp3")],
  ["-i", VOIX],
  ...VOLUMES.map(() => ["-i", join(SONS, "porte.mp3")]),
].flat();

const filtres = [
  `[0:a]volume=${DECOR},atrim=0:${DUREE}[decor]`,
  `[1:a]volume=${VOIX_V},adelay=500|500[voix]`,
  ...VOLUMES.map(
    (v, i) => `[${i + 2}:a]volume=${v},adelay=${(4 + i * PAS) * 1000}|${(4 + i * PAS) * 1000}[p${i}]`,
  ),
  `[decor][voix]${VOLUMES.map((_, i) => `[p${i}]`).join("")}amix=inputs=${VOLUMES.length + 2}:duration=first:normalize=0[out]`,
].join(";");

const sortie = join(SORTIE, "porte-comparer.mp3");
await run("ffmpeg", [
  "-y", "-hide_banner", "-loglevel", "error",
  ...entrees,
  "-filter_complex", filtres,
  "-map", "[out]", "-t", String(DUREE), "-b:a", "192k", sortie,
]);

console.log(`Rendu : ${sortie}`);
VOLUMES.forEach((v, i) => {
  const db = (20 * Math.log10(v) - 16.5).toFixed(1);
  console.log(`  ${(4 + i * PAS).toString().padStart(2)} s  volume ${v}  ->  ${db} dB effectifs`);
});
console.log("  (repères : tampon -36,0 · coche -39,1 · machine -44,8 · page -47,3)");
