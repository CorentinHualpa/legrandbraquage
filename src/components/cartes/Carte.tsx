"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { PIECES, type NumeroPiece, type Pieces } from "@/lib/pieces";
import { frapper, jouer, reglerSons, sonsActifs } from "@/lib/sons";

/**
 * Ce que toutes les cartes savent faire, sans se le passer de main en main.
 * Vide par defaut : une carte rendue hors du parcours (un banc, un test) ne
 * casse pas, elle n'affiche simplement pas le bouton.
 */
export const ContexteDossier = createContext<{ recommencer?: () => void }>({});

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
  teteSurClair = false,
}: {
  numero: number;
  total: number;
  /** Ce qu'on lit à gauche du bandeau : « Déposition », « Interrogatoire · 1 sur 3 ». */
  nature: string;
  retour?: () => void;
  photo?: { numero: NumeroPiece; pieces: Pieces; hauteur: number; legende?: string; clair?: boolean; position?: string };
  children: ReactNode;
  action?: { libelle: string; onClick: () => void; disabled?: boolean; couleur?: "jaune" | "rouge" | "papier" };
  actionSecondaire?: { libelle: string; onClick: () => void };
  pied?: ReactNode;
  /**
   * Vrai quand la carte glisse un aplat clair SOUS le bandeau (l'écran du
   * butin). Le bandeau est en position absolue : sans ça, son texte gris
   * clair et sa jauge crème se posent sur du jaune et disparaissent.
   */
  teteSurClair?: boolean;
}) {
  const { recommencer } = useContext(ContexteDossier);
  const couleurs = {
    jaune: "bg-jaune-police text-encre hover:bg-jaune-sombre",
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
            <span className={`font-mono text-[10px] tracking-[0.14em] uppercase ${teteSurClair ? "text-encre/70" : "text-ligne"}`}>
              {nature} · 43 ans
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {recommencer ? <BoutonRecommencer surClair={teteSurClair} recommencer={recommencer} /> : null}
            <BoutonSon surClair={teteSurClair} />
            <span className={`font-mono text-[10px] tracking-[0.14em] ${teteSurClair ? "text-encre/70" : "text-ligne"}`}>
              {numero} / {total}
            </span>
          </div>
        </div>
        {/* La jauge en jaune de ruban : c'est elle qui porte la langue de la
            couverture sur toutes les cartes, y compris celles sans aplat. */}
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-[3px] flex-1 ${
                i < numero
                  ? teteSurClair ? "bg-encre" : "bg-jaune-police"
                  : teteSurClair ? "bg-encre/25" : "bg-papier/25"
              }`}
            />
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
                couleurs[action.couleur ?? "jaune"]
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
export function Commissaire({
  qui = "Le commissaire",
  couleur = "rouge",
  children,
}: {
  qui?: string;
  /** Le commissaire parle en rouge, l'avocat du Braqueur en bleu. */
  couleur?: "rouge" | "bleu";
  children: ReactNode;
}) {
  const c = couleur === "bleu" ? "border-[#7fa3cf] text-[#7fa3cf]" : "border-rouge-clair text-rouge-clair";
  return (
    <div className={`flex flex-col gap-1 border-l-2 pl-3 ${c}`}>
      <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase">{qui}</span>
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
export function Kicker({ children, couleur = "gris" }: { children: ReactNode; couleur?: "gris" | "jaune" | "rouge" | "encre" | "bleu" }) {
  /* Jaune = l'enquête pose une question. Rouge = elle annonce ce qui est pris. */
  const c = { gris: "text-ligne", jaune: "text-jaune-police", rouge: "text-rouge-clair", encre: "text-encre-3", bleu: "text-bleu" }[couleur];
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
/**
 * ⚠ TOUT lien d'une carte s'ouvre dans un ONGLET, y compris `/methode`.
 *
 * Il ne s'agit pas de confort : un lien qui remplace la page emporte le
 * dossier. L'adresse est bien tenue à jour à chaque écran, donc revenir en
 * arrière restaure la progression, mais le retour arrière est un geste que
 * personne ne fait après avoir cliqué pour comprendre un chiffre. Constaté le
 * 09/09/2026 : « j'ai cliqué pour en savoir plus sur les quatre lignes et j'ai
 * perdu ma page en cours ». Le lecteur veut un aparté, pas une sortie.
 */
export function Lien({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a
      href={href}
      className="self-start text-[14px] text-ligne underline underline-offset-[3px]"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

/** Une réponse au commissaire : une rangée qu'on tape. */
/**
 * Le vert et le rouge d'une réponse qui prend parti. Deux réponses de même
 * poids se distinguent d'abord par leur couleur, pas par leur libellé : c'est
 * ce qui permet de choisir sans lire (Coq, 08/09/2026).
 */
const TEINTE = {
  neutre: {
    repos: "border-papier/45 text-papier hover:border-papier",
    actif: "border-rouge bg-papier text-encre",
    coche: "#b8342a",
  },
  vert: {
    repos: "border-vert-clair/55 text-vert-clair hover:border-vert-clair",
    actif: "border-vert bg-papier text-vert",
    coche: "#24663f",
  },
  rouge: {
    repos: "border-rouge-clair/55 text-rouge-clair hover:border-rouge-clair",
    actif: "border-rouge bg-papier text-rouge-texte",
    coche: "#9c2b22",
  },
} as const;

export function Reponse({
  actif,
  onClick,
  children,
  repere,
  centre = false,
  teinte = "neutre",
}: {
  actif: boolean;
  onClick: () => void;
  children: ReactNode;
  repere?: ReactNode;
  centre?: boolean;
  teinte?: keyof typeof TEINTE;
}) {
  const t = TEINTE[teinte];
  return (
    <button
      type="button"
      onClick={() => {
        jouer("coche");
        // Le stylo coche, puis quelqu'un le saisit au clavier. La rafale est
        // différée dans `frapper` : deux clics rapprochés n'en font qu'une.
        frapper("court");
        onClick();
      }}
      aria-pressed={actif}
      className={`flex min-h-[48px] items-center gap-2.5 border-[1.5px] px-3.5 py-2.5 text-left text-[16px] transition-colors ${
        centre ? "justify-center" : "justify-between"
      } ${actif ? `${t.actif} font-medium shadow-[0_6px_16px_rgba(0,0,0,0.45)]` : t.repos}`}
    >
      <span className="flex items-center gap-2">
        {actif ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={t.coche} strokeWidth="2.2" aria-hidden className="shrink-0">
            <path d="m3 8.5 3.2 3L13 4.5" />
          </svg>
        ) : null}
        <span>{children}</span>
      </span>
      {repere ? (
        <span className={`shrink-0 font-mono text-[12px] ${actif ? "text-encre-3" : "text-ligne"}`}>{repere}</span>
      ) : null}
    </button>
  );
}

/**
 * L'INTERRUPTEUR DU SON, dans l'en-tête de chaque carte.
 *
 * ⚠ Il existe parce que la couverture n'est plus le seul chemin d'entrée. Un
 * lien partagé, une actualisation (l'adresse suit la progression depuis le
 * 09/09/2026) ou un lien vers la méthode reposent le visiteur au milieu du
 * dossier, où la question « garder le silence ou passer sur écoute » n'a jamais
 * été posée : il restait donc muet jusqu'à la fin, sans rien pour l'allumer, et
 * toutes les répliques du commissaire lui passaient à côté.
 *
 * Il ne se souvient de rien entre deux visites, et c'est voulu : un site qui
 * rouvre en faisant du bruit parce qu'on avait dit oui la veille se fait fermer.
 * Le geste est redemandé à chaque fois, ici ou sur la couverture.
 */
function BoutonSon({ surClair }: { surClair?: boolean }) {
  const [allume, setAllume] = useState(sonsActifs());
  const c = surClair ? "text-encre/70" : "text-ligne";
  return (
    <button
      type="button"
      onClick={() => {
        const suite = !allume;
        setAllume(suite);
        // Le clic EST le geste que le navigateur exige pour autoriser le son.
        reglerSons(suite);
        if (suite) jouer("coche");
      }}
      aria-label={allume ? "Couper le son" : "Passer sur écoute"}
      aria-pressed={allume}
      className={`flex h-7 w-7 items-center justify-center ${c}`}
    >
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 7h2.5L10 4v10L6.5 11H4z" />
        {allume ? (
          <>
            <path d="M12.5 6.5a3.5 3.5 0 0 1 0 5" />
            <path d="M14.5 4.5a6 6 0 0 1 0 9" />
          </>
        ) : (
          <path d="M12.5 6.5l4 5m0-5l-4 5" />
        )}
      </svg>
    </button>
  );
}

/**
 * RECOMMENCER, en deux temps.
 *
 * ⚠ Pas de `confirm()` : une boîte de dialogue du navigateur casse net
 * l'ambiance du dossier, et c'est le seul endroit du parcours où on verrait
 * l'interface de Chrome. Le bouton se transforme en question, un second clic
 * confirme, et un clic ailleurs annule au bout de quelques secondes.
 *
 * La confirmation n'est pas une politesse : un clic par mégarde jetterait
 * jusqu'à quinze cartes de réponses, et il n'y a pas de retour arrière.
 */
function BoutonRecommencer({ surClair, recommencer }: { surClair?: boolean; recommencer: () => void }) {
  const [demande, setDemande] = useState(false);
  const c = surClair ? "text-encre/70" : "text-ligne";

  useEffect(() => {
    if (!demande) return;
    const t = setTimeout(() => setDemande(false), 4_000);
    return () => clearTimeout(t);
  }, [demande]);

  if (demande) {
    return (
      <button
        type="button"
        onClick={recommencer}
        className={`font-mono text-[10px] tracking-[0.12em] uppercase ${surClair ? "text-rouge" : "text-rouge-clair"}`}
      >
        Tout effacer ?
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setDemande(true)}
      aria-label="Recommencer la simulation"
      className={`flex h-7 w-7 items-center justify-center ${c}`}
    >
      <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M15 9a6 6 0 1 1-1.8-4.3" />
        <path d="M15 2v3.5h-3.5" />
      </svg>
    </button>
  );
}
