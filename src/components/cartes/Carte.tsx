"use client";

import { useState, type ReactNode } from "react";

import { PIECES, type NumeroPiece, type Pieces } from "@/lib/pieces";

/**
 * Une carte du parcours : un écran, un chiffre, la nuit du commissariat.
 *
 * Fond sombre, photo en plein cadre qui fond vers le noir, le texte posé
 * dessus. Les documents (déposition, PV, avis) sont des papiers clairs posés
 * de travers sur le sombre. Le bandeau du haut rappelle sur CHAQUE carte
 * qu'on rejoue une carrière entière : sans lui, un total de quarante-trois
 * ans se lit comme un prélèvement de l'année.
 *
 * Refonte du 08/09/2026, retour de Coq : « ça ne met pas assez dans
 * l'ambiance, plus tourner ça comme une investigation, un interrogatoire,
 * avec des images immersives ».
 */
export function Carte({
  numero,
  total,
  nature,
  retour,
  photo,
  children,
  action,
  actionSecondaire,
  pied,
}: {
  numero: number;
  total: number;
  /** Ce qu'on lit à gauche du bandeau : « Déposition », « Interrogatoire · 1 sur 3 ». */
  nature: string;
  retour?: () => void;
  photo?: { numero: NumeroPiece; pieces: Pieces; hauteur: number; legende?: string; clair?: boolean; position?: string };
  children: ReactNode;
  action?: { libelle: string; onClick: () => void; disabled?: boolean; couleur?: "rouge" | "papier" };
  actionSecondaire?: { libelle: string; onClick: () => void };
  pied?: ReactNode;
}) {
  const couleurs = {
    rouge: "bg-rouge text-papier hover:bg-rouge-sombre",
    papier: "bg-papier text-encre hover:bg-papier-2",
  };

  return (
    <section className="relative mx-auto flex min-h-dvh w-full max-w-[460px] flex-col bg-nuit text-papier sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
      <header className="absolute inset-x-0 top-0 z-20 flex flex-col gap-2 px-5 pt-3.5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {retour ? (
              <button
                type="button"
                onClick={retour}
                aria-label="Écran précédent"
                className="-ml-1 flex h-7 w-7 items-center justify-center text-papier"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M11 4 6 9l5 5" />
                </svg>
              </button>
            ) : null}
            <span className="font-mono text-[10px] tracking-[0.14em] text-ligne uppercase">
              {nature} · 43 ans
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.14em] text-ligne">
            {numero} / {total}
          </span>
        </div>
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-[3px] flex-1 ${i < numero ? "bg-papier" : "bg-papier/25"}`} />
          ))}
        </div>
      </header>

      {photo ? <Photo {...photo} /> : <div className="h-16" />}

      <div className={`relative z-10 flex grow flex-col gap-4 px-5 pb-5 sm:px-6 ${photo ? "-mt-14" : ""}`}>
        {children}
      </div>

      {action || actionSecondaire || pied ? (
        <footer className="relative z-10 flex flex-col gap-2.5 px-5 pb-5 sm:px-6">
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className={`px-4 py-4 text-center text-[17px] font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-encre-3 disabled:text-ligne ${
                couleurs[action.couleur ?? "rouge"]
              }`}
            >
              {action.libelle}
            </button>
          ) : null}
          {actionSecondaire ? (
            <button
              type="button"
              onClick={actionSecondaire.onClick}
              className="border-2 border-papier px-4 py-3.5 text-center text-[16px] font-semibold text-papier transition-colors hover:bg-nuit-2"
            >
              {actionSecondaire.libelle}
            </button>
          ) : null}
          {pied}
        </footer>
      ) : null}
    </section>
  );
}

/**
 * La photo en plein cadre, qui fond vers la nuit. Sans fichier, un cadre
 * sombre porte le numéro de la pièce à générer : la page ne casse pas.
 */
export function Photo({
  numero,
  pieces,
  hauteur,
  legende,
  clair = false,
  position = "50% 50%",
}: {
  numero: NumeroPiece;
  pieces: Pieces;
  hauteur: number;
  legende?: string;
  clair?: boolean;
  /** Où cadrer une photo plus haute que son cadre : « 50% 20% » garde le chapeau. */
  position?: string;
}) {
  const fichier = pieces[numero];
  const nom = PIECES[numero].nom;
  return (
    <div className="relative w-full shrink-0 overflow-hidden" style={{ height: hauteur }}>
      {fichier ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/${fichier}`}
          alt={nom}
          className={`h-full w-full object-cover ${clair ? "" : "saturate-[0.8] contrast-[1.05]"}`}
          style={{ objectPosition: position }}
          decoding="async"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-nuit-2">
          <span className="px-6 text-center font-mono text-[10px] leading-relaxed tracking-[0.12em] text-ligne">
            PIÈCE N° {String(numero).padStart(2, "0")}
            <br />
            {nom.toUpperCase()}
          </span>
        </div>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,21,28,0.6) 0%, rgba(15,21,28,0) 28%, rgba(15,21,28,0) 55%, #0f151c 100%)",
        }}
      />
      {legende ? (
        <span className="absolute bottom-16 left-5 font-mono text-[9px] tracking-[0.12em] text-ligne sm:left-6">{legende}</span>
      ) : null}
    </div>
  );
}

