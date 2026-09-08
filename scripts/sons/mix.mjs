/**
 * CE QU'ON ENTEND EN OUVRANT LA DÉPOSITION, rendu en un fichier.
 *
 * ⚠ Pourquoi ce script existe : j'ai réglé les volumes et la cadence des bruits
 * de vie EN LISANT DES NOMBRES, sans jamais écouter le résultat. C'est la faute
 * classique sur du son, et elle s'est vue tout de suite (« les sons sont super
 * espacés »). Un mix rendu permet de juger en trente secondes ce qu'il faudrait
 * cinq minutes à entendre dans le navigateur, et de comparer deux cadences côte
 * à côte, ce que le navigateur ne permet pas du tout.
 *
 * Il rejoue EXACTEMENT ce que fait `src/lib/sons.ts` : mêmes fichiers, mêmes
 * volumes, même tirage pondéré, même règle du « jamais deux fois de suite ».
 * Si le mix sonne bien, le site sonne pareil.
 *
 *   node scripts/sons/mix.mjs
 *   VOIX=chemin.mp3 node scripts/sons/mix.mjs
 */
import { mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ici = dirname(fileURLToPath(import.meta.url));
const SONS = join(ici, "..", "..", "public", "sons");
const SORTIE = process.env.SORTIE ?? join(ici, "_mix");
const DUREE = 75;
const VOIX = process.env.VOIX ?? "";
const VOIX_A = 2.2;

/** Les volumes du module, recopiés ici volontairement pour pouvoir les FAIRE VARIER. */
const DECOR = { f: "ambiance-commissariat", v: 0.15 };
const RUMEUR = { f: "ambiance-rumeur", v: 0.075 };
const VIE = [
  { f: "bruit-telephone", v: 0.09, poids: 1 },
  { f: "bruit-tiroir", v: 0.2, poids: 4 },
  { f: "bruit-chaise", v: 0.18, poids: 4 },
  { f: "bruit-briquet", v: 0.16, poids: 3 },
  { f: "bruit-clavier-court", v: 0.17, poids: 5 },
  { f: "bruit-clavier-long", v: 0.15, poids: 3 },
  { f: "bruit-clavier-mecanique", v: 0.13, poids: 2 },
];

/** Les cadences à comparer, en secondes. */
const CADENCES = {
  "a-actuelle-22-70": [22, 70],
  "b-serree-10-26": [10, 26],
  "c-tres-serree-6-16": [6, 16],
};

/** Le même tirage que le module : pondéré, jamais deux fois de suite. */
function planifier([min, max], graine) {
  let t = 2.5;
  const recents = [];
  let h = graine;
  const suivant = () => ((h = (h * 1103515245 + 12345) % 2147483648) / 2147483648);
  const plan = [];
  while (t < DUREE - 3) {
    const dispo = VIE.filter((b) => !recents.includes(b.f));
    const total = dispo.reduce((n, b) => n + b.poids, 0);
    let tir = suivant() * total;
    const choisi = dispo.find((b) => (tir -= b.poids) < 0) ?? dispo[dispo.length - 1];
    plan.push({ ...choisi, t });
    recents.push(choisi.f);
    if (recents.length > 2) recents.shift();
    t += min + suivant() * (max - min);
  }
  return plan;
}

await mkdir(SORTIE, { recursive: true });

for (const [nom, bornes] of Object.entries(CADENCES)) {
  const plan = planifier(bornes, 42);
  const entrees = [
    // Les deux nappes, bouclées jusqu'à la durée voulue.
    "-stream_loop", "-1", "-t", String(DUREE), "-i", join(SONS, `${DECOR.f}.mp3`),
    "-stream_loop", "-1", "-t", String(DUREE), "-i", join(SONS, `${RUMEUR.f}.mp3`),
    // La porte : le geste qui ouvre le dossier.
    "-i", join(SONS, "porte.mp3"),
    ...(VOIX ? ["-i", VOIX] : []),
    ...plan.flatMap((b) => ["-i", join(SONS, `${b.f}.mp3`)]),
  ];
  const parts = [
    `[0:a]volume=${DECOR.v},afade=t=in:st=0:d=1.5[d]`,
    `[1:a]volume=${RUMEUR.v},afade=t=in:st=0:d=1.5[r]`,
    `[2:a]volume=0.55,adelay=200|200[p]`,
    ...(VOIX ? [`[3:a]volume=1.0,adelay=${Math.round(VOIX_A*1000)}|${Math.round(VOIX_A*1000)}[voix]`] : []),
    ...plan.map((b, i) => {
      const ms = Math.round(b.t * 1000);
      return `[${i + 3 + (VOIX ? 1 : 0)}:a]volume=${b.v},adelay=${ms}|${ms}[v${i}]`;
    }),
  ];
  const etiquettes = ["[d]", "[r]", "[p]", ...(VOIX ? ["[voix]"] : []), ...plan.map((_, i) => `[v${i}]`)].join("");
  parts.push(`${etiquettes}amix=inputs=${plan.length + 3 + (VOIX ? 1 : 0)}:duration=first:normalize=0[out]`);

  const cible = join(SORTIE, `mix-${nom}.mp3`);
  await run("ffmpeg", [
    "-y", ...entrees, "-filter_complex", parts.join(";"),
    "-map", "[out]", "-t", String(DUREE), "-codec:a", "libmp3lame", "-q:a", "3", cible,
  ]);
  console.log(
    `mix-${nom.padEnd(20)} ${DUREE} s  ${String(plan.length).padStart(2)} bruits  `
    + `(${plan.map((b) => b.f.replace("bruit-", "")).join(", ")})`,
  );
}
