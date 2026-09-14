/**
 * Les accises, déclarées par la personne : tabac, carburant, alcool.
 *
 * Le taux d'effort TVA par décile (CPO, Boutchenik) ne couvre que la TVA.
 * Les accises dépendent d'habitudes que personne ne peut deviner : un paquet
 * par jour, c'est près de quatre mille euros de taxes par an, et rien pour
 * un non-fumeur. Le site ne fournit donc que le PRIX UNITAIRE, sourcé, et la
 * personne dit ce qu'elle consomme. Demande de Coq, 08/09/2026 au soir.
 *
 * ⚠ Sans profil, `simuler` n'ajoute RIEN : c'est le comportement de
 * référence des anciens tests, où les accises étaient supposées couvertes par
 * le taux d'effort. Tout est en euros d'aujourd'hui, constant sur la carrière.
 */

/** Paquet de 20 : prix modal 13,00 € au 01/09/2026, dont 82,5 % de taxes (droits de consommation et TVA). */
export const TABAC = {
  prixPaquet: 13.0,
  partTaxes: 0.825,
  source: 'DGDDI, prix modal du paquet de 20 au 01/09/2026 ; part des taxes, Conseil des prélèvements obligatoires',
};

/** Un plein de 50 L de SP95-E10 à 98,50 € : TICPE 0,6702 €/L, plus la TVA à 20 % sur le prix TTC. */
export const CARBURANT = {
  prixPlein: 98.5,
  litres: 50,
  ticpeParLitre: 0.6702,
  source: 'TICPE 2026 sur le SP95-E10 (majoration régionale abrogée par la LF 2025) ; plein relevé à 98,50 €',
};

/**
 * L'alcool : ordres de grandeur ASSUMÉS, parce que l'accise dépend du produit
 * (le vin est presque exempt de droits, les spiritueux paient 1 932,42 € par
 * hectolitre d'alcool pur). Une bouteille de vin par semaine, c'est surtout de
 * la TVA ; un verre chaque soir plus une bouteille de spiritueux par mois,
 * c'est l'accise qui pèse.
 */
export const ALCOOL = {
  /*
   * ⚠ UN VERRE PAR SEMAINE, PAS UNE BOUTEILLE. Le choix du milieu proposait
   * une bouteille par semaine, ce qui est déjà une consommation soutenue :
   * personne ne se reconnaissait entre « jamais » et « une bouteille », donc
   * le milieu ne servait à rien (Coq, 14/09/2026 : « une bouteille par semaine
   * c'est trop »). Les deux montants descendent maintenant du MÊME ordre de
   * grandeur par verre, 52 verres contre 365, au lieu d'être posés chacun de
   * son côté.
   */
  parSemaineParAn: Math.round((400 * 52) / 365),
  chaqueSoirParAn: 400,
  source: 'accise spiritueux 2026 (1 932,42 € par hectolitre d’alcool pur), droits sur le vin, TVA à 20 % : ordres de grandeur assumés, 52 verres par an contre 365',
};

/**
 * L'électricité : l'ACCISE seule, pas la TVA.
 *
 * ⚠ LA TVA EST DÉJÀ COMPTÉE AILLEURS. Le taux d'effort par décile couvre
 * toute la TVA du budget, celle de la facture d'électricité comprise :
 * l'ajouter ici la compterait deux fois et gonflerait le verdict d'un
 * montant qui n'existe pas. Ne sont ajoutées que les taxes SPÉCIFIQUES, que
 * le taux d'effort ne voit pas. Même règle pour le gaz et l'avion.
 *
 * Les deux consommations sont les CLIENTS TYPES de la CRE, ceux qui servent
 * à comparer les offres. Ce ne sont pas des moyennes constatées, et aucune
 * moyenne officielle « par ménage » n'est publiée : le dossier dit ce qu'il
 * utilise plutôt que d'inventer une moyenne.
 */
export const ELECTRICITE = {
  acciseParMWh: 30.62,
  sansChauffageMWh: 2.4,
  avecChauffageMWh: 8.5,
  source:
    'accise sur l’électricité, catégorie ménages, 30,62 €/MWh du 01/08/2026 au 31/01/2027 (guide DGEC 2026 sur la fiscalité des énergies) ; consommations : clients types CRE, 2 400 kWh en base 6 kVA et 8 500 kWh en heures creuses 9 kVA',
};

