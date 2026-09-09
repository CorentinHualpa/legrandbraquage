/**
 * L'inventaire des pièces photographiques : numéro, fichier, nom.
 *
 * ⚠ Ce module ne touche PAS au disque, et c'est voulu : les écrans (côté
 * navigateur) ont besoin du NOM d'une pièce pour afficher son cadre vide,
 * et importer une valeur depuis un module qui lit `node:fs` embarque
 * `node:fs` dans le paquet client, ce que Turbopack refuse au build. La
 * lecture du dossier vit dans `images.ts`, côté serveur seulement.
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
  // Planche 2, le parcours en cartes (08/09/2026).
  14: { fichier: "14-mot-du-braqueur", nom: "Le mot du braqueur" },
  15: { fichier: "15-bulletin-scelle", nom: "Le bulletin sous scellé" },
  16: { fichier: "16-bracelet-hopital", nom: "Le bracelet d’hôpital" },
  17: { fichier: "17-bureau-vide", nom: "Le bureau vidé" },
  // Le commissaire, en six postures, jamais de visage (08/09/2026).
  18: { fichier: "18-commissariat", nom: "Le commissariat, la nuit" },
  19: { fichier: "19-commissaire-dossier", nom: "Le commissaire, penché sur la pièce" },
  20: { fichier: "20-commissaire-regard", nom: "Le commissaire, qui vous regarde" },
  21: { fichier: "21-commissaire-montre", nom: "Le commissaire, la montre" },
  22: { fichier: "22-commissaire-aparte", nom: "Le commissaire, en aparté" },
  23: { fichier: "23-commissaire-interrogatoire", nom: "Le commissaire, bras croisés" },
  24: { fichier: "24-commissaire-porte", nom: "Le commissaire, à la porte" },
  /** La table aux six enveloppes, vue du dessus : c'est là qu'on pose la liasse. */
  25: { fichier: "25-table-enveloppes", nom: "La table du commissaire" },
  // Les encarts du 08/09/2026 au soir : le café, le témoin, l'avocate.
  26: { fichier: "26-cafe", nom: "Le café du commissariat" },
  /* Plus affichée depuis le retrait de la carte du témoin (09/09/2026). Gardée :
     le fichier existe, il a coûté une génération, et la scène peut revenir. */
  27: { fichier: "27-temoin", nom: "Le témoin, derrière la vitre" },
  28: { fichier: "28-avocat", nom: "L’avocate du Braqueur" },
} as const;

export type NumeroPiece = keyof typeof PIECES;

/** Pour chaque pièce, le fichier réellement présent, ou null. Ce que les écrans reçoivent. */
export type Pieces = Record<NumeroPiece, string | null>;
