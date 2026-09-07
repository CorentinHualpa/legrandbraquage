/**
 * Barèmes 2026 du professionnel libéral RÉGLEMENTÉ relevant de la CIPAV.
 *
 * Ce n'est pas une variante du régime de l'indépendant, c'est un autre régime,
 * et l'écart change de SIGNE : à 25 000 € de revenu un libéral CIPAV paie
 * 13 % de MOINS qu'un artisan, à 250 000 € il paie 24 % de PLUS. Le point de
 * croisement tombe vers 1,5 plafond de sécurité sociale d'assiette. Servir un
 * régime « moyen » aux deux serait donc faux des deux côtés à la fois.
 *
 * ⚠⚠ DEUX SOURCES OFFICIELLES SE CONTREDISENT SUR CE BARÈME, et c'est le point
 * le plus dangereux du dossier.
 *
 * | Poste                  | URSSAF, barème 2026 | fiche pratique CIPAV 2026 |
 * |------------------------|---------------------|---------------------------|
 * | Retraite de base T1    | 8,73 %              | 8,23 %                    |
 * | Retraite compl. T1     | 11 % jusqu'à 1 PASS | 9 % jusqu'à 1 PASS        |
 * | Retraite compl. T2     | 21 % de 1 à 4 PASS  | 22 % de 1 à 3 PASS        |
 *
 * Aucune des deux ne mentionne l'autre. On retient l'URSSAF : c'est elle qui
 * RECOUVRE les cotisations CIPAV depuis le 01/01/2023, et ses taux sont ceux
 * du décret 2024-688. La fiche CIPAV sert manifestement encore l'ancien barème
 * malgré sa date. Un utilisateur libéral qui compare avec sa fiche verra un
 * écart, et il aura raison de le signaler : la page méthodologie le dit.
 *
 * ⚠ Qui est concerné. Depuis la LFSS 2018, les libéraux NON réglementés créés
 * à compter du 01/2019 relèvent de la sécurité sociale des indépendants, donc
 * du barème de `baremes-tns.js`. Ne restent à la CIPAV que les libéraux
 * réglementés de son champ (architecte, géomètre expert, ostéopathe,
 * psychologue, moniteur de ski, guide-conférencier, expert automobile,
 * vétérinaire…, art. L640-1 CSS) et les non réglementés installés avant 2019
 * qui n'ont pas opté. Cette fenêtre d'option est FERMÉE depuis le 31/12/2023.
 *
 * Sources, toutes consultées le 06 et le 07/09/2026 :
 * - URSSAF, taux de cotisations PLR CIPAV, mise à jour du 27/02/2026
 *   https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-plr-cipav.html
 * - CIPAV, fiche pratique 2026 « Cotiser pour acquérir des droits à retraite »
 * - CIPAV, fiche pratique 2026 « Comment est calculée la retraite ? »
 * - CSS art. L640-1, décret 2024-688, décret 2021-755 (indemnités journalières)
 *
 * Détail et ce qui reste NON TROUVÉ : RECHERCHE-TNS.md, § 3.
 */

import { PASS_ANNUEL, SMIC_HORAIRE_JANVIER } from './baremes-2026.js';
import {
  ALLOCATIONS_FAMILIALES,
  ASSIETTE,
  CSG_CRDS,
  MALADIE,
} from './baremes-tns.js';

/**
 * Ce que la CIPAV partage EXACTEMENT avec la sécurité sociale des indépendants.
 *
 * Réexporté depuis `baremes-tns.js` plutôt que recopié : la réforme de
 * l'assiette unique a aligné ces quatre postes, et deux copies d'un même barème
 * finissent toujours par diverger d'une décimale au premier ajustement.
 */
export { ASSIETTE, MALADIE, ALLOCATIONS_FAMILIALES, CSG_CRDS };

/**
 * Indemnités journalières. Décret 2021-755 du 12/06/2021.
 * ⚠ Deux fois moins chères que chez l'artisan, et bornées à 3 PASS et non 5.
 */
export const IJ = { taux: 0.003, plancherPass: 0.4, plafondPass: 3 };

/**
 * Retraite de base du régime des professions libérales (CNAVPL).
 *
 * ⚠ Les DEUX tranches s'appliquent à la même assiette, comme chez l'artisan :
 * T2 court de 0 à 5 PASS et non de 1 à 5. La cotisation minimale publiée par la
 * CIPAV le confirme : 573 € = 5 409 × (8,73 % + 1,87 %), les deux taux sur la
 * même base. Traiter T2 comme une tranche marginale sous-estime la cotisation
 * de tous les revenus au-dessus d'un plafond.
 */
