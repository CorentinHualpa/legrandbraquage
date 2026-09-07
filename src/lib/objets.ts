/**
 * Le convertisseur d'objets.
 *
 * Registre : absurde assumé. L'absurdité vient de la QUANTITÉ (« 412 000
 * croissants »), jamais du prix unitaire, qui doit être exact et sourcé. Un
 * prix inventé est le seul endroit par lequel cette page peut se faire démonter
 * en trente secondes, parce que c'est le seul chiffre que le lecteur peut
 * vérifier de tête.
 *
 * Le convertisseur marche DANS LES DEUX SENS : le plateau droit convertit lui
 * aussi ce que les prélèvements ont acheté.
 *
 * ⚠ Les prix marqués `a-sourcer` attendent le relevé officiel. Ils s'affichent
 * avec leur réserve tant qu'ils ne sont pas confirmés, et la page méthode les
 * liste. Ne jamais retirer la réserve sans avoir mis l'URL en face.
 */

export type Provenance = "releve" | "ordre-de-grandeur" | "a-sourcer";

export type Unite = {
  id: string;
  /** Au singulier, sans article. */
  nom: string;
  /** Au pluriel, tel qu'on l'écrit après un nombre. */
  pluriel: string;
  prix: number;
  provenance: Provenance;
  source: string;
};

/** Les petites unités, pour les grands nombres. */
export const UNITES: Unite[] = [
  {
    id: "croissant",
    nom: "croissant au beurre",
    pluriel: "croissants au beurre",
    prix: 1.2,
    provenance: "a-sourcer",
    source: "prix moyen en boulangerie, à confirmer sur relevé officiel",
  },
  {
    id: "baguette",
    nom: "baguette de tradition",
    pluriel: "baguettes de tradition",
    prix: 1.3,
    provenance: "a-sourcer",
    source: "prix moyen, à confirmer sur relevé officiel",
  },
  {
    id: "cinema",
    nom: "place de cinéma",
    pluriel: "places de cinéma",
    prix: 7.5,
    provenance: "a-sourcer",
    source: "prix moyen d'entrée, CNC",
  },
  {
    id: "plein",
    nom: "plein de cinquante litres",
    pluriel: "pleins de cinquante litres",
    prix: 87,
    provenance: "a-sourcer",
    source: "relevé hebdomadaire des prix des carburants",
  },
  {
    id: "loyer",
    nom: "mois de loyer",
    pluriel: "mois de loyer",
    prix: 750,
    provenance: "a-sourcer",
    source: "loyer moyen d'un deux-pièces hors Paris",
  },
];

/**
 * L'échelle des objets, du plus cher au moins cher. Le curseur la parcourt et
 * l'objet se transforme sous les yeux : le château perd ses tours, devient une
 * maison, un studio, une voiture triste.
 */
export type Palier = {
  id: string;
  seuil: number;
  nom: string;
  /** La phrase qui suit, et qui fait le registre. */
  pointe: string;
  provenance: Provenance;
  source: string;
};

export const ECHELLE: Palier[] = [
  {
    id: "chateau",
    seuil: 2_000_000,
    nom: "Un château habitable, avec des douves",
    pointe: "Les douves ne sont pas en eau. On ne peut pas tout avoir.",
    provenance: "ordre-de-grandeur",
    source: "marché des demeures historiques, ordre de grandeur assumé",
  },
  {
    id: "maison-piscine",
    seuil: 900_000,
    nom: "Une maison avec piscine dans le Var",
    pointe: "La piscine n’est pas chauffée. On ne peut pas tout avoir.",
    provenance: "ordre-de-grandeur",
    source: "prix au mètre carré du Var, hypothèse de surface explicite",
  },
  {
    id: "maison",
    seuil: 350_000,
    nom: "Une maison, sans la piscine",
    pointe: "Il reste de quoi mettre une bâche sur le terrain vague.",
    provenance: "ordre-de-grandeur",
    source: "prix moyen d’une maison en France",
  },
  {
    id: "t3",
    seuil: 200_000,
    nom: "Un trois-pièces en province",
    pointe: "Avec un balcon, si le braquage s’est bien passé.",
    provenance: "ordre-de-grandeur",
    source: "prix au mètre carré hors Île-de-France",
  },
  {
    id: "studio",
    seuil: 90_000,
    nom: "Un studio",
    pointe: "Vingt-deux mètres carrés. Le lit se replie.",
    provenance: "ordre-de-grandeur",
    source: "prix au mètre carré hors Île-de-France",
  },
  {
    id: "voiture",
    seuil: 15_000,
    nom: "Une petite voiture neuve",
    pointe: "Blanche, sans options. Elle démarre, c’est déjà ça.",
    provenance: "a-sourcer",
    source: "tarif catalogue constructeur, à confirmer",
  },
  {
    id: "scooter",
    seuil: 2_500,
    nom: "Un scooter d’occasion",
    pointe: "Il faudra le pousser les jours de pluie.",
    provenance: "a-sourcer",
    source: "cote de l’occasion, à confirmer",
  },
  {
    id: "rien",
    seuil: 0,
    nom: "De quoi faire les courses un moment",
    pointe: "C’est peu. C’est aussi ce que ça veut dire.",
    provenance: "a-sourcer",
    source: "panier moyen, à confirmer",
  },
];