/** Ce que dit le commissaire. Il vouvoie, l'interface tutoie. */
export function Commissaire({ qui = "Le commissaire", children }: { qui?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-rouge-clair pl-3">
      <span className="font-mono text-[9.5px] tracking-[0.16em] text-rouge-clair uppercase">{qui}</span>
      <p className="text-[17px] leading-[1.4] text-papier italic">{children}</p>
    </div>
  );
}

/** Un document clair posé sur la nuit : la déposition, le PV, le jugement. */
export function Papier({
  children,
  rotation = 0,
  className = "",
}: {
  children: ReactNode;
  rotation?: number;
  className?: string;
}) {
  return (
    <div
      className={`papier-regle bg-papier text-encre shadow-[0_18px_40px_rgba(0,0,0,0.55)] ${className}`}
      style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
    >
      {children}
    </div>
  );
}

/** Le petit libellé en capitales mono au-dessus d'un bloc. */
export function Kicker({ children, couleur = "gris" }: { children: ReactNode; couleur?: "gris" | "rouge" | "encre" | "bleu" }) {
  const c = { gris: "text-ligne", rouge: "text-rouge-clair", encre: "text-encre-3", bleu: "text-bleu" }[couleur];
  return <span className={`font-mono text-[10px] tracking-[0.14em] uppercase ${c}`}>{children}</span>;
}

/** Le chiffre de la carte, celui qu'on retient. */
export function Chiffre({ children, couleur = "papier", taille = 52 }: { children: ReactNode; couleur?: "papier" | "rouge" | "bleu" | "encre"; taille?: number }) {
  const c = { papier: "text-papier", rouge: "text-rouge-clair", bleu: "text-bleu", encre: "text-encre" }[couleur];
  return (
    <span
      className={`chiffres montant-anime block font-mono leading-none font-semibold tracking-[-0.03em] ${c}`}
      style={{ fontSize: taille }}
    >
      {children}
    </span>
  );
}

/**
 * Le détail, au clic. Une ligne discrète en bas de carte, fermée par défaut :
 * rien de ce qu'elle contient ne se voit avant qu'on le demande.
 */
export function Volet({ titre, children, ouvertParDefaut = false }: { titre: string; children: ReactNode; ouvertParDefaut?: boolean }) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut);
  return (
    <div className="flex flex-col border-t border-papier/25">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-expanded={ouvert}
        className="flex w-full items-center justify-between py-3 text-left text-ligne"
      >
        <span className="text-[14.5px] underline underline-offset-[3px]">{titre}</span>
        <svg
          width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8"
          className={`transition-transform ${ouvert ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m4 7 5 5 5-5" />
        </svg>
      </button>
      {ouvert ? <div className="flex flex-col gap-3 pb-3">{children}</div> : null}
    </div>
  );
}

/** Une ligne « libellé, montant » d'un volet, sur la nuit. */
export function Ligne({
  libelle,
  sous,
  montant,
  eteinte = false,
  onClick,
}: {
  libelle: ReactNode;
  sous?: ReactNode;
  montant: ReactNode;
  eteinte?: boolean;
  onClick?: () => void;
}) {
  const contenu = (
    <>
      <span className="flex min-w-0 grow flex-col">
        <span className={`text-[15.5px] leading-snug ${eteinte ? "text-ligne" : "text-papier"}`}>{libelle}</span>
        {sous ? <span className="text-[12.5px] leading-snug text-ligne">{sous}</span> : null}
      </span>
      <span className={`chiffres shrink-0 font-mono text-[15px] font-semibold ${eteinte ? "text-ligne" : "text-papier"}`}>
        {montant}
      </span>
    </>
  );
  const classes = "flex w-full items-baseline justify-between gap-3 border-b border-papier/15 py-2.5 text-left last:border-0";
  return onClick ? (
    <button type="button" onClick={onClick} className={classes}>{contenu}</button>
  ) : (
    <div className={classes}>{contenu}</div>
  );
}

/** Un lien discret vers un détail ou une source. */
export function Lien({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a
      href={href}
      className="self-start text-[14px] text-ligne underline underline-offset-[3px]"
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

/** Une réponse au commissaire : une rangée qu'on tape. */
export function Reponse({
  actif,
  onClick,
  children,
  repere,
  centre = false,
}: {
  actif: boolean;
  onClick: () => void;
  children: ReactNode;
  repere?: ReactNode;
  centre?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={`flex min-h-[48px] items-center gap-3 px-3.5 py-2.5 text-left text-[16px] transition-colors ${
        centre ? "justify-center" : "justify-between"
      } ${actif ? "bg-papier text-encre" : "border-[1.5px] border-papier/45 text-papier hover:border-papier"}`}
    >
      <span>{children}</span>
      {repere ? (
        <span className={`shrink-0 font-mono text-[12px] ${actif ? "text-encre-3" : "text-ligne"}`}>{repere}</span>
      ) : null}
    </button>
  );
}
