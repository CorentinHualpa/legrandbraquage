/**
 * Barèmes 2026 de la fonction publique.
 *
 * Régime distinct de celui du privé, et pas un paramètre de celui-ci : assiette
 * amputée des primes, aucune réduction générale, aucune retraite
 * complémentaire, aucune cotisation chômage, et une pension calculée sur le
 * seul traitement indiciaire.
 *
 * Chaque constante porte son texte. Le détail complet, les sources et ce qui
 * n'a PAS été trouvé sont dans le rapport de recherche du 06/09/2026, versé au
 * dossier de travail sous le nom RECHERCHE-FONCTION-PUBLIQUE.md.
 */

// ─── Vocabulaire ─────────────────────────────────────────────────────────────
// TIB   : traitement indiciaire brut. C'est l'assiette de la pension.
// primes: tout le reste du brut. Hors assiette de pension, dans celle du RAFP.
// brut  : TIB + primes.
// La part des primes décide de TOUT dans ce régime. C'est elle qui explique à
// la fois un taux de retenue salariale plus bas que dans le privé et un taux de
// remplacement plus faible : ce qui n'est pas dans l'assiette ne se cotise pas,
// et ne se retrouve pas dans la pension.

// ─── Retenues salariales ─────────────────────────────────────────────────────
/** Retenue pour pension civile (FPE) et retenue CNRACL (FPT, FPH). */
export const RETENUE_PENSION = 0.111; // art. L61 CPCMR ; décret 2010-1749 mod. 2014-1531

/** Régime additionnel, en capitalisation, assis sur les SEULES primes. */
export const RAFP = {
  tauxAgent: 0.05, // décret 2004-569, art. 3
  tauxEmployeur: 0.05, // idem
  /** L'assiette est plafonnée à 20 % du traitement indiciaire brut. */
  plafondSurTib: 0.2, // décret 2004-569, art. 2
  valeurAcquisition: 1.4596, // CA de l'ERAFP du 16/12/2025
  valeurService: 0.05671, // idem
  /** Coefficient de majoration selon l'âge de liquidation, décret 2004-569 art. 8. */
  majoration: { 62: 1.0, 63: 1.04, 64: 1.08, 65: 1.12, 66: 1.17, 67: 1.22, 70: 1.4 },
};

/** CSG et CRDS : mêmes taux que dans le privé, même assiette abattue. */
export const CSG_CRDS = {
  csgDeductible: 0.068,
  csgNonDeductible: 0.024,
  crds: 0.005,
  /** Abattement d'assiette, dans la limite de 4 PASS. */
  assiette: 0.9825,
};

/**
 * ⚠ Ce qui N'EXISTE PAS, et qu'un simulateur oublie de dire.
 * La contribution exceptionnelle de solidarité de 1 % est SUPPRIMÉE depuis le
 * 01/01/2018 (loi 2017-1837, art. 112). Il n'y a ni cotisation chômage, ni
 * Agirc-Arrco, ni APEC, ni maladie salariale.
 */
export const INEXISTANT = ['solidarite1pct', 'chomage', 'agircArrco', 'apec', 'maladieSalariale'];

// ─── Part employeur ──────────────────────────────────────────────────────────
/**
 * ⚠⚠ LE TAUX EMPLOYEUR DE LA FONCTION PUBLIQUE NE SE COMPARE PAS À CELUI DU
 * PRIVÉ, et le COR l'écrit lui-même. C'est le passage le plus attaquable d'un
 * simulateur public-privé, et l'avertissement doit voyager avec le chiffre :
 *
 *   « il convient de souligner que le taux implicite appliqué aux
 *   fonctionnaires de l'État [...] ne résulte pas d'une générosité plus
 *   importante du régime public par rapport aux régimes du privé. »
 *   COR, rapport annuel juin 2026, p. 84
 *
 *   « par leur nature, ils ne peuvent pas être comparés à la contribution des
 *   employeurs des salariés du secteur privé. »
 *   COR, fiche FPE annexée au rapport annuel de juin 2024, § 2.3
 *
 * Le taux est haut parce que le rapport démographique du régime est de 1,29
 * cotisant par retraité contre 2,25 au régime général, parce que l'assiette
 * exclut le quart du brut, et parce que la solidarité qu'un régime privé
 * finance par l'impôt est ici financée par la cotisation employeur. Le taux
 * nécessaire au seul financement des droits, hors invalidité et départs
 * anticipés, est estimé à 34,7 % (IPP, cité par le COR).
 */
export const TAUX_EQUILIBRE_HORS_SOLIDARITE = 0.347;
/** Le taux employeur comparable dans le privé, tel que le COR le pose. */
export const TAUX_EMPLOYEUR_PRIVE_COMPARABLE = 0.1667;

