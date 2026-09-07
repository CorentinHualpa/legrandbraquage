/**
 * Le régime du professionnel libéral réglementé relevant de la CIPAV.
 *
 * Même contrat de sortie que `salaire.js`, `fonction-publique.js` et `tns.js`,
 * pour que la projection de carrière n'ait pas à savoir lequel elle déroule.
 *
 * Il partage avec l'artisan l'assiette unique, la maladie, les allocations
 * familiales et la CSG-CRDS, et il en diffère sur les quatre postes de
 * retraite et de prévoyance. Ces quatre postes suffisent à retourner le
 * résultat : le libéral paie MOINS jusqu'à environ 1,5 plafond d'assiette et
 * BEAUCOUP plus au-dessus, parce que sa retraite de base est deux fois moins
 * chère et sa complémentaire deux fois plus.
 *
 * Comme l'artisan, il n'a AUCUNE part employeur.
 */

import {
  ALLOCATIONS_FAMILIALES,
  CFP,
  CSG_CRDS,
  IJ,
  IJ_RETRANCHEE_DE_LA_MALADIE,
  INVALIDITE_DECES,
  MALADIE,
  PASS_ANNUEL,
  PLANCHER_RETRAITE_BASE,
  POINTS_BASE,
  RETRAITE_BASE,
  RETRAITE_COMPLEMENTAIRE,
} from './baremes-cipav.js';
import { assietteUnique, tauxAllocationsFamiliales, tauxMaladie } from './tns.js';

const borne = (x, bas, haut) => Math.min(Math.max(x, bas), haut);

// L'assiette et les deux taux progressifs sont ceux de l'artisan, à l'identique.
// Ils sont réexportés pour que ce module se lise seul, jamais réécrits.
export { assietteUnique, tauxAllocationsFamiliales, tauxMaladie };

/**
 * Toutes les cotisations et contributions dues sur une année, en euros annuels.
 *
 * @param {number} revenuBrutSocial annuel
 */
export function cotisationsAnnuelles(revenuBrutSocial) {
  const { abattement, assiette: a } = assietteUnique(revenuBrutSocial);

  const ij = IJ.taux * borne(a, IJ.plancherPass * PASS_ANNUEL, IJ.plafondPass * PASS_ANNUEL);

  const maladieTotale =
    tauxMaladie(a) * Math.min(a, 3 * PASS_ANNUEL)
    + MALADIE.tauxAuDela3Pass * Math.max(0, a - 3 * PASS_ANNUEL);
  // ⚠ Contrairement à l'artisan, le modèle officiel de la CIPAV ne retranche
  // PAS les indemnités journalières de la cotisation maladie : elles s'ajoutent.
  const maladie = IJ_RETRANCHEE_DE_LA_MALADIE ? Math.max(0, maladieTotale - ij) : maladieTotale;

  const assietteRetraite = Math.max(a, PLANCHER_RETRAITE_BASE);
  // ⚠ Les DEUX tranches portent sur la même assiette : T2 court de 0 à 5 PASS,
  // pas de 1 à 5. C'est ce que confirme la cotisation minimale publiée.
  const retraiteBase =
    RETRAITE_BASE.t1 * Math.min(assietteRetraite, RETRAITE_BASE.plafondT1Pass * PASS_ANNUEL)
    + RETRAITE_BASE.t2 * Math.min(assietteRetraite, RETRAITE_BASE.plafondT2Pass * PASS_ANNUEL);

  const retraiteComplementaire =
    RETRAITE_COMPLEMENTAIRE.t1 * Math.min(a, PASS_ANNUEL)
    + RETRAITE_COMPLEMENTAIRE.t2
      * borne(a - PASS_ANNUEL, 0, (RETRAITE_COMPLEMENTAIRE.plafondPass - 1) * PASS_ANNUEL);

  const invaliditeDeces =
    INVALIDITE_DECES.taux
    * borne(
      a,
      INVALIDITE_DECES.plancherPass * PASS_ANNUEL,
      INVALIDITE_DECES.plafondPass * PASS_ANNUEL,
    );

  const lignes = {
    maladie,
    ij,
    retraiteBase,
    retraiteComplementaire,
    invaliditeDeces,
    allocationsFamiliales: tauxAllocationsFamiliales(a) * a,
    csgDeductible: CSG_CRDS.deductible * a,
    csgNonDeductible: CSG_CRDS.nonDeductible * a,
    formation: CFP.taux * PASS_ANNUEL,
  };

  const total = Object.values(lignes).reduce((t, x) => t + x, 0);

  return {
    lignes,
    total,
    taux: revenuBrutSocial > 0 ? total / revenuBrutSocial : 0,
    abattement,
    assiette: a,
  };
}

/** Contrat commun : côté agent, tout. Rendu en euros MENSUELS. */
export function retenuesSalariales(revenuBrutSocialMensuel) {
  const annuel = cotisationsAnnuelles(revenuBrutSocialMensuel * 12);
  const lignes = Object.fromEntries(
    Object.entries(annuel.lignes).map(([k, v]) => [k, v / 12]),
  );
  return {
    lignes,
    total: annuel.total / 12,
    taux: annuel.taux,
    assiette: annuel.assiette / 12,
    abattement: annuel.abattement / 12,
  };
}

