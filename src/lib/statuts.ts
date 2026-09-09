import { regimeDuStatut } from "@moteur/index.js";

import type { Statut } from "./moteur";

/**
 * Les quatre qualités de victime, et ce que chacune vaut dans le moteur.
 *
 * ⚠ Le patron de TPE n'est PAS un troisième régime, et c'est ce qui fait tenir
 * la v1 : un gérant majoritaire de SARL cotise comme un travailleur non
 * salarié, un président de SAS comme un assimilé salarié. Le bouton pose donc
 * une question de forme juridique et aiguille, il ne calcule rien de neuf.
 *
 * La correspondance statut → régime vit dans le MOTEUR, pas ici : c'est une
 * règle de droit, elle a sa place là où elle est testée.
 */

export type Regime = "salarie" | "tns" | "cipav" | "micro" | "fonctionnaire";
export type FormeTpe = "sarl-majoritaire" | "sas";
export type Activite = "micro" | "ssi" | "cipav";
export type Versant = "fpe" | "fpt" | "fph";

export const STATUTS: Array<{ id: Statut; libelle: string; precision: string }> = [
  { id: "salarie", libelle: "Salarié du privé", precision: "un bulletin de paie chaque mois" },
  {
    id: "independant",
    libelle: "Indépendant",
    precision: "freelance, artisan, commerçant, profession libérale",
  },
  {
    id: "fonctionnaire",
    libelle: "Fonctionnaire",
    precision: "titulaire, État, territoriale ou hospitalière",
  },
  { id: "tpe", libelle: "Patron de TPE", precision: "vous vous versez une rémunération" },
];

export const FORMES_TPE: Array<{
  id: FormeTpe;
  libelle: string;
  precision: string;
}> = [
  {
    id: "sarl-majoritaire",
    libelle: "Gérant majoritaire de SARL ou EURL",
    precision: "vous cotisez comme un travailleur non salarié",
  },
  {
    id: "sas",
    libelle: "Président de SAS ou SASU",
    precision: "vous cotisez comme un salarié, sans l’assurance chômage",
  },
];

/**
 * Sous quel régime cotise un indépendant.
 *
 * ⚠ Ce n'est pas une nuance : à 25 000 € de revenu un libéral réglementé paie
 * 13 % de MOINS qu'un artisan, à 250 000 € il paie 24 % de PLUS. L'écart change
 * de signe vers 1,5 plafond de sécurité sociale d'assiette, donc aucun régime
 * « moyen » ne peut servir les deux.
 *
 * Le défaut est la sécurité sociale des indépendants, et c'est le bon défaut :
 * depuis 2019 les libéraux NON réglementés en relèvent aussi, avec les artisans
 * et les commerçants. La CIPAV ne garde que les professions réglementées de son
 * champ (art. L640-1 CSS).
 */
export const ACTIVITES: Array<{ id: Activite; libelle: string; precision: string }> = [
  {
    id: "micro",
    libelle: "Micro-entrepreneur",
    precision:
      "ex auto-entrepreneur : vous cotisez sur votre chiffre d’affaires, à taux fixe, "
      + "et vous ne déduisez aucune charge",
  },
  {
    id: "ssi",
    libelle: "Entreprise au réel",
    precision:
      "artisan, commerçant ou libéral non réglementé : vous cotisez sur votre revenu, "
      + "une fois vos charges déduites",
  },
  {
    id: "cipav",
    libelle: "Profession libérale réglementée",
    precision:
      "architecte, géomètre, ostéopathe, psychologue, vétérinaire, moniteur de ski, guide-conférencier, expert…",
  },
];

export const VERSANTS: Array<{ id: Versant; libelle: string; precision: string }> = [
  { id: "fpt", libelle: "Territoriale", precision: "commune, département, région" },
  { id: "fph", libelle: "Hospitalière", precision: "hôpital public, EHPAD public" },
  { id: "fpe", libelle: "État", precision: "ministères, enseignement, police" },
];

/**
 * Les régimes que le moteur sait réellement calculer.
 *
 * Cette liste est la SEULE source de vérité de ce que la page a le droit de
 * chiffrer. Tant qu'un régime n'y est pas, son bouton dit ce qu'il en est au
 * lieu d'afficher un résultat emprunté à un autre statut : servir le calcul du
 * salarié à un indépendant serait exactement le genre de faux chiffre que ce
 * dossier reproche à la partie adverse. Le moteur lève d'ailleurs plutôt que
 * de deviner ; cette liste existe pour que l'écran le dise AVANT le calcul.
 */
/*
 * ⚠ `micro` a rejoint la liste le 07/09/2026, une fois son barème sourcé sur
 * l'article D613-4 du code de la sécurité sociale. Il n'a JAMAIS partagé celui
 * du réel : son assiette est le chiffre d'affaires encaissé, à taux
 * forfaitaire, sans déduction de charges.
 */
export const REGIMES_DISPONIBLES: Regime[] = [
  "salarie",
  "fonctionnaire",
  "tns",
  "cipav",
  "micro",
];

