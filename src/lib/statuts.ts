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
      "ex auto-entrepreneur : tu cotises sur ton chiffre d’affaires, à taux fixe, "
      + "et tu ne déduis aucune charge",
  },
  {
    id: "ssi",
    libelle: "Entreprise au réel",
    precision:
      "artisan, commerçant ou libéral non réglementé : tu cotises sur ton revenu, "
      + "une fois tes charges déduites",
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
 * ⚠ `micro` en est volontairement ABSENT tant que son barème n'est pas sourcé.
 *
 * Un micro-entrepreneur ne cotise PAS comme une entreprise au réel : son
 * assiette est le chiffre d'affaires encaissé, à taux forfaitaire, sans
 * déduction de charges, et son impôt peut passer par un versement libératoire.
 * Lui servir le barème du réel produirait un chiffre faux et parfaitement
 * crédible, c'est-à-dire exactement ce que ce dossier reproche à la partie
 * adverse. L'écran le dit et refuse de calculer.
 */
export const REGIMES_DISPONIBLES: Regime[] = ["salarie", "fonctionnaire", "tns", "cipav"];

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

/** Poste de consommation : le seul qui se dise pareil pour tout le monde. */
const CONSOMMATION: LignePerimetre = {
  cle: "consommation",
  geste: "Repris à chaque caddie, sans reçu",
  nom: "TVA et taxes de consommation",
};

export const LIGNES_PERIMETRE: Record<Regime, LignePerimetre[]> = {
  salarie: [
    {
      cle: "salariales",
      geste: "Pris sur ta paie, sous tes yeux",
      nom: "cotisations salariales",
    },
    {
      cle: "patronales",
      geste: "Pris avant ta paie, sans te le dire",
      nom: "cotisations patronales, jamais imprimées sur ton net",
    },
    {
      cle: "impotRevenu",
      geste: "Repris sur chaque virement, à la source",
      nom: "impôt sur le revenu",
    },
    CONSOMMATION,
  ],
  fonctionnaire: [
    {
      cle: "salariales",
      geste: "Retenu sur ton traitement, chaque mois",
      nom: "retenue pour pension, CSG-CRDS et régime additionnel",
    },
    {
      cle: "patronales",
      geste: "Versé par ton employeur public à ton propre régime",
      nom: "contribution employeur, 37,65 % à la CNRACL et 82,28 % pour l’État",
    },
    {
      cle: "impotRevenu",
      geste: "Repris sur chaque virement, à la source",
      nom: "impôt sur le revenu",
    },
    CONSOMMATION,
  ],
  tns: [
    {
      cle: "salariales",
      geste: "Pris sur ce que tu factures, avant de te payer",
      nom: "cotisations et contributions sociales, sur ton revenu professionnel",
    },
    {
      cle: "patronales",
      geste: "Personne ne verse avant toi",
      nom: "aucune part employeur : tu es ton propre employeur",
      sansObjet: true,
    },
    {
      cle: "impotRevenu",
      geste: "Repris par acompte, tous les mois ou tous les trimestres",
      nom: "impôt sur le revenu",
    },
    CONSOMMATION,
  ],
  micro: [
    {
      cle: "salariales",
      // ⚠ Chez lui, l'assiette est le CHIFFRE D'AFFAIRES encaissé, pas un
      // revenu après charges : il paie même sur ce qu'il a dépensé pour
      // travailler. C'est la différence qui justifie un régime à part.
      geste: "Pris sur tout ce que tu encaisses, charges comprises",
      nom: "cotisations forfaitaires, en pourcentage du chiffre d’affaires",
    },
    {
      cle: "patronales",
      geste: "Personne ne verse avant toi",
      nom: "aucune part employeur : tu es ton propre employeur",
      sansObjet: true,
    },
    {
      cle: "impotRevenu",
      geste: "Repris par acompte, ou prélevé avec les cotisations",
      nom: "impôt sur le revenu, barème ou versement libératoire",
    },
    CONSOMMATION,
  ],
  cipav: [
    {
      cle: "salariales",
      geste: "Pris sur ce que tu factures, avant de te payer",
      nom: "cotisations CIPAV et contributions sociales",
    },
    {
      cle: "patronales",
      geste: "Personne ne verse avant toi",
      nom: "aucune part employeur : tu es ton propre employeur",
      sansObjet: true,
    },
    {
      cle: "impotRevenu",
      geste: "Repris par acompte, tous les mois ou tous les trimestres",
      nom: "impôt sur le revenu",
    },
    CONSOMMATION,
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
    label: "TON NET MENSUEL, AVANT IMPÔT SUR LE REVENU",
    aide:
      "La ligne « net à payer avant impôt sur le revenu » de ta fiche de paie, "
      + "en gros caractères. Pas le virement reçu : l’impôt, on le compte ici.",
  },
  fonctionnaire: {
    label: "TON NET MENSUEL, AVANT IMPÔT SUR LE REVENU",
    aide:
      "La ligne « net à payer avant impôt sur le revenu » de ton bulletin de paie. "
      + "Pas le virement reçu : l’impôt, on le compte ici.",
  },
  tns: {
    label: "CE QU’IL TE RESTE PAR MOIS, AVANT IMPÔT SUR LE REVENU",
    aide:
      "Ton revenu professionnel une fois les cotisations payées, avant l’impôt. "
      + "Ni ton chiffre d’affaires, ni ce qui reste après les acomptes.",
  },
  cipav: {
    label: "CE QU’IL TE RESTE PAR MOIS, AVANT IMPÔT SUR LE REVENU",
    aide:
      "Ton revenu professionnel une fois les cotisations payées, avant l’impôt. "
      + "Ni ton chiffre d’affaires, ni ce qui reste après les acomptes.",
  },
  micro: {
    label: "CE QU’IL TE RESTE PAR MOIS, AVANT IMPÔT SUR LE REVENU",
    aide:
      "Ton chiffre d’affaires encaissé, moins les cotisations, avant l’impôt. "
      + "Tes charges professionnelles ne se déduisent pas : c’est le régime.",
  },
};