export const RETRAITE_BASE = {
  t1: 0.0873,
  t2: 0.0187,
  plafondT1Pass: 1,
  plafondT2Pass: 5,
  /** Même plancher que l'artisan : 450 fois le SMIC du 1er janvier. D633-2. */
  plancherHeuresSmic: 450,
};

/**
 * Retraite complémentaire CIPAV. C'est ELLE qui fait tout l'écart avec
 * l'artisan au-dessus d'un plafond : 21 % contre 9,1 %.
 */
export const RETRAITE_COMPLEMENTAIRE = {
  t1: 0.11,
  t2: 0.21,
  plafondPass: 4,
  /** Fiche pratique CIPAV 2026, exemple chiffré. */
  valeurAchatPoint: 47.4,
  /**
   * Fiche pratique CIPAV 2026, « Comment est calculée la retraite ? » :
   * « Pour le régime complémentaire en 2026, la valeur de service d'un point
   * s'élève à 2,89 €. » Confirmée sur lacipav.fr/calcul-retraite.
   * Trajectoire : 2,77 € en 2023, 2,89 € en 2026. Les valeurs 2024 et 2025 ne
   * sont publiées nulle part.
   */
  valeurServicePoint: 2.89,
};

/** ⚠ Plafond à 1,85 PASS, plancher à 37 % du PASS. Ni l'un ni l'autre commun. */
export const INVALIDITE_DECES = { taux: 0.005, plancherPass: 0.37, plafondPass: 1.85 };

/** Contribution à la formation professionnelle : 0,25 % du PASS. */
export const CFP = { taux: 0.0025 };

/**
 * Attribution des points du régime de BASE, fiche pratique CIPAV 2026.
 *
 * « Tranche 1 : 1 point pour 89,71 € de revenus, 557 points maximum.
 *   Tranche 2 : 1 point pour 9 420 € de revenus, 25 points supplémentaires
 *   maximum. Le nombre de points maximum en une année est de 582 points. »
 *
 * ⚠ Les deux nombres de la tranche 1 NE SE RECONCILIENT PAS : au plafond de
 * la tranche, 48 060 / 89,71 rend 535,7 points, pas 557 (il faudrait 86,28 €
 * par point). Le plafond de 557 n'est donc jamais atteint et ne mord jamais.
 * On applique les deux tels qu'ils sont publiés, ratio ET plafond, plutôt que
 * d'en corriger un pour faire tomber l'autre juste : reconstituer un chiffre
 * que personne ne publie serait exactement ce que ce dossier reproche à la
 * partie adverse. L'écart joue 4 % sur la seule pension de base.
 *
 * Valeur de service 2026 : 0,6599 €, même fiche.
 */
export const POINTS_BASE = {
  revenuParPointT1: 89.71,
  pointsMaxT1: 557,
  revenuParPointT2: 9420,
  pointsMaxT2: 25,
  valeurServicePoint: 0.6599,
};

/** Plancher de retraite de base, en euros. Recalculé, jamais figé. */
export const PLANCHER_RETRAITE_BASE =
  RETRAITE_BASE.plancherHeuresSmic * SMIC_HORAIRE_JANVIER;

/**
 * Ce qu'on ne sait PAS, et qu'il ne faut pas combler de mémoire.
 *
 * Il n'existe pas plus de taux de remplacement publié pour un libéral CIPAV
 * que pour un artisan : le COR a créé un cas type de médecin libéral, pas de
 * libéral CIPAV, et la DREES exclut les non-salariés de son champ. La pension
 * se CALCULE donc par les points, dans les deux étages.
 */
export const TAUX_REMPLACEMENT_CIPAV = null;

/**
 * La convention « maladie 1 = maladie totale − indemnités journalières » est
 * certaine pour la sécurité sociale des indépendants, dont le modèle officiel
 * l'implémente. Pour la CIPAV, le modèle officiel NE retranche PAS. On suit le
 * modèle officiel de la CIPAV : ne pas retrancher.
 *
 * L'écart induit par l'autre convention est borné par la cotisation elle-même,
 * soit 433 € par an au plus (3 PASS × 0,30 %). La circulaire qui trancherait
 * définitivement n'a pas été trouvée.
 */
export const IJ_RETRANCHEE_DE_LA_MALADIE = false;

export { PASS_ANNUEL };
