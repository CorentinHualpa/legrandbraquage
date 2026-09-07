/**
 * L'alibi du million : que vaut vraiment le capital qu'on aurait accumulé,
 * et que vaut la pension à laquelle on le compare.
 *
 * Règle de la maison : on ne dit jamais que le calcul de la partie adverse est
 * faux. Il est juste. On montre ce qu'il suppose, cran par cran.
 */

import {
  FRAIS,
  RENDEMENTS,
  RETRAITE,
  PFU,
  PS_PLACEMENT,
  INFLATION_MOYENNE_39_ANS,
} from './baremes-2026.js';

/** Un taux annoncé en euros courants, ramené en euros d'aujourd'hui. */
export function reel(nominal, inflation = INFLATION_MOYENNE_39_ANS) {
  return (1 + nominal) / (1 + inflation) - 1;
}

/**
 * L'échelle des placements : « et si j'avais placé cet argent moi-même ? ».
 *
 * Le défaut est PRUDENT, et c'est un choix éditorial autant que méthodologique.
 * Le gros chiffre existe, mais c'est l'utilisateur qui monte le curseur pour
 * l'obtenir : un simulateur qui ouvre sur le rendement le plus flatteur ne
 * mesure plus rien, il vend une conclusion.
 *
 * Chaque barreau porte SON hypothèse de frais, parce que c'est là que se joue
 * l'essentiel. Le CAC 40 dans un PER rend moins qu'un ETF World dans un PEA
 * malgré un rendement brut supérieur : c'est le second braquage, celui dont
 * personne ne parle.
 */
export const PLACEMENTS = [
  {
    id: 'livret-a',
    nom: 'Livret A',
    detail: 'Le placement sans risque et sans frais. Il ne suit pas l’inflation.',
    rendementReel: reel(RENDEMENTS.livretAMoyen15Ans),
    fraisAnnuels: 0,
    fraisVersement: 0,
    source: 'Taux moyen sur quinze ans, 1,60 % en euros courants',
    note: 'Aucun frais, c’est la loi. Le rendement réel est négatif.',
  },
  {
    id: 'fonds-euros',
    nom: 'Fonds en euros',
    detail: 'Le capital est garanti. C’est ce que la moitié des Français détient.',
    rendementReel: reel(RENDEMENTS.fondsEuros2025),
    fraisAnnuels: 0,
    fraisVersement: 0,
    source: 'Taux moyen servi en 2025, 2,60 %',
    note: 'Le taux servi est déjà net des frais de gestion du contrat : les retirer une seconde fois compterait deux fois.',
    defaut: true,
  },
  {
    id: 'cac40-per',
    nom: 'CAC 40 dans un PER',
    detail: 'Dividendes réinvestis, l’hypothèse la plus favorable de la partie adverse.',
    rendementReel: RENDEMENTS.cac40GrReel,
    fraisAnnuels: FRAIS.perUcActions,
    fraisVersement: FRAIS.perVersement,
    source: 'AMF 1988-2023 pour le rendement, Banque de France pour les frais',
    note: '2,71 % par an et 1,51 % par versement partent chez l’intermédiaire.',
  },
  {
    id: 'etf-world-pea',
    nom: 'ETF World dans un PEA',
    detail: 'Le monde entier, en un seul fonds, avec les frais les plus bas du marché.',
    rendementReel: reel(RENDEMENTS.msciWorldGrossNominal),
    fraisAnnuels: FRAIS.etfPea,
    fraisVersement: 0,
    source: 'MSCI World gross return 1987-2026, frais PEA-ETF constatés',
    note: 'Rendement brut plus faible que la ligne du dessus, résultat plus élevé : les frais pèsent plus que la performance.',
  },
];

export const PLACEMENT_DEFAUT = 'fonds-euros';

/**
 * Les crans de RENDEMENT posés à côté du curseur, chacun avec sa source.
 *
 * Le curseur est continu, en rendement RÉEL (net d'inflation, comme tout le
 * dossier, qui compte en euros d'aujourd'hui). Les crans ne sont que des
 * repères que l'on peut cliquer : ils disent où se situe tel ou tel placement
 * réel, et le lecteur règle ce qu'il veut entre deux. Aucun n'est étiqueté
 * « prudent » ni « risqué » : un taux et une source, rien d'autre.
 */
