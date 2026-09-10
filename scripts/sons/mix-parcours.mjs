/**
 * LE PARCOURS ENTENDU BOUT À BOUT, rendu en un fichier.
 *
 * `mix.mjs` répond à « est-ce que le commissariat sonne vivant » sur un écran
 * fixe. Celui-ci répond à la question d'après, qui est la vraie : est-ce que
 * l'ENCHAÎNEMENT tient ? On y entend ce qu'aucun réglage isolé ne montre :
 *
 *  - le commissaire qui parle par-dessus un décor qui BAISSE, et qui remonte ;
 *  - le changement de lieu (commissariat, scellés, tribunal), en fondu ;
 *  - la page qu'on tourne puis, une seconde après, sa voix ;
 *  - le greffier qui tape juste après une saisie.
 *
 * ⚠ Les tables ne sont PAS recopiées : elles sont lues dans `src/lib/sons.ts`.
 * Un mix qui aurait ses propres volumes finirait par juger un mixage qui
 * n'existe nulle part, ce qui est pire que pas de mix du tout.
 *
 *   node scripts/sons/mix-parcours.mjs
 *   NIVEAU=discret node scripts/sons/mix-parcours.mjs
 *
 * `NIVEAU` fait varier les NAPPES seules, autour de ce que le module contient
 * (`juste` = exactement le code). C'est le seul réglage qui ne se décide pas au
 * raisonnement : un fond se juge en écoutant une voix par-dessus, jamais sur un
 * nombre.
 *
 * Écrit `scripts/sons/_mix/parcours-<niveau>.mp3`. Fichier d'écoute, PAS un
 * livrable : `_mix` est ignoré par git.
 */
import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ici = dirname(fileURLToPath(import.meta.url));
const racine = join(ici, "..", "..");
const SONS = join(racine, "public", "sons");
const VOIX = join(racine, "public", "voix");
const SORTIE = process.env.SORTIE ?? join(ici, "_mix");
const source = readFileSync(join(racine, "src", "lib", "sons.ts"), "utf8");

/** Autour du code : quatre décibels de moins, ou quatre de plus. */
const NIVEAUX = { discret: 0.63, juste: 1, present: 1.6 };
const NIVEAU = process.env.NIVEAU ?? "juste";
if (!(NIVEAU in NIVEAUX)) throw new Error(`NIVEAU inconnu : ${NIVEAU}. Connus : ${Object.keys(NIVEAUX).join(", ")}`);
const NAPPE = NIVEAUX[NIVEAU];

/* ---------- ce que le module dit vraiment ---------- */

const nombre = (nom) => Number(source.match(new RegExp(`${nom} = ([\\d._]+)`))[1].replace(/_/g, ""));
const DUCK = nombre("DUCK");
const AVANT_DE_PARLER = nombre("AVANT_DE_PARLER_MS") / 1000;
const ENTRE_DEUX = nombre("ENTRE_DEUX_REPLIQUES_MS") / 1000;
const VIE_MIN = nombre("VIE_MIN_MS") / 1000;
const VIE_MAX = nombre("VIE_MAX_MS") / 1000;

const DECORS = Object.fromEntries(
  [...source.matchAll(/(\w+): \{ fichier: "(ambiance-[\w-]+)", volume: ([\d.]+) \}/g)]
    .map((m) => [m[1], { f: m[2], v: Number(m[3]) }]),
);
const RUMEUR = (() => {
  const m = source.match(/const RUMEUR = \{ fichier: "([\w-]+)", volume: ([\d.]+) \}/);
  return { f: m[1], v: Number(m[2]) };
})();
const VIE = [...source
  .slice(source.indexOf("const VIE: BruitDeVie[]"), source.indexOf("/** Bornes entre"))
  .matchAll(/fichier: "([^"]+)", volume: ([\d.]+), actes: \[([^\]]*)\], poids: (\d+)/g)]
  .map((m) => ({
    f: m[1],
    v: Number(m[2]),
    actes: m[3].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean),
    poids: Number(m[4]),
  }));

/* ---------- la visite qu'on rejoue ---------- */

