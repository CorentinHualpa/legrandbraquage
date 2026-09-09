/**
 * Projection d'une carrière de quarante ans, en euros constants.
 *
 * Deux principes non négociables :
 *  - on ne fige JAMAIS le salaire, sinon on fait cotiser un homme de 1990 en
 *    euros de 2026, ce qui est le biais le plus lourd du débat ;
 *  - tout est ramené en euros d'aujourd'hui, sinon on compare un capital futur
 *    à une pension actuelle.
 */

import { COURBE_AGE, COURBES_AGE, CARRIERE } from './baremes-2026.js';
import {
  brutDepuisNet, cotisationsSalariales, cotisationsPatronales, netsDepuisBrut,
} from './salaire.js';
import * as fp from './fonction-publique.js';
import * as tns from './tns.js';
import * as cipav from './cipav.js';
import * as micro from './micro.js';
import { impotSurLeRevenu, taxesConsommationAnnuelles } from './impot.js';

/**
 * Les régimes que la projection sait dérouler.
 *
 * Chacun expose le MÊME contrat, pour que `deroulerCarriere` n'ait pas à savoir
 * lequel elle déroule : inverser un net en brut, rendre les retenues du côté de
 * l'agent, rendre les cotisations du côté de l'employeur, et dire quelle part
 * de ce qui est versé finance la vieillesse.
 *
 * ⚠ Un régime absent de cette table ne doit JAMAIS retomber sur celui du privé.
 * Servir le calcul du salarié à un indépendant produirait un chiffre faux et
 * crédible, c'est-à-dire exactement le reproche que ce dossier adresse à la
 * partie adverse. `regimeDe` lève plutôt que de deviner.
 */
const REGIMES = {
  salarie: {
    brutDepuisNet,
    netsDepuisBrut,
    salariales: cotisationsSalariales,
    patronales: cotisationsPatronales,
    vieillesse: (sal, pat) =>
      sal.lignes.vieillessePlafonnee + sal.lignes.vieillesseDeplafonnee
      + sal.lignes.retraiteCompT1 + sal.lignes.retraiteCompT2
      + sal.lignes.cegT1 + sal.lignes.cegT2
      + pat.lignes.vieillessePlafonnee + pat.lignes.vieillesseDeplafonnee
      + pat.lignes.retraiteCompT1 + pat.lignes.retraiteCompT2
      + pat.lignes.cegT1 + pat.lignes.cegT2,
  },
  tns: {
    // Bénéfice BIC ou BNC : pas d'abattement de 10 % pour frais professionnels.
    fraisProfessionnels: false,
    brutDepuisNet: tns.brutDepuisNet,
    netsDepuisBrut: tns.netsDepuisBrut,
    salariales: tns.retenuesSalariales,
    patronales: tns.cotisationsPatronales,
    // Un indépendant n'a pas d'employeur : tout ce qui finance sa vieillesse
    // sort de sa poche, et il le voit.
    vieillesse: (sal) => sal.lignes.retraiteBase + sal.lignes.retraiteComplementaire,
  },
  cipav: {
    // Bénéfice BIC ou BNC : pas d'abattement de 10 % pour frais professionnels.
    fraisProfessionnels: false,
    brutDepuisNet: cipav.brutDepuisNet,
    netsDepuisBrut: cipav.netsDepuisBrut,
    salariales: cipav.retenuesSalariales,
    patronales: cipav.cotisationsPatronales,
    // Pas d'employeur non plus : le libéral voit cent pour cent de ce qu'il verse.
    vieillesse: (sal) => sal.lignes.retraiteBase + sal.lignes.retraiteComplementaire,
  },
  micro: {
    // Bénéfice BIC ou BNC : pas d'abattement de 10 % pour frais professionnels.
    fraisProfessionnels: false,
    /*
     * ⚠ Ce que saisit un micro-entrepreneur est son CHIFFRE D'AFFAIRES, pas un
     * net. C'est le seul nombre qu'il connaît sans calcul : il le déclare à
     * l'URSSAF chaque mois. Lui demander « ce qu'il te reste après
     * cotisations » l'oblige à faire la soustraction de tête, et surtout ça
     * fait disparaître de l'écran les 26 % que l'URSSAF prend, puisqu'ils sont
     * déjà retirés du chiffre saisi. Constaté sur l'écran de Coq le 07/09/2026 :
     * « l'URSSAF devrait me prendre 26 % en plus des impôts, non ? ». Elle les
     * prenait, en silence.
     */
    entreeEstLeBrut: true,
    brutDepuisNet: micro.brutDepuisNet,
    netsDepuisBrut: micro.netsDepuisBrut,
    salariales: micro.retenuesSalariales,
    patronales: micro.cotisationsPatronales,
    // Le forfait global n'est pas ventilé sur l'avis d'appel : la part qui
    // finance la vieillesse se lit dans la clé de répartition publiée.
    vieillesse: (sal, pat, opts) => micro.partVieillesse(sal, opts),
    // ⚠ Le seul régime dont l'impôt peut ne PAS passer par le barème : avec le
    // versement libératoire, c'est un pourcentage du chiffre d'affaires.
    impotAnnuel: micro.impotAnnuel,
    // Le revenu porté au compte n'est pas le CA : il se reconstitue par la
    // chaîne de la circulaire Cnav. C'est LUI qui fait la pension.
    droitsRetraite: micro.droitsRetraiteAnnuels,
  },
  fonctionnaire: {
    /*
     * Le seul régime qui n'a pas la carrière du privé, et il en a TROIS.
     * L'État est plus pentu que le privé, la territoriale nettement plus plate,
     * l'hospitalière entre les deux. Servir une courbe publique unique aurait
     * remplacé une erreur par une autre. Repli sur la territoriale, comme
     * `versant()` de fonction-publique.js, pour que les deux ne divergent pas.
     */
    courbeAge: (opts = {}) => COURBES_AGE[opts.versant] ?? COURBES_AGE.fpt,
    brutDepuisNet: fp.brutDepuisNet,
    netsDepuisBrut: fp.netsDepuisBrut,
    salariales: fp.retenuesSalariales,
    patronales: fp.cotisationsPatronales,
    // Côté public, la contribution employeur au régime de pension EST la
    // cotisation vieillesse : il n'y a pas d'étage complémentaire à additionner
    // en dehors du régime additionnel, assis sur les seules primes.
    vieillesse: (sal, pat) => sal.lignes.pension + sal.lignes.rafp + pat.lignes.pension + pat.lignes.rafp,
  },
};

