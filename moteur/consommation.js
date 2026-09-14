/**
 * Les accises, déclarées par la personne : tabac, carburant, alcool.
 *
 * Le taux d'effort TVA par décile (CPO, Boutchenik) ne couvre que la TVA.
 * Les ACCISES, elles, n'y sont pas, et elles dépendent d'habitudes que
 * personne ne peut deviner : un paquet par jour, c'est plus de trois mille
 * euros d'accise par an, et rien pour un non-fumeur. Le site ne fournit donc
 * que le barème, sourcé, et la personne dit ce qu'elle consomme. Demande de
 * Coq, 08/09/2026 au soir.
 *
 * ⚠ Sans profil, `simuler` n'ajoute RIEN : c'est le comportement de
 * référence des anciens tests, où les accises étaient supposées couvertes par
 * le taux d'effort. Tout est en euros d'aujourd'hui, constant sur la carrière.
 */

/*
 * ⚠⚠ ON NE COMPTE QUE L'ACCISE, JAMAIS LA TVA, SUR AUCUN POSTE.
 *
 * `TVA_TAUX_EFFORT_DECILES` (baremes-2026.js) est un taux d'effort **TVA**, et
 * rien d'autre : la TVA de tout le budget y est déjà, tabac, carburant et
 * alcool compris. Les accises, elles, n'y sont pas, et c'est ce qui justifie de
 * les demander à la personne.
 *
 * Le tabac et le carburant comptaient pourtant leur TVA en plus jusqu'au
 * 14/09/2026 : 2,25 € par paquet et 17,39 € par plein comptés DEUX FOIS. Et le
 * volet affirmait l'inverse à l'écran (« on ne compte QUE la taxe propre à
 * chacun, jamais la TVA »). La page se contredisait elle-même, en faveur de sa
 * propre thèse, ce qui est la pire direction possible pour une erreur.
 *
 * Conséquence assumée : les montants BAISSENT. Un paquet par jour passe de
 * 3 916 à 3 245 € par an, un plein par mois de 599 à 402 €.
 */

/**
 * Le paquet de 20, et l'accise dessus.
 *
 * ⚠ La formule n'est pas un pourcentage : l'accise est un taux proportionnel
 * PLUS un montant fixe, avec un minimum de perception qui mord sous 11,22 €.
 * Un « 82,5 % de taxes » recopié se trompe dès que le prix bouge, et il
 * incluait la TVA.
 */
export const TABAC = {
  prixPaquet: 13.5,
  partProportionnelle: 0.55,
  specifiqueParPaquet: 1.466,
  minimumParPaquet: 7.638,
  source:
    'paquet de 20 à 13,50 € (Marlboro Red, arrêté du 5 août 2026 homologuant les prix, en vigueur au 01/09/2026) ; accise 2026 = 55 % du prix plus 73,30 € par mille unités, minimum de perception 381,90 € par mille (arrêté du 24 décembre 2025, articles L. 314-1 et suivants du CIBS). Un fumeur quotidien fume en moyenne 12,8 cigarettes par jour (Baromètre de Santé publique France 2024)',
};

/**
 * Le plein de 50 litres de SP95-E10, et l'accise dessus.
 *
 * ⚠ 2,0869 €/L relevé, et la TVA n'entre PAS dans le compte : elle est dans le
 * taux d'effort. L'accise, si.
 */
export const CARBURANT = {
  litres: 50,
  prixLitre: 2.0869,
  acciseParLitre: 0.6702,
  source:
    'SP95-E10 à 2,0869 € le litre (relevé DGEC du 4 septembre 2026, France métropolitaine hors Corse) ; accise 2026 de 75,397 €/MWh, soit 0,6702 € le litre (article L. 312-83 du CIBS ; la modulation régionale a disparu le 01/08/2025 et la majoration Île-de-France le 01/01/2026). Une voiture roule 11 600 km par an en moyenne (SDES, parc au 01/01/2026)',
};

/**
 * L'ALCOOL, ENFIN CALCULÉ AU LIEU D'ÊTRE SUPPOSÉ.
 *
 * Il portait « 57 € et 400 € par an », deux ordres de grandeur posés à la main
 * et sans arithmétique derrière. Ils sont remplacés par un calcul dont chaque
 * terme est sourcé.
 *
 * ⚠ LE PROBLÈME DE L'ALCOOL, C'EST QU'UN VERRE N'EST PAS UN VERRE. À quantité
 * d'alcool pur égale, les droits vont de 34,92 €/hlap sur le vin à 2 552,89 sur
 * les spiritueux : un facteur SOIXANTE-TREIZE. Une estimation « un verre par
 * jour coûte tant » qui ne dit pas QUEL verre se trompe d'un facteur cinq.
 *
 * On prend donc le VERRE STANDARD (10 g d'alcool pur, l'unité de l'OFDT) et on
 * le pondère par la consommation réelle des Français : 52 % de l'alcool bu est
 * du vin, 25 % de la bière, 21 % des spiritueux (OFDT, bilan 2024). Le buveur
 * moyen n'existe pas, mais le mélange, lui, est mesuré.
 */
const DROITS_PAR_10G = {
  // Accise seule : 4,19 €/hl de produit sur un vin à 12°, soit 34,92 €/hlap.
  vin: 0.0044,
  // 8,24 €/hl/degré, soit 824 €/hlap quel que soit le titre de la bière.
  biere: 0.104,
  // Accise 1 932,42 + cotisation sécurité sociale 620,47 = 2 552,89 €/hlap.
  spiritueux: 0.323,
};
/** La part de chaque boisson dans l'alcool pur bu en France (OFDT 2024). */
const MELANGE = { vin: 0.52, biere: 0.25, spiritueux: 0.21 };
const droitsParVerre =
  DROITS_PAR_10G.vin * MELANGE.vin
  + DROITS_PAR_10G.biere * MELANGE.biere
  + DROITS_PAR_10G.spiritueux * MELANGE.spiritueux;

