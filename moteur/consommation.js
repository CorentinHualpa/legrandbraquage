/**
 * Les accises, déclarées par la personne : tabac, carburant, alcool.
 *
 * Le taux d'effort TVA par décile (CPO, Boutchenik) ne couvre que la TVA.
 * Les accises dépendent d'habitudes que personne ne peut deviner : un paquet
 * par jour, c'est 3 900 € de taxes par an, et rien pour un non-fumeur. Le
 * site ne fournit donc que le prix unitaire des taxes, sourcé, et la
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
  source: 'DGDDI, prix modal du paquet de 20 au 01/09/2026 ; part des taxes CPO',
};

/** Un plein de 50 L de SP95-E10 à 98,50 € : TICPE 0,6702 €/L, plus la TVA à 20 % sur le prix TTC. */
export const CARBURANT = {
  prixPlein: 98.5,
  litres: 50,
  ticpeParLitre: 0.6702,
  source: 'TICPE 2026 sur le SP95-E10 (LF 2025, majoration régionale abrogée) ; plein relevé à 98,50 €',
};

/**
 * L'alcool : ordres de grandeur ASSUMÉS, parce que l'accise dépend du produit
 * (le vin est presque exempt, les spiritueux paient 1 932,42 € par hectolitre
 * d'alcool pur). Une bouteille de vin par semaine, c'est surtout de la TVA ;
 * un verre chaque soir plus une bouteille de spiritueux par mois, c'est
 * l'accise qui pèse.
 */
export const ALCOOL = {
  parfoisParAn: 60,
  chaqueSoirParAn: 400,
  source: 'accise spiritueux 2026 (1 932,42 €/hL d’alcool pur), droits sur le vin, TVA à 20 %, ordres de grandeur',
};

const taxesParPaquet = TABAC.prixPaquet * TABAC.partTaxes;
const tvaParPlein = CARBURANT.prixPlein - CARBURANT.prixPlein / 1.2;
const taxesParPlein = CARBURANT.litres * CARBURANT.ticpeParLitre + tvaParPlein;

export const HABITUDES = {
  tabac: {
    question: 'Vous fumez ?',
    defaut: 'non',
    choix: [
      { id: 'non', libelle: 'Non', repere: '0 €', parAn: 0 },
      { id: 'semaine', libelle: 'Un paquet par semaine', repere: '52 PAQUETS', parAn: 52 * taxesParPaquet },
      { id: 'jour', libelle: 'Un paquet par jour', repere: '365 PAQUETS', parAn: 365 * taxesParPaquet },
    ],
  },
  carburant: {
    question: 'Et la voiture ?',
    defaut: 'mois',
    choix: [
      { id: 'non', libelle: 'Pas de voiture', repere: '0 €', parAn: 0 },
      { id: 'mois', libelle: 'Un plein par mois', repere: '12 PLEINS', parAn: 12 * taxesParPlein },
      { id: 'semaine', libelle: 'Un plein par semaine', repere: '52 PLEINS', parAn: 52 * taxesParPlein },
    ],
  },
  alcool: {
    question: 'Un verre ?',
    defaut: 'parfois',
    choix: [
      { id: 'non', libelle: 'Jamais', repere: '0 €', parAn: 0 },
      { id: 'parfois', libelle: 'Une bouteille par semaine', repere: '~60 €', parAn: ALCOOL.parfoisParAn },
      { id: 'soir', libelle: 'Un verre chaque soir', repere: '~400 €', parAn: ALCOOL.chaqueSoirParAn },
    ],
  },
};

export const HABITUDES_DEFAUT = {
  tabac: HABITUDES.tabac.defaut,
  carburant: HABITUDES.carburant.defaut,
  alcool: HABITUDES.alcool.defaut,
};

function choix(poste, id) {
  const c = HABITUDES[poste].choix.find((x) => x.id === id);
  if (!c) throw new Error(`Habitude inconnue pour ${poste} : « ${id} »`);
  return c;
}

/** Les accises d'une année, en euros, d'après ce que la personne déclare. */
export function accisesAnnuelles(habitudes) {
  return choix('tabac', habitudes.tabac).parAn
    + choix('carburant', habitudes.carburant).parAn
    + choix('alcool', habitudes.alcool).parAn;
}

/** Ce que chaque poste coûte par an, pour l'écran. */
export function detailAccises(habitudes) {
  return {
    tabac: choix('tabac', habitudes.tabac).parAn,
    carburant: choix('carburant', habitudes.carburant).parAn,
    alcool: choix('alcool', habitudes.alcool).parAn,
    taxesParPaquet,
    taxesParPlein,
  };
}
