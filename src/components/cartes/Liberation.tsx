"use client";

import { Carte, Kicker, Volet } from "./Carte";
import { Scelle } from "../papier";
import type { Pieces } from "@/lib/images";
import { pourcent } from "@/lib/format";
import { heureDeLiberation, type Simulation } from "@/lib/moteur";

/**
 * Écran 4 : chaque année, tu auras travaillé pour eux jusqu'au…
 *
 * La date et l'heure sont le chiffre de la carte. La barre dit la part. Le
 * dénominateur, qui décide de tout, est expliqué au clic.
 */
export function Liberation({
  pieces,
  simulation,
  numero,
  total,
  suivant,
  retour,
}: {
  pieces: Pieces;
  simulation: Simulation;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
}) {
  const liberation = heureDeLiberation(simulation);
  const partEux = Math.round(liberation.part * 1000) / 10;
  const partToi = Math.round((100 - partEux) * 10) / 10;

  return (
    <Carte numero={numero} total={total} retour={retour} action={{ libelle: "Suivant", onClick: suivant }}>
      <Scelle numero={10} nom="Le distributeur sous scellés" ratio="16:9" fichier={pieces[10]} legende="CLICHÉ 10 · LE GUICHET, LA NUIT" />

      <p className="text-[24px] leading-tight font-medium">
        Chaque année, tu auras travaillé pour eux jusqu’au
      </p>

      <div className="flex flex-col gap-1">
        <span className="text-[50px] leading-none font-bold tracking-[-0.02em] text-rouge">
          {liberation.jour.texte}
        </span>
        <span className="chiffres font-mono text-[34px] leading-tight font-semibold tracking-[-0.03em] text-rouge">
          {liberation.heureTexte}
        </span>
      </div>

      <p className="text-[17px] leading-relaxed text-encre-2 italic">
        Du 1er janvier jusqu’à cette heure-là, tout ce que ton travail rapporte
        part chez eux. Le reste de l’année est à toi.
      </p>

      <div className="flex flex-col gap-2 border-2 border-encre bg-papier-2 px-4 py-3.5">
        <div className="flex h-3.5 border border-encre">
          <div className="bg-rouge" style={{ width: `${partEux}%` }} />
          <div className="grow bg-papier" />
        </div>
        <div className="flex justify-between">
          <Kicker couleur="rouge">{String(partEux).replace(".", ",")} % pour eux</Kicker>
          <Kicker>{String(partToi).replace(".", ",")} % pour toi</Kicker>
        </div>
      </div>

      <Volet titre="Comment on calcule ça ?">
        <p className="text-[14.5px] leading-relaxed text-encre-2">
          C’est {pourcent(liberation.part, 1)} de ce que ton travail coûte en tout,
          part employeur comprise. Rapporté à ce qui arrive vraiment sur ton
          compte, la même somme vaut{" "}
          <span className="font-semibold text-encre">
            {liberation.partDuNet.toFixed(2).replace(".", ",")} € prélevés pour 1 € reçu
          </span>
          . Les deux chiffres sont exacts. Ils ne racontent pas la même histoire,
          et c’est le dénominateur qui décide :{" "}
          <a href="/methode" className="text-bleu underline underline-offset-2">la méthode dit lequel on a pris, et pourquoi</a>.
        </p>
      </Volet>
    </Carte>
  );
}
