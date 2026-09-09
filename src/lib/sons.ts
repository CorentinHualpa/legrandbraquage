"use client";

/**
 * La bande son du dossier : des bruits, jamais de musique.
 *
 * Le visiteur choisit à l'entrée entre « Garder le silence » et « Passer sur
 * écoute ». Tant qu'il n'a pas choisi, RIEN ne sort : un site qui se met à
 * faire du bruit tout seul se fait fermer avant la deuxième carte, et un lien
 * partagé qui ouvre le verdict n'a jamais posé la question.
 *
 * ⚠ Les navigateurs refusent de jouer un son avant un geste de la personne.
 * Ce n'est pas une contrainte ici, c'est le mécanisme : le bouton « Passer sur
 * écoute » EST ce geste, donc tout ce qui suit a le droit de sonner. Le son
 * ne s'allume nulle part ailleurs.
 *
 * TROIS COUCHES, refonte du 08/09/2026.
 *
 * 1. LES GESTES : un bruit par action de la personne (la porte, la page qui
 *    tourne, le tampon). Déclenchés par l'appelant, volume fixe.
 * 2. LE DÉCOR : une ambiance par ACTE, qui se fond quand on change de lieu.
 *    Avant, c'était un seul fichier de vingt-deux secondes en boucle, avec du
 *    grésillement de radio dedans : l'oreille repérait la boucle au deuxième
 *    passage, et un parcours de seize écrans la joue des dizaines de fois.
 * 3. LA VIE : des bruits RARES tirés au sort, à intervalles irréguliers et à
 *    faible volume. C'est cette couche qui fait la pièce vivante, pas la
 *    richesse du fond. Une horloge régulière s'oublie ; un tiroir métallique
 *    qu'on entend une fois par minute fait croire à quelqu'un dans le couloir.
 *
 * Les fichiers sont générés par `scripts/sons/generer.mjs` (ElevenLabs), pour
 * que tout sonne comme un seul enregistrement.
 */

export const SONS = {
  /** La porte du commissariat, quand on dépose plainte. */
  porte: 0.55,
  /** Une page du dossier qu'on tourne : à chaque changement d'écran. */
  page: 0.4,
  /** Le tampon du tribunal, sur le verdict. */
  tampon: 0.7,
  /** Le flash du photographe, sur le verdict. */
  flash: 0.5,
  /** Une frappe de machine à écrire : la déposition qui s'écrit. */
  machine: 0.28,
  /** Le ruban qu'on déchire : le scellé du butin. */
  ruban: 0.5,
  /** Le stylo qui coche : une réponse choisie. */
  coche: 0.45,
} as const;

export type Son = keyof typeof SONS;

/* ------------------------------------------------------------------ *
 * LE DÉCOR : une ambiance par acte
 * ------------------------------------------------------------------ */

export type Acte = "commissariat" | "scelles" | "tribunal" | "rue";

/**
 * ⚠ Les volumes sont BAS et ils doivent le rester. Une ambiance qu'on remarque
 * est une ambiance ratée : elle doit s'oublier au bout de dix secondes et ne
 * manquer que si on la coupe.
 *
 * ⚠⚠ Ces nombres n'ont de sens que parce que les fichiers ont été mis au même
 * niveau (`scripts/sons/normaliser.mjs`, 08/09/2026). Ils valaient 0,15 / 0,13 /
 * 0,12 / 0,15 quand les fichiers sortaient bruts du générateur, avec onze
 * décibels d'écart entre la rue et le tribunal : les nappes sortaient alors
 * entre 33 et 44 dB SOUS la voix, c'est-à-dire inaudibles, et le tribunal était
 * le plus bas des cinq alors que le code croyait le poser deux crans sous le
 * commissariat. Régénérer une ambiance sans la repasser au normaliseur remet
 * exactement ce défaut, sans rien casser de visible.
 *
 * Les petits écarts qui restent sont VOULUS : un tribunal plus feutré, une rue
 * et un commissariat au même plan.
 */
const DECORS: Record<Acte, { fichier: string; volume: number }> = {
  commissariat: { fichier: "ambiance-commissariat", volume: 0.72 },
  scelles: { fichier: "ambiance-scelles", volume: 0.57 },
  tribunal: { fichier: "ambiance-tribunal", volume: 0.41 },
  rue: { fichier: "ambiance-rue", volume: 0.62 },
};