export const VERSANTS = {
  fpe: {
    nom: 'Fonction publique d’État',
    /** CAS Pensions, civils. Décret 2025-1341 du 26/12/2025, en vigueur au 01/01/2026. */
    contributionPension: 0.8228,
    /** Allocation temporaire d’invalidité. Arrêté du 28/12/2012. */
    ati: 0.0032,
    maladie: 0.097,
    formation: 0,
    /** Fonds pour l’emploi hospitalier : sans objet hors FPH. */
    feh: 0,
    /** Part moyenne des primes dans le brut, DGAFP, données 2023. */
    partPrimes: 0.247,
    brutMoyen: 4025,
    netMoyen: 3267,
    netMedian: 3044,
    /** Aucun échéancier : le taux est réajusté chaque année pour équilibrer. */
    echeancier: null,
  },
  fpt: {
    nom: 'Fonction publique territoriale',
    /** CNRACL. Décret 2025-86 du 30/01/2025. */
    contributionPension: 0.3765,
    ati: 0.004, // ATIACL
    maladie: 0.0988,
    formation: 0.01,
    feh: 0,
    partPrimes: 0.253,
    brutMoyen: 2926,
    netMoyen: 2383,
    netMedian: 2114,
    /** Hausse programmée, écrite dans le décret : à rejouer le moment venu. */
    echeancier: { 2027: 0.4065, 2028: 0.4365 },
  },
  fph: {
    nom: 'Fonction publique hospitalière',
    contributionPension: 0.3765,
    ati: 0.004,
    maladie: 0.0988,
    formation: 0.01,
    /** FEH, décret 2002-160. ⚠ Taux non reconfirmé sur un texte postérieur. */
    feh: 0.01,
    partPrimes: 0.235,
    brutMoyen: 3314,
    netMoyen: 2691,
    netMedian: 2474,
    echeancier: { 2027: 0.4065, 2028: 0.4365 },
  },
};

/** Lignes patronales communes aux trois versants, assises sur le brut total. */
export const PATRONAL_COMMUN = {
  contributionSolidariteAutonomie: 0.003,
  /** Pas de taux réduit : la dégressivité du privé ne s'applique pas ici. */
  allocationsFamiliales: 0.0525,
  /** Cinquante agents et plus, ce qui est le cas de la quasi-totalité. */
  fnal: 0.005,
};

// ─── Traitement indiciaire ───────────────────────────────────────────────────
/** Décret 85-1148, art. 3, version en vigueur au 01/07/2023. Gelé depuis. */
export const POINT_INDICE_ANNUEL_IM100 = 5907.34;
export const POINT_INDICE_MENSUEL = POINT_INDICE_ANNUEL_IM100 / 1200;

// ─── Pension ─────────────────────────────────────────────────────────────────
export const PENSION = {
  /** Art. L13 CPCMR. 80 % au maximum avec bonifications. */
  tauxPlein: 0.75,
  /** Le traitement retenu est celui détenu depuis six mois, PRIMES EXCLUES. */
  assiette: 'traitement indiciaire brut',
  /** CNRACL, minimum garanti au 01/01/2026, décret 2003-1306 art. 22. */
  minimumGarantiMensuel: 1366.35,
  /** Réversion sans condition d'âge ni de ressources, contre 54 % sous conditions au privé. */
  reversion: 0.5,
};

/**
 * ⚠ Paramètre modifié en 2026, et il vaut AUSSI pour le privé.
 * La LFSS 2026 (loi 2025-1403 du 30/12/2025, art. 105) a suspendu le calendrier
 * de la réforme de 2023. Décrets 2026-344 et 2026-345 du 07/05/2026,
 * applicables aux pensions prenant effet à compter du 01/09/2026.
 * Les générations 1969 et suivantes ne bougent pas : 64 ans, 172 trimestres.
 * Ce sont les générations 1964 à 1968 qui changent.
 */
export const AGE_ET_DUREE = [
  { neEn: 1964, age: 62.75, trimestres: 170 },
  { neEn: 1965, age: 63, trimestres: 171 },
  { neEn: 1966, age: 63.25, trimestres: 172 },
  { neEn: 1967, age: 63.5, trimestres: 172 },
  { neEn: 1968, age: 63.75, trimestres: 172 },
  { neEn: 1969, age: 64, trimestres: 172 },
];

/**
 * Taux de remplacement, et ce qu'il faut en dire.
 *
 * Le taux PROJETÉ par le COR pour l'agent sédentaire de catégorie B décroît de
 * 64,8 % pour la génération 1960 à 55,9 % pour la génération 2000 (rapport
 * annuel juin 2026, figure 3.5). L'écart avec le non-cadre du privé est de
 * treize points, dont 5,4 viennent de la SEULE hypothèse de montée des primes.
 *
 * Mais le taux réellement OBSERVÉ ne montre pas cet écart : 74,8 % dans le
 * privé contre 73,8 % dans le public pour la génération 1950 à carrière
 * complète (DREES). Les deux chiffres sont vrais et ne mesurent pas la même
 * chose : le premier projette des règles, le second constate des carrières.
 *
 * On retient l'observé pour la comparaison affichée, et on cite le projeté à
 * côté. Publier le seul projeté ferait dire au dossier l'inverse de ce que les
 * données constatées montrent.
 */
export const TAUX_REMPLACEMENT = {
  projeteCatBGeneration2000: 0.559,
  projeteCatBGeneration1960: 0.648,
  observePublicGeneration1950: 0.738,
  observePriveGeneration1950: 0.748,
};
