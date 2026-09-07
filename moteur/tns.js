/**
 * Le régime du travailleur non salarié.
 *
 * Même contrat de sortie que `salaire.js` et `fonction-publique.js`, pour que la
 * projection de carrière n'ait pas à savoir quel régime elle déroule.
 *
 * Deux choses le distinguent des deux autres, et elles se voient à l'écran :
 *
 * 1. Il n'y a PAS de part employeur. Un indépendant voit cent pour cent de ce
 *    qu'il verse. La ligne « pris avant ta paie, sans te le dire » vaut donc
 *    zéro pour lui, et c'est un résultat, pas un trou dans le calcul.
 * 2. Le taux effectif dessine une CLOCHE, pas une droite : il culmine à 31,98 %
 *    au voisinage d'un plafond de sécurité sociale d'assiette, puis redescend,
 *    parce que la retraite de base se déplafonne, que l'invalidité-décès et les
 *    indemnités journalières butent sur leurs plafonds, et qu'au-delà de cinq
 *    plafonds l'abattement lui-même est plafonné.
 */

import {
  ALLOCATIONS_FAMILIALES,
  ASSIETTE,
  CFP,
  CSG_CRDS,
  IJ,
  INVALIDITE_DECES,
  MALADIE,
  PASS_ANNUEL,
  PLANCHER_RETRAITE_BASE,
  RETRAITE_BASE,
  RETRAITE_COMPLEMENTAIRE,
} from './baremes-tns.js';

const borne = (x, bas, haut) => Math.min(Math.max(x, bas), haut);

/**
 * L'assiette unique, à partir du revenu brut social annuel.
 *
 * ⚠ Le plancher et le plafond portent sur l'ABATTEMENT. Entre les deux,
 * l'assiette vaut exactement 74 % du revenu brut social.
 */
export function assietteUnique(revenuBrutSocial) {
  const abattement = Math.min(
    Math.max(ASSIETTE.abattement * revenuBrutSocial, ASSIETTE.plancherPass * PASS_ANNUEL),
    ASSIETTE.plafondPass * PASS_ANNUEL,
  );
  return { abattement, assiette: Math.max(0, revenuBrutSocial - abattement) };
}

/**
 * Le taux de la cotisation maladie, interpolé selon la position de l'assiette.
 * C'est un taux UNIQUE appliqué ensuite à toute l'assiette, pas un barème
 * marginal : voir l'avertissement de baremes-tns.js.
 */
export function tauxMaladie(assiette) {
  const part = assiette / PASS_ANNUEL;
  const p = MALADIE.paliers;
  if (part < p[0][0]) return 0;
  for (let i = 0; i < p.length - 1; i += 1) {
    const [borneBasse, tauxBas] = p[i];
    const [borneHaute, tauxHaut] = p[i + 1];
    if (part < borneHaute) {
      return tauxBas + ((tauxHaut - tauxBas) * (part - borneBasse)) / (borneHaute - borneBasse);
    }
  }
  return MALADIE.tauxPlein;
}

/** D613-1 : nul sous 110 % du PASS, plein à partir de 140 %. */
export function tauxAllocationsFamiliales(assiette) {
  const part = assiette / PASS_ANNUEL;
  if (part <= ALLOCATIONS_FAMILIALES.seuilBasPass) return 0;
  if (part >= ALLOCATIONS_FAMILIALES.seuilHautPass) return ALLOCATIONS_FAMILIALES.tauxMax;
  const largeur = ALLOCATIONS_FAMILIALES.seuilHautPass - ALLOCATIONS_FAMILIALES.seuilBasPass;
  return (ALLOCATIONS_FAMILIALES.tauxMax / largeur) * (part - ALLOCATIONS_FAMILIALES.seuilBasPass);
}

/**
 * Toutes les cotisations et contributions dues sur une année, en euros annuels.
 *
 * @param {number} revenuBrutSocial annuel
 * @param {{activite?: 'commercant'|'artisan'|'avecConjoint'}} [opts]
 */
