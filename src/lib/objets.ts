/**
 * Le convertisseur d'objets.
 *
 * Registre : absurde assumé. L'absurdité vient de la QUANTITÉ (« 1,3 million de
 * baguettes »), jamais du prix unitaire, qui doit être exact et sourcé. Un prix
 * inventé est le seul endroit par lequel cette page peut se faire démonter en
 * trente secondes, parce que c'est le seul chiffre que le lecteur peut vérifier
 * de tête.
 *
 * Le convertisseur marche DANS LES DEUX SENS : le plateau droit convertit lui
 * aussi ce que les prélèvements ont acheté.
 *
 * Prix relevés le 06/09/2026, détail et URL dans le rapport de recherche versé
 * au dossier de travail sous le nom RECHERCHE-PRIX-OBJETS.md.
 *
 * ⚠ Trois repères évidents ont été ÉCARTÉS faute de source acceptable, et il ne
 * faut pas les réintroduire de mémoire : le croissant au beurre (la série INSEE
 * s'arrête en 2005 et portait sur le croissant ordinaire), la baguette de
 * tradition (aucune source ne la distingue de la baguette courante), et le
 * château (aucune statistique publique ne code cette catégorie).
 */

export type Provenance = "releve" | "mediane" | "reconstitue";

export type Unite = {
  id: string;
  nom: string;
  pluriel: string;
  prix: number;
  provenance: Provenance;
  source: string;
};

/** Les petites unités, pour les grands nombres. */
export const UNITES: Unite[] = [
  {
    id: "baguette",
    nom: "baguette",
    pluriel: "baguettes",
    prix: 1.03,
    provenance: "releve",
    source: "prix moyen d’une baguette de 250 g, INSEE, juillet 2026",
  },
  {
    id: "cinema",
    nom: "place de cinéma",
    pluriel: "places de cinéma",
    prix: 7.42,
    provenance: "releve",
    source: "recette moyenne par entrée, CNC, bilan 2025",
  },
  {
    id: "foot",
    nom: "place de Ligue 1",
    pluriel: "places de Ligue 1",
    prix: 35.52,
    provenance: "releve",
    source: "billet au match hors abonnement, DNCG, saison 2024-2025",
  },
  {
    id: "transport",
    nom: "abonnement mensuel de transport",
    pluriel: "abonnements mensuels de transport",
    prix: 59.5,
    provenance: "reconstitue",
    source: "moyenne de cinq grands réseaux urbains, relevés 2026",
  },
  {
    id: "panier",
    nom: "semaine de courses",
    pluriel: "semaines de courses",
    prix: 64.8,
    provenance: "reconstitue",
    source: "Budget de famille 2017 pour une personne seule, réévalué sur l’indice alimentaire",
  },
  {
    id: "plein",
    nom: "plein de cinquante litres",
    pluriel: "pleins de cinquante litres",
    prix: 98.5,
    provenance: "releve",
    source: "1,97 €/L de SP95-E10, INSEE, juillet 2026",
  },
  {
    id: "loyer",
    nom: "mois de loyer",
    pluriel: "mois de loyer",
    prix: 624,
    provenance: "reconstitue",
    source: "16,86 €/m² charges comprises sur 37 m², carte des loyers 2025, hors Paris",
  },
];

/**
 * L'échelle des objets, du plus cher au moins cher. Le curseur la parcourt et
 * l'objet se transforme sous les yeux.
 *
 * Les cinq premiers barreaux sont des MÉDIANES recalculées sur les 822 240
 * ventes de la base des demandes de valeurs foncières 2025. Ce ne sont pas des
 * estimations d'agence : chaque prix se rejoue à partir d'un prix au mètre
 * carré et d'une surface, tous deux écrits ici.
 */
export type Palier = {
  id: string;
  seuil: number;
  nom: string;
  /** La phrase qui suit, et qui fait le registre. */
  pointe: string;
  provenance: Provenance;
  source: string;
  /**
   * Le dessin du barreau, dans `public/images/butin/<id>.webp`, quand il
   * existe. Au trait, encre sur papier, même main que la caricature : l'image
   * change sous le curseur, elle doit se lire comme une seule série. Absent
   * sur le barreau le plus bas, que la génération n'a pas pu servir.
   */
  image?: string;
};