/**
 * La rumeur du commissariat : une SECONDE nappe, posée sous le décor, et
 * seulement là où il y a du monde. Séparée du décor pour pouvoir la doser à
 * part : c'est le seul son du dossier qui contient des voix, et une voix mal
 * dosée capte toute l'attention même quand on n'en comprend pas un mot.
 *
 * ⚠ Son fichier normalisé sort 7 dB plus fort que les décors, parce que la
 * mesure R128 est pondérée pour la parole : d'où un multiplicateur qui a l'air
 * quatre fois plus bas que celui du commissariat pour un résultat cinq
 * décibels dessous. Le nombre ne se compare pas à ceux d'au-dessus.
 */
const RUMEUR = { fichier: "ambiance-rumeur", volume: 0.15 };
const ACTES_AVEC_RUMEUR: Acte[] = ["commissariat"];

/* ------------------------------------------------------------------ *
 * LA VIE : les bruits rares
 * ------------------------------------------------------------------ */

interface BruitDeVie {
  fichier: string;
  volume: number;
  /** Les actes où il a un sens. Ailleurs, il ne se déclenche jamais. */
  actes: Acte[];
  /**
   * Poids du tirage. Un tiroir qui coulisse peut revenir souvent, un téléphone
   * qui sonne dans le couloir devient vite pénible : c'est le seul réglage qui
   * décide si la pièce est vivante ou agaçante.
   */
  poids: number;
}

const VIE: BruitDeVie[] = [
  /*
   * ⚠ Le téléphone est le plus BAS et le plus RARE de tous. C'est le bruit qui
   * attire le plus l'oreille (une sonnerie appelle une réponse), donc celui qui
   * lasse le plus vite. Volume divisé par trois par rapport aux autres, et un
   * poids de 1 contre 4 ou 5 : il passe une fois toutes les cinq à dix minutes.
   */
  { fichier: "bruit-telephone", volume: 0.09, actes: ["commissariat"], poids: 1 },
  { fichier: "bruit-tiroir", volume: 0.2, actes: ["commissariat", "scelles"], poids: 4 },
  { fichier: "bruit-chaise", volume: 0.18, actes: ["commissariat", "tribunal"], poids: 4 },
  { fichier: "bruit-briquet", volume: 0.16, actes: ["commissariat", "rue"], poids: 3 },
  { fichier: "bruit-clavier-court", volume: 0.17, actes: ["commissariat"], poids: 5 },
  { fichier: "bruit-clavier-long", volume: 0.15, actes: ["commissariat"], poids: 3 },
  /*
   * La mécanique claque plus fort et date la pièce autrement : le dossier a
   * déjà une machine à écrire, deux époques de clavier dans la même pièce se
   * remarquent. Gardée, mais rare et discrète.
   */
  { fichier: "bruit-clavier-mecanique", volume: 0.13, actes: ["commissariat"], poids: 2 },
];

/**
 * Bornes entre deux bruits de vie, en millisecondes.
 *
 * ⚠ Ces deux nombres se règlent À L'OREILLE, jamais au raisonnement. Ils
 * valaient 22 à 70 secondes, écrits en réfléchissant sans écouter : ça donne
 * DEUX bruits en soixante-quinze secondes, mesuré en rendant le mix, et le
 * commissariat sonnait vide. La cadence retenue vient d'une comparaison de
 * trois versions rendues en fichiers (`scripts/sons/mix.mjs`), écoutées côte à
 * côte. Pour les changer, refaire un mix, ne pas raisonner.
 */
const VIE_MIN_MS = 6_000;
const VIE_MAX_MS = 16_000;

/* ------------------------------------------------------------------ *
 * Machinerie
 * ------------------------------------------------------------------ */

let actif = false;
let acteCourant: Acte | null = null;
/** Un exemplaire préchargé par son de geste, cloné à chaque lecture. */
const modeles = new Map<string, HTMLAudioElement>();
/** Les nappes en cours : le décor, et la rumeur quand l'acte en a une. */
const nappes = new Map<string, HTMLAudioElement>();
let minuterieVie: ReturnType<typeof setTimeout> | null = null;
/** Les deux derniers bruits de vie joués, pour ne pas les reprendre tout de suite. */
const recentsDeVie: string[] = [];