/**
 * Le gaz : l'accise seule, là aussi. Le tarif est en MWh PCS, exactement
 * l'unité de la facture, donc le client type de la CRE s'y applique
 * directement (le piège serait de prendre une statistique en PCI, inférieure
 * d'environ 11 %).
 */
export const GAZ = {
  acciseParMWh: 16.66,
  cuisineMWh: 0.61,
  chauffageMWh: 14,
  source:
    'accise sur les gaz naturels à usage combustible, 16,66 €/MWh PCS du 01/08/2026 au 31/01/2027 (guide DGEC 2026) ; consommations : clients types CRE, 610 kWh en cuisine et 14 000 kWh en chauffage',
};

/**
 * L'avion : ce que l'État prend sur un passager qui DÉCOLLE DE FRANCE.
 *
 * ⚠ Un aller-retour ne compte qu'UN départ taxé : le vol retour part d'un
 * autre pays, qui applique ses propres taxes, pas les nôtres.
 *
 * Le tarif de sûreté et de sécurité (de 3,30 € à 11,80 € en classe 1) n'est
 * pas compté : il est fixé aéroport par aéroport, et on ne sait pas d'où la
 * personne décolle. Le chiffre est donc un plancher, et il est annoncé comme
 * tel.
 */
/**
 * ⚠ LE TARIF DE SÛRETÉ MANQUAIT, et il pesait 45 % du total.
 *
 * Il était écarté du calcul le 14/09/2026 au matin parce qu'il est fixé
 * aéroport par aéroport et qu'on ne sait pas d'où la personne décolle : 13,96 €
 * pour un aller-retour en Europe, un chiffre qui a l'air faux (Coq : « 14 € de
 * taxe c'est tout ??? »). Écarter une taxe réelle pour ne pas choisir une
 * valeur est pire qu'assumer une hypothèse : on publie un total qui ne
 * correspond à aucun billet existant.
 *
 * On prend donc PARIS, Roissy ou Orly, 11,80 €, et on l'écrit. C'est le départ
 * le plus probable, et le montant est dans le code, à l'article A. 422-12.
 *
 * ⚠ ON NE COMPTE QUE LES TAXES, pas les redevances. La redevance passager du
 * groupe ADP (11,16 € en Schengen) est perçue par l'EXPLOITANT de l'aéroport,
 * pas par l'État : elle gonflerait la ligne « taxes et redevances » du billet à
 * une trentaine d'euros, mais ce n'est pas ce que ce dossier reproche.
 */
const T2S_PARIS = 11.8;
export const AVION = {
  europeParDepart: 7.4 + 5.21 + T2S_PARIS + 1.35,
  lointainParDepart: 40 + 9.37 + T2S_PARIS + 1.35,
  source:
    'au départ de Paris, en classe économique : tarif de solidarité (7,40 € vers l’Europe, 40 € vers une destination lointaine, barème de la loi de finances pour 2025, article L. 422-22 du CIBS), tarif de sûreté et de sécurité (11,80 € à Roissy et Orly, article A. 422-12), tarif de l’aviation civile (5,21 € et 9,37 € du 01/04/2026 au 31/03/2027, article A. 422-8) et péréquation aéroportuaire (1,35 € depuis le 01/07/2026, article A. 422-17) ; la redevance passager de l’aéroport n’est pas comptée, elle va à l’exploitant et non à l’État',
};

const taxesParPaquet = TABAC.prixPaquet * TABAC.partTaxes;
const tvaParPlein = CARBURANT.prixPlein - CARBURANT.prixPlein / 1.2;
const taxesParPlein = CARBURANT.litres * CARBURANT.ticpeParLitre + tvaParPlein;
const accisesElecSans = ELECTRICITE.sansChauffageMWh * ELECTRICITE.acciseParMWh;
const accisesElecAvec = ELECTRICITE.avecChauffageMWh * ELECTRICITE.acciseParMWh;
const accisesGazCuisine = GAZ.cuisineMWh * GAZ.acciseParMWh;
const accisesGazChauffage = GAZ.chauffageMWh * GAZ.acciseParMWh;

