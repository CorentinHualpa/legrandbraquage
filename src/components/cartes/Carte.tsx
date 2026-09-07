"use client";

import { useState, type ReactNode } from "react";

/**
 * Une carte du parcours : un écran, un chiffre.
 *
 * Le bandeau du haut rappelle sur CHAQUE carte qu'on rejoue une carrière
 * entière : c'est ce qui rend le futur antérieur lisible (« ils t'auront
 * pris ») et ce qui empêche de lire un total de quarante-trois ans comme un
 * prélèvement de l'année. Retour de Coq, 07/09/2026 : « il faut vraiment
 * tourner ça pour que ce soit clair que c'est une simulation sur 43 ans ».
 *
 * La carte prend toute la hauteur du téléphone. Le corps défile si un volet
 * s'ouvre, le bouton d'action reste posé en bas.
 */
export function Carte({
  numero,
  total,
  sombre = false,
  retour,
  children,
  action,
  actionSecondaire,
  pied,
}: {
  numero: number;
  total: number;
  /** L'intermède est la seule carte sombre du parcours. */
  sombre?: boolean;
  retour?: () => void;
  children: ReactNode;
  action?: { libelle: string; onClick: () => void; disabled?: boolean; couleur?: "rouge" | "bleu" | "papier" };
  actionSecondaire?: { libelle: string; onClick: () => void };
  pied?: ReactNode;
}) {
  const encre = sombre ? "text-papier" : "text-encre";
  const couleurs = {
    rouge: "bg-rouge text-papier hover:bg-rouge-sombre",
    bleu: "bg-bleu text-papier hover:bg-encre",
    papier: "bg-papier text-encre hover:bg-papier-2",
  };

  return (
    <section
      className={`relative mx-auto flex min-h-dvh w-full max-w-[460px] flex-col ${
        sombre ? "bg-encre text-papier" : "papier-regle bg-papier text-encre"
      } sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:border-2 sm:border-encre`}
    >
      <header className="flex flex-col gap-2 px-5 pt-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {retour ? (
              <button
                type="button"
                onClick={retour}
                aria-label="Écran précédent"
                className={`-ml-1 flex h-7 w-7 items-center justify-center ${encre}`}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M11 4 6 9l5 5" />
                </svg>
              </button>
            ) : null}
            <span className={`font-mono text-[10px] tracking-[0.14em] ${sombre ? "text-ligne" : "text-encre-3"}`}>
              SIMULATION · 43 ANS DE CARRIÈRE
            </span>
          </div>
          <span className={`font-mono text-[10px] tracking-[0.14em] ${sombre ? "text-ligne" : "text-encre-3"}`}>
            {numero} / {total}
          </span>
        </div>
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-[3px] flex-1 ${
                i < numero
                  ? sombre ? "bg-papier" : "bg-encre"
                  : sombre ? "bg-encre-3" : "bg-ligne"
              }`}
            />
          ))}
        </div>
      </header>

      <div className="flex grow flex-col gap-5 px-5 pt-5 pb-5 sm:px-6">{children}</div>

      {action || actionSecondaire || pied ? (
        <footer className="flex flex-col gap-2.5 px-5 pb-5 sm:px-6">
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className={`px-4 py-4 text-center text-[17px] font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-cadre-bord disabled:text-encre-3 ${
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
              className={`border-2 px-4 py-3.5 text-center text-[16px] font-semibold transition-colors ${
                sombre ? "border-papier text-papier hover:bg-encre-2" : "border-encre text-encre hover:bg-papier-2"
              }`}
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

/** Le petit libellé en capitales mono au-dessus d'un bloc. */
export function Kicker({ children, couleur = "gris" }: { children: ReactNode; couleur?: "gris" | "rouge" | "bleu" | "encre" }) {
  const c = { gris: "text-encre-3", rouge: "text-rouge-texte", bleu: "text-bleu", encre: "text-encre" }[couleur];
  return <span className={`font-mono text-[10px] tracking-[0.14em] uppercase ${c}`}>{children}</span>;
}

/** La question de la carte, en gros. */
export function Question({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[32px] leading-[1.08] font-bold tracking-[-0.02em]">{children}</h1>
  );
}

/** Le chiffre de la carte, celui qu'on retient. */
export function Chiffre({ children, couleur = "rouge", taille = 52 }: { children: ReactNode; couleur?: "rouge" | "bleu" | "encre"; taille?: number }) {
  const c = { rouge: "text-rouge", bleu: "text-bleu", encre: "text-encre" }[couleur];
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
 * Le détail, au clic. Fermé par défaut : rien de ce qu'il contient ne se voit
 * avant qu'on le demande. C'est la règle du parcours, un chiffre par écran.
 */
export function Volet({
  titre,
  couleur = "encre",
  ouvertParDefaut = false,
  children,
}: {
  titre: string;
  couleur?: "encre" | "bleu";
  ouvertParDefaut?: boolean;
  children: ReactNode;
}) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut);
  const bord = couleur === "bleu" ? "border-bleu" : "border-encre";
  const texte = couleur === "bleu" ? "text-bleu" : "text-encre";
  return (
    <div className={`-mx-5 border-t-2 bg-papier-2 sm:-mx-6 ${bord}`}>
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-expanded={ouvert}
        className={`flex w-full items-center justify-between px-5 py-3.5 text-left sm:px-6 ${texte}`}
      >
        <span className="font-mono text-[11px] tracking-[0.14em] uppercase">{titre}</span>
        <svg
          width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8"
          className={`transition-transform ${ouvert ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m4 7 5 5 5-5" />
        </svg>
      </button>
      {ouvert ? <div className="flex flex-col gap-3 px-5 pb-5 sm:px-6">{children}</div> : null}
    </div>
  );
}

/** Une ligne « libellé, montant » d'un volet. */
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
        <span className={`text-[15.5px] leading-snug ${eteinte ? "text-encre-3" : "text-encre"}`}>{libelle}</span>
        {sous ? <span className="text-[12.5px] leading-snug text-encre-3">{sous}</span> : null}
      </span>
      <span className={`chiffres shrink-0 font-mono text-[15px] font-semibold ${eteinte ? "text-encre-3" : "text-encre"}`}>
        {montant}
      </span>
    </>
  );
  const classes = "flex w-full items-baseline justify-between gap-3 border-b border-ligne py-2.5 text-left last:border-0";
  return onClick ? (
    <button type="button" onClick={onClick} className={classes}>{contenu}</button>
  ) : (
    <div className={classes}>{contenu}</div>
  );
}

/** Un lien discret vers un détail ou une source. */
export function Lien({ children, href, onClick }: { children: ReactNode; href?: string; onClick?: () => void }) {
  const classes = "self-start text-[14px] text-bleu underline underline-offset-2";
  if (href) {
    return (
      <a href={href} className={classes} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>{children}</button>
  );
}

/** Une pastille de choix, dans une rangée ou une grille. */
export function Pastille({
  actif,
  onClick,
  children,
  large = false,
}: {
  actif: boolean;
  onClick: () => void;
  children: ReactNode;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={`min-h-[44px] px-3 py-2.5 text-[15px] transition-colors ${large ? "text-left" : "text-center"} ${
        actif ? "bg-encre font-medium text-papier" : "border border-cadre-bord text-encre hover:border-encre"
      }`}
    >
      {children}
    </button>
  );
}
