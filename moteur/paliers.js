/**
 * Le second plateau, chiffré PAR LA PERSONNE, en paliers.
 *
 * Santé, école et chômage n'ont aucune valeur « moyenne » opposable pour une
 * vie entière : la DREES exclut ce calcul de son champ, la DEPP publie un coût
 * par élève et par an mais jamais un cumul, l'Unédic publie une allocation
 * moyenne mais pas une durée par carrière. Le site ne fournit donc que le
 * PRIX UNITAIRE, sourcé, et c'est la personne qui dit combien elle en a
 * consommé, avec des libellés à sa voix. Le verdict change avec.
 *
 * Décision de Coq, 07/09/2026 au soir. Prix relevés le 07/09/2026, rapport
 * complet dans `RECHERCHE-PRIX-UNITAIRES-PALIERS.md` du dossier de travail.
 *
 * ⚠ Sans paliers, `simuler` garde ses trois lignes NOMMÉES SANS MONTANT :
 * c'est le comportement de référence des tests, et c'est ce qu'on veut quand
 * personne n'a répondu. Un montant par défaut serait un montant inventé.
 */

/** DEPP, Note d'Information n° 25.52, septembre 2025. Données 2024, par élève et par an, tous financeurs. */
export const PRIX_ECOLE = {
  maternelle: 8_990,
  elementaire: 9_130,
  college: 10_450,
  lyceeGeneral: 13_020,
  universite: 12_460,
  source: 'DEPP, Note d’Information n° 25.52 (septembre 2025), Compte de l’éducation, données 2024',
  url: 'https://www.education.gouv.fr/sites/default/files/2025-09/depp-ni-2025-52-442155.pdf',
};

/**
 * DREES, jeu open data « Dépenses de santé et restes à charge », SNDS,
 * millésime 2023. Colonne : dépense REMBOURSÉE par l'Assurance maladie
 * obligatoire, par consommant et par an, en euros 2023.
 *
 * ⚠ Les tranches de la DREES vont de 0 à 10 et de 11 à 20, pas de 0 à 9 : on
 * les reprend telles quelles. Le jeu couvre environ 85 % de la consommation de
 * soins (2 496 € par tête contre 2 956 € de financement public par habitant
 * dans les Comptes de la santé) : on n'applique AUCUN recalage, le chiffre
 * publié est le seul opposable.
 */
export const PRIX_SANTE = {
  /** [âge de début, âge de fin inclus, euros remboursés par an] */
  tranches: [
    [0, 10, 925],
    [11, 20, 887],
    [21, 30, 1_134],
    [31, 40, 1_477],
    [41, 50, 1_713],
    [51, 60, 2_557],
    [61, 70, 3_822],
    [71, 80, 5_587],
    [81, 120, 7_858],
  ],
  /** Dernier âge compté, INCLUS. 85 ans est l'horizon de la rente, en face. */
  dernierAge: 84,
  source: 'DREES, « Dépenses de santé et restes à charge », SNDS 2023, part remboursée par l’Assurance maladie',
  url: 'https://data.drees.solidarites-sante.gouv.fr/explore/dataset/depenses-de-sante-et-restes-a-charge/information/',
};

/** Unédic, « Le montant d'indemnisation chômage au 4e trimestre 2025 » (27/05/2026). Net versé, par mois. */
export const PRIX_CHOMAGE = {
  allocationNetteMensuelle: 1_040,
  source: 'Unédic, « Le montant d’indemnisation chômage au 4e trimestre 2025 », publié le 27/05/2026',
  url: 'https://www.unedic.org/publications/le-montant-dindemnisation-chomage-au-4e-trimestre-2025',
};

/** Ce que la Sécu rembourse à un âge donné, par an. */
export function santeParAn(age) {
  const tranche = PRIX_SANTE.tranches.find(([de, a]) => age >= de && age <= a);
  return tranche ? tranche[2] : 0;
}

/** Le cumul remboursé de la naissance au dernier âge compté. DÉRIVÉ, jamais publié tel quel. */
export function santeSurUneVie() {
  let total = 0;
  for (let age = 0; age <= PRIX_SANTE.dernierAge; age += 1) total += santeParAn(age);
  return total;
}

const ECOLE_JUSQU_AU_BAC =
  3 * PRIX_ECOLE.maternelle
  + 5 * PRIX_ECOLE.elementaire
  + 4 * PRIX_ECOLE.college
  + 3 * PRIX_ECOLE.lyceeGeneral;

/**
 * Les paliers, dans l'ordre où l'écran les propose. Le libellé est à la voix
 * de la personne, la `regle` dit ce qui est compté, le `facteur` ou les
 * `mois` font le calcul. Chaque poste porte un palier par défaut, celui qui
 * ne prend parti pour personne.
 */
