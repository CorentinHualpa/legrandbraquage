/**
 * Projection d'une carrière de quarante ans, en euros constants.
 *
 * Deux principes non négociables :
 *  - on ne fige JAMAIS le salaire, sinon on fait cotiser un homme de 1990 en
 *    euros de 2026, ce qui est le biais le plus lourd du débat ;
 *  - tout est ramené en euros d'aujourd'hui, sinon on compare un capital futur
 *    à une pension actuelle.
 */

import { COURBE_AGE, CARRIERE } from './baremes-2026.js';
import { brutDepuisNet, cotisationsSalariales, cotisationsPatronales } from './salaire.js';
import { impotSurLeRevenu, taxesConsommationAnnuelles } from './impot.js';

/** Indice de salaire à un âge donné, interpolé sur la courbe INSEE. */
export function indiceAge(age) {
  if (age <= COURBE_AGE[0][0]) return COURBE_AGE[0][1];
  const dernier = COURBE_AGE[COURBE_AGE.length - 1];
  if (age >= dernier[0]) return dernier[1];

  for (let i = 0; i < COURBE_AGE.length - 1; i += 1) {
    const [a1, v1] = COURBE_AGE[i];
    const [a2, v2] = COURBE_AGE[i + 1];
    if (age >= a1 && age <= a2) {
      return v1 + ((age - a1) / (a2 - a1)) * (v2 - v1);
    }
  }
  return dernier[1];
}

/**
 * Déroule la carrière année par année.
 *
 * @param {number} netMensuelActuel ce qui arrive sur le compte aujourd'hui
 * @param {object} [opts]
 * @param {number} [opts.ageActuel] âge auquel ce salaire est constaté
 * @param {boolean} [opts.cadre]
 * @param {number} [opts.effectif]
 * @param {number} [opts.parts] parts fiscales
 */
export function deroulerCarriere(netMensuelActuel, opts = {}) {
  const {
    ageActuel = 36,
    ageDebut = CARRIERE.ageDebut,
    ageFin = CARRIERE.ageFin,
    croissance = CARRIERE.croissanceReelleGenerale,
  } = opts;

  const indiceReference = indiceAge(ageActuel);
  const annees = [];

  for (let age = ageDebut; age <= ageFin; age += 1) {
    // Effet d'âge (la carrière) et effet de génération (la croissance générale
    // des salaires) se composent, en euros constants d'aujourd'hui.
    const facteurAge = indiceAge(age) / indiceReference;
    const facteurGeneration = Math.pow(1 + croissance, age - ageActuel);
    const netApresImpot = netMensuelActuel * facteurAge * facteurGeneration;

    const brut = brutDepuisNet(netApresImpot, {
      ...opts,
      cible: 'apresImpot',
      calculerImpot: (netImposableAnnuel) => impotSurLeRevenu(netImposableAnnuel, opts),
    });

    const sal = cotisationsSalariales(brut, opts);
    const pat = cotisationsPatronales(brut, opts);
    const netAvantImpot = brut - sal.total;
    const netImposable = netAvantImpot + sal.lignes.csgNonDeductible + sal.lignes.crds;
    const ir = impotSurLeRevenu(netImposable * 12, opts);
    const tva = taxesConsommationAnnuelles(netApresImpot, opts);

    annees.push({
      age,
      brut,
      netApresImpot,
      salariales: sal.total * 12,
      patronales: pat.total * 12,
      reductionRgdu: pat.reduction * 12,
      impotRevenu: ir,
      taxesConsommation: tva,
      coutEmployeur: (brut + pat.total) * 12,
      // La cotisation vieillesse seule, pour la comparaison capitalisation.
      cotisationVieillesse:
        (sal.lignes.vieillessePlafonnee + sal.lignes.vieillesseDeplafonnee
          + sal.lignes.retraiteCompT1 + sal.lignes.retraiteCompT2
          + sal.lignes.cegT1 + sal.lignes.cegT2
          + pat.lignes.vieillessePlafonnee + pat.lignes.vieillesseDeplafonnee
          + pat.lignes.retraiteCompT1 + pat.lignes.retraiteCompT2
          + pat.lignes.cegT1 + pat.lignes.cegT2) * 12,
    });
  }

  const somme = (cle) => annees.reduce((total, a) => total + a[cle], 0);

  return {
    annees,
    totaux: {
      salariales: somme('salariales'),
      patronales: somme('patronales'),
      impotRevenu: somme('impotRevenu'),
      taxesConsommation: somme('taxesConsommation'),
      cotisationVieillesse: somme('cotisationVieillesse'),
      reductionRgdu: somme('reductionRgdu'),
    },
  };
}

/**
 * Total prélevé selon le périmètre coché.
 * C'est l'empilement que l'utilisateur pilote lui-même à l'écran.
 */
export function totalPreleve(totaux, perimetre = {}) {
  // Contrat STRICT : une clé absente vaut false. Des valeurs par défaut à true
  // font qu'un périmètre partiel embarque silencieusement des postes que
  // l'utilisateur n'a pas cochés, et le chiffre affiché ment.
  const { salariales, patronales, impotRevenu, consommation } = perimetre;
  return (salariales ? totaux.salariales : 0)
    + (patronales ? totaux.patronales : 0)
    + (impotRevenu ? totaux.impotRevenu : 0)
    + (consommation ? totaux.taxesConsommation : 0);
}
