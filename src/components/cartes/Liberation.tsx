"use client";

import { Carte, Commissaire, Kicker, Volet } from "./Carte";
import type { Pieces } from "@/lib/images";
import { dit } from "@/lib/repliques";
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
      {/*
        ⚠ LA CARTE DOIT SE LIRE DANS L'ORDRE : ce que la date VEUT DIRE, puis la
        date, puis la barre. Elle donnait l'inverse (« sur une année, vous
        travaillez pour eux du 1er janvier au » — 19 mai — 9 h 05 — une barre —
        deux pourcentages), et personne ne reconstruit une idée à partir d'un
        surtitre coupé en deux par un chiffre géant (Coq : « j'y comprends
        rien »). L'heure, surtout, arrivait sans qu'on sache qu'elle était la
        MINUTE de bascule et pas une heure de la journée.
      */}
      <Kicker couleur="rouge">La date de votre libération</Kicker>
      <p className="text-[16.5px] leading-snug text-papier">
        Chaque année, vous travaillez d’abord pour les braqueurs. Vous ne commencez à
        travailler pour vous qu’à partir du
      </p>
      <div className="flex flex-col">
        <span className="text-[52px] leading-none font-bold tracking-[-0.02em]">{liberation.jour.texte}</span>
        <span className="chiffres font-mono text-[30px] leading-tight font-semibold tracking-[-0.03em] text-ligne">
          {liberation.heureTexte}
        </span>
        <span className="pt-1 text-[13.5px] leading-snug text-ligne">
          à la minute près, et ça recommence le 1<sup>er</sup> janvier suivant.
        </span>
      </div>

      {/* La barre porte enfin ses deux moitiés en clair, dedans et pas dessous. */}
      <div className="flex flex-col gap-1.5">
        <div className="flex h-2.5 border border-papier">
          <div className="bg-rouge" style={{ width: `${partEux}%` }} />
        </div>
        <div className="flex justify-between gap-3">
          <Kicker couleur="rouge">
            {String(partEux).replace(".", ",")} % de l’année pour les braqueurs
          </Kicker>
          <Kicker>{String(partToi).replace(".", ",")} % pour vous</Kicker>
        </div>
      </div>

      <p className="text-[16px] leading-relaxed text-papier-2 italic">
        {liberation.part >= 0.5 ? "Plus de la moitié" : "Presque la moitié"} de ce que votre travail
        rapporte part chez les braqueurs avant que vous touchiez quoi que ce soit. Tous les ans, la même
        date, la même heure.
      </p>
      <Commissaire>{dit("liberation")}</Commissaire>

      <div className="grow" />

      <Volet titre="Comment on calcule ça ?">
        <p className="text-[14px] leading-relaxed text-ligne">
          C’est {pourcent(liberation.part, 1)} de ce que votre travail coûte en tout, part employeur comprise.
          Rapporté à ce qui arrive vraiment sur votre compte, la même somme vaut{" "}
          <span className="font-semibold text-papier">{liberation.partDuNet.toFixed(2).replace(".", ",")} € prélevés pour 1 € reçu</span>.
          Les deux chiffres sont exacts et ne racontent pas la même histoire :{" "}
          <a href="/methode" target="_blank" rel="noreferrer" className="underline underline-offset-2">la méthode dit quel dénominateur on a pris, et pourquoi</a>.
        </p>
      </Volet>
    </Carte>
  );
}