export function cotisationsAnnuelles(revenuBrutSocial, opts = {}) {
  const { activite = 'commercant' } = opts;
  const { abattement, assiette: a } = assietteUnique(revenuBrutSocial);

  const ij = IJ.taux * borne(a, IJ.plancherPass * PASS_ANNUEL, IJ.plafondPass * PASS_ANNUEL);

  const maladieTotale =
    tauxMaladie(a) * Math.min(a, 3 * PASS_ANNUEL)
    + MALADIE.tauxAuDela3Pass * Math.max(0, a - 3 * PASS_ANNUEL);
  // Les indemnités journalières sont RETRANCHÉES de la cotisation maladie
  // totale, ce n'est pas une ligne qui s'ajoute.
  const maladie = Math.max(0, maladieTotale - ij);

  const assietteRetraite = Math.max(a, PLANCHER_RETRAITE_BASE);
  const retraiteBase =
    (RETRAITE_BASE.plafonnee + RETRAITE_BASE.deplafonnee) * Math.min(assietteRetraite, PASS_ANNUEL)
    + RETRAITE_BASE.deplafonnee * Math.max(0, assietteRetraite - PASS_ANNUEL);

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
    formation: CFP[activite] * PASS_ANNUEL,
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
export function retenuesSalariales(revenuBrutSocialMensuel, opts = {}) {
  const annuel = cotisationsAnnuelles(revenuBrutSocialMensuel * 12, opts);
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

/**
 * Contrat commun : côté employeur, RIEN.
 *
 * Ce n'est pas un trou dans le calcul, c'est le régime. Un indépendant n'a pas
 * d'employeur : il voit cent pour cent de ce qu'il verse. La ligne « pris avant
 * ta paie, sans te le dire » vaut donc zéro pour lui, et c'est ce qui rend sa
 * fiche la plus honnête des trois.
 */
export function cotisationsPatronales() {
  return { lignes: {}, total: 0, taux: 0, reduction: 0 };
}

export function coutEmployeur(revenuBrutSocialMensuel) {
  return revenuBrutSocialMensuel;
}

export function netsDepuisBrut(revenuBrutSocialMensuel, opts = {}) {
  const r = retenuesSalariales(revenuBrutSocialMensuel, opts);
  const netAvantImpot = revenuBrutSocialMensuel - r.total;
  // Revenu imposable = revenu brut social moins les cotisations, moins la CSG
  // DÉDUCTIBLE, moins la contribution formation. La CSG-CRDS non déductible
  // reste donc dans l'assiette de l'impôt : c'est le seul écart, et le retirer
  // par erreur allège l'impôt de deux points et demi d'assiette.
  const netImposable = revenuBrutSocialMensuel - r.total + r.lignes.csgNonDeductible;
  return { netAvantImpot, netImposable, retenues: r };
}

/**
 * Inversion du revenu disponible vers le revenu brut social.
 *
 * ⚠ Pas de forme fermée, et ce n'est pas un renoncement : le taux effectif est
 * affine PAR MORCEAUX, avec sept ruptures (plancher et plafond d'abattement,
 * cinq paliers de maladie, deux seuils d'allocations familiales, trois
 * plafonds). Une formule fermée valable partout n'existe pas ; une formule
 * fermée valable sur un morceau se trompe silencieusement sur les autres.
 */
export function brutDepuisNet(netCible, opts = {}) {
  const { cible = 'avantImpot', calculerImpot } = opts;
  let bas = netCible;
  let haut = netCible * 3 + 10000;

  const netPour = (rbs) => {
    const { netAvantImpot, netImposable } = netsDepuisBrut(rbs, opts);
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

/**
 * La pension d'un indépendant, calculée par les RÈGLES.
 *
 * Il n'existe aucun taux de remplacement publié pour ce régime, et c'est un
 * refus motivé de la DREES, pas un oubli : son panel ne contient aucun revenu
 * non salarié, donc la mesure est impossible. On calcule donc.
 *
 * Depuis 2020 la retraite de BASE d'un indépendant est celle du régime général :
 * la moitié du revenu annuel moyen des vingt-cinq meilleures années, chacune
 * plafonnée au plafond de sécurité sociale. La COMPLÉMENTAIRE est un régime par
 * points, dont les deux valeurs sont publiées.
 *
 * @param {number[]} assiettesAnnuelles l'assiette de chaque année de carrière
 * @param {number[]} cotisationsComplementaires la ligne complémentaire, par année
 * @param {{tauxLiquidation?: number}} [opts]
 */
export function pension(assiettesAnnuelles, cotisationsComplementaires, opts = {}) {
  const { tauxLiquidation = 1 } = opts;

  const meilleures = [...assiettesAnnuelles]
    .map((a) => Math.min(a, PASS_ANNUEL))
    .sort((x, y) => y - x)
    .slice(0, 25);
  const revenuAnnuelMoyen =
    meilleures.length > 0 ? meilleures.reduce((t, x) => t + x, 0) / meilleures.length : 0;

  const base = (revenuAnnuelMoyen * 0.5 * Math.min(1, tauxLiquidation)) / 12;

  const points = cotisationsComplementaires.reduce(
    (t, c) => t + c / RETRAITE_COMPLEMENTAIRE.valeurAchatPoint,
    0,
  );
  const complementaire = (points * RETRAITE_COMPLEMENTAIRE.valeurServicePoint) / 12;

  return {
    base,
    complementaire,
    points,
    revenuAnnuelMoyen,
    totale: base + complementaire,
    /** Nombre d'années réellement retenues : moins de 25 abaisse la moyenne. */
    anneesRetenues: meilleures.length,
    /**
     * ⚠ CE CHIFFRE DÉPASSE DE LOIN LA PENSION MOYENNE OBSERVÉE, et il faut le
     * dire avant qu'on nous le reproche.
     *
     * On simule une carrière ENTIÈRE passée en indépendant. Or c'est le cas de
     * 12 % d'entre eux seulement : 97 % des anciens artisans et 94 % des anciens
     * commerçants sont polypensionnés, et deux tiers à trois quarts ont fait
     * l'essentiel de leur carrière ailleurs. La moitié de la pension d'un ancien
     * non-salarié vient d'un régime de salariés.
     *
     * La pension moyenne basse qu'on cite partout (1 230 € pour les
     * artisans-commerçants, EIR 2020) mesure donc des carrières COURTES dans le
     * régime, pas des règles avares. Les deux chiffres sont vrais et ne portent
     * pas sur la même population.
     */
    ecartAvecLObserve: {
      pensionMoyenneObservee: 1230,
      source: 'EIR 2020, régime principal artisans-commerçants',
      pourquoi: 'carrière entière en indépendant, cas de 12 % d’entre eux seulement',
    },
  };
}
