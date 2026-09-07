/**
 * Barèmes 2026 du travailleur non salarié (artisan, commerçant, profession
 * libérale non réglementée), métropole, régime réel.
 *
 * ⚠⚠ LE FAIT LE PLUS IMPORTANT DE CE RÉGIME, et il change la méthode.
 *
 * L'API publique de mon-entreprise.urssaf.fr, qui sert d'étalon au régime du
 * salarié, sert encore l'ANCIEN barème pour l'indépendant : 17,75 % de retraite
 * de base, un plafond de retraite complémentaire à 43 891 €, et une CSG assise
 * sur l'assiette PLUS les cotisations. La réforme de l'assiette unique
 * s'applique depuis avril 2026 et les pages de barème de l'URSSAF publient les
 * nouveaux taux.
 *
 * L'étalon habituel ne peut donc PAS valider ce régime. La table de référence
 * des tests est reconstruite depuis le barème opposable, ligne par ligne, et
 * chaque taux d'entrée renvoie à son article du code de la sécurité sociale.
 * C'est moins confortable et c'est plus honnête : on vérifie contre le droit,
 * pas contre un simulateur qui a du retard.
 *
 * Détail, sources et ce qui reste NON TROUVÉ : RECHERCHE-TNS.md.
 */

import { PASS_ANNUEL, SMIC_HORAIRE_JANVIER } from './baremes-2026.js';

// ─── L'assiette unique ───────────────────────────────────────────────────────
/**
 * ⚠ Le plancher et le plafond portent sur l'ABATTEMENT, pas sur l'assiette.
 * L'erreur inverse déplace la cassure haute et se voit tout de suite : le
 * plafond doit mordre à 5 PASS PILE (62 478 / 0,26 = 240 300 €). Si votre
 * implémentation ne casse pas exactement là, un des deux chiffres est faux.
 *
 * Réforme de l'assiette unique, art. L136-3 III et D136-5 CSS.
 */
export const ASSIETTE = {
  abattement: 0.26,
  plancherPass: 0.0176,
  plafondPass: 1.3,
};

/**
 * ⚠ Le mécanisme circulaire est MORT. Avant la réforme, la CSG était assise sur
 * l'assiette PLUS les cotisations, ce qui obligeait à résoudre une équation
 * implicite. Depuis 2026, assiette des cotisations = assiette de la CSG. Tout
 * code qui itère encore pour lever la circularité résout un problème disparu.
 */
export const CIRCULARITE_SUPPRIMEE = true;

// ─── Maladie ─────────────────────────────────────────────────────────────────
/**
 * ⚠⚠ LE TAUX PROGRESSIF N'EST PAS UN BARÈME MARGINAL. C'est un taux UNIQUE,
 * interpolé selon la position de l'assiette, puis appliqué à TOUTE l'assiette.
 * Confondre les deux est l'erreur la plus fréquente du régime, et elle est
 * énorme : à 22 200 € d'assiette, un barème marginal donne environ 74 €, le
 * taux progressif donne 505 €. Un facteur 7, sur toute la plage.
 *
 * Bornes de D621-2 CSS, en part de PASS, avec le taux ATTEINT à chaque borne.
 */
export const MALADIE = {
  paliers: [
    [0.2, 0],
    [0.4, 0.015],
    [0.6, 0.04],
    [1.1, 0.065],
    [2.0, 0.077],
    [3.0, 0.085],
  ],
  tauxPlein: 0.085, // D621-1, fraction sous 3 PASS
  tauxAuDela3Pass: 0.065, // D621-1
};

/** Indemnités journalières, retranchées de la cotisation maladie. D621-3 CSS. */
export const IJ = { taux: 0.005, plancherPass: 0.4, plafondPass: 5 };

// ─── Retraite ────────────────────────────────────────────────────────────────
/** D633-3 CSS. Le déplafonné est passé de 0,60 à 0,72 % (décret 2024-688). */
export const RETRAITE_BASE = {
  plafonnee: 0.1715,
  deplafonnee: 0.0072,
  /**
   * ⚠ Le plancher retient le SMIC du 1er JANVIER, pas celui de juin. Même
   * piège que le SMIC de référence gelé de la réduction générale côté salarié.
   * D633-2 CSS : 450 fois le SMIC horaire en vigueur au 1er janvier.
   */
  plancherHeuresSmic: 450,
};

/** D635-7 CSS. ⚠ Le plafond spécifique PRCI a DISPARU : la borne est le PASS. */
export const RETRAITE_COMPLEMENTAIRE = {
  t1: 0.081, // jusqu'à 1 PASS
  t2: 0.091, // de 1 à 4 PASS
  plafondPass: 4,
  /**
   * ⚠ La page de l'URSSAF annonce 17 494 € de cotisation maximale, alors que
   * son propre barème et D635-7 donnent 17 013 €. On suit le texte.
   */
  cotisationMaximale: 17013,
  /** Barème RCI, valeurs au 01/01/2026. */
  valeurAchatPoint: 21.726,
  valeurServicePoint: 1.347,
};

/** D632-1 et D632-2 CSS. */
export const INVALIDITE_DECES = { taux: 0.013, plancherPass: 0.115, plafondPass: 1 };

/**
 * D613-1 CSS. Taux progressif, appliqué comme la maladie à TOUTE l'assiette :
 * nul sous 110 % du PASS, plein à partir de 140 %.
 */
export const ALLOCATIONS_FAMILIALES = {
  tauxMax: 0.031,
  seuilBasPass: 1.1,
  seuilHautPass: 1.4,
};

export const CSG_CRDS = {
  deductible: 0.068,
  nonDeductible: 0.029,
  total: 0.097,
};

/** Contribution à la formation professionnelle, forfaitaire, assise sur le PASS. */
export const CFP = {
  commercant: 0.0025,
  artisan: 0.0029,
  avecConjoint: 0.0034,
};

/** Plancher de retraite de base, en euros. Recalculé, jamais figé. */
export const PLANCHER_RETRAITE_BASE =
  RETRAITE_BASE.plancherHeuresSmic * SMIC_HORAIRE_JANVIER;

/**
 * Ce qu'on ne sait PAS, et qu'il ne faut pas combler de mémoire.
 *
 * Il n'existe AUCUN taux de remplacement d'artisan ou de commerçant. La DREES
 * les exclut explicitement de son champ, et écrit pourquoi : son panel ne
 * contient aucun revenu non salarié, donc la mesure est impossible. Le COR n'a
 * jamais eu de cas type artisan ni commerçant, il a signalé la lacune en 2001
 * et ne l'a pas comblée en 2026.
 *
 * D'où le choix de ce moteur : la pension d'un indépendant se CALCULE par les
 * règles, elle ne s'estime pas par un taux emprunté au salarié. C'est le seul
 * chemin défendable, et c'est celui que le rapport de recherche recommande.
 */
export const TAUX_REMPLACEMENT_TNS = null;

/** Le PASS, réexporté pour que ce fichier se lise seul. */
export { PASS_ANNUEL };