function audio(fichier: string): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const connu = modeles.get(fichier);
  if (connu) return connu;
  const a = new Audio(`/sons/${fichier}.mp3`);
  a.preload = "auto";
  modeles.set(fichier, a);
  return a;
}

/**
 * Monte ou descend le volume d'une nappe en douceur.
 *
 * ⚠ Un changement de décor qui COUPE net s'entend comme une panne : le
 * visiteur croit que le son a lâché. Le fondu est ce qui fait que le
 * changement de pièce se ressent sans se remarquer.
 *
 * En pas de volume et non en WebAudio : un `AudioContext` demande un geste de
 * la personne pour démarrer et se met en pause tout seul, ce qui rajouterait
 * un mode de panne à un effet purement cosmétique.
 */
function fondre(el: HTMLAudioElement, vers: number, ms: number, apres?: () => void) {
  const depart = el.volume;
  const debut = performance.now();
  const pas = () => {
    const t = Math.min(1, (performance.now() - debut) / ms);
    el.volume = Math.max(0, Math.min(1, depart + (vers - depart) * t));
    if (t < 1) requestAnimationFrame(pas);
    else apres?.();
  };
  requestAnimationFrame(pas);
}

function lancerNappe(fichier: string, volume: number) {
  if (nappes.has(fichier)) return;
  const el = new Audio(`/sons/${fichier}.mp3`);
  el.loop = true;
  el.volume = 0;
  nappes.set(fichier, el);
  void el.play().catch(() => {});
  fondre(el, volume, 1400);
}

function arreterNappe(fichier: string) {
  const el = nappes.get(fichier);
  if (!el) return;
  nappes.delete(fichier);
  fondre(el, 0, 1200, () => el.pause());
}

/** Vrai si la personne a demandé le son. Sert à afficher l'état, pas à décider. */
export function sonsActifs(): boolean {
  return actif;
}

/**
 * Pose le décor de l'acte en cours. Idempotent : appelable à chaque rendu,
 * il ne fait rien tant que l'acte ne change pas.
 */
export function poserDecor(acte: Acte): void {
  if (typeof window === "undefined") return;
  if (acteCourant === acte) return;
  acteCourant = acte;
  if (!actif) return;
  appliquerDecor();
}

function appliquerDecor() {
  const acte = acteCourant;
  if (!acte) return;
  const voulu = DECORS[acte];
  const rumeur = ACTES_AVEC_RUMEUR.includes(acte);
  const gardees = new Set([voulu.fichier, ...(rumeur ? [RUMEUR.fichier] : [])]);
  for (const fichier of [...nappes.keys()]) {
    if (!gardees.has(fichier)) arreterNappe(fichier);
  }
  lancerNappe(voulu.fichier, voulu.volume);
  if (rumeur) lancerNappe(RUMEUR.fichier, RUMEUR.volume);
}

/**
 * L'ordonnanceur de la vie : un bruit rare, puis un délai tiré au sort, puis
 * un autre. Jamais deux fois le même d'affilée, parce que c'est la répétition
 * qui trahit la machine, pas la fréquence.
 */
function programmerVie() {
  if (minuterieVie) clearTimeout(minuterieVie);
  if (!actif) return;
  const delai = VIE_MIN_MS + Math.random() * (VIE_MAX_MS - VIE_MIN_MS);
  minuterieVie = setTimeout(() => {
    tirerUnBruitDeVie();
    programmerVie();
  }, delai);
}

/**
 * QUEL bruit de vie jouer. Fonction PURE, exportée pour être éprouvée : c'est
 * la seule partie qui peut se tromper en silence (un acte sans candidat, un
 * poids mal écrit, une répétition), et elle ne se voit pas à l'écran, seulement
 * au bout de plusieurs minutes d'écoute.
 *
 * `hasard` est injecté plutôt que tiré ici, sinon le test devrait boucler mille
 * fois en espérant tomber sur le cas qu'il vérifie.
 */
