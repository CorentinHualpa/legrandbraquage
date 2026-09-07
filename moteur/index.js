/**
 * Le Grand Braquage — moteur de calcul.
 *
 * Une seule fonction publique : simuler(). Elle rend les deux plateaux de la
 * balance et le verdict, avec le détail de chaque ligne pour que la page
 * méthodologie puisse tout afficher.
 *
 * Le code est public parce que c'est la seule façon de rendre le résultat
 * opposable. Chaque barème renvoie à son texte officiel dans baremes-2026.js.
 */

import { deroulerCarriere, totalPreleve } from './carriere.js';
import {
  capitalPourRente,
  fourchetteCapitalPourRente,
  PALIERS_ALIBI,
  placerSoiMeme,
  PLACEMENT_DEFAUT,
} from './capitalisation.js';
import { RETRAITE, SALAIRES_REFERENCE } from './baremes-2026.js';

export {
  PALIERS_ALIBI,
  ALIBI_INDICE_NU,
  capitalApresRetraits,
  PLACEMENTS,
  PLACEMENT_DEFAUT,
  placement,
  placerSoiMeme,
  reel,
} from './capitalisation.js';
export { deroulerCarriere, totalPreleve } from './carriere.js';
export { heureDeLiberation } from './liberation.js';
export * from './salaire.js';
export * from './impot.js';

/**
 * Ce que les prélèvements achètent, en équivalent capital.
 *
 * ⚠ Les trois postes hors retraite sont des ordres de grandeur assumés, à
 * remplacer par un chiffrage par décile quand on l'aura. La retraite, elle,
 * est calculée : c'est le seul poste dont le montant est défendable au centime.
 */
/** Un montant en clair, avec ses séparateurs de milliers. */
function espacer(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function contreparties(pensionMensuelle) {
  const retraite = capitalPourRente(pensionMensuelle);
  return {
    retraite: {
      montant: retraite,
      libelle: 'Une rente à vie, indexée, réversible',
      calcule: true,
      note: `capital nécessaire pour servir ${espacer(Math.round(pensionMensuelle))} €/mois à 65 ans`,
    },
    sante: {
      montant: 216000,
      libelle: 'Le droit de tomber malade sans payer',
      calcule: false,
      note: 'reste à charge des ménages le plus bas de l’Union européenne',
    },
    education: {
      montant: 127000,
      libelle: 'Douze ans d’école, sans facture',
      calcule: false,
      note: 'coût public reconstitué du CP au baccalauréat',
    },
    chomage: {
      montant: 47000,
      libelle: 'Un filet, le jour où tu es tombé',
      calcule: false,
      note: '91 % des carrières connaissent au moins un épisode indemnisé',
    },
  };
}

/**
 * Simulation complète.
 *
 * @param {object} entree
 * @param {number} entree.netMensuel ce qui arrive sur le compte
 * @param {'salarie'|'independant'|'fonctionnaire'|'tpe'} [entree.statut]
 * @param {number} [entree.ageActuel]
 * @param {boolean} [entree.cadre]
 * @param {number} [entree.effectif]
 * @param {number} [entree.parts]
 * @param {object} [entree.perimetre] quels prélèvements l'utilisateur a cochés
 */
export function simuler(entree) {
  const {
    netMensuel,
    ageActuel = 36,
    cadre = false,
    effectif = 10,
    parts = 1,
    perimetre = { salariales: true, patronales: true, impotRevenu: false, consommation: false },
  } = entree;

  if (!(netMensuel > 0)) throw new Error('netMensuel doit être positif');

  const opts = { cadre, effectif, parts, ageActuel };
  const carriere = deroulerCarriere(netMensuel, opts);

  const preleve = totalPreleve(carriere.totaux, perimetre);

  // Pension estimée au taux de remplacement du COR, appliqué au dernier net.
  const dernier = carriere.annees[carriere.annees.length - 1];
  const tauxRemplacement = cadre
    ? RETRAITE.tauxRemplacementCadre
    : RETRAITE.tauxRemplacementNonCadre;
  const pensionMensuelle = dernier.netApresImpot * tauxRemplacement;

  const recu = contreparties(pensionMensuelle);
  const totalRecu = Object.values(recu).reduce((t, c) => t + c.montant, 0);

  const ecart = preleve - totalRecu;

  return {
    entree: { netMensuel, ageActuel, cadre, effectif, parts, perimetre },
    carriere,
    plateauGauche: {
      total: preleve,
      lignes: {
        salariales: carriere.totaux.salariales,
        patronales: carriere.totaux.patronales,
        impotRevenu: carriere.totaux.impotRevenu,
        consommation: carriere.totaux.taxesConsommation,
      },
      reductionRgdu: carriere.totaux.reductionRgdu,
    },
    plateauDroit: {
      total: totalRecu,
      pensionMensuelle,
      tauxRemplacement,
      lignes: recu,
      fourchetteRetraite: fourchetteCapitalPourRente(pensionMensuelle),
    },
    verdict: {
      braquage: ecart > 0,
      ecart: Math.abs(ecart),
      libelle: ecart > 0 ? 'Braquage constaté.' : 'Braquage non constaté. Relaxe.',
    },
  };
}

/**
 * Cherche le salaire où la balance bascule, par dichotomie.
 * C'est le chiffre inédit de la page : personne ne le publie.
 */
export function salairePivot(opts = {}) {
  const perimetre = opts.perimetre
    ?? { salariales: true, patronales: true, impotRevenu: true, consommation: true };

  let bas = SALAIRES_REFERENCE.d1 * 0.7;
  let haut = SALAIRES_REFERENCE.d9 * 2;

  const braquageA = simuler({ ...opts, netMensuel: bas, perimetre }).verdict.braquage;
  const braquageB = simuler({ ...opts, netMensuel: haut, perimetre }).verdict.braquage;
  if (braquageA === braquageB) return null; // pas de bascule sur la plage

  for (let i = 0; i < 40; i += 1) {
    const milieu = (bas + haut) / 2;
    if (simuler({ ...opts, netMensuel: milieu, perimetre }).verdict.braquage === braquageA) {
      bas = milieu;
    } else {
      haut = milieu;
    }
  }
  return Math.round((bas + haut) / 2);
}

/**
 * « Et si j'avais placé cet argent moi-même ? »
 *
 * On capitalise le flux réel de cotisation vieillesse de LA carrière simulée,
 * année par année, et non un versement constant : c'est exactement l'hypothèse
 * que la partie adverse ne fait pas, et c'est elle qui déplace le résultat le
 * plus fort. Le capital obtenu se compare ensuite au capital équivalent à la
 * pension, jamais à la pension mensuelle : comparer un stock à un flux est le
 * tour de passe-passe qui fabrique l'écart de mille pour un.
 *
 * @param {ReturnType<typeof simuler>} simulation
 * @param {string} [placementId]
 */
export function placerSaRetraite(simulation, placementId = PLACEMENT_DEFAUT) {
  const versements = simulation.carriere.annees.map((a) => a.cotisationVieillesse);
  const place = placerSoiMeme(versements, placementId);
  const equivalentPension = simulation.plateauDroit.lignes.retraite.montant;

  return {
    ...place,
    equivalentPension,
    ecart: place.capital - equivalentPension,
    // true = se débrouiller seul aurait rapporté plus que la pension servie.
    gagnant: place.capital > equivalentPension,
  };
}
