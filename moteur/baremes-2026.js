/**
 * Le Grand Braquage — barèmes officiels 2026.
 *
 * Chaque valeur porte sa source. Toute modification doit citer un texte
 * officiel : c'est ce fichier qui rend le simulateur opposable.
 *
 * Source complète et pièges : ../PARAMETRES-SIMULATEUR.md
 */

// ─── Plafonds ────────────────────────────────────────────────────────────────
// Arrêté du 22/12/2025, JO 23/12/2025
export const PASS_ANNUEL = 48060;
export const PSS_MENSUEL = 4005;
export const PLAFOND_4_PASS = 192240;

// Décret SMIC. Deux valeurs en 2026 : le SMIC de référence de la RGDU est
// GELÉ à celle de janvier, c'est un piège qui fausse tout le bas de l'échelle.
export const SMIC_HORAIRE_JANVIER = 12.02;
export const SMIC_MENSUEL_JANVIER = 1823.03;
export const SMIC_MENSUEL_JUIN = 1867.02;
export const RGDU_SMIC_REFERENCE_ANNUEL = 21876.4; // 12,02 × 1 820 h, PAS mensuel × 12

// ─── Cotisations salariales, secteur privé, régime général ───────────────────
// urssaf.fr/taux-cotisations-secteur-prive + agirc-arrco.fr
export const SALARIAL = {
  vieillessePlafonnee: 0.069,
  vieillesseDeplafonnee: 0.004,
  retraiteCompT1: 0.0315,
  retraiteCompT2: 0.0864,
  cegT1: 0.0086,
  cegT2: 0.0108,
  cet: 0.0014, // due UNIQUEMENT si la rémunération dépasse 1 PSS
  apec: 0.00024, // cadres seulement
  csgDeductible: 0.068,
  csgNonDeductible: 0.024,
  crds: 0.005,
  abattementCsg: 0.9825, // sur 98,25 % du brut jusqu'à 4 PASS
  chomage: 0, // supprimée en 2018-2019
};

// ─── Cotisations patronales ──────────────────────────────────────────────────
export const PATRONAL = {
  maladie: 0.13,
  allocationsFamiliales: 0.0525,
  vieillessePlafonnee: 0.0855,
  vieillesseDeplafonnee: 0.0211,
  atmpMoyen: 0.0208, // taux national net moyen ; fourchette réelle 0,16 à 35 %
  atmpPlafonneRgdu: 0.0049, // plafond retenu DANS le calcul de la RGDU
  chomage: 0.04,
  ags: 0.0025,
  retraiteCompT1: 0.0472,
  retraiteCompT2: 0.1295,
  cegT1: 0.0129,
  cegT2: 0.0162,
  cet: 0.0021,
  apec: 0.00036,
  fnalMoins50: 0.001,
  fnal50EtPlus: 0.005,
  csa: 0.003,
  dialogueSocial: 0.00016,
  cfpMoins11: 0.0055,
  cfp11EtPlus: 0.01,
  taxeApprentissage: 0.0068,
};

// ─── RGDU : la réduction générale dégressive unique ──────────────────────────
// LFSS 2026 art. 40, CSS L241-13 et D241-7, décret n° 2026-509 du 12/06/2026.
// ATTENTION : elle a REMPLACÉ la réduction Fillon et les bandeaux maladie et
// famille au 01/01/2026, et elle sort à 3 SMIC au lieu de 1,6.
export const RGDU = {
  tmin: 0.02,
  tdeltaMoins50: 0.3781,
  tdelta50EtPlus: 0.3821,
  exposant: 1.75,
  sortieEnSmic: 3,
};

// ─── Impôt sur le revenu 2026 (revenus 2025) ─────────────────────────────────
// Loi n° 2026-103 du 19/02/2026 art. 4, indexation +0,9 %
export const IR_TRANCHES = [
  { plancher: 0, taux: 0 },
  { plancher: 11600, taux: 0.11 },
  { plancher: 29579, taux: 0.3 },
  { plancher: 84577, taux: 0.41 },
  { plancher: 181917, taux: 0.45 },
];
export const IR = {
  abattementFraisPro: 0.1,
  abattementPlancher: 509,
  abattementPlafond: 14555,
  decoteCelibataire: 897,
  decoteCouple: 1483,
  decoteTaux: 0.4525,
  plafondDemiPart: 1807,
};

