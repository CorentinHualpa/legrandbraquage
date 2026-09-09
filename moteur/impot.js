/**
 * Impôt sur le revenu 2026 (revenus 2025), TVA et taxes de consommation.
 */

import {
  IR_TRANCHES, IR, TVA_TAUX_EFFORT_DECILES, SALAIRES_REFERENCE,
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
 * Taux d'effort TVA, lu sur la courbe du CPO par décile de niveau de vie.
 *
 * ⚠ LA PRÉMISSE DE LA VERSION D'AVANT ÉTAIT FAUSSE. Le commentaire annonçait
 * une courbe « proportionnelle jusqu'au 8e décile puis régressive » : cette
 * phrase appartient au rapport CPO de 2011 et elle décrit le taux rapporté à la
 * CONSOMMATION, où la TVA est effectivement plate et même légèrement
 * progressive (12,6 % en D1 contre 13,4 % en D10, Boutchenik tableau 4).
 * Rapportée au REVENU, qui est le dénominateur de ce dossier, la forme est tout
 * autre : une chute brutale de D1 à D2 (-3 points), une pente douce jusqu'à D9
 * (-2,3 points étalés sur sept déciles), puis une falaise sur le dernier décile
 * (-2,5 points d'un coup). Le dénominateur tranche le débat, et il est affiché.
 *
 * L'interpolation linéaire d'avant ratait exactement ça : elle lissait les deux
 * décrochages et se trompait de 2,1 points en D2, 1,8 en D3, 1,6 en D9.
 *
 * ⚠ DEUX APPROXIMATIONS RESTENT, et elles sont dans l'autre sens l'une de
 * l'autre, donc on ne prétend pas les compenser :
 *
 * 1. Le CPO classe les MÉNAGES par niveau de vie ; ce dossier ne connaît que le
 *    salaire d'une PERSONNE. Un célibataire et un couple au même salaire ne
 *    sont pas au même niveau de vie, et rien ici ne le rattrape.
 * 2. On ne dispose que de trois bornes de la distribution des salaires (INSEE
 *    2024, privé, net EQTP) : le premier décile, la médiane et le neuvième
 *    décile. Le rang entre ces bornes est donc interpolé, faute d'avoir les
 *    neuf seuils. Ce sont les BORNES qui manquent, pas les taux.
 */
export function tauxEffortTva(netMensuel) {
  return tauxTvaPourRang(rangDecimal(netMensuel));
}

/**
 * Place un salaire sur une échelle de déciles continue, entre 1 et 10.
 *
 * Trois ancrages publiés, et rien entre eux : d1 -> 1, médiane -> 5, d9 -> 9.
 * Au-delà du neuvième décile la distribution est ouverte, donc il n'existe
 * aucune borne à viser : on prolonge la dernière pente (un décile par tranche
 * de (d9 - médiane) / 4) et on s'arrête à 10. C'est une convention, elle est
 * écrite ici plutôt que devinée à la lecture.
 */
function rangDecimal(netMensuel) {
  const { d1, median, d9 } = SALAIRES_REFERENCE;
  if (netMensuel <= d1) return 1;
  if (netMensuel <= median) return 1 + (4 * (netMensuel - d1)) / (median - d1);
  if (netMensuel <= d9) return 5 + (4 * (netMensuel - median)) / (d9 - median);
  const pasParDecile = (d9 - median) / 4;
  return Math.min(10, 9 + (netMensuel - d9) / pasParDecile);
}

/** Lit la table du CPO au rang demandé, en interpolant entre deux déciles. */
function tauxTvaPourRang(rang) {
  const table = TVA_TAUX_EFFORT_DECILES;
  if (rang <= table[0].decile) return table[0].taux;
  const dernier = table[table.length - 1];
  if (rang >= dernier.decile) return dernier.taux;
  const i = Math.floor(rang) - 1;
  const bas = table[i];
  const haut = table[i + 1];
  return bas.taux + (rang - bas.decile) * (haut.taux - bas.taux);
}

/**
 * Taxes de consommation payées sur une année, à partir du revenu disponible.
 * Couvre la TVA et, par le même taux d'effort, les accises sur les carburants,
 * le tabac, l'alcool et l'électricité, plus la taxe foncière moyenne.
 */
export function taxesConsommationAnnuelles(revenuDisponibleMensuel, opts = {}) {
  /*
   * DEUX quantités différentes, et les confondre était un défaut silencieux.
   *
   * L'ASSIETTE est le revenu disponible : c'est le dénominateur du CPO, et
   * c'est ce dont on vit. Le RANG, lui, dit dans quel décile on se situe, et il
   * se lit sur le salaire AVANT impôt, parce que les bornes de SALAIRES_REFERENCE
   * sont des nets EQTP avant impôt (INSEE 2024). Positionner un revenu après
   * impôt contre des seuils d'avant impôt classait tout le monde un cran trop
   * bas et gonflait son taux : même famille que l'erreur de dénominateur déjà
   * payée en comparant le pivot à la médiane INSEE.
   *
   * Sans `salairePourRang`, on retombe sur l'assiette : un appelant qui n'a
   * qu'un chiffre garde le comportement d'avant plutôt que de lever.
   */
  const { tauxEffort, salairePourRang } = opts;
  const taux = tauxEffort ?? tauxEffortTva(salairePourRang ?? revenuDisponibleMensuel);
  return revenuDisponibleMensuel * 12 * taux;
}
