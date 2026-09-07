"use client";

import { Carte, Kicker } from "./Carte";
import { Scelle } from "../papier";
import type { Pieces } from "@/lib/images";

/**
 * Écran 5 : les braqueurs étaient de bonne foi.
 *
 * La seule carte sombre du parcours. Elle coupe le récit en deux, juste
 * avant qu'on demande à la personne ce qu'elle a reçu. En bas, en italique,
 * la phrase qui explique la redistribution et annonce les trois questions.
 * Demande de Coq, 07/09/2026 au soir.
 */
export function Intermede({
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
      sombre
      retour={retour}
      action={{ libelle: "Voir ce qu’ils m’auront laissé", onClick: suivant, couleur: "papier" }}
    >
      <Scelle numero={14} nom="Le mot du braqueur" ratio="4:3" fichier={pieces[14]} legende="CLICHÉ 14 · LE COFFRE, ROUVERT" />

      <div className="flex grow flex-col justify-center gap-5">
        <Kicker couleur="gris">Mais attention.</Kicker>
        <p className="text-[38px] leading-[1.08] font-bold tracking-[-0.02em]">
          Les braqueurs étaient de bonne foi.
        </p>
        <p className="text-[24px] leading-tight text-papier-2 italic">
          Ils t’ont laissé un petit quelque chose.
          <br />
          Ou pas.
        </p>
      </div>

      <p className="border-t border-encre-2 pt-3 text-[13.5px] leading-relaxed text-cadre-bord italic">
        C’est la fameuse « redistribution » : une partie de ce qu’ils t’auront
        pris revient, en école, en soins, en allocations, en retraite. Combien ?
        Ça dépend de ta vie. Les trois écrans suivants te la demandent, et le
        verdict change avec.
      </p>
    </Carte>
  );
}
