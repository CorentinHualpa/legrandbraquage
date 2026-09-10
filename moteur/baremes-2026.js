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
/**
 * Taux d'effort TVA rapporté au REVENU DISPONIBLE, par décile de niveau de vie.
 *
 * Source : Conseil des prélèvements obligatoires, « Les effets redistributifs
 * de la taxe sur la valeur ajoutée », rapport particulier n° 2, Béatrice
 * Boutchenik, avril 2015, Graphique 1 page 11. Modèle Ines (Insee-Drees),
 * enquête Budget de famille 2011, législation 2014. Le revenu disponible y est
 * net de l'impôt sur le revenu, de la taxe d'habitation et de la taxe foncière.
 *
 * ⚠ LA PROVENANCE EST INÉGALE, et le champ `source` de chaque ligne le dit.
 * Le rapport ne CHIFFRE que D1 et D10 ; les huit déciles du milieu n'existent
 * que sous forme de graphique. D2 est imprimé dans le rapport CPO de 2022, qui
 * republie la même série. Les sept autres sont LUS sur le graphique officiel.
 *
 * Pourquoi on les garde quand même, alors que le dossier a retiré ses trois
 * ordres de grandeur non sourcés : ce n'est pas le même geste. Ici la donnée
 * EST publiée, sous forme de courbe ; la lire n'est pas l'inventer. Et la
 * version d'avant n'était pas plus prudente, elle fabriquait déjà huit valeurs
 * intermédiaires par interpolation linéaire, en silence et beaucoup plus faux :
 * 11,6 % en D2 contre 9,5 % publiés, soit 2,1 points d'erreur.
 *
 * ⚠ Deux contradictions dans les sources elles-mêmes, tranchées ici :
 * le CPO 2022 écrit « décroît de 9,5 % à 7,5 % » entre D2 et D9 alors que ses
 * propres graphiques donnent 7,2 % en D9 (approximation de rédaction) ; et son
 * redessin place D10 à 4,50 % quand son texte et l'original de 2015 disent
 * 4,7 %. On retient les valeurs imprimées.
 *
 * ⚠ La série est datée (Budget de famille 2011). L'estimation INSEE la plus
 * récente (André et Biotteau, Économie et Statistique n° 522-523, données 2016)
 * ne publie que deux points, 13,1 % en D1 et 7,4 % en D10 : une courbe
 * sensiblement PLUS PLATE. Le dossier retient donc l'hypothèse la plus
 * régressive des deux, et c'est à dire.
 */
export const TVA_TAUX_EFFORT_DECILES = [
  { decile: 1, taux: 0.125, source: 'publie' },
  { decile: 2, taux: 0.095, source: 'publie-cpo-2022' },
  { decile: 3, taux: 0.09, source: 'lu-sur-graphique' },
  { decile: 4, taux: 0.085, source: 'lu-sur-graphique' },
  { decile: 5, taux: 0.08, source: 'lu-sur-graphique' },
  { decile: 6, taux: 0.08, source: 'lu-sur-graphique' },
  { decile: 7, taux: 0.078, source: 'lu-sur-graphique' },
  { decile: 8, taux: 0.076, source: 'lu-sur-graphique' },
  { decile: 9, taux: 0.072, source: 'lu-sur-graphique' },
  { decile: 10, taux: 0.047, source: 'publie' },
];
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
  // S&P 500 dividendes réinvestis, 1928-2025, géométrique. Damodaran, NYU
  // Stern, feuille « Returns by year », bloc « Geometric Average », lignes
  // 1928-2025 : 0,100177 nominal et 0,067763 réel (déflaté CPI-U). En dollars.
  sp500Nominal1928: 0.1002,
  sp500Reel1928: 0.0677,
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
/**
 * Courbes de salaire par âge, en indice. Une par régime, et ce n'est pas un
 * raffinement.
 *
 * ⚠ Jusqu'au 09/09/2026 il n'y en avait qu'UNE, celle du privé, et la
 * projection l'appliquait à TOUS les régimes, fonctionnaires compris. C'était
 * le seul endroit du moteur où un régime empruntait un chiffre à un autre,
 * alors que `regimeDe` lève explicitement plutôt que de le faire ailleurs.
 *
 * ⚠⚠ ET LA RAISON QU'ON SE DONNAIT ÉTAIT FAUSSE. « Une carrière publique
 * avance à l'ancienneté, son profil est plus plat » : sur champ symétrique
 * (Insee Première n° 2043, données 2021, hors apprentis et stagiaires des deux
 * côtés), le rapport entre le salaire des 55 ans et plus et celui des moins de
 * 25 ans vaut 1,86 dans le public contre 1,88 dans le privé. Le profil agrégé
 * public n'est PAS plus plat. Ce qui est plat, c'est la territoriale ; l'État,
 * lui, est plus pentu que le privé. Une courbe publique unique aurait remplacé
 * une erreur par une autre : le découpage utile est le VERSANT.
 *
 * Indices calculés sur les valeurs publiées, base 100 à 36 ans, qui est l'âge
 * de référence de la projection. Seule la FORME compte : `indiceAge` ne sert
 * qu'en rapport à l'indice de l'âge où le salaire est constaté.
 */

