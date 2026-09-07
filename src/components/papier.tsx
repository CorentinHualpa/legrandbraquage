/**
 * Les primitives du dossier : la feuille, l'en-tête, le tampon, le scellé.
 *
 * Tout le site est UNE pièce de procédure. Ces cinq composants portent la
 * grammaire visuelle, et rien ailleurs ne redessine un cadre ou un tampon :
 * deux copies d'un même motif finissent toujours par diverger.
 */

import type { ReactNode } from "react";

/** La feuille réglée, avec la marge du greffier. */
export function Feuille({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`papier-regle marge-greffe relative mx-auto w-full max-w-[620px] bg-papier ${className}`}
    >
      <div className="relative flex flex-col gap-5 py-6 pr-5 pl-10 sm:gap-6 sm:pr-8 sm:pl-16">
        {children}
      </div>
    </div>
  );
}

/** L'en-tête d'une pièce : sa nature en petites capitales, son titre, son tampon. */
export function EnTete({
  nature,
  titre,
  tampon,
}: {
  nature: string;
  titre: string;
  tampon?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 border-b-2 border-encre pb-2.5">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[10px] tracking-[0.14em] text-encre-3">
          {nature}
        </span>
        <h2 className="text-[22px] leading-tight font-bold tracking-[-0.015em] sm:text-[26px]">
          {titre}
        </h2>
      </div>
      {tampon ? <div className="mt-1 shrink-0">{tampon}</div> : null}
    </header>
  );
}

/** Le cachet posé de travers, en rouge d'accusation ou en bleu de greffe. */
export function Tampon({
  children,
  couleur = "rouge",
  sens = "gauche",
}: {
  children: ReactNode;
  couleur?: "rouge" | "bleu";
  sens?: "gauche" | "droite";
}) {
  const teinte = couleur === "rouge" ? "border-rouge text-rouge-texte" : "border-bleu text-bleu";
  return (
    <span
      className={`${sens === "gauche" ? "tampon-gauche" : "tampon-droite"} inline-block rounded-[3px] border-2 px-2 py-1 ${teinte}`}
    >
      <span className="font-mono text-[10px] font-semibold tracking-[0.1em]">
        {children}
      </span>
    </span>
  );
}

const RATIOS = {
  "16:9": "aspect-[16/9]",
  "4:3": "aspect-[4/3]",
  "3:2": "aspect-[3/2]",
  "3:4": "aspect-[3/4]",
  "1:1": "aspect-square",
} as const;

/**
 * Une pièce photographique du dossier.
 *
 * Tant que le fichier n'est pas déposé dans `public/images/`, le cadre reste
 * un scellé numéroté : la page ne casse pas, elle affiche un emplacement de
 * pièce qui n'a pas encore été versée au dossier. C'est cohérent avec la
 * fiction, donc montrable en l'état.
 */
export function Scelle({
  numero,
  nom,
  fichier,
  ratio = "16:9",
  legende,
  className = "",
}: {
  numero: number;
  nom: string;
  /**
   * Le nom de fichier RÉELLEMENT trouvé sur le disque, ou null.
   *
   * ⚠ Ne jamais écrire ce nom en dur à l'appel. Le dossier accepte plusieurs
   * extensions, et un `.jpg` codé en face d'un `.webp` déposé donne un cadre
   * qui se croit rempli et sert une image manquante : la page a l'air juste et
   * n'affiche rien. Passer `pieces[n]`, qui vient de `piecesDeposees()`.
   */
  fichier: string | null;
  ratio?: keyof typeof RATIOS;
  legende?: string;
  className?: string;
}) {
  if (fichier) {
    return (
      <figure className={`relative overflow-hidden border border-cadre-bord ${RATIOS[ratio]} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/images/${fichier}`}
          alt={nom}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {legende ? (
          <figcaption className="absolute right-0 bottom-0 left-0 bg-encre/70 px-2 py-1 font-mono text-[9px] tracking-wide text-papier">
            {legende}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <div
      className={`cadre-scelle relative flex items-center justify-center ${RATIOS[ratio]} ${className}`}
    >
      <span className="px-4 text-center font-mono text-[10px] leading-relaxed tracking-[0.1em] text-encre-3">
        PIÈCE N° {String(numero).padStart(2, "0")}
        <br />
        {nom.toUpperCase()}
      </span>
      {legende ? (
        <span className="absolute bottom-1.5 left-2 font-mono text-[9px] text-encre-3">
          {legende}
        </span>
      ) : null}
    </div>
  );
}

/** Le bloc « pièces versées au dossier », en pied de chaque écran. */
export function PiecesVersees({ children }: { children?: ReactNode }) {
  return (
    <p className="border-t border-ligne pt-3 font-mono text-[10px] leading-relaxed text-encre-3">
      {children ?? (
        <>
          PIÈCES VERSÉES AU DOSSIER : URSSAF, DGFiP, INSEE, COR, DREES,
          <br />
          BANQUE DE FRANCE · BARÈMES 2026. MÉTHODE ET MOTEUR PUBLICS.
        </>
      )}
    </p>
  );
}

/** Un renvoi de greffe : le paragraphe précédé du signe §. */
export function Renvoi({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-t border-ligne pt-3">
      <span className="shrink-0 font-mono text-[15px] text-bleu">§</span>
      <p className="text-[13.5px] leading-relaxed text-encre-2">{children}</p>
    </div>
  );
}
