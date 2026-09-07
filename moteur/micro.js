/**
 * Le régime du micro-entrepreneur.
 *
 * Même contrat de sortie que les quatre autres régimes, avec deux différences
 * qui se voient à l'écran et qu'il ne faut pas gommer :
 *
 * 1. **L'assiette est le chiffre d'affaires ENCAISSÉ**, pas un revenu après
 *    charges. Un micro paie ses cotisations sur ce qu'il a dépensé pour
 *    travailler comme sur ce qu'il garde. C'est le seul régime du simulateur
 *    dont le prélèvement ne dépend pas du bénéfice.
 * 2. **Il est taxé sur un revenu qu'il ne touche pas.** L'impôt frappe le CA
 *    après un abattement forfaitaire (71, 50 ou 34 %) qui n'a aucune raison de
 *    correspondre à ses charges réelles. Selon la catégorie, l'assiette fiscale
 *    est au-dessus ou au-dessous de ce qui lui reste vraiment.
 *
 * Il n'y a AUCUNE part employeur, comme chez les autres non-salariés.
 *
 * ⚠ L'inversion est ANALYTIQUE ici, et c'est le seul régime où elle peut
 * l'être : tous les taux portent sur le même CA, sans plancher, sans plafond
 * et sans palier. Pas de dichotomie, pas d'approximation.
 */

import {
  ABATTEMENT_MINIMUM,
  CATEGORIES,
  POINT_RCI,
  REVENU_PAR_TRIMESTRE,
  TAUX_VIEILLESSE_REEL,
  TRIMESTRES_MAX_PAR_AN,
} from './baremes-micro.js';

/** La catégorie, avec un défaut explicite et un refus sur l'inconnu. */
export function categorie(id = 'liberal') {
  const c = CATEGORIES[id];
  if (!c) {
    throw new Error(
      `Catégorie micro « ${id} » inconnue. Attendu : ${Object.keys(CATEGORIES).join(', ')}.`,
    );
  }
  return c;
}

/** La part du CA qui part en prélèvements sociaux, taxes annexes comprises. */
export function tauxTotal(id) {
  const c = categorie(id);
  return c.taux + c.formation + c.consulaire;
}

/**
 * Toutes les cotisations dues sur une année, à partir du CA ENCAISSÉ.
 *
 * @param {number} chiffreAffairesAnnuel
 * @param {{categorieMicro?: keyof typeof CATEGORIES}} [opts]
 */
export function cotisationsAnnuelles(chiffreAffairesAnnuel, opts = {}) {
  const c = categorie(opts.categorieMicro);
  const ca = Math.max(0, chiffreAffairesAnnuel);

  const forfaitGlobal = c.taux * ca;

  const lignes = {
    // Le forfait global est indivisible sur l'avis d'appel : c'est UNE ligne,
    // et la décomposer en maladie, retraite et CSG donnerait à croire qu'on
    // peut en discuter poste par poste. On la nomme pour ce qu'elle est.
    forfaitSocial: forfaitGlobal,
    formation: c.formation * ca,
    consulaire: c.consulaire * ca,
    // Rendues à zéro pour tenir le contrat commun des régimes : la CSG-CRDS
    // d'un micro est DÉJÀ dans le forfait global, elle ne s'isole pas.
    csgDeductible: 0,
    csgNonDeductible: 0,
  };

  const total = lignes.forfaitSocial + lignes.formation + lignes.consulaire;

  return {
    lignes,
    total,
    taux: ca > 0 ? total / ca : 0,
    /** L'assiette est le CA lui-même : c'est tout le sujet. */
    assiette: ca,
    forfaitGlobal,
  };
}

/** Contrat commun : côté agent, tout. Rendu en euros MENSUELS. */
export function retenuesSalariales(chiffreAffairesMensuel, opts = {}) {
  const annuel = cotisationsAnnuelles(chiffreAffairesMensuel * 12, opts);
  const lignes = Object.fromEntries(
    Object.entries(annuel.lignes).map(([k, v]) => [k, v / 12]),
  );
  return {
    lignes,
    total: annuel.total / 12,
    taux: annuel.taux,
    assiette: annuel.assiette / 12,
    forfaitGlobal: annuel.forfaitGlobal / 12,
  };
}

/** Contrat commun : côté employeur, RIEN. Un micro n'a pas d'employeur. */
export function cotisationsPatronales() {
  return { lignes: {}, total: 0, taux: 0, reduction: 0 };
}

export function coutEmployeur(chiffreAffairesMensuel) {
  return chiffreAffairesMensuel;
}

/**
 * Net avant impôt et net imposable, à partir du CA mensuel.
 *
 * ⚠ Les deux n'ont AUCUNE raison de coïncider, et c'est propre au micro. Le net
 * avant impôt est ce qui lui reste ; le net imposable est le CA moins un
 * abattement forfaitaire, qui ne mesure pas ses charges. Un libéral en BNC est
 * taxé sur 66 % de son CA alors qu'il en garde 74 % : il est imposé sur moins
 * qu'il ne gagne. Chez un prestataire de services, c'est l'inverse.
 */