/**
 * Privé, net EQTP 2024 (INSEE séries longues). Indice 100 = 2 733 €/mois.
 * ⚠ La remontée après 55 ans est un effet de SÉLECTION (les ouvriers sortent
 * plus tôt de l'emploi), pas une accélération de carrière : la pente est
 * plafonnée pour un individu suivi.
 */
const COURBE_PRIVE = [
  [20, 53.9], [22, 62.0], [25, 74.2], [28, 86.3], [30, 89.9],
  [32, 93.4], [35, 98.7], [36, 100.1], [38, 102.4], [40, 104.7],
  [43, 108.2], [45, 110.5], [47, 111.9], [50, 113.5], [53, 115.1],
  [55, 116.2], [57, 116.8], [60, 117.2], [62, 117.4], [64, 117.5],
];

/*
 * Fonction publique : INSEE, Insee Résultats, « Séries longues sur les salaires
 * dans le secteur privé et dans la fonction publique » (04/12/2025), tableau
 * EQTPFP04, « Salaire net annuel moyen par tranche d'âge et versant », source
 * Siasp, données 2023.
 *
 * ⚠ SIX TRANCHES, et c'est tout ce qui est publié : moins de 26, 26-30, 31-40,
 * 41-50, 51-60, 60 et plus. Aucune source ne descend au quinquennat dans le
 * public, ni l'INSEE, ni la DGAFP, ni la DREES. Les points sont donc posés au
 * MILIEU de chaque tranche (23, 28, 35,5, 45,5, 55,5 et 62 ans), ce qui est une
 * convention de notre part, pas une donnée.
 *
 * ⚠ Ce sont des moyennes TRANSVERSALES, pas des cohortes : elles portent les
 * effets de structure, à commencer par la part de catégorie A qui monte avec
 * l'âge. Une carrière individuelle est plus plate que ce que la courbe suggère.
 *
 * ⚠ La première tranche ne résout pas 20-25 ans : elle vaut « moins de 26 »,
 * tous agents confondus. La projection commence à 22 ans et lit donc la même
 * valeur de 20 à 23 ans.
 */
