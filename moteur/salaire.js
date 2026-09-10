/**
 * Du net au coût employeur, et retour.
 *
 * Vérifié contre l'API publique du simulateur officiel de l'URSSAF
 * (mon-entreprise.urssaf.fr) sur cinq points de salaire : voir test.mjs.
 */

import {
  PSS_MENSUEL, PASS_ANNUEL, SALARIAL, PATRONAL, RGDU, RGDU_SMIC_REFERENCE_ANNUEL,
} from './baremes-2026.js';

/** Tranches Agirc-Arrco pour un brut mensuel. */
function tranches(brut) {
  const t1 = Math.min(brut, PSS_MENSUEL);
  const t2 = Math.max(0, Math.min(brut, 8 * PSS_MENSUEL) - PSS_MENSUEL);
  return { t1, t2 };
}

/**
 * Cotisations salariales mensuelles, ligne par ligne.
 * @param {number} brut brut mensuel
 * @param {{cadre?: boolean}} [opts]
 */
export function cotisationsSalariales(brut, opts = {}) {
  const { cadre = false } = opts;
  const { t1, t2 } = tranches(brut);
  const assietteCsg = Math.min(brut, PASS_ANNUEL / 12 * 4) * SALARIAL.abattementCsg
    + Math.max(0, brut - PASS_ANNUEL / 12 * 4);

  const lignes = {
    vieillessePlafonnee: t1 * SALARIAL.vieillessePlafonnee,
    vieillesseDeplafonnee: brut * SALARIAL.vieillesseDeplafonnee,
    retraiteCompT1: t1 * SALARIAL.retraiteCompT1,
    retraiteCompT2: t2 * SALARIAL.retraiteCompT2,
    cegT1: t1 * SALARIAL.cegT1,
    cegT2: t2 * SALARIAL.cegT2,
    // La CET n'est due QUE si la rémunération dépasse le plafond.
    cet: brut > PSS_MENSUEL ? (t1 + t2) * SALARIAL.cet : 0,
    apec: cadre ? Math.min(t1 + t2, 4 * PSS_MENSUEL) * SALARIAL.apec : 0,
    csgDeductible: assietteCsg * SALARIAL.csgDeductible,
    csgNonDeductible: assietteCsg * SALARIAL.csgNonDeductible,
    crds: assietteCsg * SALARIAL.crds,
  };

  const total = Object.values(lignes).reduce((a, b) => a + b, 0);
  return { lignes, total, taux: total / brut };
}

/**
 * Coefficient de la réduction générale dégressive unique.
 * Nul au-delà de 3 SMIC, plafonné à Tmin + Tdelta en dessous du SMIC.
 */
export function coefficientRgdu(brutAnnuel, opts = {}) {
  const { effectif = 10 } = opts;
  const tdelta = effectif < 50 ? RGDU.tdeltaMoins50 : RGDU.tdelta50EtPlus;
  const tmax = RGDU.tmin + tdelta;

  if (brutAnnuel >= RGDU.sortieEnSmic * RGDU_SMIC_REFERENCE_ANNUEL) return 0;

  const ratio = (RGDU.sortieEnSmic * RGDU_SMIC_REFERENCE_ANNUEL) / brutAnnuel;
  const base = 0.5 * (ratio - 1);
  const coef = RGDU.tmin + tdelta * Math.pow(base, RGDU.exposant);
  return Math.min(Math.round(coef * 10000) / 10000, tmax);
}

/** Montant mensuel de la RGDU. */
export function reductionRgdu(brut, opts = {}) {
  return brut * coefficientRgdu(brut * 12, opts);
}

/**
 * Cotisations patronales mensuelles, RGDU déduite.
 * @param {number} brut brut mensuel
 * @param {{cadre?: boolean, effectif?: number, tauxAtmp?: number, sansChomage?: boolean}} [opts]
 */