export const CRANS_RENDEMENT = [
  {
    id: 'livret-a',
    nom: 'Livret A',
    reel: reel(RENDEMENTS.livretAMoyen15Ans),
    nominal: RENDEMENTS.livretAMoyen15Ans,
    source: 'taux moyen sur quinze ans',
  },
  {
    id: 'immobilier',
    nom: 'Immobilier en France',
    reel: RENDEMENTS.immobilierFranceReel40Ans,
    nominal: null,
    source: 'prix réels sur quarante ans, hors loyers',
  },
  {
    id: 'fonds-euros',
    nom: 'Fonds en euros',
    reel: reel(RENDEMENTS.fondsEuros2025),
    nominal: RENDEMENTS.fondsEuros2025,
    source: 'taux moyen servi en 2025',
  },
  {
    id: 'msci-world',
    nom: 'MSCI World',
    reel: reel(RENDEMENTS.msciWorldGrossNominal),
    nominal: RENDEMENTS.msciWorldGrossNominal,
    source: 'gross return 1987-2026',
  },
  {
    id: 'sp500',
    nom: 'S&P 500 dividendes réinvestis',
    reel: RENDEMENTS.sp500Reel1928,
    nominal: RENDEMENTS.sp500Nominal1928,
    // ⚠ En dollars : un Français porte le change en plus. Et la fenêtre de
    // 98 ans est la bonne, pas celle de 30 ans (7,5 % réel), qui démarre en
    // 1996 et embarque deux décennies exceptionnelles.
    source: 'Damodaran, NYU Stern, 1928-2025, en dollars',
  },
  {
    id: 'cac40',
    nom: 'CAC 40 dividendes réinvestis',
    reel: RENDEMENTS.cac40GrReel,
    nominal: RENDEMENTS.cac40GrNominal,
    source: 'AMF, 1988-2023',
  },
];

/**
 * Les crans de FRAIS. C'est le second curseur, et il pèse autant que le
 * premier : entre un ETF en PEA et un fonds actions en PER, sur 43 ans, la
 * différence de frais vaut plus que la différence de performance.
 */
export const CRANS_FRAIS = [
  { id: 'aucun', nom: 'Sans frais', annuels: 0, versement: 0, source: 'hypothèse de la partie adverse' },
  { id: 'pea-etf', nom: 'ETF dans un PEA', annuels: FRAIS.etfPea, versement: 0, source: 'frais constatés' },
  { id: 'per-etf', nom: 'ETF dans un PER', annuels: FRAIS.perEtf, versement: FRAIS.perVersement, source: 'Banque de France' },
  { id: 'per-actions', nom: 'Fonds actions dans un PER', annuels: FRAIS.perUcActions, versement: FRAIS.perVersement, source: 'Banque de France, OPEF 2026' },
];

export function placement(id) {
  return PLACEMENTS.find((p) => p.id === id) ?? PLACEMENTS.find((p) => p.defaut);
}

/**
 * Les quatre paliers documentés du calcul « vous seriez millionnaire ».
 * Ce sont des valeurs ABSOLUES issues du backtest sur la série CAC 40 GR
 * 1990-2024, pas le produit de facteurs approximatifs : multiplier des
 * pourcentages entre eux donne un résultat qui n'existe dans aucune source.
 *
 * Détail et méthode : ../MOTEUR-DE-CALCUL.md §0
 */
export const PALIERS_ALIBI = [
  {
    id: 'pose',
    montant: 1594561,
    titre: 'Le chiffre tel que la défense le pose',
    detail: '876 €/mois constants, CAC 40 dividendes réinvestis, zéro frais.',
  },
  {
    id: 'csg',
    montant: 1450760,
    titre: 'La clé de répartition de la CSG',
    detail: 'Elle affecte 45 % de la CSG à la retraite ; le COR en compte environ 15 %.',
    source: 'COR, rapport annuel juin 2026, tableau 2.2',
  },
  {
    id: 'carriere',
    montant: 749353,
    titre: 'Une carrière qui bouge',
    detail: 'Un salarié à 2 500 € net aujourd’hui versait autour de 300 € en 1990.',
    source: 'Courbe de salaire par âge, INSEE 2024',
  },
  {
    id: 'frais',
    montant: 432190,
    titre: 'Ce que la banque prend au passage',
    detail: '2,71 %/an sur un PER en actions, plus 1,51 % sur chaque versement.',
    source: 'Observatoire de l’épargne, Banque de France 2026',
  },
];

/** Variante hors chaîne : le même calcul avec l'indice nu, sans dividendes. */
export const ALIBI_INDICE_NU = 782068;

