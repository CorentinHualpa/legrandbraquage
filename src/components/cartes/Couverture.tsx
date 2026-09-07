"use client";

import type { Pieces } from "@/lib/images";

/**
 * Écran 1 : la scène de crime, le ruban, le titre.
 *
 * Pas de bandeau, pas de compteur : on n'est pas encore dans le dossier. La
 * photo de l'effraction en plein cadre, deux rubans de police posés de
 * travers, et le titre en bas, comme une affiche. Couverture B des maquettes
 * du 08/09/2026, choisie par Coq.
 */
export function Couverture({ pieces, porterPlainte }: { pieces: Pieces; porterPlainte: () => void }) {
  const fichier = pieces[9];
  return (
    <section className="relative mx-auto flex min-h-dvh w-full max-w-[460px] flex-col overflow-hidden bg-nuit text-papier sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
      {fichier ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/${fichier}`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover saturate-[0.7] brightness-[0.6]"
          decoding="async"
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(15,21,28,0.15) 0%, rgba(15,21,28,0) 40%, rgba(15,21,28,0.97) 100%)" }}
      />

      {/* Les rubans dépassent des deux côtés, exprès : ils ne sont pas cadrés. */}
      <div aria-hidden className="absolute -inset-x-10 top-[19%] -rotate-[8deg]">
        <Ruban>SCÈNE DE CRIME · NE PAS FRANCHIR · SCÈNE DE CRIME · NE PAS FRANCHIR</Ruban>
      </div>
      <div aria-hidden className="absolute -inset-x-10 top-[26%] rotate-[5deg]">
        <Ruban>POLICE DES PRÉLÈVEMENTS · POLICE DES PRÉLÈVEMENTS · POLICE DES PRÉLÈVEMENTS</Ruban>
      </div>

      <div className="relative z-10 mt-auto flex flex-col gap-4 px-5 pb-5 sm:px-6">
        <span className="font-mono text-[10px] tracking-[0.16em] text-jaune-police">DÉPÔT DE PLAINTE · 2026</span>
        <h1 className="text-[56px] leading-[0.95] font-extrabold tracking-[-0.02em]">
          VOUS AVEZ ÉTÉ BRAQUÉS.
        </h1>
        <p className="text-[17px] leading-[1.4] text-papier-2 italic">
          Chaque mois, quelqu’un passe chez vous avant vous. Il a une clé. Il a le droit.
        </p>
        <button
          type="button"
          onClick={porterPlainte}
          className="bg-rouge px-4 py-4 text-center text-[17px] font-semibold text-papier transition-colors hover:bg-rouge-sombre"
        >
          Porter plainte
        </button>
        <p className="text-center text-[12.5px] text-ligne">
          Rien n’est enregistré. Tout se calcule dans ton téléphone.{" "}
          <a href="/methode" className="underline underline-offset-2">La méthode.</a>
        </p>
      </div>
    </section>
  );
}

function Ruban({ children }: { children: string }) {
  return (
    <div className="ruban flex h-[26px] items-center justify-center overflow-hidden">
      <span className="bg-nuit-2 px-2.5 py-0.5 font-mono text-[9.5px] tracking-[0.2em] whitespace-nowrap text-jaune-police">
        {children}
      </span>
    </div>
  );
}
