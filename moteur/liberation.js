/**
 * L'heure de libération : à quel moment on cesse de travailler pour les
 * prélèvements et où l'on commence à travailler pour soi.
 *
 * La méthode est celle du « jour de libération fiscale », et elle n'est pas
 * neutre : elle rapporte les prélèvements au COÛT EMPLOYEUR, c'est-à-dire à ce
 * que le travail coûte, et non au net perçu. C'est le dénominateur le plus
 * défavorable aux prélèvements, et c'est celui qu'emploient les publications
 * qui militent pour leur baisse. On le retient quand même, à une condition :
 * que la page le DISE. Un simulateur qui choisit un dénominateur sans le nommer
 * ne mesure rien, il cadre un résultat.
 *
 * Le pendant honnête est dans le même objet : `partDuNet`, qui rapporte les
 * mêmes prélèvements à ce qui arrive réellement sur le compte. Les deux
 * chiffres sont vrais, ils ne racontent pas la même histoire, et le lecteur a
 * le droit de voir les deux.
 */

const JOURS_MOIS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** Le n-ième jour d'une année de 365 jours, en clair. */
function jourEnClair(rang) {
  let reste = Math.max(1, Math.min(365, Math.ceil(rang)));
  for (let m = 0; m < 12; m += 1) {
    if (reste <= JOURS_MOIS[m]) return { jour: reste, mois: MOIS[m], texte: `${reste} ${MOIS[m]}` };
    reste -= JOURS_MOIS[m];
  }
  return { jour: 31, mois: 'décembre', texte: '31 décembre' };
}

/**
 * @param {object} simulation la sortie de simuler()
 * @param {object} [opts]
 * @param {boolean} [opts.avecConsommation] compter la TVA et les taxes de conso
 */
export function heureDeLiberation(simulation, opts = {}) {
  const { avecConsommation = simulation.entree.perimetre?.consommation ?? false } = opts;

  // L'année type est celle de l'âge actuel : c'est la fiche de paie que la
  // personne a sous les yeux, pas une moyenne de carrière qu'elle ne
  // reconnaîtrait pas.
  const annee =
    simulation.carriere.annees.find((a) => a.age === simulation.entree.ageActuel)
    ?? simulation.carriere.annees[0];

  const perimetre = simulation.entree.perimetre ?? {};
  let preleve = 0;
  if (perimetre.salariales !== false) preleve += annee.salariales;
  if (perimetre.patronales !== false) preleve += annee.patronales;
  if (perimetre.impotRevenu) preleve += annee.impotRevenu;
  if (avecConsommation) preleve += annee.taxesConsommation;

  const coutEmployeur = annee.coutEmployeur;
  const net = annee.netApresImpot * 12;

  const part = coutEmployeur > 0 ? preleve / coutEmployeur : 0;
  const borne = Math.max(0, Math.min(0.999, part));

  const rangJour = borne * 365;
  const heureDecimale = borne * 24;
  const heures = Math.floor(heureDecimale);
  const minutes = Math.round((heureDecimale - heures) * 60);

  return {
    /** Part des prélèvements dans le coût du travail. Le dénominateur est nommé. */
    part,
    /** Le même montant rapporté à ce qui arrive sur le compte. */
    partDuNet: net > 0 ? preleve / net : 0,
    preleve,
    coutEmployeur,
    net,
    /** Le jour de l'année où l'on commence à travailler pour soi. */
    jour: jourEnClair(rangJour),
    rangJour: Math.ceil(rangJour),
    /** L'heure de la journée, même calcul ramené à vingt-quatre heures. */
    heure: { heures, minutes: minutes === 60 ? 59 : minutes },
    heureTexte: `${heures} h ${String(minutes === 60 ? 59 : minutes).padStart(2, '0')}`,
  };
}
