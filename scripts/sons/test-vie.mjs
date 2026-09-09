/**
 * Le tirage des bruits de vie, éprouvé sans navigateur.
 *
 * Pourquoi un test ici alors que le reste de la bande son n'en a pas : c'est la
 * seule partie qui peut se tromper EN SILENCE. Un acte sans aucun candidat ne
 * lève rien, il fait juste une pièce muette ; un poids mal écrit ne se voit
 * qu'au bout de plusieurs minutes d'écoute ; et le téléphone, qui est le bruit
 * le plus vite pénible, doit rester rare sans qu'on ait à le vérifier à
 * l'oreille tous les six mois.
 *
 * ⚠ Le fichier lit `src/lib/sons.ts` et en extrait les tables, plutôt que de
 * les recopier. Un test qui recopie la donnée qu'il vérifie ne vérifie rien : il
 * reste vert le jour où quelqu'un change un poids dans le vrai fichier.
 *
 *   node --test scripts/sons/test-vie.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(ici, "..", "..", "src", "lib", "sons.ts"), "utf8");

/** Rejoue `choisirBruitDeVie` à partir des tables réelles du module. */
function lireVie() {
  const bloc = source.slice(source.indexOf("const VIE: BruitDeVie[]"), source.indexOf("/** Bornes entre"));
  const vie = [];
  const re = /\{\s*fichier:\s*"([^"]+)",\s*volume:\s*([\d.]+),\s*actes:\s*\[([^\]]*)\],\s*poids:\s*(\d+)\s*\}/g;
  let m;
  while ((m = re.exec(bloc))) {
    vie.push({
      fichier: m[1],
      volume: Number(m[2]),
      actes: m[3].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean),
      poids: Number(m[4]),
    });
  }
  return vie;
}

const VIE = lireVie();

function choisir(acte, recents, hasard) {
  const duLieu = VIE.filter((b) => b.actes.includes(acte));
  if (!duLieu.length) return null;
  const candidats = duLieu.filter((b) => !recents.includes(b.fichier));
  const tirables = candidats.length ? candidats : duLieu;
  const total = tirables.reduce((n, b) => n + b.poids, 0);
  let tirage = Math.max(0, Math.min(0.999999, hasard)) * total;
  const choisi = tirables.find((b) => (tirage -= b.poids) < 0) ?? tirables[tirables.length - 1];
  return { fichier: choisi.fichier, volume: choisi.volume };
}

test("les tables ont bien été lues dans le vrai module", () => {
  assert.ok(VIE.length >= 5, `seulement ${VIE.length} bruits lus : l'extraction a cassé`);
});

test("chaque acte a de quoi vivre", () => {
  // Un acte sans candidat ne lève rien : il fait une pièce muette, et personne
  // ne s'en aperçoit avant de rester une minute dessus.
  for (const acte of ["commissariat", "scelles", "tribunal", "rue"]) {
    const n = VIE.filter((b) => b.actes.includes(acte)).length;
    assert.ok(n >= 1, `l'acte « ${acte} » n'a aucun bruit de vie`);
  }
});

test("jamais deux fois le même d'affilée, quand il y a le choix", () => {
  // C'est la répétition qui trahit la machine, pas la fréquence.
  for (const b of VIE.filter((x) => x.actes.includes("commissariat"))) {
    for (let i = 0; i < 50; i++) {
      const suivant = choisir("commissariat", [b.fichier], i / 50);
      assert.notEqual(suivant?.fichier, b.fichier);
    }
  }
});

test("un acte à un seul bruit ne devient pas MUET", () => {
  /*
   * Le défaut trouvé par ce test avant qu'il ne s'entende : écarter le dernier
   * joué ne laissait plus personne sur un acte à un seul bruit, donc le premier
   * tirage le jouait et tous les suivants rendaient le silence, définitivement.
   * On préfère l'entendre deux fois que ne plus rien entendre.
   */
  for (const acte of ["commissariat", "scelles", "tribunal", "rue"]) {
    const duLieu = VIE.filter((b) => b.actes.includes(acte));
    if (duLieu.length !== 1) continue;
    const seul = duLieu[0].fichier;
    assert.equal(choisir(acte, [seul], 0.5)?.fichier, seul, `l'acte « ${acte} » devient muet`);
  }
  assert.doesNotThrow(() => choisir("rue", ["n-existe-pas"], 0.99));
});

test("le téléphone reste le plus rare et le plus bas", () => {
  const tel = VIE.find((b) => b.fichier === "bruit-telephone");
  assert.ok(tel, "le téléphone a disparu de la table");
  const autres = VIE.filter((b) => b.fichier !== "bruit-telephone");
  for (const a of autres) {
    assert.ok(tel.poids <= a.poids, `le téléphone (poids ${tel.poids}) doit rester le plus rare`);
    assert.ok(tel.volume <= a.volume, `le téléphone (${tel.volume}) doit rester le plus bas`);
  }
});

