/**
 * Impôt sur le revenu 2026 (revenus 2025), TVA et taxes de consommation.
 */

import {
  IR_TRANCHES, IR, TVA_TAUX_EFFORT, SALAIRES_REFERENCE,
} from './baremes-2026.js';

/** Abattement de 10 % pour frais professionnels, plancher et plafond compris. */
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
  const { parts = 1, couple = false } = opts;
  const revenuNetGlobal = netImposableAnnuel - abattementFraisPro(netImposableAnnuel);
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