/**
 * Capital restant après avoir retiré les `n` premières hypothèses.
 * Les crans se retirent DANS L'ORDRE : seules les quatre valeurs documentées
 * sont atteignables, aucune combinaison inventée.
 */
export function capitalApresRetraits(n) {
  const index = Math.max(0, Math.min(PALIERS_ALIBI.length - 1, n));
  return PALIERS_ALIBI[index].montant;
}

/**
 * Capitalisation d'un flux de versements annuels, frais compris.
 *
 * @param {number[]} versementsAnnuels en euros constants
 * @param {object} [opts]
 * @param {number} [opts.rendementReel] rendement réel annuel avant frais
 * @param {number} [opts.fraisAnnuels] frais de gestion annuels
 * @param {number} [opts.fraisVersement] frais prélevés sur chaque versement
 * @param {boolean} [opts.behaviorGap] retirer l'écart de comportement mesuré
 */
export function capitaliser(versementsAnnuels, opts = {}) {
  const {
    rendementReel = RENDEMENTS.cac40GrReel,
    fraisAnnuels = FRAIS.perUcActions,
    fraisVersement = FRAIS.perVersement,
    behaviorGap = false,
  } = opts;

  const net = rendementReel - fraisAnnuels - (behaviorGap ? FRAIS.behaviorGap : 0);
  let capital = 0;
  for (const versement of versementsAnnuels) {
    capital = capital * (1 + net) + versement * (1 - fraisVersement);
  }
  return capital;
}

/**
 * Capital nécessaire pour servir une rente viagère donnée.
 *
 * Le taux technique de 0 % se lit en termes RÉELS : il approche une rente
 * indexée sur l'inflation, seule comparable à une pension française qui est
 * revalorisée sur les prix. C'est le cœur de la contre-expertise.
 *
 * @param {number} renteMensuelle
 * @param {{avecFrais?: boolean}} [opts]
 */
export function capitalPourRente(renteMensuelle, opts = {}) {
  const { avecFrais = true } = opts;
  const taux = avecFrais
    ? RETRAITE.tauxConversion65AvecFrais
    : RETRAITE.tauxConversion65TGF05;
  return (renteMensuelle * 12) / taux;
}

/**
 * Fourchette honnête du capital équivalent à une pension, en faisant varier le
 * taux technique. On publie une fourchette, jamais un chiffre unique : ce sont
 * des calculs actuariels à hypothèses explicites, pas des devis d'assureur.
 */
export function fourchetteCapitalPourRente(renteMensuelle) {
  const annuel = renteMensuelle * 12;
  return {
    bas: annuel / 0.045, // taux technique haut, rente nominale
    haut: annuel / RETRAITE.tauxConversion65AvecFrais, // taux réel, rente indexée
  };
}

/** Fiscalité de sortie appliquée à une plus-value. */
export function apresFiscalite(capital, verse, enveloppe = 'per') {
  const plusValue = Math.max(0, capital - verse);
  if (enveloppe === 'pea') return capital - plusValue * PS_PLACEMENT;
  if (enveloppe === 'cto') return capital - plusValue * PFU;
  // PER : les versements déduits à l'entrée sont imposés au barème à la
  // sortie, les gains au PFU. On retient une approximation prudente.
  return capital - plusValue * PFU - verse * 0.11;
}

/**
 * Ce que deviendrait un flux de versements sur un barreau donné de l'échelle,
 * et ce que l'intermédiaire aura prélevé au passage.
 *
 * On rend les DEUX : un capital final sans le montant des frais ne dit pas d'où
 * vient l'écart entre deux barreaux, et c'est précisément ce qu'on veut montrer.
 *
 * @param {number[]} versementsAnnuels en euros constants
 * @param {string} [placementId]
 */
export function placerSoiMeme(versementsAnnuels, placementId = PLACEMENT_DEFAUT) {
  const p = placement(placementId);
  const verse = versementsAnnuels.reduce((t, v) => t + v, 0);

  const capital = capitaliser(versementsAnnuels, {
    rendementReel: p.rendementReel,
    fraisAnnuels: p.fraisAnnuels,
    fraisVersement: p.fraisVersement,
  });

  // Le même flux, au même rendement, sans un centime de frais. La différence
  // est ce que l'intermédiaire a pris, gains manqués compris.
  const sansFrais = capitaliser(versementsAnnuels, {
    rendementReel: p.rendementReel,
    fraisAnnuels: 0,
    fraisVersement: 0,
  });

  return {
    placement: p,
    verse,
    capital,
    sansFrais,
    fraisPayes: sansFrais - capital,
  };
}