export function regimeDe(
  statut: Statut,
  forme?: FormeTpe,
  activite?: Activite,
): Regime | null {
  return (regimeDuStatut(statut, forme, activite) as Regime | null) ?? null;
}

export function regimeCalculable(regime: Regime | null): boolean {
  return regime !== null && REGIMES_DISPONIBLES.includes(regime);
}

export const NOMS_REGIME: Record<Regime, string> = {
  salarie: "salarié du privé",
  tns: "travailleur non salarié",
  micro: "micro-entrepreneur",
  cipav: "professionnel libéral réglementé",
  fonctionnaire: "fonctionnaire",
};

/**
 * Les quatre postes que l'utilisateur empile, DITS DANS SA LANGUE À LUI.
 *
 * ⚠ Un seul jeu de libellés pour tout le monde ment à trois personnes sur
 * quatre. « Pris sur ta paie, sous tes yeux » n'a aucun sens pour un freelance,
 * qui n'a pas de paie : ce qui lui est pris l'est sur ce qu'il facture. Et
 * « Pris avant ta paie, sans te le dire » lui affichait zéro euro en face d'une
 * case à cocher, ce qui ressemble à un trou dans le calcul alors que c'est LE
 * résultat de son régime : personne ne verse avant lui.
 *
 * Le geste change donc avec le régime, et une ligne qui n'existe pas dans un
 * régime le DIT au lieu de s'afficher à zéro.
 *
 * ⚠ « Repris une fois par an, par courrier » était faux pour tout le monde
 * depuis 2019 : l'impôt est prélevé à la source pour un salarié comme pour un
 * agent public, et par acompte mensuel ou trimestriel pour un indépendant.
 */
export type ClePerimetre = "salariales" | "patronales" | "impotRevenu" | "consommation";

export type LignePerimetre = {
  cle: ClePerimetre;
  /** Le geste, du point de vue de la victime. */
  geste: string;
  /** Le nom technique du poste, sous le geste. */
  nom: string;
  /**
   * true = ce poste N'EXISTE PAS dans ce régime. La ligne s'affiche quand même,
   * parce que son absence est un résultat qui se compare, mais elle ne se coche
   * pas : une case qui ne change rien quand on clique dessus est une panne aux
   * yeux de celui qui clique.
   */
  sansObjet?: boolean;
};

export const LIGNES_PERIMETRE: Record<Regime, LignePerimetre[]> = {
  /*
   * ⚠ Le libellé principal dit CE QUE C'EST, en mots de tous les jours. La
   * métaphore du dossier (« pris avant ta paie, sans te le dire ») passe en
   * sous-titre : mise en titre, elle obligeait à deviner de quoi on parlait.
   * Retour de Coq, 07/09/2026 : « je ne comprends pas les options, rien n'est
   * clair ». Un ado doit pouvoir lire chaque ligne sans rien savoir.
   */
  salarie: [
    { cle: "salariales", geste: "Les cotisations sur votre paie", nom: "la ligne que vous voyez sur votre fiche, entre le brut et le net" },
    { cle: "patronales", geste: "Ce que votre employeur verse en plus", nom: "pour vous, avant même votre paie : vous ne le voyez jamais" },
    { cle: "impotRevenu", geste: "L’impôt sur le revenu", nom: "prélevé à la source sur chaque virement" },
    { cle: "consommation", geste: "La TVA sur tout ce que vous achetez", nom: "et les taxes sur l’essence, l’alcool, le tabac" },
  ],
  fonctionnaire: [
    { cle: "salariales", geste: "Les retenues sur votre traitement", nom: "pension, CSG-CRDS et régime additionnel, chaque mois" },
    { cle: "patronales", geste: "Ce que votre employeur public verse en plus", nom: "à votre propre régime de retraite : vous ne le voyez jamais" },
    { cle: "impotRevenu", geste: "L’impôt sur le revenu", nom: "prélevé à la source sur chaque virement" },
    { cle: "consommation", geste: "La TVA sur tout ce que vous achetez", nom: "et les taxes sur l’essence, l’alcool, le tabac" },
  ],
  tns: [
    { cle: "salariales", geste: "Les cotisations URSSAF", nom: "sur votre revenu, une fois vos charges déduites" },
    { cle: "patronales", geste: "Part employeur", nom: "aucune : vous êtes votre propre employeur", sansObjet: true },
    { cle: "impotRevenu", geste: "L’impôt sur le revenu", nom: "payé par acomptes, tous les mois ou tous les trimestres" },
    { cle: "consommation", geste: "La TVA sur tout ce que vous achetez", nom: "et les taxes sur l’essence, l’alcool, le tabac" },
  ],
  micro: [
    { cle: "salariales", geste: "Les cotisations URSSAF", nom: "en pourcentage de tout ce que vous encaissez, charges comprises" },
    { cle: "patronales", geste: "Part employeur", nom: "aucune : vous êtes votre propre employeur", sansObjet: true },
    { cle: "impotRevenu", geste: "L’impôt sur le revenu", nom: "au barème, ou en versement libératoire avec vos cotisations" },
    { cle: "consommation", geste: "La TVA sur tout ce que vous achetez", nom: "et les taxes sur l’essence, l’alcool, le tabac" },
  ],
  cipav: [
    { cle: "salariales", geste: "Les cotisations URSSAF et CIPAV", nom: "sur votre revenu, une fois vos charges déduites" },
    { cle: "patronales", geste: "Part employeur", nom: "aucune : vous êtes votre propre employeur", sansObjet: true },
    { cle: "impotRevenu", geste: "L’impôt sur le revenu", nom: "payé par acomptes, tous les mois ou tous les trimestres" },
    { cle: "consommation", geste: "La TVA sur tout ce que vous achetez", nom: "et les taxes sur l’essence, l’alcool, le tabac" },
  ],
};

