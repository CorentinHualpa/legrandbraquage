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
 * Les fichiers sont générés par `scripts/sons/generer.mjs` (ElevenLabs), pour
 * que les huit sonnent comme un seul enregistrement.
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

/** Le volume de l'ambiance de fond : elle doit s'oublier, pas s'écouter. */
const VOLUME_AMBIANCE = 0.14;

let actif = false;
let ambiance: HTMLAudioElement | null = null;
/** Un exemplaire préchargé par son, cloné à chaque lecture. */
const modeles = new Map<Son, HTMLAudioElement>();

function modele(nom: Son): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const connu = modeles.get(nom);
  if (connu) return connu;
  const audio = new Audio(`/sons/${nom}.mp3`);
  audio.preload = "auto";
  modeles.set(nom, audio);
  return audio;
}

/** Vrai si la personne a demandé le son. Sert à afficher l'état, pas à décider. */
export function sonsActifs(): boolean {
  return actif;
}

/**
 * Allume ou éteint toute la bande son. À n'appeler QUE depuis un geste de la
 * personne : c'est ce geste qui autorise le navigateur à jouer.
 */
export function reglerSons(oui: boolean): void {
  actif = oui;
  if (typeof window === "undefined") return;
  if (!oui) {
    ambiance?.pause();
    return;
  }
  for (const nom of Object.keys(SONS) as Son[]) modele(nom)?.load();
  if (!ambiance) {
    ambiance = new Audio("/sons/commissariat.mp3");
    ambiance.loop = true;
    ambiance.volume = VOLUME_AMBIANCE;
  }
  // Un refus de lecture n'est pas une panne : la page marche sans le son.
  void ambiance.play().catch(() => {});
}

/** Joue un bruit, une fois. Ne fait rien si la personne a gardé le silence. */
export function jouer(nom: Son): void {
  if (!actif || typeof window === "undefined") return;
  const source = modele(nom);
  if (!source) return;
  // Un clone par lecture : deux frappes rapprochées doivent se superposer,
  // pas se couper l'une l'autre.
  const exemplaire = source.cloneNode(true) as HTMLAudioElement;
  exemplaire.volume = SONS[nom];
  void exemplaire.play().catch(() => {});
}
