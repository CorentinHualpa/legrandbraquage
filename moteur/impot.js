/**
 * Impôt sur le revenu 2026 (revenus 2025), TVA et taxes de consommation.
 */

import {
  IR_TRANCHES, IR, TVA_TAUX_EFFORT, SALAIRES_REFERENCE,
} from './baremes-2026.js';

/**
 * Abattement de 10 % pour frais professionnels, plancher et plafond compris.
 *
 * ⚠ Il ne vaut QUE pour les traitements, salaires et pensions (CGI art. 83, 3°).
 * Un bénéfice BIC ou BNC n'y a pas droit : le revenu professionnel d'un
 * indépendant au réel est imposé tel qu'il est déclaré, et celui d'un micro a
 * déjà son abattement forfaitaire de 71, 50 ou 34 %. L'appliquer à eux le
 * cumule avec le leur.
 */
export function abattementFraisPro(netImposableAnnuel) {
  const brut = netImposableAnnuel * IR.abattementFraisPro;
  return Math.min(Math.max(brut, IR.abattementPlancher), IR.abattementPlafond);
}

/** Impôt brut sur un revenu par part, barème progressif. */
function impotParPart(revenuParPart) {
  let impot = 0;
  for (let i = IR_TRANCHES.length - 1; i >= 0; i -= 1) {
    const { plancher, taux } = IR_TRANCHES[i];
    if (revenuParPart > plancher) {
      impot += (revenuParPart - plancher) * taux;
      revenuParPart = plancher;
    }
  }
  return impot;
}

/**
 * Impôt sur le revenu annuel.
 * @param {number} netImposableAnnuel
 * @param {{parts?: number, couple?: boolean}} [opts]
 */
export function impotSurLeRevenu(netImposableAnnuel, opts = {}) {
  /*
   * ⚠ `fraisProfessionnels` vaut true par DÉFAUT parce que le cas des
   * traitements et salaires est celui de la majorité des appels et le seul où
   * l'abattement de 10 % est dû. Les régimes de non-salariés le passent
   * explicitement à false : leur revenu est un bénéfice, pas un salaire.
   *
   * Il était appliqué à TOUT LE MONDE jusqu'au 07/09/2026, ce qui allégeait
   * indûment l'impôt d'un indépendant, d'un libéral et d'un micro de 10 % de
   * leur assiette — et, chez le micro, se cumulait avec son propre abattement
   * forfaitaire.
   */
  const { parts = 1, couple = false, fraisProfessionnels = true } = opts;
  /*
   * ⚠ Un net imposable qui n'est pas un nombre est une PANNE, pas un revenu nul.
   *
   * Sans ce refus, `NaN` traversait tout le calcul et ressortait en 0 € d'impôt,
   * ce qui est un chiffre parfaitement crédible et parfaitement faux. C'est
   * exactement ce qui est arrivé au régime de l'indépendant, et rien ne l'a
   * signalé. Une donnée manquante doit casser bruyamment.
   */
  if (!Number.isFinite(netImposableAnnuel)) {
    throw new Error(
      `Net imposable non chiffrable (${netImposableAnnuel}). Un régime ne rend pas `
      + 'son net imposable : c’est un contrat manquant, pas un revenu nul.',
    );
  }
  const revenuNetGlobal = fraisProfessionnels
    ? netImposableAnnuel - abattementFraisPro(netImposableAnnuel)
    : netImposableAnnuel;
  if (revenuNetGlobal <= 0) return 0;

  const brut = impotParPart(revenuNetGlobal / parts) * parts;

  // Décote : elle efface l'impôt des premiers déciles imposables.
  const forfait = couple ? IR.decoteCouple : IR.decoteCelibataire;
  const decote = Math.max(0, forfait - IR.decoteTaux * brut);

  return Math.max(0, brut - decote);
}

/**
 * Taux d'effort TVA rapporté au revenu disponible, interpolé entre le premier
 * et le dernier décile.
 *
 * ⚠ Le CPO décrit la courbe comme proportionnelle jusqu'au 8e décile puis
 * régressive au-delà, et le tableau complet n'est pas accessible. Cette
 * interpolation linéaire est donc une APPROXIMATION assumée : elle doit être
 * signalée dans la page méthodologie, et remplacée dès qu'on récupère la
 * table Boutchenik.
 */
export function tauxEffortTva(netMensuel) {
  const bas = SALAIRES_REFERENCE.d1;
  const haut = SALAIRES_REFERENCE.d9;
  const position = Math.min(1, Math.max(0, (netMensuel - bas) / (haut - bas)));
  return TVA_TAUX_EFFORT.d1 + position * (TVA_TAUX_EFFORT.d10 - TVA_TAUX_EFFORT.d1);
}

/**
 * Taxes de consommation payées sur une année, à partir du revenu disponible.
 * Couvre la TVA et, par le même taux d'effort, les accises sur les carburants,
 * le tabac, l'alcool et l'électricité, plus la taxe foncière moyenne.
 */
export function taxesConsommationAnnuelles(netMensuel, opts = {}) {
  const { tauxEffort = tauxEffortTva(netMensuel) } = opts;
  return netMensuel * 12 * tauxEffort;
}