export function choisirBruitDeVie(
  acte: Acte,
  /** Les derniers joués, du plus ancien au plus récent. */
  recents: readonly string[],
  hasard: number,
): { fichier: string; volume: number } | null {
  const duLieu = VIE.filter((b) => b.actes.includes(acte));
  if (!duLieu.length) return null;
  /*
   * ⚠ On écarte les DEUX derniers, pas seulement le précédent. Une mémoire d'un
   * seul laisse passer A-B-A-B, qui s'entend exactement comme une boucle de
   * deux sons : sur le premier mix rendu, le clavier revenait trois fois en une
   * minute alors que la règle « jamais deux fois de suite » était respectée.
   */
  /*
   * ⚠ Écarter le dernier joué est une bonne règle tant qu'il RESTE quelqu'un.
   * Sur un acte qui n'a qu'un seul bruit (la rue n'a que le briquet), elle ne
   * produit pas de la variété, elle produit du SILENCE définitif : le premier
   * tirage le joue, et tous les suivants ne rendent plus rien. Le test l'a
   * montré avant que ça ne s'entende. On retombe donc sur la liste complète
   * plutôt que de se taire.
   */
  const candidats = duLieu.filter((b) => !recents.includes(b.fichier));
  const tirables = candidats.length ? candidats : duLieu;
  const total = tirables.reduce((n, b) => n + b.poids, 0);
  let tirage = Math.max(0, Math.min(0.999999, hasard)) * total;
  const choisi = tirables.find((b) => (tirage -= b.poids) < 0) ?? tirables[tirables.length - 1];
  return { fichier: choisi.fichier, volume: choisi.volume };
}

function tirerUnBruitDeVie() {
  const acte = acteCourant;
  if (!acte || !actif) return;
  // L'onglet en arrière-plan ne doit RIEN jouer : un bruit qui sort d'un onglet
  // qu'on ne regarde plus se cherche pendant trente secondes.
  if (typeof document !== "undefined" && document.hidden) return;
  const choisi = choisirBruitDeVie(acte, recentsDeVie, Math.random());
  if (!choisi) return;
  recentsDeVie.push(choisi.fichier);
  if (recentsDeVie.length > 2) recentsDeVie.shift();
  const source = audio(choisi.fichier);
  if (!source) return;
  const ex = source.cloneNode(true) as HTMLAudioElement;
  ex.volume = choisi.volume;
  void ex.play().catch(() => {});
}

/* ------------------------------------------------------------------ *
 * LA VOIX DU COMMISSAIRE
 * ------------------------------------------------------------------ */

/**
 * Une réplique par écran, pré-enregistrée (`scripts/voix/repliques.mjs`).
 *
 * ⚠ Elle ne se superpose JAMAIS à la précédente. Deux commissaires qui parlent
 * en même temps, c'est ce qui arrive dès qu'on avance vite dans le parcours, et
 * ça ne se répare pas à l'écoute : on n'entend plus rien des deux. La nouvelle
 * coupe l'ancienne, sèchement, parce qu'un fondu sur une voix s'entend comme un
 * problème de lecture.
 *
 * ⚠ Le DÉCOR baisse pendant qu'il parle. Sans ça, la rumeur et le clavier
 * passent par-dessus la moitié de ses phrases : c'est le défaut classique d'un
 * mixage à volumes fixes, et il ne se voit que quand les deux tombent ensemble.
 */
let voixEnCours: HTMLAudioElement | null = null;
let minuterieVoix: ReturnType<typeof setTimeout> | null = null;
/** Vrai pendant une réaction : elle ne se fait pas couper par la carte suivante. */
let protegee = false;
/** La réplique d'arrivée qui attend la fin d'une réaction. Une seule place. */
let enAttente: string | null = null;
let ducking = false;

/** De combien on baisse le décor pendant qu'il parle. */
const DUCK = 0.4;

/**
 * Les écrans qui ont une réplique. Écrit ici plutôt que déduit d'un 404 : une
 * requête qui échoue baisse le décor le temps de l'aller-retour, et pollue la
 * console du visiteur d'une erreur rouge à chaque écran muet.
 *
 * ⚠ « couverture » n'en a pas et n'en aura pas : c'est l'écran où l'on demande
 * la permission de faire du bruit. Une voix y serait exactement ce qu'on
 * s'interdit ailleurs.
 */
