/**
 * Le Grand Braquage — moteur de calcul.
 *
 * Une seule fonction publique : simuler(). Elle rend les deux plateaux de la
 * balance et le verdict, avec le détail de chaque ligne pour que la page
 * méthodologie puisse tout afficher.
 *
 * Le code est public parce que c'est la seule façon de rendre le résultat
 * opposable. Chaque barème renvoie à son texte officiel dans baremes-2026.js.
 */

import { deroulerCarriere, totalPreleve } from './carriere.js';
import {
  capitaliser,
  capitalPourRente,
  fourchetteCapitalPourRente,
  PALIERS_ALIBI,
  placerSoiMeme,
  PLACEMENT_DEFAUT,
} from './capitalisation.js';
import { RETRAITE, SALAIRES_REFERENCE } from './baremes-2026.js';
import * as fp from './fonction-publique.js';
import * as tns from './tns.js';
import * as cipav from './cipav.js';
import * as micro from './micro.js';
import { TAUX_REMPLACEMENT, VERSANTS } from './baremes-fonction-publique.js';
import { lignesChoisies } from './paliers.js';
import { accisesAnnuelles } from './consommation.js';

/**
 * Le régime social derrière une qualité de victime.
 *
 * « Patron de TPE » n'est PAS un régime : un gérant majoritaire de SARL cotise
 * comme un travailleur non salarié, un président de SAS comme un assimilé
 * salarié. Le statut pose donc une question de forme juridique et aiguille, il
 * ne fabrique aucun calcul de plus.
 */
export function regimeDuStatut(statut = 'salarie', forme, activite) {
  if (statut === 'salarie') return 'salarie';
  if (statut === 'fonctionnaire') return 'fonctionnaire';
  if (statut === 'independant') {
    // ⚠ Le libéral RÉGLEMENTÉ n'est pas une nuance de l'artisan : son barème
    // change de signe autour de 1,5 plafond d'assiette. Sans précision, on
    // sert la sécurité sociale des indépendants, qui couvre les artisans, les
    // commerçants ET les libéraux non réglementés créés depuis 2019, soit la
    // très grande majorité. L'écran pose la question.
    if (activite === 'cipav') return 'cipav';
    // ⚠ Le micro n'est PAS une variante du réel : assiette = chiffre d'affaires
    // encaissé, taux forfaitaire, aucune charge déductible. Il a son propre
    // identifiant pour que `regimeDe` LÈVE tant qu'il n'est pas instruit,
    // plutôt que de lui servir le barème du réel.
    if (activite === 'micro') return 'micro';
    return 'tns';
  }
  if (statut === 'tpe') {
    if (forme === 'sarl-majoritaire') return 'tns';
    if (forme === 'sas') return 'salarie';
    return null;
  }
  return null;
}

export {
  CRANS_FRAIS,
  CRANS_RENDEMENT,
  PALIERS_ALIBI,
  ALIBI_INDICE_NU,
  capitalApresRetraits,
  PLACEMENTS,
  PLACEMENT_DEFAUT,
  placement,
  placerSoiMeme,
  reel,
} from './capitalisation.js';
export { deroulerCarriere, totalPreleve } from './carriere.js';
export { heureDeLiberation } from './liberation.js';
export {
  HABITUDES, HABITUDES_DEFAUT, TABAC, CARBURANT, ALCOOL, accisesAnnuelles, detailAccises,
} from './consommation.js';
export {
  PALIERS, PALIERS_DEFAUT, PRIX_ECOLE, PRIX_SANTE, PRIX_CHOMAGE,
  montantEcole, montantSante, montantChomage, santeSurUneVie, santeParAn,
} from './paliers.js';
export * from './salaire.js';
export * from './impot.js';

/**
 * Ce que les prélèvements achètent, en équivalent capital.
 *
 * ⚠ Les trois postes hors retraite sont des ordres de grandeur assumés, à
 * remplacer par un chiffrage par décile quand on l'aura. La retraite, elle,
 * est calculée : c'est le seul poste dont le montant est défendable au centime.
 */