/**
 * ⚠⚠ LA TRANCHE « 60 ET PLUS » EST PLAFONNÉE, exactement comme celle du privé.
 *
 * Ce que la série publie à 62 ans : État 143,0, territoriale 116,8,
 * hospitalière 143,5. Ces valeurs sont RÉELLES et elles ne sont pas jetées,
 * elles sont écrites ici. Mais elles mesurent une POPULATION à un instant, pas
 * une carrière suivie, et la dernière tranche est celle où les effets de
 * composition sont les plus violents : dans l'hospitalière, les 48 500 € annuels
 * des « 60 et plus » sont tirés par les praticiens hospitaliers, qui pèsent lourd
 * dans une tranche peu nombreuse. Un aide-soignant ne voit pas son traitement
 * bondir de 35 % après 60 ans.
 *
 * C'est le MÊME phénomène que la courbe du privé plafonne déjà (« effet de
 * SÉLECTION, pas une accélération de carrière »), et le traitement est donc le
 * même, sinon les quatre courbes ne se liraient pas de la même façon : au-delà
 * de 55,5 ans on applique la pente de fin de carrière du PRIVÉ, la seule qu'on
 * ait déjà jugée représentative d'un individu suivi, soit 117,5 / 116,2 = +1,12 %
 * de 55 à 64 ans. Décision de Coq du 09/09/2026, et elle est écrite sur la page
 * méthode : c'est notre jugement, pas une donnée.
 *
 * Effet sur la pension d'un agent à 2 600 € net : hospitalière 2 049 → 1 614 €,
 * État 2 043 → 1 891 €, territoriale 1 728 → 1 657 €. Il porte surtout sur la
 * pension parce qu'elle se calcule sur le traitement de FIN de carrière.
 */
const COURBE_FPE = [[23, 73.5], [28, 85.3], [35.5, 99.2], [45.5, 115.7], [55.5, 129.0], [64, 130.4]];
const COURBE_FPT = [[23, 85.5], [28, 90.6], [35.5, 99.5], [45.5, 109.5], [55.5, 109.7], [64, 110.9]];
const COURBE_FPH = [[23, 74.6], [28, 83.1], [35.5, 99.9], [45.5, 102.0], [55.5, 106.2], [64, 107.4]];

/*
 * Non-salariés : INSEE, Insee Résultats, « Effectifs et revenus d'activité des
 * non-salariés en 2021 » (15/11/2023), tableau NA_TABNAT_2, revenu mensuel
 * MOYEN par tranche d'âge, base Non-salariés, données 2021. Fichier :
 * https://www.insee.fr/fr/statistiques/fichier/7676317/NA_TABNAT_2.xlsx
 *
 * ⚠ Jusqu'au 09/09/2026 ces trois régimes empruntaient la courbe du PRIVÉ, et
 * la page méthode le déclarait faute de source. La source existe : neuf tranches
 * quinquennales, micro-entrepreneurs sur une LIGNE SÉPARÉE des non-salariés
 * « classiques ». C'est cette séparation qui la rend utilisable, parce que les
 * deux populations n'ont pas la même forme de carrière du tout.
 *
 * ⚠⚠ CE N'EST PAS DE L'EQTP, et c'est le vrai défaut de ces deux courbes.
 * L'INSEE le dit : « Le revenu n'est pas rapporté à la durée d'affiliation dans
 * l'année. Il peut correspondre à une activité à temps complet ou à temps
 * partiel. » La courbe du privé, elle, est en équivalent temps plein. Le biais
 * est donc DIRIGÉ : les tranches où les années incomplètes sont fréquentes (les
 * plus jeunes, les plus âgés) sont écrasées vers le bas. Aucune version EQTP du
 * revenu des non-salariés n'existe, chez personne.
 *
 * ⚠ La moyenne INCLUT les revenus nuls et déficitaires, comptés à zéro (les
 * quantiles, eux, les excluent). Sur la tranche 60-64 ans, 12,6 % de revenus
 * nuls contre 9,3 % à 40-44 : la fin de courbe mesure autant l'extinction
 * d'activité que le niveau de revenu. La moyenne est retenue quand même, parce
 * que c'est ce qu'est la série privée EQTP03 à laquelle elle est comparée.
 *
 * ⚠ Champ : France hors Mayotte, hors agriculture, hors taxés d'office pour le
 * revenu. Les dirigeants ASSIMILÉS SALARIÉS en sont exclus par construction
 * (« gérants minoritaires de SARL, dirigeants de SAS, de SA »), ce qui tombe
 * juste : le président de SAS part déjà sur le régime salarié dans ce moteur.
 *
 * ⚠ La première tranche publiée est « moins de 30 ans », point posé à 26 ans
 * (milieu de 22-29, l'intervalle que la projection couvre réellement). La
 * projection commence à 22 ans et lit donc la même valeur de 22 à 26 ans. Les
 * autres points sont au milieu de leur tranche quinquennale. Convention de
 * NOTRE part, comme dans le public, et pour la même raison : la source ne
 * descend pas plus fin.
 */