const AVEC_REPLIQUE = new Set([
  "deposition", "tabac", "carburant", "alcool", "pris", "butin",
  "liberation", "aparte", "ecole", "sante", "chomage", "rendu", "bourse",
  "verdict", "avis",
  // Les dix tranches de salaire, une par décile (cf. `DECILES` de repliques.ts).
  "salaire-01", "salaire-02", "salaire-03", "salaire-04", "salaire-05",
  "salaire-06", "salaire-07", "salaire-08", "salaire-09", "salaire-10",
  // Les réponses cliquables : le cadeau, puis l'enveloppe de la bourse.
  "cadeau-partage", "cadeau-picotte",
  "placement-prudent", "placement-pierre", "placement-audacieux", "placement-cac",
  // L'avocate du Braqueur, sur toute la partie nuance.
  "aparte", "aparte-concede", "ecole", "sante", "chomage", "rendu",
]);

/**
 * Le temps qu'on laisse avant qu'il ouvre la bouche.
 *
 * L'arrivée sur une carte joue déjà la page qu'on tourne, et la carte s'anime.
 * Une voix qui démarre dans la même image se cogne au bruit de page et donne
 * l'impression d'un fichier lancé trop tôt. Une seconde suffit à faire croire
 * qu'il lève les yeux du dossier avant de parler.
 */
const AVANT_DE_PARLER_MS = 900;

/**
 * Le silence entre une réaction et la réplique de la carte suivante.
 *
 * Plus long que le délai d'arrivée, et c'est voulu : ici il ne s'agit pas de
 * laisser passer un bruit de page, mais de faire entendre qu'il a FINI de
 * répondre avant de passer à autre chose. Sous deux secondes, les deux phrases
 * se lisent comme une seule.
 */
const ENTRE_DEUX_REPLIQUES_MS = 2_000;

function duckerLesNappes(baisser: boolean) {
  if (ducking === baisser) return;
  ducking = baisser;
  for (const [fichier, el] of nappes) {
    const plein = fichier === RUMEUR.fichier
      ? RUMEUR.volume
      : (Object.values(DECORS).find((d) => d.fichier === fichier)?.volume ?? el.volume);
    fondre(el, baisser ? plein * DUCK : plein, 400);
  }
}

/**
 * Fait parler le commissaire. Sans effet si la personne a gardé le silence :
 * la voix suit le même interrupteur que le reste, elle n'a pas de régime à part.
 */
function lancerLaVoix(nom: string, delaiMs: number) {
  minuterieVoix = setTimeout(() => {
    minuterieVoix = null;
    const el = new Audio(`/voix/${nom}.mp3`);
    voixEnCours = el;
    duckerLesNappes(true);
    const fini = () => {
      if (voixEnCours !== el) return;
      voixEnCours = null;
      protegee = false;
      /*
       * ⚠ Le décor remonte TOUJOURS, même quand une réplique attend derrière.
       * Enchaîner sans le laisser revenir collait les deux phrases : on
       * entendait un seul bloc de parole ininterrompu, la réaction au montant
       * et le commentaire de la carte suivante mélangés, et on ne comprenait
       * plus qui commente quoi (Coq, 09/09/2026 : « il enchaîne directement,
       * du coup on comprend pas »). Ce sont les deux secondes de bureau qui
       * disent qu'une phrase est finie et qu'une autre commence.
       */
      duckerLesNappes(false);
      const suite = enAttente;
      enAttente = null;
      if (suite) lancerLaVoix(suite, ENTRE_DEUX_REPLIQUES_MS);
    };
    el.addEventListener("ended", fini);
    // Un fichier manquant ne doit pas laisser le décor baissé pour toujours :
    // c'est le genre de panne qu'on met une heure à relier à sa cause.
    el.addEventListener("error", fini);
    void el.play().catch(fini);
  }, delaiMs);
}

export function parler(ecran: string): void {
  if (typeof window === "undefined") return;
  /*
   * Une réplique d'arrivée ne coupe PAS une réaction en cours : la réaction
   * vient d'un clic de la personne, et couper ce qu'on vient de déclencher soi-
   * même se lit comme une panne, pas comme du rythme. Elle attend derrière, et
   * si on avance encore, c'est la dernière carte vue qui prend la place.
   */
  if (protegee && voixEnCours) {
    enAttente = actif && AVEC_REPLIQUE.has(ecran) ? ecran : null;
    return;
  }
  // Sinon on coupe toujours, même sur un écran sans réplique : sans ça il finit
  // sa phrase de la carte précédente par-dessus la nouvelle.
  taire();
  if (!actif || !AVEC_REPLIQUE.has(ecran)) return;
  lancerLaVoix(ecran, AVANT_DE_PARLER_MS);
}