export const ECHELLE: Palier[] = [
  {
    id: "grande-maison",
    image: "grande-maison",
    seuil: 1_128_000,
    nom: "Une maison de plus de cinq cents mètres carrés",
    pointe: "Il restera des pièces où vous n’entrerez jamais.",
    provenance: "mediane",
    source: "médiane des ventes de maisons de 500 m² et plus, DVF 2025",
  },
  {
    id: "maison-var",
    image: "maison-var",
    seuil: 570_000,
    nom: "Une maison avec terrain dans le Var",
    pointe: "La piscine, elle, n’est codée dans aucune statistique publique.",
    provenance: "mediane",
    source: "médiane des ventes de maisons avec terrain dans le Var, DVF 2025",
  },
  {
    id: "maison",
    image: "maison",
    seuil: 205_000,
    nom: "Une maison de quatre-vingt-quatorze mètres carrés",
    pointe: "2 158 € le mètre carré. C’est la France médiane, sans le décor.",
    provenance: "mediane",
    source: "médiane nationale des ventes de maisons, DVF 2025",
  },
  {
    id: "t3",
    image: "t3",
    seuil: 188_100,
    nom: "Un trois-pièces de soixante-quatre mètres carrés",
    pointe: "Avec un balcon, si le braquage s’est bien passé.",
    provenance: "mediane",
    source: "médiane des ventes de trois-pièces, DVF 2025",
  },
  {
    id: "studio",
    image: "studio",
    seuil: 98_000,
    nom: "Un studio de vingt-six mètres carrés",
    pointe: "Le lit se replie. C’est prévu pour.",
    provenance: "mediane",
    source: "médiane des ventes de studios, DVF 2025",
  },
  {
    id: "twingo",
    image: "twingo",
    seuil: 19_490,
    nom: "Une Twingo neuve",
    pointe: "Électrique. Elle démarre, c’est déjà ça.",
    provenance: "reconstitue",
    source: "tarif catalogue reconstitué, le constructeur n’affichant que des prix nets de prime",
  },
  {
    id: "sandero",
    image: "sandero",
    seuil: 13_290,
    nom: "Une Dacia Sandero neuve",
    pointe: "Blanche, sans options, et elle vous enterrera.",
    provenance: "releve",
    source: "tarif catalogue constructeur, 2026",
  },
  {
    id: "courses",
    seuil: 0,
    nom: "De quoi faire les courses un moment",
    pointe: "C’est peu. C’est aussi ce que ça veut dire.",
    provenance: "reconstitue",
    source: "panier hebdomadaire d’une personne seule",
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
 * La rémunération NETTE annuelle d'un député, telle que l'Assemblée nationale
 * la publie. C'est le repère de comparaison le plus parlant du dossier, et
 * celui où l'on se trompe le plus facilement.
 *
 * ⚠⚠ NE JAMAIS y ajouter l'avance de frais de mandat : elle N'EXISTE PLUS.
 * Elle a été fusionnée au 1er janvier 2026 dans la dotation de fonctionnement
 * parlementaire (7 238,04 € par mois), qui n'est PAS une rémunération, ne
 * s'ajoute jamais au net, et se justifie sur pièces. Un dossier qui additionne
 * les deux se fait démonter en une réponse.
 */
export const DEPUTE_NET_ANNUEL = 71_440.08;
export const DEPUTE_NET_MENSUEL = 5_953.34;

export function enAnneesDeDepute(montant: number): number {
  return montant / DEPUTE_NET_ANNUEL;
}

/**
 * Au-delà d'un certain montant on ne convertit plus en biens, mais en années de
 * vie sans travailler. C'est la seule unité qui reste lisible quand le nombre
 * d'objets devient une abstraction.
 */
export function anneesSansTravailler(montant: number, netMensuel: number): number {
  if (netMensuel <= 0) return 0;
  return montant / (netMensuel * 12);
}

/** Au-dessus de ce montant, la conversion en années s'ajoute à l'objet. */
export const SEUIL_ANNEES = 700_000;

/**
 * Le second plateau, converti lui aussi.
 *
 * ⚠ Ce sont les lignes les plus attaquables de la page : trois des quatre
 * postes sont des ordres de grandeur assumés côté moteur, et leur équivalent
 * « prix privé » n'a pas encore de source. Elles s'affichent donc comme des
 * questions ouvertes, jamais comme des devis, et la page méthode les liste.
 */
export type Contrepartie = {
  cle: "retraite" | "sante" | "education" | "chomage";
  ailleurs: string;
  sourcee: boolean;
  source: string;
};

export const CONTREPARTIES_AILLEURS: Contrepartie[] = [
  {
    cle: "retraite",
    ailleurs:
      "Le capital qu’il faudrait avoir devant soi pour s’acheter la même rente à vie, indexée, avec réversion.",
    sourcee: true,
    source: "tables de mortalité TGF05, taux technique réel, frais sur arrérages",
  },
  {
    cle: "sante",
    ailleurs: "Ce que la même couverture coûterait à une famille qui la paie entièrement.",
    sourcee: false,
    source: "équivalent privé non encore sourcé",
  },
  {
    cle: "education",
    ailleurs: "Ce que douze ans de scolarité coûteraient à une famille qui les paie.",
    sourcee: false,
    source: "équivalent privé non encore sourcé",
  },
  {
    cle: "chomage",
    ailleurs: "Ce qu’une assurance perte d’emploi privée facturerait pour la même garantie.",
    sourcee: false,
    source: "équivalent privé non encore sourcé",
  },
];

/** Tout ce qui attend encore sa source, pour la page méthode. */
export function aSourcer(): string[] {
  return [
    ...UNITES.filter((u) => u.provenance === "reconstitue").map((u) => u.nom),
    ...ECHELLE.filter((p) => p.provenance === "reconstitue").map((p) => p.nom),
    ...CONTREPARTIES_AILLEURS.filter((c) => !c.sourcee).map((c) => c.cle),
  ];
}