/**
 * Non-salariés « classiques » (entrepreneurs individuels au réel et gérants
 * majoritaires de SARL). Sert au TNS et à la CIPAV. Indice 100 = 3 705 €/mois.
 *
 * ⚠ LA TRANCHE 60-64 EST PLAFONNÉE, exactement comme dans le privé et dans les
 * trois versants publics. Publiée, elle vaut 121,7, soit le point le PLUS HAUT
 * de toute la courbe, alors que c'est la tranche où 12,6 % des non-salariés
 * déclarent un revenu nul. Ce n'est pas une accélération de carrière, c'est la
 * même sélection des survivants que le privé plafonne déjà : ceux dont l'affaire
 * n'a pas tenu ont cessé, et ne sont plus dans la moyenne des non nuls. On
 * applique donc la pente de fin de carrière du privé, 117,5 / 116,2 = +1,12 %
 * de 57 à 64 ans, soit 120,2 au lieu de 121,7. La valeur publiée reste écrite
 * ici, elle n'est pas jetée.
 *
 * ⚠ Le revenu non salarié est net des cotisations PAYÉES mais avant CSG non
 * déductible, CRDS et impôt, quand le salaire net de l'INSEE est déjà net de
 * CSG-CRDS. L'écart est quasi proportionnel, donc presque sans effet sur une
 * courbe normalisée, mais il interdit de comparer les NIVEAUX des deux séries.
 */
const COURBE_NON_SALARIE = [
  [26, 68.2], [32, 88.8], [37, 102.8], [42, 113.3],
  [47, 118.3], [52, 119.5], [57, 118.9], [64, 120.2],
];

/**
 * Micro-entrepreneurs économiquement actifs. Indice 100 = 712 €/mois.
 *
 * ⚠ Sa FORME est l'inverse de celle du privé, et c'est ce qui rend l'ancien
 * emprunt indéfendable : elle culmine à 35-39 ans puis décline sans
 * interruption jusqu'à la fin, quand la courbe du privé monte jusqu'à 60 ans.
 * Prêter le privé à un micro-entrepreneur n'était pas une approximation, c'était
 * une inversion de tendance sur toute la seconde moitié de la carrière.
 *
 * Le plafond de fin de carrière NE MORD PAS ici : la pente observée de 57 à 62
 * ans est déjà négative (78,3), très en dessous des 88,4 qu'autoriserait la
 * pente du privé. On garde donc les valeurs publiées telles quelles, et le
 * dernier point vaut jusqu'à 64 ans.
 *
 * ⚠ Le « revenu » d'un micro dans cette série est son chiffre d'affaires APRÈS
 * abattement forfaitaire, quand le simulateur, lui, fait saisir le chiffre
 * d'affaires BRUT. L'abattement étant un pourcentage fixe par catégorie, les
 * deux ont exactement la même forme : seule la forme est utilisée.
 *
 * ⚠ Champ « économiquement actifs » : les inscrits à chiffre d'affaires nul sur
 * toute l'année sont hors série. La population visée est donc un peu plus aisée
 * que l'ensemble des micro-entrepreneurs immatriculés.
 */
const COURBE_MICRO = [
  [26, 69.6], [32, 98.7], [37, 100.3], [42, 98.7],
  [47, 95.8], [52, 92.5], [57, 87.4], [62, 78.3],
];

export const COURBES_AGE = {
  prive: COURBE_PRIVE,
  fpe: COURBE_FPE,
  fpt: COURBE_FPT,
  fph: COURBE_FPH,
  nonSalarie: COURBE_NON_SALARIE,
  micro: COURBE_MICRO,
};

/**
 * La courbe par défaut reste celle du privé, et c'est un choix DÉCLARÉ.
 * ⚠ Depuis le 09/09/2026 elle ne sert plus qu'au salarié : les six régimes
 * portent tous la leur, et `deroulerCarriere` ne retombe plus sur ce défaut.
 */
export const COURBE_AGE = COURBE_PRIVE;

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