/**
 * Les trois questions du café. Chaque choix porte une `pointe` : une phrase
 * courte sous le libellé, qui fait sourire et qui dit au passage ce qui est
 * compté. Demande de Coq, 08/09/2026 : « un petit commentaire rigolo sous
 * chaque choix ».
 */
export const HABITUDES = {
  tabac: {
    question: 'Vous fumez ? (je juge pas)',
    defaut: 'non',
    choix: [
      { id: 'non', libelle: 'Non', pointe: 'Vos poumons vous remercient, pas le Trésor public.', repere: '0 €', parAn: 0 },
      { id: 'semaine', libelle: 'Un paquet par semaine', pointe: 'Le vendredi soir, surtout. Ça compte quand même.', repere: '52 PAR AN', parAn: 52 * taxesParPaquet },
      { id: 'jour', libelle: 'Un paquet par jour', pointe: 'Vous financez un ministère à vous tout seul.', repere: '365 PAR AN', parAn: 365 * taxesParPaquet },
    ],
  },
  carburant: {
    question: 'Et la voiture ?',
    defaut: 'mois',
    choix: [
      { id: 'non', libelle: 'Pas de voiture', pointe: 'Et je mets le carton dans la jaune.', repere: '0 €', parAn: 0 },
      { id: 'mois', libelle: 'Un plein par mois', pointe: 'Les courses, la belle-mère, et c’est tout.', repere: '12 PLEINS', parAn: 12 * taxesParPlein },
      { id: 'semaine', libelle: 'Un plein par semaine', pointe: 'Je suis plus chaud que le climat.', repere: '52 PLEINS', parAn: 52 * taxesParPlein },
    ],
  },
  alcool: {
    question: 'Un verre ?',
    defaut: 'parfois',
    choix: [
      { id: 'non', libelle: 'Jamais', pointe: 'Sobre, et fier. Le fisc s’en remettra.', repere: '0 €', parAn: 0 },
      { id: 'parfois', libelle: 'Un verre par semaine', pointe: 'Le dimanche midi, ça ne compte pas vraiment.', repere: '52 VERRES', parAn: ALCOOL.parSemaineParAn },
      { id: 'soir', libelle: 'Un verre chaque soir', pointe: 'C’est culturel, c’est le patrimoine.', repere: '~400 €', parAn: ALCOOL.chaqueSoirParAn },
    ],
  },
  electricite: {
    question: 'Chez vous, le chauffage, c’est l’électricité ?',
    defaut: 'base',
    choix: [
      { id: 'base', libelle: 'Non, je me chauffe autrement', pointe: 'Le frigo et la box tournent quand même.', repere: '2 400 KWH', parAn: accisesElecSans },
      { id: 'chauffage', libelle: 'Oui, tout à l’électrique', pointe: 'Le compteur, lui, ne dort jamais.', repere: '8 500 KWH', parAn: accisesElecAvec },
    ],
  },
  gaz: {
    question: 'Et le gaz ?',
    /*
     * ⚠ DÉFAUT NON NUL, comme le carburant et l'alcool. Un défaut à zéro fait
     * stagner le compteur pendant deux cartes, et un compteur qui ne monte plus
     * dit le contraire de ce qu'il est là pour dire (Coq, 14/09/2026).
     *
     * C'est la CUISINE et pas le chauffage, et l'écart compte : le chauffage au
     * gaz concerne une minorité de logements, le poser par défaut chiffrerait
     * 233 € à des gens qui n'ont pas de chaudière. Trois plaques, 610 kWh, dix
     * euros : modeste, mais vrai pour beaucoup de monde et modifiable en un clic.
     */
    defaut: 'cuisine',
    choix: [
      { id: 'non', libelle: 'Pas de gaz', pointe: 'Tout électrique, ou tout au bois.', repere: '0 €', parAn: 0 },
      { id: 'cuisine', libelle: 'La cuisine seulement', pointe: 'Trois plaques et une omelette.', repere: '610 KWH', parAn: accisesGazCuisine },
      { id: 'chauffage', libelle: 'Le chauffage au gaz', pointe: 'La chaudière, et la facture qui va avec.', repere: '14 000 KWH', parAn: accisesGazChauffage },
    ],
  },
  avion: {
    question: 'Vous prenez l’avion ?',
    /*
     * ⚠ Même raison : un aller-retour en Europe dans l'année, c'est UN départ
     * taxé et vingt-six euros. C'est le voyage le plus banal qui soit, et celui
     * qui ne prend jamais l'avion le décoche en un clic.
     */
    defaut: 'europe',
    choix: [
      { id: 'non', libelle: 'Jamais', pointe: 'Les pieds sur terre, le portefeuille aussi.', repere: '0 €', parAn: 0 },
      { id: 'europe', libelle: 'Un aller-retour en Europe dans l’année', pointe: 'Le retour part d’ailleurs : la France ne taxe que le départ.', repere: '1 DÉPART', parAn: AVION.europeParDepart },
      {
        id: 'souvent',
        libelle: 'Plusieurs vols, dont un long-courrier',
        pointe: 'Vous décollez, ils encaissent.',
        repere: '3 DÉPARTS',
        parAn: 2 * AVION.europeParDepart + AVION.lointainParDepart,
      },
    ],
  },
};

