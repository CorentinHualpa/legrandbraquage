/**
 * Barèmes 2026 du MICRO-ENTREPRENEUR (ex auto-entrepreneur).
 *
 * ⚠⚠ CE N'EST PAS UNE VARIANTE DU RÉGIME AU RÉEL, et confondre les deux est le
 * piège central de ce régime.
 *
 * Un micro-entrepreneur cotise sur son **chiffre d'affaires encaissé**, à taux
 * forfaitaire, et ne déduit AUCUNE charge : il paie donc aussi sur ce qu'il a
 * dépensé pour travailler. La réforme de l'assiette unique de 2026 (abattement
 * de 26 %, plancher 1,76 % du PASS, plafond 130 %) ne le concerne PAS.
 *
 *   URSSAF, « Réforme des cotisations des indépendants », mise à jour du
 *   07/05/2026 : « Les auto-entrepreneurs continueront de déclarer
 *   mensuellement ou trimestriellement leur chiffre d'affaires et leurs
 *   cotisations seront toujours calculées sur la base de celui-ci. »
 *
 * ⚠ DEUX TEXTES OFFICIELS SE CONTREDISENT SUR LE TAUX BNC 2026, et le web
 * répète encore le mauvais. Le décret n° 2024-484 du 30/05/2024 programmait
 * **26,1 %** au 1er janvier 2026 ; le décret n° 2025-943 du 08/09/2025 a
 * réécrit l'article D613-4 du code de la sécurité sociale AVANT cette entrée en
 * vigueur, et la valeur applicable est **25,6 %**. C'est le texte en vigueur qui
 * fait foi. Un utilisateur qui compare avec un article de blog verra un écart,
 * et la page méthode le dit.
 *
 * Sources, consultées le 07/09/2026 :
 * - CSS art. D613-4, version en vigueur depuis le 01/01/2026 (décret 2025-943)
 * - CGI art. 50-0 et 102 ter (plafonds et abattements), version du 01/07/2026
 * - CGI art. 151-0 (versement libératoire)
 * - Code du travail art. L6331-48 (contribution formation)
 * - CGI art. 1600 A et 1601-0 A (taxes pour frais de chambre)
 * - Circulaire Cnav n° 2026-12 du 07/04/2026 (droits à retraite)
 * - URSSAF, actualité du 17/12/2025 (répartition interne du taux global)
 */

import { PASS_ANNUEL, SMIC_HORAIRE_JANVIER } from './baremes-2026.js';
import { RETRAITE_COMPLEMENTAIRE as RCI } from './baremes-tns.js';

/**
 * Les trois catégories qui changent tout. Entre la vente et le libéral, le taux
 * de cotisation va du simple au double.
 *
 * `taux` : taux global du micro-social, en part du CA encaissé. CSS D613-4.
 * ⚠ Il INCLUT la CSG-CRDS, et il N'INCLUT PAS la contribution formation.
 *
 * `formation` : contribution à la formation professionnelle, qui S'AJOUTE.
 * Code du travail L6331-48.
 *
 * `consulaire` : taxe pour frais de chambre, qui s'ajoute aussi. On retient le
 * cas du régime général (hors Alsace-Moselle, dont les taux sont plus élevés).
 *
 * `abattement` : abattement forfaitaire du micro-FISCAL. CGI 50-0 et 102 ter.
 * `plafond` : plafond annuel de CA du régime.
 * `versementLiberatoire` : taux de l'option, en part du CA. CGI 151-0.
 * `repartitionRetraiteBase` / `repartitionRetraiteComplementaire` : la part du
 * forfait global affectée à chaque étage de retraite. URSSAF, 17/12/2025, et
 * circulaire Cnav 2026-12 p. 8-9.
 */
export const CATEGORIES = {
  vente: {
    nom: 'vente de marchandises',
    taux: 0.123,
    formation: 0.001, // commerçant
    consulaire: 0.00015, // CCI, vente
    abattement: 0.71,
    plafond: 203100,
    versementLiberatoire: 0.01,
    repartitionRetraiteBase: 0.4345,
    repartitionRetraiteComplementaire: 0.1975,
  },
  services: {
    nom: 'prestations de services artisanales ou commerciales',
    taux: 0.212,
    formation: 0.003, // artisan
    consulaire: 0.0048, // CMA, prestations
    abattement: 0.5,
    plafond: 83600,
    versementLiberatoire: 0.017,
    repartitionRetraiteBase: 0.4345,
    repartitionRetraiteComplementaire: 0.1975,
  },
  liberal: {
    nom: 'prestations libérales',
    taux: 0.256,
    formation: 0.002, // profession libérale
    consulaire: 0, // ni CCI ni CMA
    abattement: 0.34,
    plafond: 83600,
    versementLiberatoire: 0.022,
    repartitionRetraiteBase: 0.464,
    repartitionRetraiteComplementaire: 0.21,
  },
};

/** L'abattement fiscal ne peut pas descendre sous ce plancher. CGI 50-0. */
export const ABATTEMENT_MINIMUM = 305;

/**
 * Le taux de cotisation vieillesse d'un indépendant AU RÉEL, qui sert à
 * reconstituer le « revenu cotisé » d'un micro. Ce n'est pas une cotisation
 * qu'il paie : c'est le diviseur de la circulaire Cnav.
 * D633-3 CSS, valeur citée par la circulaire Cnav 2026-12 p. 10.
 */
export const TAUX_VIEILLESSE_REEL = 0.1787;

/** 150 heures de SMIC valident un trimestre. Le SMIC retenu est celui du 1er janvier. */
export const HEURES_SMIC_PAR_TRIMESTRE = 150;
export const REVENU_PAR_TRIMESTRE = HEURES_SMIC_PAR_TRIMESTRE * SMIC_HORAIRE_JANVIER;
export const TRIMESTRES_MAX_PAR_AN = 4;

/**
 * Le point du régime complémentaire des indépendants, partagé avec le réel.
 *
 * ⚠ La circulaire Cnav 2026-12 ne publie que les valeurs 2023 (19,394 €) et
 * 2024 (20,734 €) ; la valeur 2026 utilisée ici est celle du barème RCI déjà
 * sourcé pour le régime au réel. Si elle bouge, elle bouge pour les deux.
 */
export const POINT_RCI = {
  valeurAchat: RCI.valeurAchatPoint,
  valeurService: RCI.valeurServicePoint,
};

/**
 * Ce qu'on ne sait PAS, et qu'il ne faut pas combler de mémoire.
 *
 * Le chiffre d'affaires minimum pour valider ses trimestres n'est PUBLIÉ que
 * pour la CIPAV (2 792 € par trimestre en 2026). Pour le régime général,
 * l'URSSAF ne publie plus de table : seule la FORMULE de la circulaire Cnav est
 * officielle. Le moteur applique donc la formule et présente le résultat comme
 * CALCULÉ, jamais comme un seuil publié.
 */
export const SEUIL_TRIMESTRE_PUBLIE = { cipav: 2792 };

export { PASS_ANNUEL, SMIC_HORAIRE_JANVIER };