export const ALCOOL = {
  droitsParVerre,
  parSemaineParAn: 52 * droitsParVerre,
  chaqueSoirParAn: 365 * droitsParVerre,
  source:
    'accises 2026 sur les alcools (circulaire DGDDI du 22/12/2025) et cotisation sécurité sociale sur les boissons de plus de 18 degrés (620,47 € par hectolitre d’alcool pur) ; verre standard de 10 g d’alcool pur, pondéré par ce que boivent les Français, 52 % de vin, 25 % de bière et 21 % de spiritueux en volume d’alcool pur (OFDT, bilan 2024)',
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

/** L'accise d'un paquet : proportionnelle plus forfaitaire, jamais sous le minimum. */
const taxesParPaquet = Math.max(
  TABAC.partProportionnelle * TABAC.prixPaquet + TABAC.specifiqueParPaquet,
  TABAC.minimumParPaquet,
);
const prixPlein = CARBURANT.litres * CARBURANT.prixLitre;
const taxesParPlein = CARBURANT.litres * CARBURANT.acciseParLitre;
const accisesElecSans = ELECTRICITE.sansChauffageMWh * ELECTRICITE.acciseParMWh;
const accisesElecAvec = ELECTRICITE.avecChauffageMWh * ELECTRICITE.acciseParMWh;
const accisesGazCuisine = GAZ.cuisineMWh * GAZ.acciseParMWh;
const accisesGazChauffage = GAZ.chauffageMWh * GAZ.acciseParMWh;

/** Un nombre en euros, à la française, pour les explications ci-dessous. */
function eur(n, decimales = 0) {
  return n.toFixed(decimales).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * CE QU'ON RÉPOND QUAND ON CLIQUE SUR « D'OÙ SORTENT CES CHIFFRES ? ».
 *
 * ⚠ UNE ENTRÉE PAR POSTE, CONSTRUITE AVEC LES CONSTANTES, jamais recopiée à la
 * main. Le volet affichait un paragraphe fourre-tout où trois postes sur six
 * n'étaient pas expliqués du tout, et les montants y étaient réécrits à côté de
 * ceux qui les calculent : deux endroits, donc deux vérités le jour où l'un
 * bouge. Ici le texte SE FABRIQUE à partir des mêmes nombres que le calcul, et
 * un poste ajouté sans explication se voit tout de suite (Coq, 14/09/2026 :
 * « toujours préciser quand la personne clique sur d'où sortent ces chiffres »).
 */
export const EXPLICATIONS = {
  tabac: {
    titre: 'Le tabac',
    calcul: `Un paquet de 20 à ${eur(TABAC.prixPaquet, 2)} € porte ${eur(taxesParPaquet, 2)} € d’accise, soit ${Math.round((taxesParPaquet / TABAC.prixPaquet) * 100)} % du prix. Un paquet par semaine fait 52 paquets, un paquet par jour en fait 365.`,
    source: TABAC.source,
  },
  alcool: {
    titre: 'L’alcool',
    calcul: `${eur(ALCOOL.droitsParVerre * 100)} centimes de droits par verre standard, soit ${eur(ALCOOL.parSemaineParAn)} € par an pour un verre par semaine et ${eur(ALCOOL.chaqueSoirParAn)} € pour un verre chaque soir. ⚠ Un verre n’est pas un verre : à quantité d’alcool égale, les spiritueux paient 73 fois plus de droits que le vin.`,
    source: ALCOOL.source,
  },
  electricite: {
    titre: 'L’électricité',
    calcul: `${eur(ELECTRICITE.acciseParMWh, 2)} € d’accise par MWh, sur ${eur(ELECTRICITE.sansChauffageMWh * 1000)} kWh si vous vous chauffez autrement (${eur(accisesElecSans)} € par an) et ${eur(ELECTRICITE.avecChauffageMWh * 1000)} kWh si tout est électrique (${eur(accisesElecAvec)} €).`,
    source: ELECTRICITE.source,
  },
  gaz: {
    titre: 'Le gaz',
    calcul: `${eur(GAZ.acciseParMWh, 2)} € d’accise par MWh, sur ${eur(GAZ.cuisineMWh * 1000)} kWh pour la cuisine seule (${eur(accisesGazCuisine)} € par an) et ${eur(GAZ.chauffageMWh * 1000)} kWh pour une chaudière (${eur(accisesGazChauffage)} €).`,
    source: GAZ.source,
  },
  avion: {
    titre: 'L’avion',
    calcul: `${eur(AVION.europeParDepart, 2)} € de taxes par départ vers l’Europe, ${eur(AVION.lointainParDepart, 2)} € vers une destination lointaine. Un aller-retour ne compte qu’UN départ : le vol de retour part d’un autre pays, qui applique ses propres taxes.`,
    source: AVION.source,
  },
  carburant: {
    titre: 'Le carburant',
    calcul: `Un plein de ${CARBURANT.litres} litres à ${eur(prixPlein, 2)} € porte ${eur(taxesParPlein, 2)} € d’accise, à ${eur(CARBURANT.acciseParLitre, 4)} € le litre. La TVA n’est pas recomptée ici, mais elle porte bien sur l’accise à la pompe : on paie une taxe sur une taxe.`,
    source: CARBURANT.source,
  },
};

/**
 * Les six questions du café. Chaque choix porte une `pointe` : une phrase
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
      { id: 'soir', libelle: 'Un verre chaque soir', pointe: 'C’est culturel, c’est le patrimoine.', repere: '365 VERRES', parAn: ALCOOL.chaqueSoirParAn },
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