export const HABITUDES_DEFAUT = Object.fromEntries(
  Object.entries(HABITUDES).map(([poste, d]) => [poste, d.defaut]),
);

/**
 * L'ORDRE DES QUESTIONS, et la seule liste qui fasse foi.
 *
 * ⚠ Ajouter un poste, c'est ajouter une entrée à `HABITUDES` et son nom ici.
 * Tout le reste suit : la somme, le détail par poste, le compteur qui monte,
 * les écrans du parcours. Les trois fonctions plus bas énuméraient les postes
 * à la main, et un quatrième poste aurait été compté dans le détail sans
 * jamais entrer dans le total.
 */
/*
 * ⚠ L'ORDRE EST UN CHOIX DE MISE EN SCÈNE, pas l'ordre d'écriture.
 *
 * Le CARBURANT passe en DERNIER (14/09/2026). Il pèse 599 € à lui seul, contre
 * 57, 73, 10 et 14 pour les autres : posé en deuxième, il écrasait tout ce qui
 * suivait et les quatre dernières cartes ressemblaient à des miettes. En
 * dernier, le compteur monte doucement puis encaisse le coup, et la carte qui
 * ouvre l'addition est celle qui frappe.
 *
 * ⚠ Le TABAC reste en premier : sa réplique ouvre sur « Bon. », la charnière
 * qui enchaîne après la réaction au montant signé, et c'est la seule carte qui
 * porte le décor du café.
 */
export const POSTES = ['tabac', 'alcool', 'electricite', 'gaz', 'avion', 'carburant'];

/**
 * ⚠ NE PAS RÉPONDRE et RÉPONDRE N'IMPORTE QUOI sont deux choses.
 *
 * Un poste ABSENT retombe sur son défaut : c'est le cas d'un appelant qui ne
 * connaît que les postes d'avant (un ancien lien partagé, un test écrit quand
 * il n'y en avait que trois), et le faire lever casserait un dossier
 * parfaitement valide. Une VALEUR inconnue lève, elle, parce qu'elle veut dire
 * qu'on compte zéro sans le dire.
 */
function choix(poste, id) {
  const valeur = id === undefined || id === null ? HABITUDES[poste].defaut : id;
  const c = HABITUDES[poste].choix.find((x) => x.id === valeur);
  if (!c) throw new Error(`Habitude inconnue pour ${poste} : « ${id} »`);
  return c;
}

/** Les accises d'une année, en euros, d'après ce que la personne déclare. */
export function accisesAnnuelles(habitudes) {
  return POSTES.reduce((total, poste) => total + choix(poste, habitudes[poste]).parAn, 0);
}

/** Ce que chaque poste coûte par an, pour l'écran. */
export function detailAccises(habitudes) {
  const detail = { taxesParPaquet, taxesParPlein };
  for (const poste of POSTES) detail[poste] = choix(poste, habitudes[poste]).parAn;
  return detail;
}