export const PALIERS = {
  ecole: {
    question: 'L’école, ça t’aura servi ?',
    defaut: 'bac',
    choix: [
      { id: 'rien', libelle: 'J’ai séché, ça ne m’a servi à rien', repere: '0 %', montant: 0,
        regle: 'rien n’est compté' },
      { id: 'bac', libelle: 'Jusqu’au bac, et ça suffisait', repere: 'BAC', montant: ECOLE_JUSQU_AU_BAC,
        regle: 'trois ans de maternelle, cinq de primaire, quatre de collège, trois de lycée' },
      { id: 'etudes', libelle: 'Mes études m’ont amené là où je suis', repere: 'BAC +3',
        montant: ECOLE_JUSQU_AU_BAC + 3 * PRIX_ECOLE.universite,
        regle: 'jusqu’au bac, plus trois ans d’université' },
    ],
  },
  sante: {
    question: 'Ta santé, sur toute ta vie ?',
    defaut: 'normal',
    choix: [
      { id: 'fer', libelle: 'Santé de fer, jamais vu un médecin', repere: '¼', facteur: 0.25,
        regle: 'un quart de ce que la Sécu rembourse à chaque âge' },
      { id: 'normal', libelle: 'Comme tout le monde', repere: '×1', facteur: 1,
        regle: 'ce que la Sécu rembourse à chaque âge, de la naissance à 85 ans' },
      { id: 'fragile', libelle: 'Tout le temps malade, hypocondriaque', repere: '×2,5', facteur: 2.5,
        regle: 'deux fois et demie ce que la Sécu rembourse à chaque âge' },
    ],
  },
  chomage: {
    question: 'Le chômage, dans ta vie ?',
    defaut: 'trou',
    choix: [
      { id: 'jamais', libelle: 'Jamais', repere: '0 MOIS', mois: 0, regle: 'rien n’est compté' },
      { id: 'trou', libelle: 'Un trou d’air', repere: '6 MOIS', mois: 6,
        regle: 'six mois d’allocation moyenne' },
      { id: 'deuxAns', libelle: 'Deux ans, le temps de me retourner', repere: '24 MOIS', mois: 24,
        regle: 'vingt-quatre mois d’allocation moyenne' },
    ],
  },
};

/** Les paliers par défaut, ceux qu'on sert quand la personne n'a rien dit. */
export const PALIERS_DEFAUT = {
  ecole: PALIERS.ecole.defaut,
  sante: PALIERS.sante.defaut,
  chomage: PALIERS.chomage.defaut,
};

function choix(poste, id) {
  const c = PALIERS[poste].choix.find((x) => x.id === id);
  if (!c) throw new Error(`Palier inconnu pour ${poste} : « ${id} »`);
  return c;
}

/** Ce que vaut un palier d'école, en euros. */
export function montantEcole(id) {
  return choix('ecole', id).montant;
}

/** Ce que vaut un palier de santé, en euros, sur une vie. */
export function montantSante(id) {
  return Math.round(santeSurUneVie() * choix('sante', id).facteur);
}

/** Ce que vaut un palier de chômage, en euros. */
export function montantChomage(id) {
  return choix('chomage', id).mois * PRIX_CHOMAGE.allocationNetteMensuelle;
}

/**
 * Les trois lignes du second plateau, chiffrées d'après les paliers choisis.
 * Rend un objet de lignes au même format que `contreparties`, à fusionner.
 *
 * @param {{ecole: string, sante: string, chomage: string}} paliers
 * @param {string} regime  un fonctionnaire n'a pas de ligne chômage
 */
export function lignesChoisies(paliers, regime) {
  const ecole = choix('ecole', paliers.ecole);
  const sante = choix('sante', paliers.sante);
  const sortie = {
    education: {
      montant: montantEcole(ecole.id),
      libelle: 'L’école, payée pour toi',
      calcule: true,
      note: ecole.regle,
      palier: ecole.id,
      source: PRIX_ECOLE.source,
    },
    sante: {
      montant: montantSante(sante.id),
      libelle: 'Les soins, remboursés pour toi',
      calcule: true,
      note: sante.regle,
      palier: sante.id,
      source: PRIX_SANTE.source,
    },
  };
  if (regime !== 'fonctionnaire') {
    const chomage = choix('chomage', paliers.chomage);
    sortie.chomage = {
      montant: montantChomage(chomage.id),
      libelle: 'Le chômage, versé le jour où tu es tombé',
      calcule: true,
      note: chomage.regle,
      palier: chomage.id,
      source: PRIX_CHOMAGE.source,
    };
  }
  return sortie;
}