// ─── Consommation ────────────────────────────────────────────────────────────
// Taux d'effort TVA rapporté au REVENU DISPONIBLE (CPO, rapport Boutchenik
// 2015). ⚠ Rapportée à la consommation, la TVA est à peu près proportionnelle :
// le dénominateur choisi tranche le débat, il doit être affiché.
export const TVA_TAUX_EFFORT = { d1: 0.125, d10: 0.047 };
export const TVA_TAUX_NORMAL = 0.2;

// Part des taxes dans le prix à la pompe, TVA comprise (EU Weekly Oil Bulletin)
export const PART_TAXES_CARBURANT = 0.567;
// Part des taxes dans une facture d'électricité résidentielle (Eurostat 2025)
export const PART_TAXES_ELECTRICITE = 0.295;

// ─── Rendements et frais ─────────────────────────────────────────────────────
export const RENDEMENTS = {
  cac40GrNominal: 0.0906, // dividendes réinvestis, 1987-2026
  cac40NuNominal: 0.0572, // indice de prix seul
  cac40GrReel: 0.074, // AMF, 1988-2023, avant frais et fiscalité
  msciWorldGrossNominal: 0.0908,
  livretAMoyen15Ans: 0.016,
  fondsEuros2025: 0.026,
  immobilierFranceReel40Ans: 0.0197,
};

export const FRAIS = {
  perUcActions: 0.0271, // 0,91 % contrat + 1,80 % fonds — Banque de France OPEF
  perEtf: 0.012,
  fondsCollectifPublic: 0.002, // type AP7 suédois ou ERAFP
  perVersement: 0.0151,
  etfPea: 0.0045,
  etfCto: 0.002,
  behaviorGap: 0.012, // Morningstar Mind the Gap, 10 ans au 31/12/2025
};

export const INFLATION_MOYENNE_39_ANS = 0.0184; // FRED FRACPIALLMINMEI

// ─── Fiscalité de sortie ─────────────────────────────────────────────────────
export const PFU = 0.314; // LFSS 2026 : 12,8 % IR + 18,6 % PS
export const PS_PLACEMENT = 0.186;

// ─── Retraite ────────────────────────────────────────────────────────────────
export const RETRAITE = {
  tauxCotisationVieillesseTotal: 0.2789, // non-cadre sous plafond, 2026
  ageDepartGeneration1969: 64,
  trimestresRequis: 172,
  dureeRetraiteMoyenne: 24.75, // années
  // Taux de conversion capital → rente à 65 ans, tables TGF05, arrérages
  // mensuels, 3 % de frais sur arrérages. Le taux technique 0 % se lit en
  // termes RÉELS : il approche une rente indexée, seule comparable à une
  // pension française revalorisée sur les prix.
  tauxConversion65TGF05: 0.0344,
  tauxConversion65AvecFrais: 0.0334,
  tauxRemplacementNonCadre: 0.687, // génération 2000, COR
  tauxRemplacementCadre: 0.465,
};

// ─── Carrière ────────────────────────────────────────────────────────────────
// Courbe de salaire par âge, privé, net EQTP 2024 (INSEE séries longues).
// Indice 100 = 2 733 €/mois. ⚠ La remontée après 55 ans est un effet de
// SÉLECTION (les ouvriers sortent plus tôt de l'emploi), pas une accélération
// de carrière : on plafonne la pente pour un individu suivi.
export const COURBE_AGE = [
  [20, 53.9], [22, 62.0], [25, 74.2], [28, 86.3], [30, 89.9],
  [32, 93.4], [35, 98.7], [36, 100.1], [38, 102.4], [40, 104.7],
  [43, 108.2], [45, 110.5], [47, 111.9], [50, 113.5], [53, 115.1],
  [55, 116.2], [57, 116.8], [60, 117.2], [62, 117.4], [64, 117.5],
];

export const CARRIERE = {
  ageDebut: 22,
  ageFin: 64,
  croissanceReelleGenerale: 0.005, // INSEE 1996-2024
};

// ─── Salaires de référence (INSEE 2024, privé, net EQTP) ─────────────────────
export const SALAIRES_REFERENCE = {
  moyen: 2733,
  median: 2190,
  d1: 1492,
  d9: 4334,
};
