/**
 * Le régime du fonctionnaire.
 *
 * Même contrat de sortie que `salaire.js` pour le privé, pour que la projection
 * de carrière n'ait pas à savoir quel régime elle déroule. Ce qui change n'est
 * pas un taux, c'est l'ASSIETTE : les primes, qui pèsent environ un quart du
 * brut, sont hors de l'assiette de pension. Tout découle de là, y compris le
 * fait qu'un fonctionnaire paie moins de retenues qu'un salarié du privé ET
 * touche un taux de remplacement projeté plus faible.
 */

import {
  CSG_CRDS,
  PATRONAL_COMMUN,
  PENSION,
  RAFP,
  RETENUE_PENSION,
  VERSANTS,
} from './baremes-fonction-publique.js';
import { PLAFOND_4_PASS } from './baremes-2026.js';

export function versant(id) {
  return VERSANTS[id] ?? VERSANTS.fpt;
}

/**
 * Décompose un brut en traitement indiciaire et primes.
 * @param {number} brut mensuel
 * @param {{versant?: string, partPrimes?: number}} [opts]
 */
export function decomposer(brut, opts = {}) {
  const v = versant(opts.versant);
  const part = opts.partPrimes ?? v.partPrimes;
  const primes = brut * part;
  return { tib: brut - primes, primes, partPrimes: part };
}

/** L'assiette du régime additionnel : les primes, plafonnées à 20 % du TIB. */
export function assietteRafp(tib, primes) {
  return Math.min(primes, tib * RAFP.plafondSurTib);
}

/**
 * Retenues salariales d'un fonctionnaire titulaire.
 * Même forme de retour que `cotisationsSalariales` du privé.
 */
export function retenuesSalariales(brut, opts = {}) {
  const { tib, primes } = decomposer(brut, opts);
  const baseCsg = Math.min(brut, PLAFOND_4_PASS / 12) * CSG_CRDS.assiette
    + Math.max(0, brut - PLAFOND_4_PASS / 12);

  const lignes = {
    pension: tib * RETENUE_PENSION,
    rafp: assietteRafp(tib, primes) * RAFP.tauxAgent,
    csgDeductible: baseCsg * CSG_CRDS.csgDeductible,
    csgNonDeductible: baseCsg * CSG_CRDS.csgNonDeductible,
    crds: baseCsg * CSG_CRDS.crds,
  };

  const total = Object.values(lignes).reduce((t, x) => t + x, 0);
  return { lignes, total, taux: brut > 0 ? total / brut : 0, tib, primes };
}

/**
 * Cotisations patronales d'un employeur public.
 *
 * ⚠ Le taux obtenu est très élevé et il NE SE COMPARE PAS à celui d'un
 * employeur privé : voir l'avertissement du COR en tête de
 * baremes-fonction-publique.js. Toute surface qui affiche ce chiffre doit
 * afficher l'avertissement avec.
 *
 * Aucune réduction générale : la RGDU vise les employeurs soumis à l'obligation
 * d'adhésion à l'assurance chômage, ce que les employeurs publics ne sont pas.
 * Ils sont en auto-assurance, donc leur coût de chômage existe mais ne figure
 * sur aucune ligne : la comparaison des parts patronales est biaisée EN FAVEUR
 * du public tant qu'on ne le dit pas.
 */
export function cotisationsPatronales(brut, opts = {}) {
  const v = versant(opts.versant);
  const { tib, primes } = decomposer(brut, opts);

  const lignes = {
    pension: tib * v.contributionPension,
    ati: tib * v.ati,
    rafp: assietteRafp(tib, primes) * RAFP.tauxEmployeur,
    feh: tib * v.feh,
    maladie: brut * v.maladie,
    contributionSolidariteAutonomie: brut * PATRONAL_COMMUN.contributionSolidariteAutonomie,
    allocationsFamiliales: brut * PATRONAL_COMMUN.allocationsFamiliales,
    fnal: brut * PATRONAL_COMMUN.fnal,
    formation: brut * v.formation,
  };

  const total = Object.values(lignes).reduce((t, x) => t + x, 0);
  return {
    lignes,
    total,
    taux: brut > 0 ? total / brut : 0,
    // Aucune réduction : la clé existe pour que le contrat de sortie soit le
    // même que celui du privé, et elle vaut zéro pour une raison de droit.
    reduction: 0,
  };
}

