/**
 * DES AMBIANCES QUI NE TOURNENT PAS EN BOUCLE, à écouter avant de décider.
 *
 * ⚠ Le défaut corrigé le 08/09/2026 : `public/sons/commissariat.mp3` faisait
 * 22 SECONDES et tournait en `loop` sur tout le parcours. L'oreille repère une
 * boucle de vingt secondes au deuxième passage, et seize écrans durent
 * plusieurs minutes : on l'entendait des dizaines de fois. Le prompt demandait
 * en plus « faint radio static », un grésillement CONTINU, c'est-à-dire le pire
 * contenu possible pour une boucle courte, puisque rien n'y bouge. Verdict de
 * Coq : « c'est le même grésillement qui tourne en boucle ».
 *
 * ⚠ L'API de génération plafonne à 22 secondes par appel : on ne peut donc PAS
 * demander une minute d'un coup. On génère plusieurs PRISES de la même pièce et
 * on les enchaîne en fondu avec ffmpeg. Le fondu n'est pas cosmétique : bout à
 * bout, chaque raccord fait un clic qui trahit le montage encore plus vite
 * qu'une boucle.
 *
 * Ce qui casse vraiment la perception de boucle, ce n'est pas la richesse du
 * fond, ce sont les événements RARES. Une horloge régulière s'oublie ; un
 * tiroir métallique qu'on entend une fois toutes les quarante secondes fait
 * croire à une pièce vivante.
 *
 *   node ambiances.mjs            (tout)
 *   node ambiances.mjs tribunal   (une seule)
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ici = dirname(fileURLToPath(import.meta.url));
const SORTIE = process.env.SORTIE ?? join(ici, "..", "..", "public", "sons");
const TAMPON = join(SORTIE, "_prises");

const VAULT = "C:/Users/msi/.secrets/api-keys.env";
const cle = (readFileSync(VAULT, "utf8").match(/^ELEVENLABS_API_KEY=(.+)$/m) ?? [])[1]?.trim();
if (!cle) throw new Error(`ELEVENLABS_API_KEY absent de ${VAULT}`);

const COMMUN = "no music, no intelligible voices, no speech";

/**
 * Chaque ambiance est une LISTE de prises de la même pièce. Elles décrivent le
 * même lieu avec des événements différents : c'est la variation d'une prise à
 * l'autre qui fait la durée perçue, pas la longueur du fichier.
 */
const PRISES_RUMEUR = [
  "Indistinct muffled conversation of two or three people in the next room of a police station, "
    + "heard through a wall and a closed door, no discernible words, no shouting, calm, "
    + "steady room tone underneath",
  "Distant indistinct chatter in a police station corridor, a short laugh far away, a two-way "
    + "radio squelch answered by a muffled unintelligible voice, no discernible words",
  "Low murmur of a few people talking in an adjacent office, muffled through a partition wall, "
    + "one chair moving, no discernible words, no music",
];