export function regimeDe(id = 'salarie') {
  const r = REGIMES[id];
  if (!r) {
    throw new Error(
      `Régime « ${id} » non instruit. Les régimes disponibles sont : ${Object.keys(REGIMES).join(', ')}. `
      + 'Aucun repli sur le salarié du privé : un chiffre emprunté à un autre régime est un chiffre faux.',
    );
  }
  return r;
}

/**
 * Indice de salaire à un âge donné, interpolé sur la courbe du régime.
 *
 * La courbe est un ARGUMENT depuis le 09/09/2026. Avant, la fonction lisait
 * `COURBE_AGE` directement, donc la courbe du privé servait aussi au
 * fonctionnaire, au TNS, à la CIPAV et au micro. Le défaut par défaut reste le
 * privé, mais c'est désormais un choix qu'un régime peut reprendre.
 */
export function indiceAge(age, courbe = COURBE_AGE) {
  if (age <= courbe[0][0]) return courbe[0][1];
  const dernier = courbe[courbe.length - 1];
  if (age >= dernier[0]) return dernier[1];

  for (let i = 0; i < courbe.length - 1; i += 1) {
    const [a1, v1] = courbe[i];
    const [a2, v2] = courbe[i + 1];
    if (age >= a1 && age <= a2) {
      return v1 + ((age - a1) / (a2 - a1)) * (v2 - v1);
    }
  }
  return dernier[1];
}

/**
 * Déroule la carrière année par année.
 *
 * @param {number} netMensuelActuel ce qui arrive sur le compte aujourd'hui
 * @param {object} [opts]
 * @param {number} [opts.ageActuel] âge auquel ce salaire est constaté
 * @param {boolean} [opts.cadre]
 * @param {number} [opts.effectif]
 * @param {number} [opts.parts] parts fiscales
 */