test("aucun bruit de vie ne monte au-dessus de son plafond", () => {
  /*
   * ⚠ Ce plafond ne se compare PAS aux volumes des décors : les fichiers de vie
   * sortent du générateur vingt décibels plus fort que les nappes (la chaise à
   * -14,7 dB, le clavier court à -35,2), alors que les ambiances, elles, ont été
   * ramenées au même niveau. Comparer les deux multiplicateurs ne veut donc rien
   * dire. 0,25 est une borne mesurée sur ces fichiers-là.
   */
  for (const b of VIE) {
    assert.ok(b.volume <= 0.25, `${b.fichier} à ${b.volume} : trop fort pour un bruit de fond`);
  }
});

test("les bornes laissent respirer", () => {
  const min = Number(source.match(/VIE_MIN_MS = ([\d_]+)/)[1].replace(/_/g, ""));
  const max = Number(source.match(/VIE_MAX_MS = ([\d_]+)/)[1].replace(/_/g, ""));
  assert.ok(min >= 4_000, "sous quatre secondes, ce n'est plus une pièce vivante, c'est du bruitage");
  assert.ok(min <= 12_000, "au-delà, le commissariat sonne vide : mesuré, 22 s donnaient DEUX bruits en 75 s");
  assert.ok(max > min * 2, "un écart trop serré rend le rythme régulier, donc repérable");
});

test("chaque réplique annoncée existe vraiment sur le disque", () => {
  /*
   * Trois listes doivent rester d'accord : les écrans du parcours, le texte des
   * répliques, et les fichiers générés. Elles ne se cassent pas bruyamment :
   * un nom qui diverge donne juste un commissaire muet sur une carte, et
   * personne ne remarque un silence de plus dans un parcours de seize écrans.
   */
  const annonces = [...source
    .slice(source.indexOf("const AVEC_REPLIQUE"), source.indexOf("const AVANT_DE_PARLER_MS"))
    .matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);
  assert.ok(annonces.length >= 10, `seulement ${annonces.length} écrans lus : l'extraction a cassé`);

  const voix = join(ici, "..", "..", "public", "voix");
  for (const ecran of annonces) {
    assert.ok(existsSync(join(voix, `${ecran}.mp3`)), `public/voix/${ecran}.mp3 manque`);
  }

  const repliques = readFileSync(join(ici, "..", "voix", "repliques.mjs"), "utf8");
  const ecrits = [...repliques
    .slice(repliques.indexOf("export const REPLIQUES"), repliques.indexOf("const demandes"))
    .matchAll(/^ {2}([a-z]+):$/gm)].map((m) => m[1]);
  for (const ecran of ecrits) {
    assert.ok(annonces.includes(ecran), `« ${ecran} » est écrit mais jamais joué : absent de AVEC_REPLIQUE`);
  }
});

test("aucun fichier de voix ne date d'une version précédente du texte", async () => {
  /*
   * LE défaut qu'aucun autre contrôle n'attrape. Un mp3 qui date de la réécriture
   * d'avant est un fichier parfaitement valide : il joue, il dure le bon nombre
   * de secondes, il a la bonne voix. Il dit simplement autre chose que ce qui est
   * écrit dans `repliques.mjs`, et ça ne se remarque qu'en écoutant les vingt à
   * la suite, c'est-à-dire jamais.
   *
   * Le générateur écrit l'empreinte du texte qu'il a réellement synthétisé ; on
   * la compare ici au texte courant. Une divergence dit exactement quoi
   * régénérer, au lieu de tout refaire par précaution.
   */
  const { TOUTES } = await import(pathToFileURL(join(ici, "..", "..", "src", "lib", "repliques.ts")).href);
  const manifeste = JSON.parse(readFileSync(join(ici, "..", "..", "public", "voix", "_textes.json"), "utf8"));
  const { estAvocate } = await import(pathToFileURL(join(ici, "..", "..", "src", "lib", "repliques.ts")).href);
  // La voix fait partie de l'empreinte : changer de voix sans changer le texte
  // laisserait le manifeste vert sur un fichier dit par quelqu'un d'autre.
  const empreinte = (nom, t) => createHash("sha256").update(`${estAvocate(nom) ? "avocate" : "commissaire"}|${t}`).digest("hex").slice(0, 12);

  const perimes = Object.entries(TOUTES)
    .filter(([nom, texte]) => manifeste[nom] !== empreinte(nom, texte))
    .map(([nom]) => nom);
  assert.deepEqual(perimes, [], `à régénérer : node scripts/voix/repliques.mjs ${perimes.join(" ")}`);
});