/**
 * Où lire le chiffre qu'on demande, DANS SON PROPRE DOCUMENT.
 *
 * ⚠ On demande le net AVANT impôt sur le revenu, et pas ce qui arrive sur le
 * compte. Trois raisons, dans cet ordre :
 *
 * 1. C'est la seule ligne que la personne peut lire sans hésiter. « Net à payer
 *    avant impôt sur le revenu » est imprimé en gros sur toute fiche de paie
 *    française depuis 2019.
 * 2. L'impôt devient alors un prélèvement qu'on AJOUTE et qu'on voit arriver,
 *    au lieu d'une somme déjà retranchée que le moteur devait retrouver à
 *    rebours. C'est tout l'objet de la page.
 * 3. Le salaire médian de l'INSEE, auquel on compare le point de bascule, est
 *    lui aussi un net avant impôt. Comparer un pivot après impôt à une médiane
 *    avant impôt était une erreur de dénominateur, exactement celle que ce
 *    dossier reproche à la partie adverse.
 */
export const OU_LIRE_SON_NET: Record<Regime, { label: string; aide: string }> = {
  salarie: {
    label: "VOTRE NET MENSUEL, AVANT IMPÔT SUR LE REVENU",
    aide:
      "La ligne « net à payer avant impôt sur le revenu » de votre fiche de paie, "
      + "en gros caractères. Pas le virement reçu : l’impôt, on le compte ici.",
  },
  fonctionnaire: {
    label: "VOTRE NET MENSUEL, AVANT IMPÔT SUR LE REVENU",
    aide:
      "La ligne « net à payer avant impôt sur le revenu » de votre bulletin de paie. "
      + "Pas le virement reçu : l’impôt, on le compte ici.",
  },
  tns: {
    label: "CE QU’IL VOUS RESTE PAR MOIS, AVANT IMPÔT SUR LE REVENU",
    aide:
      "Votre revenu professionnel une fois les cotisations payées, avant l’impôt. "
      + "Ni votre chiffre d’affaires, ni ce qui reste après les acomptes.",
  },
  cipav: {
    label: "CE QU’IL VOUS RESTE PAR MOIS, AVANT IMPÔT SUR LE REVENU",
    aide:
      "Votre revenu professionnel une fois les cotisations payées, avant l’impôt. "
      + "Ni votre chiffre d’affaires, ni ce qui reste après les acomptes.",
  },
  micro: {
    label: "VOTRE CHIFFRE D’AFFAIRES ENCAISSÉ, PAR MOIS",
    aide:
      "Ce que vous déclarez à l’URSSAF, hors TVA. Les cotisations et l’impôt, "
      + "on les compte ici : vous allez les voir partir.",
  },
};


/**
 * Les trois catégories du micro, et elles ne se ressemblent pas : entre la
 * vente (12,3 %) et le libéral (25,6 %), le taux de cotisation DOUBLE.
 *
 * Les taux affichés ici sont ceux de l'article D613-4 du code de la sécurité
 * sociale, version en vigueur depuis le 01/01/2026. ⚠ Le décret 2024-484
 * programmait 26,1 % en BNC pour 2026 et beaucoup de sites le répètent encore ;
 * le décret 2025-943 a réécrit l'article avant son entrée en vigueur.
 */
export type CategorieMicro = "vente" | "services" | "liberal";

export const CATEGORIES_MICRO: Array<{
  id: CategorieMicro;
  libelle: string;
  precision: string;
}> = [
  {
    id: "liberal",
    libelle: "Prestations libérales",
    precision: "25,6 % de cotisations, abattement fiscal de 34 %",
  },
  {
    id: "services",
    libelle: "Prestations de services",
    precision: "artisanales ou commerciales : 21,2 %, abattement de 50 %",
  },
  {
    id: "vente",
    libelle: "Vente de marchandises",
    precision: "12,3 %, abattement de 71 %",
  },
];


/**
 * Les parts fiscales, telles que le quotient familial les compte : une part
 * par adulte, une demi-part pour chacun des deux premiers enfants, une part
 * entière à partir du troisième (CGI art. 194). Un célibataire avec enfants
 * garde ses demi-parts, la majoration du premier enfant isolé n'est pas
 * modélisée.
 */
export function partsFiscales(couple: boolean, enfants: number): number {
  const e = Math.max(0, Math.floor(enfants));
  return (couple ? 2 : 1) + Math.min(e, 2) * 0.5 + Math.max(0, e - 2);
}
