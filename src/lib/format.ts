/**
 * Une seule façon d'écrire un montant dans tout le site.
 *
 * L'unité est l'EURO D'AUJOURD'HUI, inflation corrigée. Ce n'est pas un détail
 * de présentation : c'est le piège méthodologique n° 1 de ce type d'outil, et
 * la page méthode le dit. Toute somme affichée sort d'ici.
 */

/** 1 379 000 → « 1 379 000 ». Espace insécable fine, pour que rien ne se coupe. */
export function euros(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** 1 379 000 → « 1 379 000 € ». */
export function eurosSigne(n: number): string {
  return `${euros(n)} €`;
}

/** 1 379 000 → « 1,38 M€ ». Pour les cartes et les titres, jamais pour une preuve. */
export function eurosCourt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2).replace(".", ",")} M€`;
  }
  if (abs >= 10_000) {
    return `${Math.round(n / 1000)} k€`;
  }
  return eurosSigne(n);
}

/** 0,4305 → « 43,05 % ». */
export function pourcent(n: number, decimales = 2): string {
  return `${(n * 100).toFixed(decimales).replace(".", ",")} %`;
}

/**
 * 53000 → « cinquante-trois mille ». Le verdict s'écrit en lettres : un chiffre
 * en toutes lettres se lit comme une sentence, pas comme une ligne de tableau.
 * Au-delà du million on rend la main aux chiffres, l'énoncé deviendrait illisible.
 */
const UNITES = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
];
const DIZAINES: Record<number, string> = {
  2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante",
};

function centaineEnLettres(n: number): string {
  if (n < 17) return UNITES[n];
  if (n < 20) return `dix-${UNITES[n - 10]}`;
  if (n < 70) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return DIZAINES[d];
    if (u === 1) return `${DIZAINES[d]} et un`;
    return `${DIZAINES[d]}-${UNITES[u]}`;
  }
  if (n < 80) {
    const r = n - 60;
    if (r === 11) return "soixante et onze";
    return `soixante-${centaineEnLettres(r)}`;
  }
  if (n < 100) {
    const r = n - 80;
    if (r === 0) return "quatre-vingts";
    return `quatre-vingt-${centaineEnLettres(r)}`;
  }
  const c = Math.floor(n / 100);
  const r = n % 100;
  const tete = c === 1 ? "cent" : `${UNITES[c]} cent`;
  if (r === 0) return c === 1 ? "cent" : `${tete}s`;
  return `${tete} ${centaineEnLettres(r)}`;
}

export function verdictEnLettres(montant: number): string {
  const n = Math.round(montant);
  if (n >= 1_000_000) return eurosCourt(n);

  const milliers = Math.floor(n / 1000);
  const reste = n % 1000;
  if (milliers === 0) return centaineEnLettres(reste);

  const tete = milliers === 1 ? "mille" : `${centaineEnLettres(milliers)} mille`;
  if (reste === 0) return tete;
  return `${tete} ${centaineEnLettres(reste)}`;
}

/** Majuscule à l'initiale, pour une phrase de verdict. */
export function capitale(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}
