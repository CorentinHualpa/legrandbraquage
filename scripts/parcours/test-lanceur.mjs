/**
 * LE COMMISSAIRE EST JOIGNABLE SUR TOUTES LES CARTES, ET ÇA SE VÉRIFIE ICI.
 *
 * Pourquoi ce test existe : `Parcours` a TROIS `return`. Deux sont des sorties
 * anticipées (la couverture, puis la déposition), le troisième porte les douze
 * cartes restantes. Le lanceur du widget n'était monté que dans le troisième,
 * donc la carte « 1 sur 14 » était la seule du parcours sans commissaire en bas
 * à droite. Rien ne le signalait : ça compile, ça passe le build, et le défaut
 * ne se voit qu'en ouvrant la page sur ce seul écran (Coq, 10/09/2026).
 *
 * Le test lit le VRAI fichier plutôt que de décrire ce qu'il devrait contenir :
 * il découpe le composant à chaque `return (`, garde les morceaux qui rendent un
 * écran (`<main className="min-h-dvh bg-nuit">`) et exige que chacun monte
 * `<Commissariat />`. Un quatrième `return` ajouté un jour sans lanceur échoue
 * ici avant d'arriver en ligne.
 *
 * L'écran de l'AVIS est la seule exception, et elle est déjà écrite dans le
 * code lui-même (`ecran === "avis" ? null : <Commissariat />`) : il porte son
 * propre widget embarqué dans le volet d'audition, deux widgets du même agent
 * sur une page font deux conversations et une bulle en double.
 *
 * La COUVERTURE est hors parcours, avant la carte 1 : c'est une affiche, pas un
 * écran de dossier, et le compteur ne la numérote pas. Elle n'a pas de lanceur,
 * volontairement, et le test l'écarte nommément pour que ce soit un choix lisible
 * et non un oubli de plus.
 *
 *   node --test scripts/parcours/test-lanceur.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const CHEMIN = join(ici, "..", "..", "src", "components", "Parcours.tsx");
const source = readFileSync(CHEMIN, "utf8");

/** L'ouverture d'écran, identique dans les trois sorties du composant. */
const ECRAN = '<main className="min-h-dvh bg-nuit">';

/**
 * Les morceaux de JSX rendus par le composant, un par `return (`.
 *
 * On coupe sur `return (` plutôt que d'analyser le TSX : un vrai parseur serait
 * plus juste mais demanderait une dépendance, et l'invariant qu'on protège est
 * grossier (un écran monte le lanceur, ou pas).
 */
function sorties() {
  return source
    .split(/\breturn \(/)
    .slice(1)
    .filter((morceau) => morceau.includes(ECRAN));
}

test("chaque sortie de Parcours rend bien un écran", () => {
  const trouvees = sorties();
  assert.ok(
    trouvees.length >= 3,
    `Attendu au moins trois sorties qui rendent ${ECRAN}, trouvé ${trouvees.length}. ` +
      "Si le composant a été restructuré, ce test doit l'être aussi.",
  );
});

test("toute sortie qui rend un écran monte le lanceur du commissaire", () => {
  for (const morceau of sorties()) {
    // La couverture est une affiche hors parcours : exception assumée.
    if (morceau.includes("<Couverture")) continue;

    const tete = morceau.slice(0, morceau.indexOf(ECRAN));
    const corps = morceau.slice(0, morceau.indexOf(ECRAN) + 4000);
    const nom =
      (corps.match(/<([A-Z][A-Za-z]*)\s/) || [])[1] || corps.slice(0, 60).replace(/\s+/g, " ");

    assert.ok(
      tete.includes("<Commissariat") || corps.includes("<Commissariat"),
      `L'écran rendu par la sortie « ${nom} » ne monte pas <Commissariat />. ` +
        "Le lanceur doit vivre sur toutes les cartes ; seul l'écran de l'avis s'en " +
        "passe, et il le fait par une condition explicite dans la même sortie.",
    );
  }
});

test("l'écran de l'avis reste la seule exception, et elle est explicite", () => {
  assert.ok(
    source.includes('ecran === "avis" ? null : <Commissariat />'),
    "La condition qui retire le lanceur sur l'écran de l'avis a disparu ou changé de " +
      "forme. Si c'est voulu, mettre ce test à jour ; sinon l'avis porte deux widgets.",
  );
});