/**
 * Six écrans choisis pour ce qu'ils font ENTENDRE, pas pour raconter l'histoire :
 * deux changements de lieu, une saisie au clavier, et la réplique la plus longue
 * du parcours (la libération) posée juste avant un changement de décor.
 *
 * `apres` = ce que la personne fait sur la carte avant de passer à la suivante,
 * et le temps qu'elle y met.
 */
const VISITE = [
  // `reaction` : ce qu'il dit AU CLIC, avant que la carte suivante n'arrive.
  { ecran: "deposition", acte: "commissariat", geste: "long", attente: 5, reaction: "salaire-09" },
  { ecran: "tabac", acte: "commissariat", geste: "court", attente: 3 },
  { ecran: "pris", acte: "commissariat", geste: "court", attente: 3 },
  { ecran: "butin", acte: "scelles", geste: "court", attente: 3.5 },
  /*
   * ⚠ La ligne « liberation » vivait ici, sur l’acte `rue`. L’écran de
   * l’horaire a été RETIRÉ du parcours, sa réplique avec, et personne n’est
   * revenu ici : le seul outil qui sert à JUGER le mixage plantait donc à
   * son ouverture, sur un fichier absent. Retirée le 10/09/2026.
   */
  { ecran: "verdict", acte: "tribunal", geste: null, attente: 4 },
];

const FRAPPE = {
  court: { f: "bruit-clavier-court", v: 0.22, apres: 0.26 },
  long: { f: "bruit-clavier-long", v: 0.2, apres: 0.7 },
};

async function duree(fichier) {
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", fichier,
  ]);
  return Number(stdout);
}

/* ---------- on déroule la minute ---------- */

const gestes = [];   // { f, v, t }
const paroles = [];  // { fichier, t, fin }
const segments = []; // { acte, debut, fin }
let t = 1.2;
/** Avant cet instant, la réplique d'arrivée ne peut pas partir : il parle encore. */
let contrainte = 0;

for (const etape of VISITE) {
  // La page qu'on tourne : c'est le geste qui fait changer d'écran.
  gestes.push({ f: "page", v: 0.4, t });
  const dernier = segments[segments.length - 1];
  if (dernier?.acte === etape.acte) dernier.fin = t;
  else {
    if (dernier) dernier.fin = t;
    segments.push({ acte: etape.acte, debut: t, fin: t });
  }

  const fichier = join(VOIX, `${etape.ecran}.mp3`);
  const d = await duree(fichier);
  const depart = Math.max(t + AVANT_DE_PARLER, contrainte);
  paroles.push({ fichier, t: depart, fin: depart + d });
  t = depart + d;

  if (etape.geste) {
    // Le greffier tape ce qui vient d'être dit, après un temps de latence.
    const g = FRAPPE[etape.geste];
    gestes.push({ f: g.f, v: g.v, t: t + 1.4 });
    gestes.push({ f: "coche", v: 0.45, t: t + 1.2 });
  }
  t += etape.attente;

  if (etape.reaction) {
    /*
     * Le clic fait DEUX choses en même temps : il déclenche la réaction et il
     * change de carte. La réplique de la carte suivante ne coupe donc pas la
     * réaction, elle attend sa fin plus le silence du module.
     */
    const f = join(VOIX, `${etape.reaction}.mp3`);
    const dr = await duree(f);
    paroles.push({ fichier: f, t, fin: t + dr });
    contrainte = t + dr + ENTRE_DEUX;
  }
}
const FIN = t + 2;
segments[segments.length - 1].fin = FIN;

/** Le même tirage pondéré que le module, acte par acte. */
let graine = 7;
const hasard = () => ((graine = (graine * 1103515245 + 12345) % 2147483648) / 2147483648);
const vie = [];
for (const seg of segments) {
  const duLieu = VIE.filter((b) => b.actes.includes(seg.acte));
  if (!duLieu.length) continue;
  const recents = [];
  let quand = seg.debut + 2;
  while (quand < seg.fin - 1) {
    const dispo = duLieu.filter((b) => !recents.includes(b.f));
    const tirables = dispo.length ? dispo : duLieu;
    const total = tirables.reduce((n, b) => n + b.poids, 0);
    let tir = hasard() * total;
    const choisi = tirables.find((b) => (tir -= b.poids) < 0) ?? tirables[tirables.length - 1];
    vie.push({ f: choisi.f, v: choisi.v, t: quand });
    recents.push(choisi.f);
    if (recents.length > 2) recents.shift();
    quand += VIE_MIN + hasard() * (VIE_MAX - VIE_MIN);
  }
}

