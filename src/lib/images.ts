import fs from "node:fs";
import path from "node:path";

/**
 * Quelles pièces photographiques ont réellement été versées au dossier.
 *
 * Lu UNE fois côté serveur, au rendu, et passé aux composants. Un `onError`
 * côté navigateur ferait la même chose au prix d'un clignotement et d'une
 * requête 404 par image manquante ; ici la page part déjà juste.
 *
 * Les fichiers se déposent dans `public/images/`, la convention de nommage est
 * dans `public/images/OU-DEPOSER-LES-IMAGES.md`.
 */

export const PIECES = {
  1: { fichier: "01-scene-de-crime", nom: "La scène de crime" },
  2: { fichier: "02-piece-a-conviction", nom: "La pièce à conviction" },
  3: { fichier: "03-tableau-enquete", nom: "Le tableau d'enquête" },
  4: { fichier: "04-coffre", nom: "Le coffre, après" },
  5: { fichier: "05-reconstitution", nom: "La reconstitution" },
  6: { fichier: "06-avis-de-recherche", nom: "L'avis de recherche" },
  7: { fichier: "07-empreintes-terminal", nom: "Les empreintes sur le terminal" },
  8: { fichier: "08-table-des-scelles", nom: "La table des scellés" },
  9: { fichier: "09-effraction", nom: "L'effraction" },
  10: { fichier: "10-distributeur", nom: "Le distributeur sous scellés" },
  11: { fichier: "11-pretoire", nom: "Le prétoire, vide" },
  12: { fichier: "12-dossier-texture", nom: "Le dossier" },
  13: { fichier: "13-braqueur", nom: "Le portrait du suspect" },
} as const;

export type NumeroPiece = keyof typeof PIECES;

const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

/**
 * Rend, pour chaque pièce, le nom de fichier réellement présent, ou null.
 * On accepte plusieurs extensions : le numéro et le nom font la convention,
 * pas le format.
 */
export function piecesDeposees(): Record<NumeroPiece, string | null> {
  const dossier = path.join(process.cwd(), "public", "images");
  let presents: string[] = [];
  try {
    presents = fs.readdirSync(dossier);
  } catch {
    // Le dossier peut ne pas exister sur un environnement fraîchement cloné.
    presents = [];
  }

  const sortie = {} as Record<NumeroPiece, string | null>;
  for (const [numero, piece] of Object.entries(PIECES)) {
    const trouve = EXTENSIONS.map((ext) => `${piece.fichier}${ext}`).find((f) =>
      presents.includes(f),
    );
    sortie[Number(numero) as NumeroPiece] = trouve ?? null;
  }
  return sortie;
}
