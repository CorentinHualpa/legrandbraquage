"use client";

import { Carte, Kicker } from "./Carte";
import type { Pieces } from "@/lib/images";

/**
 * Écran 7 : l'aparté. Le commissaire baisse la voix.
 *
 * C'est la carte qui coupe le récit en deux, juste avant qu'il pose ses
 * trois questions. En bas, en italique, la phrase qui explique la
 * redistribution. Demande de Coq, 07/09/2026 au soir.
 */
export function Aparte({
  pieces,
  numero,
  total,
  suivant,
  retour,
}: {
  pieces: Pieces;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
}) {
  return (
    <Carte
      numero={numero}
      total={total}
      nature="Aparté"
      retour={retour}
      photo={{ numero: 22, pieces, hauteur: 320, legende: "CLICHÉ 22 · IL SE PENCHE", position: "50% 25%" }}
      action={{ libelle: "Répondre à ses questions", onClick: suivant, couleur: "papier" }}
    >
      <Kicker couleur="rouge">Le commissaire baisse la voix.</Kicker>
      <p className="text-[36px] leading-[1.08] font-bold tracking-[-0.02em]">
        « Entre nous… ils étaient de bonne foi. »
      </p>
      <p className="text-[22px] leading-[1.3] text-papier-2 italic">
        « Ils vous ont laissé un petit quelque chose dans le coffre. Ou pas. Ça dépend, en fait. »
      </p>

      <div className="grow" />

      <p className="border-t border-papier/25 pt-3 text-[13.5px] leading-relaxed text-ligne italic">
        C’est la fameuse « redistribution » : une partie de ce qu’ils vous auront pris revient, en école, en
        soins, en allocations, en retraite. Le commissaire va vous poser trois questions, et le verdict
        change avec.
      </p>
    </Carte>
  );
}