/**
 * L'enveloppe qui baisse le décor pendant qu'il parle.
 *
 * Un trapèze par réplique : 0,4 s pour descendre, 0,4 s pour remonter. Une
 * coupure franche du fond s'entend comme un trou, exactement ce que le fondu
 * du module évite dans le navigateur.
 */
const RAMPE = 0.4;
const enveloppe = paroles.length
  ? paroles
    .map((p) => `max(0,min(1,min((t-${p.t.toFixed(2)})/${RAMPE},(${p.fin.toFixed(2)}-t)/${RAMPE})))`)
    .join("+")
  : "0";
const auVolume = (plein) =>
  `volume=eval=frame:volume='${plein}*(1-${(1 - DUCK).toFixed(2)}*min(1,${enveloppe}))'`;

/* ---------- ffmpeg ---------- */

const entrees = [];
const parts = [];
const etiquettes = [];
const ajouter = (args, filtre, nom) => {
  entrees.push(...args);
  parts.push(`[${etiquettes.length}:a]${filtre}[${nom}]`);
  etiquettes.push(`[${nom}]`);
};

segments.forEach((seg, i) => {
  const decor = DECORS[seg.acte];
  const long = seg.fin - seg.debut + 2;
  const ms = Math.round(seg.debut * 1000);
  ajouter(
    ["-stream_loop", "-1", "-t", long.toFixed(2), "-i", join(SONS, `${decor.f}.mp3`)],
    `afade=t=in:st=0:d=1.5,afade=t=out:st=${(long - 1.5).toFixed(2)}:d=1.5,`
    + `adelay=${ms}|${ms},${auVolume(decor.v * NAPPE)}`,
    `d${i}`,
  );
  // La rumeur ne suit PAS le décor : elle n'existe que là où il y a du monde.
  if (seg.acte === "commissariat") {
    ajouter(
      ["-stream_loop", "-1", "-t", long.toFixed(2), "-i", join(SONS, `${RUMEUR.f}.mp3`)],
      `afade=t=in:st=0:d=1.5,afade=t=out:st=${(long - 1.5).toFixed(2)}:d=1.5,`
      + `adelay=${ms}|${ms},${auVolume(RUMEUR.v * NAPPE)}`,
      `r${i}`,
    );
  }
});

paroles.forEach((p, i) => {
  const ms = Math.round(p.t * 1000);
  ajouter(["-i", p.fichier], `volume=1.0,adelay=${ms}|${ms}`, `p${i}`);
});
[...gestes, ...vie].forEach((g, i) => {
  const ms = Math.round(g.t * 1000);
  ajouter(["-i", join(SONS, `${g.f}.mp3`)], `volume=${g.v},adelay=${ms}|${ms}`, `g${i}`);
});

parts.push(`${etiquettes.join("")}amix=inputs=${etiquettes.length}:duration=longest:normalize=0[out]`);

await mkdir(SORTIE, { recursive: true });
const cible = join(SORTIE, `parcours-${NIVEAU}.mp3`);
await run("ffmpeg", [
  "-y", ...entrees, "-filter_complex", parts.join(";"),
  "-map", "[out]", "-t", FIN.toFixed(2), "-codec:a", "libmp3lame", "-q:a", "3", cible,
], { maxBuffer: 1 << 24 });

console.log(`${FIN.toFixed(1)} s  ${paroles.length} répliques  ${vie.length} bruits de vie  ${segments.length} lieux`);
for (const p of paroles) console.log(`  ${p.t.toFixed(1).padStart(5)} s  ${p.fichier.split(/[\\/]/).pop()}`);
console.log(cible);