/** Ce que le poste coûte réellement à l'employeur public. */
export function coutEmployeur(brut, opts = {}) {
  return brut + cotisationsPatronales(brut, opts).total;
}

/** Nets mensuels, avant et après impôt sur le revenu. */
export function netsDepuisBrut(brut, opts = {}) {
  const r = retenuesSalariales(brut, opts);
  const netAvantImpot = brut - r.total;
  // Le net imposable réintègre la CSG non déductible et la CRDS, comme au privé.
  const netImposable = netAvantImpot + r.lignes.csgNonDeductible + r.lignes.crds;
  return { netAvantImpot, netImposable, retenues: r };
}

/**
 * Inversion net vers brut.
 *
 * Toutes les retenues sont proportionnelles au brut à part fixe de primes, donc
 * l'inversion a une forme FERMÉE tant qu'on reste sous quatre plafonds et que
 * le plafond RAFP est atteint. On résout quand même par itération : le plafond
 * de CSG et celui du RAFP introduisent deux ruptures, et une formule fermée qui
 * les ignore se trompe sans prévenir sur les hauts traitements et sur les
 * agents à très faibles primes.
 */
export function brutDepuisNet(netCible, opts = {}) {
  const { cible = 'avantImpot', calculerImpot } = opts;
  let brut = netCible * 1.3;

  for (let i = 0; i < 60; i += 1) {
    const { netAvantImpot, netImposable } = netsDepuisBrut(brut, opts);
    const net = cible === 'apresImpot' && calculerImpot
      ? netAvantImpot - calculerImpot(netImposable * 12) / 12
      : netAvantImpot;
    const ecart = netCible - net;
    if (Math.abs(ecart) < 0.0005) break;
    brut += ecart * 1.35;
    if (brut < 1) brut = 1;
  }
  return brut;
}

/**
 * La pension d'un fonctionnaire, calculée par les RÈGLES et non par un taux de
 * remplacement appliqué au net.
 *
 * C'est possible ici, et c'est plus défendable : la formule est publique et
 * tient en une ligne. Pension = traitement indiciaire des six derniers mois
 * × (trimestres liquidables / requis) × 75 %, primes exclues. Le régime
 * additionnel s'y ajoute, et il pèse peu.
 *
 * @param {number} tibFinalMensuel le traitement indiciaire de fin de carrière
 * @param {object} [opts]
 * @param {number} [opts.tauxLiquidation] part des trimestres requis obtenue
 * @param {number} [opts.anneesRafp] années cotisées au régime additionnel
 * @param {number} [opts.primesMensuelles] pour l'assiette du régime additionnel
 * @param {number} [opts.ageLiquidation]
 */
export function pension(tibFinalMensuel, opts = {}) {
  const {
    tauxLiquidation = 1,
    anneesRafp = 40,
    primesMensuelles = 0,
    ageLiquidation = 64,
  } = opts;

  const base = tibFinalMensuel * PENSION.tauxPlein * Math.min(1, tauxLiquidation);

  // Régime additionnel : points acquis chaque année sur l'assiette plafonnée.
  const assiette = assietteRafp(tibFinalMensuel, primesMensuelles) * 12;
  const cotisationAnnuelle = assiette * (RAFP.tauxAgent + RAFP.tauxEmployeur);
  const points = (cotisationAnnuelle / RAFP.valeurAcquisition) * anneesRafp;
  const majoration = RAFP.majoration[Math.round(ageLiquidation)] ?? 1;
  const renteRafp = (points * RAFP.valeurService * majoration) / 12;

  const totale = Math.max(base + renteRafp, PENSION.minimumGarantiMensuel);

  return {
    base,
    renteRafp,
    points,
    totale,
    /** true quand c'est le minimum garanti qui l'emporte, pas la formule. */
    minimumGaranti: base + renteRafp < PENSION.minimumGarantiMensuel,
  };
}