/**
 * Le commissaire réagit à ce que la personne vient de faire.
 *
 * Deux différences avec `parler`, et les deux viennent du fait que c'est un
 * CLIC qui déclenche : il répond tout de suite (le délai d'arrivée servait à
 * laisser passer le bruit de page, ici il ferait juste attendre), et il n'est
 * pas coupé par la carte suivante, qui attend son tour.
 */
export function reagir(nom: string): void {
  if (typeof window === "undefined") return;
  taire();
  if (!actif || !AVEC_REPLIQUE.has(nom)) return;
  protegee = true;
  lancerLaVoix(nom, 0);
}

/** Coupe la réplique en cours. Appelé à chaque changement d'écran. */
export function taire(): void {
  // La minuterie d'abord : quelqu'un qui traverse trois cartes en deux secondes
  // n'a lancé aucun fichier, mais il a armé trois départs.
  if (minuterieVoix) clearTimeout(minuterieVoix);
  minuterieVoix = null;
  protegee = false;
  enAttente = null;
  if (!voixEnCours) return;
  voixEnCours.pause();
  voixEnCours = null;
  duckerLesNappes(false);
}

/* ------------------------------------------------------------------ *
 * LA FRAPPE DU GREFFIER
 * ------------------------------------------------------------------ */

/**
 * Quelqu'un tape ce que la personne vient de dire.
 *
 * ⚠ Volontairement DIFFÉRÉE et regroupée. Une frappe par touche donnerait un
 * clavier qui suit le doigt, ce qui est du bruitage ; ce qu'on veut, c'est un
 * greffier qui écoute, puis qui saisit. Les appels rapprochés se fondent donc
 * en UNE rafale, tirée après la dernière frappe de la personne.
 *
 * `long` pour un montant qu'on vient de saisir, `court` pour un simple clic :
 * on ne tape pas la même chose pour une case cochée et pour un chiffre.
 */
const FRAPPE = {
  court: { fichier: "bruit-clavier-court", volume: 0.22, apres: 260 },
  long: { fichier: "bruit-clavier-long", volume: 0.2, apres: 700 },
} as const;

let minuterieFrappe: ReturnType<typeof setTimeout> | null = null;

export function frapper(genre: keyof typeof FRAPPE = "court"): void {
  if (!actif || typeof window === "undefined") return;
  const f = FRAPPE[genre];
  if (minuterieFrappe) clearTimeout(minuterieFrappe);
  minuterieFrappe = setTimeout(() => {
    minuterieFrappe = null;
    const source = audio(f.fichier);
    if (!source) return;
    const ex = source.cloneNode(true) as HTMLAudioElement;
    ex.volume = f.volume;
    void ex.play().catch(() => {});
  }, f.apres);
}

/**
 * Allume ou éteint toute la bande son. À n'appeler QUE depuis un geste de la
 * personne : c'est ce geste qui autorise le navigateur à jouer.
 */
export function reglerSons(oui: boolean): void {
  actif = oui;
  if (typeof window === "undefined") return;
  if (!oui) {
    for (const fichier of [...nappes.keys()]) {
      nappes.get(fichier)?.pause();
      nappes.delete(fichier);
    }
    if (minuterieVie) clearTimeout(minuterieVie);
    minuterieVie = null;
    if (minuterieFrappe) clearTimeout(minuterieFrappe);
    minuterieFrappe = null;
    if (minuterieVoix) clearTimeout(minuterieVoix);
    minuterieVoix = null;
    protegee = false;
    enAttente = null;
    if (voixEnCours) { voixEnCours.pause(); voixEnCours = null; }
    ducking = false;
    return;
  }
  for (const nom of Object.keys(SONS)) audio(nom)?.load();
  appliquerDecor();
  programmerVie();
}

/** Joue un bruit de geste, une fois. Ne fait rien si la personne a gardé le silence. */
export function jouer(nom: Son): void {
  if (!actif || typeof window === "undefined") return;
  const source = audio(nom);
  if (!source) return;
  // Un clone par lecture : deux frappes rapprochées doivent se superposer,
  // pas se couper l'une l'autre.
  const exemplaire = source.cloneNode(true) as HTMLAudioElement;
  exemplaire.volume = SONS[nom];
  void exemplaire.play().catch(() => {});
}