const AMBIANCES = {
  rumeur: {
    quoi: "La rumeur du commissariat : des voix indistinctes, sous le decor.",
    prises: PRISES_RUMEUR,
  },
  commissariat: {
    quoi: "Le bureau du commissaire, la nuit. Remplace l'actuel.",
    prises: [
      "Quiet night ambience inside an old 1970s police station office, a wall clock ticking slowly, "
        + "a very distant typewriter in another room, faint hum of a fluorescent tube, " + COMMUN,
      "Quiet night ambience inside an old police station office, a wooden chair creaking as someone "
        + "shifts weight, a metal filing drawer sliding open and shut far down the corridor, "
        + "clock ticking, " + COMMUN,
      "Quiet night ambience inside an old police station office, rain against a single window pane, "
        + "a radiator pipe knocking twice, slow clock ticking, " + COMMUN,
      "Quiet night ambience inside an old police station office, distant footsteps on a tiled "
        + "corridor passing by and fading, a telephone ringing twice far away and stopping, "
        + "clock ticking, " + COMMUN,
    ],
  },
  scelles: {
    quoi: "La salle des scellés, au sous-sol. Pour le butin et ce qui a été pris.",
    prises: [
      "Cold basement evidence storage room ambience, low fluorescent tube buzz, faint air "
        + "ventilation drone, distant water drip on concrete, " + COMMUN,
      "Cold basement evidence room, a heavy metal shelf ticking as it cools, cardboard box dragged "
        + "briefly on a concrete floor, ventilation drone, " + COMMUN,
      "Cold basement evidence room, plastic evidence bag rustling once, deep building hum, "
        + "distant door closing two floors up, " + COMMUN,
    ],
  },
  tribunal: {
    quoi: "La salle d'audience, avant le verdict. Grande, vide, sonore.",
    prises: [
      "Empty wood panelled courtroom ambience before a hearing, large reverberant room tone, "
        + "a chair scraping far away, papers being squared on a bench, " + COMMUN,
      "Empty wood panelled courtroom, a distant heavy door opening and closing with long reverb, "
        + "faint crowd shuffling in a corridor outside, " + COMMUN,
      "Empty wood panelled courtroom, a pen tapping twice on a wooden bench, deep quiet room tone "
        + "with long natural reverb, " + COMMUN,
    ],
  },
  rue: {
    quoi: "Dehors, à la sortie. Pour la libération et l'avis.",
    prises: [
      "Quiet French city street at night after rain, distant traffic hiss on wet asphalt, "
        + "occasional car passing far away, " + COMMUN,
      "Quiet city street at night, a distant night train, wind in a narrow street, water dripping "
        + "from a gutter, " + COMMUN,
      "Quiet city street at night after rain, footsteps approaching on a wet pavement and passing, "
        + "distant traffic, " + COMMUN,
    ],
  },
};


async function generer(texte, duree, influence) {
  const r = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: { "xi-api-key": cle, "content-type": "application/json" },
    body: JSON.stringify({ text: texte, duration_seconds: duree, prompt_influence: influence }),
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
  return Buffer.from(await r.arrayBuffer());
}

const demande = process.argv.slice(2);
const faire = (n) => demande.length === 0 || demande.includes(n);

await mkdir(SORTIE, { recursive: true });
await mkdir(TAMPON, { recursive: true });

for (const [nom, a] of Object.entries(AMBIANCES)) {
  if (!faire(nom)) continue;
  const fichiers = [];
  for (const [i, texte] of a.prises.entries()) {
    // 22 s : le plafond de l'API. On prend tout ce qu'elle donne.
    const buf = await generer(texte, 22, 0.3);
    const f = join(TAMPON, `${nom}-${i}.mp3`);
    await writeFile(f, buf);
    fichiers.push(f);
  }
  /*
   * Enchaînement en FONDU de 3 s entre chaque prise. Bout à bout, chaque
   * raccord ferait un clic, qui trahit le montage encore plus vite qu'une
   * boucle. Le dernier fondu reboucle sur la première prise pour que le
   * raccord de la boucle elle-même soit inaudible.
   */
  const entrees = fichiers.flatMap((f) => ["-i", f]);
  let filtre = "";
  let precedent = "0:a";
  for (let i = 1; i < fichiers.length; i++) {
    const sortie = `x${i}`;
    filtre += `[${precedent}][${i}:a]acrossfade=d=3:c1=tri:c2=tri[${sortie}];`;
    precedent = sortie;
  }
  filtre = filtre.replace(/;$/, "");
  const cible = join(SORTIE, `ambiance-${nom}.mp3`);
  await run("ffmpeg", [
    "-y", ...entrees, "-filter_complex", filtre, "-map", `[${precedent}]`,
    "-codec:a", "libmp3lame", "-q:a", "4", cible,
  ]);
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", cible,
  ]);
  console.log(`ambiance-${nom.padEnd(14)} ${Number(stdout).toFixed(0).padStart(3)} s  (${a.prises.length} prises)  ${a.quoi}`);
}


await rm(TAMPON, { recursive: true, force: true });