export function cotisationsPatronales(brut, opts = {}) {
  const { cadre = false, effectif = 10, tauxAtmp = PATRONAL.atmpMoyen, sansChomage = false } = opts;
  const { t1, t2 } = tranches(brut);
  const plafondChomage = (4 * PASS_ANNUEL) / 12;
  const assietteChomage = Math.min(brut, plafondChomage);

  const lignes = {
    maladie: brut * PATRONAL.maladie,
    allocationsFamiliales: brut * PATRONAL.allocationsFamiliales,
    vieillessePlafonnee: t1 * PATRONAL.vieillessePlafonnee,
    vieillesseDeplafonnee: brut * PATRONAL.vieillesseDeplafonnee,
    atmp: brut * tauxAtmp,
    /*
     * ⚠ UN MANDATAIRE SOCIAL N'EST PAS ASSURÉ CONTRE LE CHÔMAGE, donc il ne
     * cotise pas. Un président de SAS ou de SASU est assimilé salarié pour la
     * sécurité sociale, mais il est hors du champ de l'assurance chômage faute
     * de contrat de travail, et hors du champ de l'AGS pour la même raison :
     * l'AGS garantit des créances SALARIALES, il n'en a pas.
     *
     * Le moteur les lui facturait quand même, alors que le bouton du parcours
     * annonce « vous cotisez comme un salarié, SANS l'assurance chômage » : le
     * site se contredisait, et dans le sens qui gonfle le braquage.
     */
    chomage: sansChomage ? 0 : assietteChomage * PATRONAL.chomage,
    ags: sansChomage ? 0 : assietteChomage * PATRONAL.ags,
    retraiteCompT1: t1 * PATRONAL.retraiteCompT1,
    retraiteCompT2: t2 * PATRONAL.retraiteCompT2,
    cegT1: t1 * PATRONAL.cegT1,
    cegT2: t2 * PATRONAL.cegT2,
    cet: brut > PSS_MENSUEL ? (t1 + t2) * PATRONAL.cet : 0,
    apec: cadre ? Math.min(t1 + t2, 4 * PSS_MENSUEL) * PATRONAL.apec : 0,
    fnal: effectif < 50 ? t1 * PATRONAL.fnalMoins50 : brut * PATRONAL.fnal50EtPlus,
    csa: brut * PATRONAL.csa,
    dialogueSocial: brut * PATRONAL.dialogueSocial,
    cfp: brut * (effectif < 11 ? PATRONAL.cfpMoins11 : PATRONAL.cfp11EtPlus),
    taxeApprentissage: brut * PATRONAL.taxeApprentissage,
  };

  const brutTotal = Object.values(lignes).reduce((a, b) => a + b, 0);
  const reduction = reductionRgdu(brut, opts);
  const total = brutTotal - reduction;

  return { lignes, brutTotal, reduction, total, taux: total / brut };
}

/**
 * Net avant impôt et net imposable, à partir du brut.
 * Le net imposable réintègre la CSG non déductible et la CRDS.
 */
export function netsDepuisBrut(brut, opts = {}) {
  const sal = cotisationsSalariales(brut, opts);
  const netAvantImpot = brut - sal.total;
  const netImposable = netAvantImpot + sal.lignes.csgNonDeductible + sal.lignes.crds;
  return { netAvantImpot, netImposable, salariales: sal };
}

/**
 * Coût total employeur.
 */
export function coutEmployeur(brut, opts = {}) {
  const pat = cotisationsPatronales(brut, opts);
  return { cout: brut + pat.total, patronales: pat };
}

/**
 * Inversion : trouve le brut mensuel qui produit un net donné.
 * Par dichotomie, parce que les tranches et la RGDU rendent la relation
 * non linéaire par morceaux.
 *
 * @param {number} netCible net mensuel visé
 * @param {{cible?: 'avantImpot'|'apresImpot', calculerImpot?: Function}} [opts]
 */
export function brutDepuisNet(netCible, opts = {}) {
  const { cible = 'avantImpot', calculerImpot } = opts;

  const netPour = (brut) => {
    const { netAvantImpot, netImposable } = netsDepuisBrut(brut, opts);
    if (cible === 'avantImpot') return netAvantImpot;
    if (!calculerImpot) throw new Error('cible apresImpot exige calculerImpot');
    return netAvantImpot - calculerImpot(netImposable * 12) / 12;
  };

  let bas = netCible;
  let haut = netCible * 3;
  for (let i = 0; i < 80; i += 1) {
    const milieu = (bas + haut) / 2;
    if (netPour(milieu) < netCible) bas = milieu;
    else haut = milieu;
  }
  return (bas + haut) / 2;
}