export function netsDepuisBrut(chiffreAffairesMensuel, opts = {}) {
  const c = categorie(opts.categorieMicro);
  const r = retenuesSalariales(chiffreAffairesMensuel, opts);
  const netAvantImpot = chiffreAffairesMensuel - r.total;

  const caAnnuel = chiffreAffairesMensuel * 12;
  const abattement = Math.min(
    caAnnuel,
    Math.max(c.abattement * caAnnuel, Math.min(ABATTEMENT_MINIMUM, caAnnuel)),
  );
  const netImposable = (caAnnuel - abattement) / 12;

  return { netAvantImpot, netImposable, retenues: r };
}

/**
 * Inversion du net avant impôt vers le chiffre d'affaires.
 *
 * Analytique : tous les taux portent sur le même CA, donc
 * net = CA × (1 − taux total), et le CA s'en déduit d'un trait. Les autres
 * régimes ont besoin d'une dichotomie parce que leur barème a des paliers ;
 * celui-ci n'en a aucun.
 */
export function brutDepuisNet(netCible, opts = {}) {
  const reste = 1 - tauxTotal(opts.categorieMicro);
  if (!(reste > 0)) throw new Error('Taux total du micro supérieur à 100 %.');
  return Math.max(0, netCible) / reste;
}

/**
 * L'impôt sur le revenu, quand le micro a choisi le VERSEMENT LIBÉRATOIRE.
 *
 * Il ne passe alors pas par le barème : il paie un pourcentage de son CA, réglé
 * en même temps que ses cotisations. Rendre `null` signifie « applique le
 * barème comme tout le monde ».
 *
 * ⚠ L'option est ouverte sous condition de revenu fiscal de référence de
 * l'avant-dernière année (29 579 € par part pour une option prise en 2026). Le
 * moteur ne la vérifie pas : il n'a pas le revenu fiscal du foyer, et inventer
 * cette condition reviendrait à refuser l'option à des gens qui l'ont.
 */
export function impotAnnuel(chiffreAffairesMensuel, opts = {}) {
  if (!opts.versementLiberatoire) return null;
  const c = categorie(opts.categorieMicro);
  return c.versementLiberatoire * chiffreAffairesMensuel * 12;
}

/**
 * Le chiffre d'affaires dépasse-t-il le plafond du régime ?
 *
 * On ne LÈVE pas : une carrière entière projetée finit presque toujours par le
 * franchir, et refuser de calculer priverait la page de son propos. On le DIT,
 * et l'écran affiche à partir de quel âge le régime ne tiendrait plus.
 */
export function horsPlafond(chiffreAffairesAnnuel, opts = {}) {
  return chiffreAffairesAnnuel > categorie(opts.categorieMicro).plafond;
}

/**
 * Les droits à retraite d'une année, par la méthode de la circulaire Cnav
 * n° 2026-12 du 07/04/2026 (p. 10).
 *
 * ⚠ Ce n'est PAS « CA après abattement rapporté à 150 SMIC », qui est le
 * raccourci qu'on lit partout et qui donne un autre résultat. La chaîne
 * officielle est : forfait global → part affectée à la retraite de base →
 * revenu cotisé reconstitué au taux d'un indépendant au réel → trimestres.
 *
 * Le revenu cotisé ainsi reconstitué EST le revenu porté au compte : c'est lui
 * qu'il faut passer au calcul de pension du régime général, pas le CA.
 */
export function droitsRetraiteAnnuels(chiffreAffairesAnnuel, opts = {}) {
  const c = categorie(opts.categorieMicro);
  const forfaitGlobal = c.taux * Math.max(0, chiffreAffairesAnnuel);

  const partBase = forfaitGlobal * c.repartitionRetraiteBase;
  const partComplementaire = forfaitGlobal * c.repartitionRetraiteComplementaire;

  const revenuCotise = partBase / TAUX_VIEILLESSE_REEL;

  return {
    forfaitGlobal,
    partBase,
    partComplementaire,
    /** Le revenu porté au compte, à passer au calcul de pension du régime général. */
    revenuCotise,
    pointsComplementaires: partComplementaire / POINT_RCI.valeurAchat,
    trimestres: Math.min(
      TRIMESTRES_MAX_PAR_AN,
      Math.floor(revenuCotise / REVENU_PAR_TRIMESTRE),
    ),
    /**
     * ⚠ CALCULÉ, jamais publié. L'URSSAF ne publie plus de table de chiffre
     * d'affaires minimal par trimestre, sauf pour la CIPAV. Seule la formule
     * de la circulaire est officielle.
     */
    caPourUnTrimestre:
      (REVENU_PAR_TRIMESTRE * TAUX_VIEILLESSE_REEL)
      / (c.taux * c.repartitionRetraiteBase),
  };
}

/** La part du forfait qui finance la vieillesse, pour la comparaison capitalisation. */
export function partVieillesse(retenuesMensuelles, opts = {}) {
  const c = categorie(opts.categorieMicro);
  return (
    retenuesMensuelles.forfaitGlobal
    * (c.repartitionRetraiteBase + c.repartitionRetraiteComplementaire)
  );
}