/** Contrat commun : côté employeur, RIEN. Un libéral n'a pas d'employeur. */
export function cotisationsPatronales() {
  return { lignes: {}, total: 0, taux: 0, reduction: 0 };
}

export function coutEmployeur(revenuBrutSocialMensuel) {
  return revenuBrutSocialMensuel;
}

export function netsDepuisBrut(revenuBrutSocialMensuel) {
  const r = retenuesSalariales(revenuBrutSocialMensuel);
  const netAvantImpot = revenuBrutSocialMensuel - r.total;
  // La CSG-CRDS non déductible reste dans l'assiette de l'impôt : même règle
  // que l'artisan, et le retirer par erreur allège l'impôt de 2,9 points.
  const netImposable = revenuBrutSocialMensuel - r.total + r.lignes.csgNonDeductible;
  return { netAvantImpot, netImposable, retenues: r };
}

/**
 * Inversion du revenu disponible vers le revenu brut social.
 *
 * Par dichotomie, pour la même raison que chez l'artisan : le taux effectif est
 * affine par morceaux, avec une dizaine de ruptures. Une formule fermée valable
 * sur un morceau se trompe silencieusement sur les autres.
 */
export function brutDepuisNet(netCible, opts = {}) {
  const { cible = 'avantImpot', calculerImpot } = opts;
  let bas = netCible;
  let haut = netCible * 3 + 10000;

  const netPour = (rbs) => {
    const { netAvantImpot, netImposable } = netsDepuisBrut(rbs);
    if (cible === 'apresImpot' && calculerImpot) {
      return netAvantImpot - calculerImpot(netImposable * 12) / 12;
    }
    return netAvantImpot;
  };

  for (let i = 0; i < 80; i += 1) {
    const milieu = (bas + haut) / 2;
    if (netPour(milieu) < netCible) bas = milieu;
    else haut = milieu;
  }
  return (bas + haut) / 2;
}

/** Les points de retraite de BASE acquis sur une année d'assiette donnée. */
export function pointsDeBase(assietteAnnuelle) {
  const t1 = Math.min(
    Math.min(assietteAnnuelle, PASS_ANNUEL) / POINTS_BASE.revenuParPointT1,
    POINTS_BASE.pointsMaxT1,
  );
  const t2 = Math.min(
    Math.min(assietteAnnuelle, 5 * PASS_ANNUEL) / POINTS_BASE.revenuParPointT2,
    POINTS_BASE.pointsMaxT2,
  );
  return t1 + t2;
}

/**
 * La pension d'un libéral CIPAV, calculée par les RÈGLES, dans les DEUX étages.
 *
 * C'est la différence structurelle avec l'artisan, et elle n'est pas cosmétique :
 * depuis 2020 la retraite de base d'un artisan est celle du régime général, la
 * moitié du revenu moyen de ses vingt-cinq meilleures années. Celle d'un libéral
 * reste un régime par POINTS, sur TOUTE la carrière. Une mauvaise année pèse
 * donc sur un libéral et disparaît chez un artisan.
 *
 * @param {number[]} assiettesAnnuelles l'assiette de chaque année de carrière
 * @param {number[]} cotisationsComplementaires la ligne complémentaire, par année
 * @param {{tauxLiquidation?: number}} [opts]
 */
export function pension(assiettesAnnuelles, cotisationsComplementaires, opts = {}) {
  const { tauxLiquidation = 1 } = opts;

  const pointsBase = assiettesAnnuelles.reduce((t, a) => t + pointsDeBase(a), 0);
  const base =
    (pointsBase * POINTS_BASE.valeurServicePoint * Math.min(1, tauxLiquidation)) / 12;

  const points = cotisationsComplementaires.reduce(
    (t, c) => t + c / RETRAITE_COMPLEMENTAIRE.valeurAchatPoint,
    0,
  );
  const complementaire = (points * RETRAITE_COMPLEMENTAIRE.valeurServicePoint) / 12;

  return {
    /** Voir l'avertissement de `tns.js` : l'écran discrimine là-dessus. */
    regime: 'cipav',
    base,
    complementaire,
    points,
    pointsBase,
    totale: base + complementaire,
    anneesRetenues: assiettesAnnuelles.length,
    /**
     * ⚠ Comme pour l'artisan, ce chiffre porte sur une carrière ENTIÈRE passée
     * dans le régime. Un libéral CIPAV polypensionné, ce qui est le cas le plus
     * fréquent, touchera moins de ce régime-ci et davantage d'un autre. La
     * comparaison avec une pension moyenne observée serait un piège de
     * population, pas une mesure.
     *
     * ⚠ Le régime de base retient un ratio publié (1 point pour 89,71 € de
     * revenus) qui ne se réconcilie pas avec le plafond publié dans la même
     * phrase (557 points). Le plafond n'est jamais atteint. Voir POINTS_BASE.
     */
    reserve: {
      quoi: 'ratio et plafond de points de base publiés incohérents entre eux',
      effet: 'la pension de base est minorée d’environ 4 %',
      source: 'fiche pratique CIPAV 2026, « Cotiser pour acquérir des droits »',
    },
  };
}