test("chaque réplique est écrite quelque part à l'écran", async () => {
  /*
   * LA RÈGLE : tout ce qu'il DIT est écrit, l'écrit peut en dire un peu plus.
   *
   * Elle se défait sans bruit. Il suffit qu'une carte retape sa bulle à la main
   * « juste pour cette fois » et on relit un texte pendant qu'on en entend un
   * autre : c'est exactement d'où on vient (la carte du tabac parlait du café à
   * l'écran et des paquets à l'oreille).
   *
   * Le contrôle est grossier à dessein : on vérifie que chaque réplique est
   * TIRÉE de la source commune par une carte, pas qu'elle est bien placée. Un
   * test plus fin devrait lire du JSX, et il coûterait plus qu'il ne rapporte.
   */
  const { REPLIQUES } = await import(pathToFileURL(join(ici, "..", "..", "src", "lib", "repliques.ts")).href);
  const cartes = readdirSync(join(ici, "..", "..", "src", "components", "cartes"))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => readFileSync(join(ici, "..", "..", "src", "components", "cartes", f), "utf8"))
    .join("\n");

  // Les cartes à table (le café, les paliers) passent la clé en variable.
  const parVariable = [...cartes.matchAll(/\b(?:dit|texte)\((poste|ecran)\)/g)].length > 0;
  const muettes = Object.keys(REPLIQUES).filter(
    (nom) => !cartes.includes(`dit("${nom}")`) && !cartes.includes(`texte("${nom}")`),
  );
  // L'aparté n'a pas de bulle : ses deux phrases sont mises en page à part,
  // depuis la même source (`APARTE`).
  const tolerees = [
    ...(parVariable ? ["tabac", "carburant", "alcool", "ecole", "sante", "chomage"] : []),
    ...(cartes.includes("APARTE.fort") ? ["aparte"] : []),
  ];
  assert.deepEqual(
    muettes.filter((n) => !tolerees.includes(n)),
    [],
    "ces répliques ne sont écrites nulle part : on les entend sans les lire",
  );
});

test("une réaction n'ouvre pas sur le mot qui ouvre la carte suivante", async () => {
  /*
   * Les quatre réactions sont suivies, deux secondes après, de la carte du
   * tabac. Une réaction qui ouvre sur le même mot qu'elle donne « Bon… » puis
   * « Bon… », et c'est le genre de défaut qui n'existe dans AUCUN des deux
   * textes pris séparément : il n'apparaît qu'enchaîné, donc on ne le voit pas
   * en relisant, on l'entend une fois le parcours joué.
   */
  const { REPLIQUES, REACTIONS, texte } = await import(
    pathToFileURL(join(ici, "..", "..", "src", "lib", "repliques.ts")).href
  );
  const premierMot = (t) => texte(t).split(/[\s.,!?]+/)[0].toLowerCase();
  const suivante = premierMot("tabac");

  for (const nom of Object.keys(REACTIONS)) {
    assert.notEqual(
      premierMot(nom),
      suivante,
      `« ${nom} » ouvre sur « ${suivante} », comme la carte du tabac juste après`,
    );
  }
  assert.ok(Object.keys(REPLIQUES).length > 0);
});

test("les quatre réactions à la signature sont atteignables et enregistrées", () => {
  /*
   * Trois choses doivent rester d'accord, et aucune ne fait de bruit en cassant :
   * les noms que `reactionSignature` peut rendre, la liste des répliques que le
   * moteur accepte de jouer, et les fichiers. Un nom qui diverge ne lève rien,
   * il rend juste un commissaire muet au moment le plus visible du parcours.
   */
  const parcours = readFileSync(join(ici, "..", "..", "src", "components", "Parcours.tsx"), "utf8");
  const bloc = parcours.slice(parcours.indexOf("function reactionSignature"));
  const noms = [...bloc.slice(0, bloc.indexOf("}")).matchAll(/"(signature-[a-z-]+)"/g)].map((m) => m[1]);
  assert.equal(noms.length, 4, `${noms.length} réactions lues au lieu de quatre`);

  for (const nom of noms) {
    assert.ok(source.includes(`"${nom}"`), `« ${nom} » n'est pas dans AVEC_REPLIQUE : il ne sera jamais joué`);
    assert.ok(existsSync(join(ici, "..", "..", "public", "voix", `${nom}.mp3`)), `public/voix/${nom}.mp3 manque`);
  }

  // Les seuils montent, sinon une tranche devient inatteignable sans rien casser.
  const seuils = ["SMIC_NET", "MEDIAN_NET", "HAUT_DE_LECHELLE"]
    .map((n) => Number(parcours.match(new RegExp(`const ${n} = (\\d+)`))[1]));
  for (let i = 1; i < seuils.length; i++) {
    assert.ok(seuils[i] > seuils[i - 1], `les seuils ne montent pas : ${seuils.join(" puis ")}`);
  }
});

test("la répartition suit les poids", () => {
  // Mille tirages : le clavier court (poids le plus haut) doit sortir plus
  // souvent que le téléphone (poids 1). Sans dernier joué, pour ne pas biaiser.
  const compte = new Map();
  for (let i = 0; i < 1000; i++) {
    const c = choisir("commissariat", [], i / 1000);
    compte.set(c.fichier, (compte.get(c.fichier) ?? 0) + 1);
  }
  const tel = compte.get("bruit-telephone") ?? 0;
  const clavier = compte.get("bruit-clavier-court") ?? 0;
  assert.ok(clavier > tel * 2, `clavier ${clavier} contre téléphone ${tel} : les poids ne s'appliquent pas`);
});
