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
 */
const DECORS: Record<Acte, { fichier: string; volume: number }> = {
  commissariat: { fichier: "ambiance-commissariat", volume: 0.15 },
  scelles: { fichier: "ambiance-scelles", volume: 0.13 },
  tribunal: { fichier: "ambiance-tribunal", volume: 0.12 },
  rue: { fichier: "ambiance-rue", volume: 0.15 },
};

/**
 * La rumeur du commissariat : une SECONDE nappe, posée sous le décor, et
 * seulement là où il y a du monde. Séparée du décor pour pouvoir la doser à
 * part : c'est le seul son du dossier qui contient des voix, et une voix mal
 * dosée capte toute l'attention même quand on n'en comprend pas un mot.
 */
const RUMEUR = { fichier: "ambiance-rumeur", volume: 0.075 };
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

/** Bornes entre deux bruits de vie, en millisecondes. */
const VIE_MIN_MS = 22_000;
const VIE_MAX_MS = 70_000;

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
let dernierBruitDeVie = "";

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
  dernier: string,
  hasard: number,
): { fichier: string; volume: number } | null {
  const duLieu = VIE.filter((b) => b.actes.includes(acte));
  if (!duLieu.length) return null;
  /*
   * ⚠ Écarter le dernier joué est une bonne règle tant qu'il RESTE quelqu'un.
   * Sur un acte qui n'a qu'un seul bruit (la rue n'a que le briquet), elle ne
   * produit pas de la variété, elle produit du SILENCE définitif : le premier
   * tirage le joue, et tous les suivants ne rendent plus rien. Le test l'a
   * montré avant que ça ne s'entende. On retombe donc sur la liste complète
   * plutôt que de se taire.
   */
  const candidats = duLieu.filter((b) => b.fichier !== dernier);
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
  const choisi = choisirBruitDeVie(acte, dernierBruitDeVie, Math.random());
  if (!choisi) return;
  dernierBruitDeVie = choisi.fichier;
  const source = audio(choisi.fichier);
  if (!source) return;
  const ex = source.cloneNode(true) as HTMLAudioElement;
  ex.volume = choisi.volume;
  void ex.play().catch(() => {});
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
