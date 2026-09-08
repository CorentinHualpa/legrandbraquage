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
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

test("aucun bruit de vie ne dépasse le volume d'une ambiance forte", () => {
  // Un bruit de fond plus fort que le décor cesse d'être un fond.
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
