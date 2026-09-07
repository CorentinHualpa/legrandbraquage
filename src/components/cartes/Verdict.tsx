"use client";

import { Carte, Chiffre, Kicker, Volet } from "./Carte";
import { Scelle } from "../papier";
import type { Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
import type { Perimetre, Simulation } from "@/lib/moteur";

/**
 * Écran 10 : le verdict.
 *
 * Le tampon, l'écart, les deux plateaux, le seuil. Le seuil est le chiffre
 * inédit de la page : personne ne le publie. Il peut ne pas exister (un
 * fonctionnaire d'État au périmètre complet), et c'est un résultat.
 */
export function Verdict({
  pieces,
  simulation,
  pivot,
  perimetre,
  numero,
  total,
  suivant,
  retour,
}: {
  pieces: Pieces;
  simulation: Simulation;
  pivot: number | null;
  perimetre: Perimetre;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
}) {
  const { plateauGauche, plateauDroit, verdict } = simulation;
  const fonctionnaire = simulation.entree.regime === "fonctionnaire";
  const sansEmployeur = ["tns", "cipav", "micro"].includes(simulation.entree.regime);
  const complet = Object.values(perimetre).every(Boolean);

  return (
    <Carte numero={numero} total={total} retour={retour} action={{ libelle: "Placarder mon avis de recherche", onClick: suivant }}>
      <Scelle numero={11} nom="Le prétoire, vide" ratio="16:9" fichier={pieces[11]} legende="CLICHÉ 11 · LE JUGE, C’EST TOI" rogneSurPetitEcran />

      <div className="flex justify-center pt-1">
        <div className={`tampon rounded-[5px] border-[3px] px-6 py-2.5 text-center ${verdict.braquage ? "border-rouge text-rouge" : "border-bleu text-bleu"}`}>
          <p className="font-mono text-[9px] tracking-[0.16em]">TRIBUNAL DES PRÉLÈVEMENTS</p>
          <p className="text-[40px] leading-[1.05] font-bold">{verdict.braquage ? "COUPABLE" : "RELAXE"}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="text-[18px] leading-snug">
          {verdict.braquage ? "Sur toute ta vie, ils t’auront pris" : "Sur toute ta vie, ils t’auront rendu"}
        </p>
        <Chiffre couleur={verdict.braquage ? "rouge" : "bleu"} taille={44}>{eurosSigne(verdict.ecart)}</Chiffre>
        <p className="text-[18px] leading-snug">
          {verdict.braquage ? "de plus qu’ils ne t’auront rendu." : "de plus qu’ils ne t’auront pris."}
        </p>
      </div>

      <div className="flex border-2 border-encre bg-papier-2">
        <div className="flex flex-1 flex-col gap-0.5 border-r border-ligne px-3.5 py-3">
          <Kicker couleur="rouge">Pris</Kicker>
          <span className="chiffres font-mono text-[18px] font-semibold text-rouge">{eurosSigne(plateauGauche.total)}</span>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 px-3.5 py-3 text-right">
          <Kicker couleur="bleu">Rendu</Kicker>
          <span className="chiffres font-mono text-[18px] font-semibold text-bleu">{eurosSigne(plateauDroit.total)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-ligne pt-3">
        <Kicker>Le seuil</Kicker>
        {pivot ? (
          <p className="text-[16.5px] leading-relaxed">
            En dessous de{" "}
            <span className="chiffres font-mono text-[20px] font-semibold">{euros(pivot)} €</span> par mois,
            la balance penche de ton côté. Au-dessus, du leur.
          </p>
        ) : (
          <p className="text-[16.5px] leading-relaxed">
            Il n’y en a pas : sur ce régime et ce périmètre, la balance ne penche de ton
            côté à <span className="font-semibold">aucun niveau de revenu</span>.
          </p>
        )}
      </div>

      <Volet titre="Pourquoi ?">
        {pivot ? (
          fonctionnaire ? (
            <p className="text-[14px] leading-relaxed text-encre-2">
              Ce seuil est très en dessous de celui d’un salarié du privé, et c’est la part
              employeur qui l’explique : la contribution au régime de pension pèse{" "}
              <span className="font-semibold text-encre">37,65 % du traitement</span> à la CNRACL,
              82,28 % pour l’État. Le Conseil d’orientation des retraites écrit lui-même que ces
              taux ne se comparent pas à ceux d’un employeur privé.
            </p>
          ) : sansEmployeur ? (
            <p className="text-[14px] leading-relaxed text-encre-2">
              Tu vois cent pour cent de ce que tu verses : personne ne prélève avant que tu te
              paies. C’est la fiche la plus honnête des cinq, et c’est ce qui rend le procès plus
              difficile que celui d’un salarié, à qui l’on cache la moitié du prélèvement.
            </p>
          ) : (
            <p className="text-[14px] leading-relaxed text-encre-2">
              Au SMIC, les cotisations patronales tombent à{" "}
              <span className="font-semibold text-encre">3,09 % du brut</span>, contre 43,05 % à dix
              mille euros. Le salaire net médian du privé est de{" "}
              <span className="font-semibold text-encre">2 190 €</span> (INSEE 2024, net avant impôt,
              comme le chiffre que tu as saisi). Personne ne publie ce seuil.
            </p>
          )
        ) : simulation.entree.versant === "fpe" && fonctionnaire ? (
          <p className="text-[14px] leading-relaxed text-encre-2">
            La contribution de l’État à son propre régime de pension pèse{" "}
            <span className="font-semibold text-encre">82,28 % du traitement indiciaire</span>. La
            compter comme un prélèvement subi condamne d’avance, et le Conseil d’orientation des
            retraites écrit que ce taux ne peut pas être comparé à la contribution d’un employeur
            privé. Décoche « ce que ton employeur public verse en plus », à l’écran 2, pour voir
            le procès sans elle.
          </p>
        ) : (
          <p className="text-[14px] leading-relaxed text-encre-2">
            Ce que l’employeur verse au régime de retraite l’emporte à tout niveau de revenu.
            Décoche cette ligne à l’écran 2 : c’est le même dossier, sans le chiffre qui décide
            de tout.
          </p>
        )}
        <p className="text-[13px] leading-relaxed text-encre-2">
          Le seuil dépend de ce que tu as coché à l’écran 2 et des paliers que tu as choisis :
          {complet ? " ici, tout est compté." : " ici, une ligne au moins est décochée."} Ce n’est
          pas un verdict sur toi, c’est un verdict sur le calcul.
        </p>
      </Volet>
    </Carte>
  );
}
