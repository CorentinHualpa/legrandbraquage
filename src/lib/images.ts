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

export { PIECES } from "./pieces";
export type { NumeroPiece, Pieces } from "./pieces";
import { PIECES, type NumeroPiece } from "./pieces";

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