export function deroulerCarriere(netMensuelActuel, opts = {}) {
  const {
    ageActuel = 36,
    ageDebut = CARRIERE.ageDebut,
    ageFin = CARRIERE.ageFin,
    croissance = CARRIERE.croissanceReelleGenerale,
    regime = 'salarie',
  } = opts;

  const R = regimeDe(regime);

  // La courbe du RÉGIME, et le privé seulement à défaut. Elle sert aux deux
  // bouts : la référence et chaque année, sinon le rapport n'a aucun sens.
  const courbe = R.courbeAge ? R.courbeAge(opts) : COURBE_AGE;
  const indiceReference = indiceAge(ageActuel, courbe);
  const annees = [];

  for (let age = ageDebut; age <= ageFin; age += 1) {
    // Effet d'âge (la carrière) et effet de génération (la croissance générale
    // des salaires) se composent, en euros constants d'aujourd'hui.
    const facteurAge = indiceAge(age, courbe) / indiceReference;
    const facteurGeneration = Math.pow(1 + croissance, age - ageActuel);
    /*
     * ⚠ L'ENTRÉE EST LE NET AVANT IMPÔT SUR LE REVENU, et ce n'est pas un
     * détail de vocabulaire.
     *
     * On inversait depuis le net APRÈS impôt : l'impôt était alors une donnée
     * déjà retranchée, que le moteur devait retrouver à rebours pour l'afficher.
     * Il devient ce qu'il est, un prélèvement qu'on AJOUTE et qu'on voit
     * arriver. C'est tout l'objet de la page, et c'est aussi la seule ligne que
     * l'utilisateur peut lire sans hésiter : « net à payer avant impôt sur le
     * revenu » est imprimé sur toute fiche de paie française depuis 2019, et
     * pour un non-salarié c'est simplement ce qui reste après cotisations.
     *
     * Le net après impôt n'a pas disparu, il est DÉDUIT plus bas : c'est lui
     * qui sert de niveau de vie pour la TVA et pour la pension.
     */
    const saisie = netMensuelActuel * facteurAge * facteurGeneration;

    // Un régime dont la saisie est déjà le brut (le micro, en chiffre
    // d'affaires) n'a rien à inverser : on lui applique ses taux directement.
    const brut = R.entreeEstLeBrut
      ? saisie
      : R.brutDepuisNet(saisie, { ...opts, cible: 'avantImpot' });

    const sal = R.salariales(brut, opts);
    const pat = R.patronales(brut, opts);
    const netAvantImpot = brut - sal.total;
    /*
     * ⚠ Le net imposable se DEMANDE au régime, il ne se rebricole pas ici.
     *
     * Cette ligne additionnait `sal.lignes.csgNonDeductible + sal.lignes.crds`.
     * Un indépendant n'a PAS de ligne `crds` : sa CSG-CRDS est une seule
     * contribution de 9,70 %, coupée en déductible et non déductible. La clé
     * absente valait `undefined`, la somme valait `NaN`, et l'impôt rendait
     * ZÉRO sans lever quoi que ce soit. Résultat : un indépendant affichait
     * 0 € d'impôt sur toute sa carrière, là où un salarié au même net en
     * affichait 142 836. Le régime avait déjà la bonne réponse dans
     * `netsDepuisBrut`, personne ne la lui demandait.
     */
    const { netImposable } = R.netsDepuisBrut(brut, opts);
    /*
     * Un régime peut avoir son propre impôt. C'est le cas du micro qui a opté
     * pour le versement libératoire : il paie un pourcentage de son chiffre
     * d'affaires avec ses cotisations, et ne passe jamais par le barème. Sans
     * cette porte, on lui appliquerait le barème sur une assiette forfaitaire
     * qu'il ne subit pas.
     */
    const irRegime = R.impotAnnuel ? R.impotAnnuel(brut, opts) : null;
    const ir = irRegime
      ?? impotSurLeRevenu(netImposable * 12, {
        ...opts,
        fraisProfessionnels: R.fraisProfessionnels !== false,
      });
    // Ce dont on VIT : c'est lui, et pas le net avant impôt, qui donne le
    // niveau de vie servant à la TVA et à la pension.
    const netApresImpot = netAvantImpot - ir / 12;
    // Les droits à retraite d'un micro ne se lisent pas dans ses cotisations :
    // ils se reconstituent. Les autres régimes n'en ont pas besoin.
    const droits = R.droitsRetraite ? R.droitsRetraite(brut * 12, opts) : null;
    const tva = taxesConsommationAnnuelles(netApresImpot, { ...opts, salairePourRang: netAvantImpot });

    annees.push({
      age,
      brut,
      netAvantImpot,
      netApresImpot,
      salariales: sal.total * 12,
      patronales: pat.total * 12,
      reductionRgdu: pat.reduction * 12,
      impotRevenu: ir,
      taxesConsommation: tva,
      coutEmployeur: (brut + pat.total) * 12,
      // La cotisation vieillesse seule, pour la comparaison capitalisation.
      cotisationVieillesse: R.vieillesse(sal, pat, opts) * 12,
      // Le traitement indiciaire, quand le régime en distingue un : c'est lui
      // et lui seul qui porte la pension d'un fonctionnaire.
      tib: sal.tib ?? brut,
      primes: sal.primes ?? 0,
      // L'assiette sociale et la ligne de retraite complémentaire, en ANNUEL,
      // pour que la pension d'un indépendant se calcule par les règles.
      assiette: droits ? droits.revenuCotise : (sal.assiette ?? brut) * 12,
      retraiteComplementaire: droits
        ? droits.partComplementaire
        : (sal.lignes.retraiteComplementaire ?? 0) * 12,
      /** Non nul seulement quand le régime reconstitue ses droits (le micro). */
      droitsRetraite: droits,
    });
  }

  const somme = (cle) => annees.reduce((total, a) => total + a[cle], 0);

  return {
    annees,
    totaux: {
      salariales: somme('salariales'),
      patronales: somme('patronales'),
      impotRevenu: somme('impotRevenu'),
      taxesConsommation: somme('taxesConsommation'),
      cotisationVieillesse: somme('cotisationVieillesse'),
      reductionRgdu: somme('reductionRgdu'),
    },
  };
}

/**
 * Total prélevé selon le périmètre coché.
 * C'est l'empilement que l'utilisateur pilote lui-même à l'écran.
 */
export function totalPreleve(totaux, perimetre = {}) {
  // Contrat STRICT : une clé absente vaut false. Des valeurs par défaut à true
  // font qu'un périmètre partiel embarque silencieusement des postes que
  // l'utilisateur n'a pas cochés, et le chiffre affiché ment.
  const { salariales, patronales, impotRevenu, consommation } = perimetre;
  return (salariales ? totaux.salariales : 0)
    + (patronales ? totaux.patronales : 0)
    + (impotRevenu ? totaux.impotRevenu : 0)
    + (consommation ? totaux.taxesConsommation : 0);
}