/** L'objet le plus cher qu'on pouvait s'offrir avec ce montant. */
export function objetPour(montant: number): Palier {
  return ECHELLE.find((p) => montant >= p.seuil) ?? ECHELLE[ECHELLE.length - 1];
}

/**
 * Le comptage absurde : on choisit l'unité qui donne un nombre à cinq ou six
 * chiffres. En dessous, ça ne frappe pas ; au-dessus, ça ne se lit plus.
 */
export function comptageAbsurde(montant: number): { nombre: number; unite: Unite } {
  const candidates = UNITES.map((u) => ({ unite: u, nombre: Math.round(montant / u.prix) }));
  const bon =
    candidates.find((c) => c.nombre >= 10_000 && c.nombre < 1_000_000) ??
    candidates.find((c) => c.nombre >= 1_000) ??
    candidates[candidates.length - 1];
  return bon;
}

/**
 * Au-delà d'un certain montant on ne convertit plus en biens, mais en années
 * de vie sans travailler. C'est la seule unité qui reste lisible quand le
 * nombre d'objets devient une abstraction.
 */
export function anneesSansTravailler(montant: number, netMensuel: number): number {
  if (netMensuel <= 0) return 0;
  return montant / (netMensuel * 12);
}

/** Au-dessus de ce montant, la conversion en années remplace l'objet. */
export const SEUIL_ANNEES = 700_000;

/**
 * Le second plateau, converti lui aussi. Ce sont des équivalents de PRIX
 * PRIVÉ : ce que la même chose coûterait à quelqu'un qui devrait la payer.
 * C'est le passage le plus attaquable de la page, donc chaque ligne dit d'où
 * elle vient et se présente comme un ordre de grandeur, jamais comme un devis.
 */
export type Contrepartie = {
  cle: "retraite" | "sante" | "education" | "chomage";
  /** Ce que ça coûterait ailleurs, en une phrase. */
  ailleurs: string;
  provenance: Provenance;
  source: string;
};

export const CONTREPARTIES_AILLEURS: Contrepartie[] = [
  {
    cle: "retraite",
    ailleurs:
      "Le capital qu’il faudrait avoir devant soi pour s’acheter la même rente à vie, indexée, avec réversion.",
    provenance: "releve",
    source: "tables de mortalité TGF05, taux technique réel, frais sur arrérages",
  },
  {
    cle: "sante",
    ailleurs:
      "Ce que la même couverture coûte à une famille américaine, prime d’assurance et reste à charge compris.",
    provenance: "a-sourcer",
    source: "à sourcer sur KFF Employer Health Benefits Survey",
  },
  {
    cle: "education",
    ailleurs:
      "Ce que douze ans d’école privée sous contrat coûtent à une famille qui les paie.",
    provenance: "a-sourcer",
    source: "à sourcer sur le coût public par élève, DEPP",
  },
  {
    cle: "chomage",
    ailleurs:
      "Ce qu’une assurance perte d’emploi privée facture pour la même garantie.",
    provenance: "a-sourcer",
    source: "à sourcer sur les contrats du marché",
  },
];

/** Tout ce qui attend encore sa source, pour la page méthode. */
export function aSourcer(): string[] {
  return [
    ...UNITES.filter((u) => u.provenance === "a-sourcer").map((u) => u.nom),
    ...ECHELLE.filter((p) => p.provenance === "a-sourcer").map((p) => p.nom),
    ...CONTREPARTIES_AILLEURS.filter((c) => c.provenance === "a-sourcer").map((c) => c.cle),
  ];
}
