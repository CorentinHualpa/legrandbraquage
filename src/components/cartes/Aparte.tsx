"use client";

import { Carte, Commissaire, Kicker } from "./Carte";
import type { Pieces } from "@/lib/images";
import { APARTE, dit } from "@/lib/repliques";

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
      photo={{ numero: 22, pieces, hauteur: 320, legende: "CLICHÉ 22 · ELLE DEMANDE LA PAROLE", position: "50% 25%" }}
      action={{ libelle: "Répondre à ses questions", onClick: suivant, couleur: "papier" }}
    >
      <Kicker couleur="bleu">L’avocate du Braqueur se lève.</Kicker>
      {/* Les deux phrases viennent de la source commune : c'est aussi ce qu'il DIT. */}
      <p className="text-[36px] leading-[1.08] font-bold tracking-[-0.02em]">« {APARTE.fort} »</p>
      <p className="text-[22px] leading-[1.3] text-papier-2 italic">« {APARTE.suite} »</p>

      {/* Il cède la parole : trois mots, mais c'est eux qui font la scène. */}
      <Commissaire>{dit("aparte-concede")}</Commissaire>

      <div className="grow" />

      <p className="border-t border-papier/25 pt-3 text-[13.5px] leading-relaxed text-ligne italic">
        C’est la fameuse « redistribution » : une partie de ce qu’ils vous auront pris revient, en école, en
        soins, en allocations, en retraite. L’avocate va vous poser trois questions, et le verdict
        change avec.
      </p>
    </Carte>
  );
}