/** Un montant en clair, avec ses séparateurs de milliers. */
function espacer(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Le second plateau : ce que les prélèvements achètent.
 *
 * ⚠ UNE SEULE ligne est chiffrée, et c'est voulu depuis le 07/09/2026. La
 * pension se calcule au centime, par les règles, et c'est le capital qu'il
 * faudrait pour servir la même rente. Santé, école et chômage restaient des
 * ordres de grandeur sans source opposable (216 000, 127 000 et 47 000 €), et
 * un lecteur hostile n'avait qu'à demander d'où ils sortaient. Ils restent
 * NOMMÉS, parce que leur absence se remarquerait et donnerait prise à « vous
 * avez oublié », mais ils ne comptent plus : « non chiffré, et on ne l'invente
 * pas » est une réponse qui tient, un montant inventé n'en est pas une.
 *
 * Conséquence assumée : le pivot d'un salarié tombe de 2 337 à 1 458 €, et un
 * fonctionnaire territorial est braqué dès 900 €.
 */
function contreparties(pensionMensuelle, regime = 'salarie', paliers = null) {
  const retraite = capitalPourRente(pensionMensuelle);
  const nonChiffre = (libelle, pourquoi) => ({
    montant: null,
    libelle,
    calcule: false,
    note: 'non chiffré, et on ne l’invente pas',
    pourquoi,
  });
  const sortie = {
    retraite: {
      montant: retraite,
      libelle: 'Une rente à vie, indexée, réversible',
      calcule: true,
      note: `capital nécessaire pour servir ${espacer(Math.round(pensionMensuelle))} €/mois à 65 ans`,
    },
    sante: nonChiffre(
      'Le droit de tomber malade sans payer',
      'aucune source publique ne rend ce qu’une carrière consomme de soins',
    ),
    education: nonChiffre(
      'Douze ans d’école, sans facture',
      'le coût public par élève existe, sa valeur pour une vie ne se déduit pas',
    ),
  };
  // Un employeur public est en auto-assurance : ni l'agent ni l'employeur ne
  // cotisent au chômage. La ligne disparaît des DEUX plateaux, sinon on
  // porterait au crédit du fonctionnaire une contrepartie qu'il n'a pas payée.
  if (regime !== 'fonctionnaire') {
    sortie.chomage = nonChiffre(
      'Un filet, le jour où vous êtes tombé',
      /*
       * ⚠ Cette ligne a porté « 91 % des carrières connaissent un épisode
       * indemnisé » jusqu'au 09/09/2026. CE CHIFFRE N'EXISTE NULLE PART :
       * l'Unédic a été crawlée en entier (351 publications du catalogue), plus
       * la Dares, France Travail, l'INSEE, la DREES, le COR, France Stratégie
       * et la Cnav, sans un seul document qui l'imprime.
       *
       * DEUX origines possibles, et aucune ne dit ce qu'on lui faisait dire. La plus probable est un
       * chiffre d'OPINION du Baromètre Unédic, dont la formulation est presque
       * mot pour mot la nôtre : « 94 à 96 % des Français estiment que tout le
       * monde peut connaître une période de chômage AU COURS DE SA CARRIÈRE »,
       * et « neuf cadres sur dix » dans le volet Apec. C'est ce que les gens
       * pensent, pas ce qui leur arrive. La seconde est l'INSEE Références
       * « Emploi, chômage, revenus du travail » 2025 : en décembre 2023, « 91 %
       * des personnes INDEMNISABLES l'ont été au titre de l'assurance
       * chômage », une part des droits ouverts à une DATE. Et la Dares publie
       * un 91 % de sens exactement inverse (91 % des salariés en contrat court
       * en 2010 n'ont ouvert aucun droit entre 2010 et 2012).
       *
       * Le seul chiffre officiel de PORTÉE CARRIÈRE trouvé : 42 % des
       * prestataires du régime général ont au moins une période assimilée
       * chômage dans leur carrière (COR, document de travail n° 17, document
       * Cnav, données 2015). Il compte le chômage indemnisé ET non indemnisé,
       * donc il ne dit pas tout à fait la même chose : c'est écrit ici, et la
       * ligne ne chiffre toujours rien.
       */
      'quatre carrières sur dix touchent le chômage, aucune ne ressemble à la vôtre',
    );
  }
  /*
   * Quand la personne a répondu aux trois questions du second plateau, ses
   * paliers REMPLACENT les lignes sans montant. Le prix unitaire est sourcé,
   * le palier est le sien : c'est la seule façon de chiffrer sans inventer.
   */
  if (paliers) Object.assign(sortie, lignesChoisies(paliers, regime));
  return sortie;
}

/**
 * Simulation complète.
 *
 * @param {object} entree
 * @param {number} entree.netMensuel ce qui arrive sur le compte
 * @param {'salarie'|'independant'|'fonctionnaire'|'tpe'} [entree.statut]
 * @param {number} [entree.ageActuel]
 * @param {boolean} [entree.cadre]
 * @param {number} [entree.effectif]
 * @param {number} [entree.parts]
 * @param {object} [entree.perimetre] quels prélèvements l'utilisateur a cochés
 * @param {{ecole: string, sante: string, chomage: string}} [entree.paliers]
 *   ce que la personne dit avoir reçu ; absent, école, santé et chômage restent
 *   nommés sans montant
 * @param {{tabac: string, carburant: string, alcool: string}} [entree.habitudes]
 *   tabac, carburant, alcool : les accises s'ajoutent à la TVA chaque année.
 *   Absent, rien n'est ajouté.
 * @param {{rendementReel: number, fraisAnnuels?: number, fraisVersement?: number}} [entree.placement]
 *   où la personne dit qu'elle aurait mis l'argent. Présent, le VERDICT se juge sur
 *   le coût d'opportunité : ce que le prélèvement serait devenu, placé à ce taux,
 *   contre ce qui a été rendu. Absent, le verdict compare pris et rendu tels quels.
 */
export function simuler(entree) {
  const {
    netMensuel,
    statut = 'salarie',
    formeTpe,
    activite,
    categorieMicro = 'liberal',
    versementLiberatoire = false,
    versant = 'fpt',
    ageActuel = 36,
    cadre = false,
    effectif = 10,
    parts = 1,
    couple = false,
    perimetre = { salariales: true, patronales: true, impotRevenu: false, consommation: false },
    paliers = null,
    placement = null,
    habitudes = null,
  } = entree;

  if (!(netMensuel > 0)) throw new Error('netMensuel doit être positif');

  const regime = entree.regime ?? regimeDuStatut(statut, formeTpe, activite);
  if (!regime) {
    throw new Error(
      `Statut « ${statut} » sans régime résolu. Pour un patron de TPE, il faut la forme `
      + 'juridique : sarl-majoritaire ou sas.',
    );
  }

  const opts = {
    cadre, effectif, parts, couple, ageActuel, regime, versant,
    categorieMicro, versementLiberatoire,
    /*
     * Un président de SAS ou de SASU cotise comme un salarié, MOINS l'assurance
     * chômage et l'AGS : il est mandataire social, sans contrat de travail, donc
     * hors du champ des deux. Le drapeau descend jusqu'à
     * `cotisationsPatronales`, qui met les deux lignes à zéro.
     */
    sansChomage: formeTpe === 'sas',
  };
  const carriere = deroulerCarriere(netMensuel, opts);

  /*
   * Les accises déclarées (tabac, carburant, alcool) s'ajoutent à la TVA de
   * chaque année. Le taux d'effort par décile ne couvre que la TVA, et
   * personne ne peut deviner un paquet par jour : c'est la personne qui le dit.
   */
  if (habitudes) {
    const accises = accisesAnnuelles(habitudes);
    for (const a of carriere.annees) a.taxesConsommation += accises;
    carriere.totaux.taxesConsommation += accises * carriere.annees.length;
  }

  const preleve = totalPreleve(carriere.totaux, perimetre);

  const dernier = carriere.annees[carriere.annees.length - 1];

  /*
   * L'année qu'on vit AUJOURD'HUI, et ce qu'il en reste après impôt.
   *
   * L'écran demande désormais le net AVANT impôt : personne ne doit avoir à
   * refaire la soustraction de tête pour savoir ce qui arrive vraiment sur son
   * compte, et c'est aussi ce niveau de vie qui sert à convertir un total en
   * années de vie sans travailler. On le calcule ici, une fois, plutôt que dans
   * chaque écran qui en a besoin.
   */
  const anneeCourante =
    carriere.annees.find((a) => a.age === ageActuel) ?? carriere.annees[0];

  // ⚠ Les DEUX régimes passent par un taux de remplacement NET du COR, sur la
  // même génération. C'est une contrainte de comparabilité, pas un choix de
  // confort : la formule de la pension publique est publique et calculable, et
  // c'est tentant de la préférer, mais elle rend un montant BRUT. Le comparer
  // au net d'un salarié gonfle la pension du fonctionnaire d'un quart, ce qui
  // se lit comme un privilège et n'est qu'une erreur de dénominateur.
  //
  // La formule reste calculée, dans `detailPension` : elle a sa place à
  // l'écran, à condition d'être présentée pour ce qu'elle est.
  //
  // ⚠ L'indépendant fait exception, et c'est une contrainte, pas un choix : il
  // n'existe AUCUN taux de remplacement publié pour ce régime. La DREES l'exclut
  // de son champ et écrit pourquoi, son panel ne contenant aucun revenu non
  // salarié ; le COR n'a jamais eu de cas type artisan ni commerçant. Sa
  // pension se calcule donc par les règles, et le taux de remplacement en est
  // DÉDUIT au lieu d'être posé.
  let pensionMensuelle;
  let tauxRemplacement;
  let pensionTns = null;

  if (regime === 'tns' || regime === 'cipav' || regime === 'micro') {
    // Les deux régimes de non-salariés calculent leur pension par les règles,
    // faute de tout taux de remplacement publié. Mais PAS par les mêmes règles :
    // la base d'un artisan est celle du régime général, sur ses vingt-cinq
    // meilleures années ; celle d'un libéral CIPAV est un régime par points, sur
    // toute la carrière. Une mauvaise année pèse chez l'un et disparaît chez
    // l'autre : c'est une différence de structure, pas de taux.
    /*
     * ⚠ Un micro passe par le calcul du RÉGIME GÉNÉRAL, comme un artisan au
     * réel, et surtout PAS sur son chiffre d'affaires : `carriere.js` a déjà
     * remplacé son assiette par le « revenu cotisé » reconstitué selon la
     * circulaire Cnav. Lui appliquer sa propre assiette gonflerait sa pension
     * d'un facteur trois.
     */
    const moteurPension = regime === 'cipav' ? cipav : tns;
    pensionTns = moteurPension.pension(
      carriere.annees.map((a) => a.assiette),
      carriere.annees.map((a) => a.retraiteComplementaire),
    );
    pensionMensuelle = pensionTns.totale;
    tauxRemplacement = dernier.netApresImpot > 0
      ? pensionMensuelle / dernier.netApresImpot
      : 0;
  } else {
    tauxRemplacement = regime === 'fonctionnaire'
      ? TAUX_REMPLACEMENT.projeteCatBGeneration2000
      : (cadre ? RETRAITE.tauxRemplacementCadre : RETRAITE.tauxRemplacementNonCadre);
    pensionMensuelle = dernier.netApresImpot * tauxRemplacement;
  }

  const detailPension = pensionTns
    ? {
      ...pensionTns,
      brut: false,
      note: regime === 'cipav'
        ? 'pension calculée par les règles : points du régime de base des '
          + 'professions libérales, plus points du régime complémentaire CIPAV'
        : 'pension calculée par les règles : base du régime général sur les '
          + '25 meilleures années, plus les points du régime complémentaire',
    }
    : regime === 'fonctionnaire'
    ? {
      ...fp.pension(dernier.tib, {
        tauxLiquidation: 1,
        anneesRafp: Math.min(40, carriere.annees.length),
        primesMensuelles: dernier.primes,
        ageLiquidation: 64,
      }),
      brut: true,
      note: 'montant BRUT rendu par la formule des pensions civiles, hors primes',
      versant: VERSANTS[versant]?.nom,
    }
    : null;

  const recu = contreparties(pensionMensuelle, regime, paliers);
  // Une ligne non chiffrée ne pèse rien : c'est tout le sens du tiret.
  const totalRecu = Object.values(recu).reduce((t, c) => t + (c.montant ?? 0), 0);

  /*
   * Le coût d'opportunité (Coq, 08/09/2026 au soir) : « c'est sur ce coût
   * d'opportunité que ce sera calculé coupable ou non ». Chaque année, ce qui
   * a été pris (au périmètre coché) est placé au taux choisi par la personne,
   * frais compris, et c'est CE capital à 64 ans qu'on met en face de ce qui a
   * été rendu. Tout est en euros d'aujourd'hui, donc le taux est RÉEL.
   */
  let opportunite = null;
  if (placement) {
    const versements = carriere.annees.map((a) =>
      (perimetre.salariales ? a.salariales : 0)
      + (perimetre.patronales ? a.patronales : 0)
      + (perimetre.impotRevenu ? a.impotRevenu : 0)
      + (perimetre.consommation ? a.taxesConsommation : 0));
    const opts = {
      rendementReel: placement.rendementReel,
      fraisAnnuels: placement.fraisAnnuels ?? 0,
      fraisVersement: placement.fraisVersement ?? 0,
    };
    const capital = capitaliser(versements, opts);
    opportunite = {
      verse: preleve,
      capital,
      sansFrais: capitaliser(versements, { ...opts, fraisAnnuels: 0, fraisVersement: 0 }),
      ...opts,
    };
  }

  const ecart = (opportunite ? opportunite.capital : preleve) - totalRecu;

  return {
    entree: {
      /** ⚠ Net AVANT impôt sur le revenu. L'impôt s'ajoute, il n'est pas déjà retranché. */
      netMensuel,
      statut, regime, versant, activite, categorieMicro, versementLiberatoire,
      ageActuel, cadre, effectif, parts, couple, perimetre, paliers, placement, habitudes,
    },
    /** Ce qui arrive réellement sur le compte cette année, impôt déduit. */
    netApresImpotActuel: anneeCourante.netApresImpot,
    /** Le brut de cette année (le chiffre d'affaires, pour un micro), mensuel. */
    brutActuel: anneeCourante.brut,
    /** Ce qu'il reste une fois les cotisations payées, avant impôt, mensuel. */
    netAvantImpotActuel: anneeCourante.netAvantImpot,
    /** Les cotisations de cette année, côté agent, mensuelles. */
    cotisationsActuelles: anneeCourante.salariales / 12,
    /** Vrai quand ce qui a été saisi est le brut lui-même (le micro). */
    saisieEstLeBrut: regime === 'micro',
    carriere,
    plateauGauche: {
      total: preleve,
      lignes: {
        salariales: carriere.totaux.salariales,
        patronales: carriere.totaux.patronales,
        impotRevenu: carriere.totaux.impotRevenu,
        consommation: carriere.totaux.taxesConsommation,
      },
      reductionRgdu: carriere.totaux.reductionRgdu,
    },
    plateauDroit: {
      total: totalRecu,
      pensionMensuelle,
      tauxRemplacement,
      detailPension,
      lignes: recu,
      fourchetteRetraite: fourchetteCapitalPourRente(pensionMensuelle),
    },
    /** Le capital qu'aurait fait le prélèvement, placé. Absent sans placement. */
    opportunite,
    verdict: {
      braquage: ecart > 0,
      ecart: Math.abs(ecart),
      libelle: ecart > 0 ? 'Braquage constaté.' : 'Braquage non constaté. Relaxe.',
    },
  };
}

/**
 * Cherche le salaire où la balance bascule, par dichotomie.
 * C'est le chiffre inédit de la page : personne ne le publie.
 */
export function salairePivot(opts = {}) {
  const perimetre = opts.perimetre
    ?? { salariales: true, patronales: true, impotRevenu: true, consommation: true };

  let bas = SALAIRES_REFERENCE.d1 * 0.7;
  let haut = SALAIRES_REFERENCE.d9 * 2;

  const braquageA = simuler({ ...opts, netMensuel: bas, perimetre }).verdict.braquage;
  const braquageB = simuler({ ...opts, netMensuel: haut, perimetre }).verdict.braquage;
  if (braquageA === braquageB) return null; // pas de bascule sur la plage

  for (let i = 0; i < 40; i += 1) {
    const milieu = (bas + haut) / 2;
    if (simuler({ ...opts, netMensuel: milieu, perimetre }).verdict.braquage === braquageA) {
      bas = milieu;
    } else {
      haut = milieu;
    }
  }
  return Math.round((bas + haut) / 2);
}

/**
 * « Et si j'avais placé cet argent moi-même ? »
 *
 * On capitalise le flux réel de cotisation vieillesse de LA carrière simulée,
 * année par année, et non un versement constant : c'est exactement l'hypothèse
 * que la partie adverse ne fait pas, et c'est elle qui déplace le résultat le
 * plus fort. Le capital obtenu se compare ensuite au capital équivalent à la
 * pension, jamais à la pension mensuelle : comparer un stock à un flux est le
 * tour de passe-passe qui fabrique l'écart de mille pour un.
 *
 * @param {ReturnType<typeof simuler>} simulation
 * @param {string} [placementId]
 */
/**
 * Le même geste, mais au taux et aux frais que l'utilisateur règle lui-même.
 *
 * Les quatre produits nommés cachaient le chiffre qui compte : le rendement.
 * Ici il est en clair, avec des crans de référence sourcés à côté du curseur,
 * et pas un mot sur le risque. Le capital bouge, c'est tout ce qu'on montre.
 */
export function placerSaRetraiteAuTaux(simulation, reglage = {}) {
  const {
    rendementReel = 0,
    fraisAnnuels = 0,
    fraisVersement = 0,
  } = reglage;
  const versements = simulation.carriere.annees.map((a) => a.cotisationVieillesse);
  const verse = versements.reduce((t, v) => t + v, 0);
  const capital = capitaliser(versements, { rendementReel, fraisAnnuels, fraisVersement });
  const sansFrais = capitaliser(versements, { rendementReel, fraisAnnuels: 0, fraisVersement: 0 });
  const equivalentPension = simulation.plateauDroit.lignes.retraite.montant;
  return {
    reglage: { rendementReel, fraisAnnuels, fraisVersement },
    verse,
    capital,
    sansFrais,
    fraisPayes: sansFrais - capital,
    equivalentPension,
    ecart: capital - equivalentPension,
    gagnant: capital > equivalentPension,
  };
}

export function placerSaRetraite(simulation, placementId = PLACEMENT_DEFAUT) {
  const versements = simulation.carriere.annees.map((a) => a.cotisationVieillesse);
  const place = placerSoiMeme(versements, placementId);
  const equivalentPension = simulation.plateauDroit.lignes.retraite.montant;

  return {
    ...place,
    equivalentPension,
    ecart: place.capital - equivalentPension,
    // true = se débrouiller seul aurait rapporté plus que la pension servie.
    gagnant: place.capital > equivalentPension,
  };
}
