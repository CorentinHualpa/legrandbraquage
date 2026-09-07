"use client";

import { Carte, Commissaire, Kicker, Volet } from "./Carte";
import type { Pieces } from "@/lib/images";
import { pourcent } from "@/lib/format";
import { heureDeLiberation, type Simulation } from "@/lib/moteur";

/**
 * Écran 6 : l'horaire du braquage. Chaque année, tu auras travaillé pour
 * eux jusqu'au… La date et l'heure sont le chiffre de la carte. Le
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
    <Carte
      numero={numero}
      total={total}
      nature="L’horaire du braquage"
      retour={retour}
      photo={{ numero: 21, pieces, hauteur: 300, legende: "CLICHÉ 21 · IL REGARDE SA MONTRE" }}
      action={{ libelle: "Suivant", onClick: suivant }}
    >
      <Kicker couleur="rouge">Sur une année, vous travaillez pour eux du 1er janvier au</Kicker>
      <span className="text-[52px] leading-none font-bold tracking-[-0.02em]">{liberation.jour.texte}</span>
      <span className="chiffres -mt-1 font-mono text-[30px] leading-tight font-semibold tracking-[-0.03em] text-ligne">
        {liberation.heureTexte}
      </span>

      <div className="flex flex-col gap-1.5">
        <div className="flex h-2.5 border border-papier">
          <div className="bg-rouge" style={{ width: `${partEux}%` }} />
        </div>
        <div className="flex justify-between">
          <Kicker couleur="rouge">{String(partEux).replace(".", ",")} % pour eux</Kicker>
          <Kicker>{String(partToi).replace(".", ",")} % pour vous</Kicker>
        </div>
      </div>

      <p className="text-[16px] leading-relaxed text-papier-2 italic">
        Tout ce que votre travail rapporte jusqu’à cette date part chez eux. À partir de là seulement, vous
        travaillez pour vous. {liberation.part >= 0.5 ? "Plus de la moitié" : "Presque la moitié"} de l’année, chaque année.
      </p>
      <Commissaire>
        « Regardez votre montre. Vous, vous bossez depuis janvier. Eux, ils encaissent depuis janvier. Et
        ils s’arrêtent pile à cette heure-là, chaque année. Réglés comme une horloge. »
      </Commissaire>

      <div className="grow" />

      <Volet titre="Comment on calcule ça ?">
        <p className="text-[14px] leading-relaxed text-ligne">
          C’est {pourcent(liberation.part, 1)} de ce que votre travail coûte en tout, part employeur comprise.
          Rapporté à ce qui arrive vraiment sur votre compte, la même somme vaut{" "}
          <span className="font-semibold text-papier">{liberation.partDuNet.toFixed(2).replace(".", ",")} € prélevés pour 1 € reçu</span>.
          Les deux chiffres sont exacts et ne racontent pas la même histoire :{" "}
          <a href="/methode" className="underline underline-offset-2">la méthode dit quel dénominateur on a pris, et pourquoi</a>.
        </p>
      </Volet>
    </Carte>
  );
}
