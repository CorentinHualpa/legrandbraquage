"use client";

import { Carte, Commissaire, Papier, Volet } from "./Carte";
import type { Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
import type { Perimetre, Simulation } from "@/lib/moteur";

/**
 * Écran 12 : le verdict. Le tampon sur le papier, dans le prétoire.
 *
 * Le seuil est le chiffre inédit de la page : personne ne le publie. Il peut
 * ne pas exister (un fonctionnaire d'État au périmètre complet), et c'est un
 * résultat. Le commissaire le lâche en sortant.
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
    <Carte
      numero={numero}
      total={total}
      nature="Tribunal des prélèvements"
      retour={retour}
      photo={{ numero: 11, pieces, hauteur: 260, legende: "CLICHÉ 11 · LE JUGE, C’EST TOI" }}
      action={{ libelle: "Placarder l’avis de recherche", onClick: suivant }}
    >
      <Papier rotation={0.8} className="-mt-10 flex flex-col items-center gap-2.5 px-4 pt-4 pb-3.5 text-center">
        <div className={`tampon rounded-[5px] border-[3px] px-5 py-2 ${verdict.braquage ? "border-rouge text-rouge" : "border-bleu text-bleu"}`}>
          <p className="font-mono text-[8.5px] tracking-[0.16em]">TRIBUNAL DES PRÉLÈVEMENTS</p>
          <p className="text-[38px] leading-[1.05] font-extrabold">{verdict.braquage ? "COUPABLE" : "RELAXE"}</p>
        </div>
        <p className="text-[16px] leading-snug text-encre-2">
          {verdict.braquage ? "Sur toute ta vie, ils t’auront pris" : "Sur toute ta vie, ils t’auront rendu"}
        </p>
        <span className={`chiffres font-mono text-[40px] leading-none font-semibold tracking-[-0.03em] ${verdict.braquage ? "text-rouge" : "text-bleu"}`}>
          {eurosSigne(verdict.ecart)}
        </span>
        <p className="text-[16px] leading-snug text-encre-2">
          {verdict.braquage ? "de plus qu’ils ne t’auront rendu." : "de plus qu’ils ne t’auront pris."}
        </p>
        <div className="flex w-full justify-between border-t border-ligne pt-2">
          <span className="font-mono text-[10px] tracking-[0.1em] text-rouge-texte">PRIS {euros(plateauGauche.total)} €</span>
          <span className="font-mono text-[10px] tracking-[0.1em] text-bleu">RENDU {euros(plateauDroit.total)} €</span>
        </div>
      </Papier>

      <Commissaire qui="Le commissaire, en sortant">
        {pivot ? (
          <>« En dessous de {euros(pivot)} € par mois, vous seriez gagnant. Au-dessus, vous savez déjà. Ne me citez pas. »</>
        ) : (
          <>« Sur votre régime, il n’y a pas de seuil : ça penche de leur côté à tous les niveaux. Ne me citez pas. »</>
        )}
      </Commissaire>

      <div className="grow" />

      <Volet titre="Pourquoi ce seuil ?">
        {pivot ? (
          fonctionnaire ? (
            <p className="text-[14px] leading-relaxed text-ligne">
              Ce seuil est très en dessous de celui d’un salarié du privé, et c’est la part employeur qui
              l’explique : la contribution au régime de pension pèse{" "}
              <span className="font-semibold text-papier">37,65 % du traitement</span> à la CNRACL, 82,28 % pour
              l’État. Le Conseil d’orientation des retraites écrit lui-même que ces taux ne se comparent pas à
              ceux d’un employeur privé.
            </p>
          ) : sansEmployeur ? (
            <p className="text-[14px] leading-relaxed text-ligne">
              Tu vois cent pour cent de ce que tu verses : personne ne prélève avant que tu te paies. C’est la
              fiche la plus honnête des cinq, et c’est ce qui rend le procès plus difficile que celui d’un
              salarié, à qui l’on cache la moitié du prélèvement.
            </p>
          ) : (
            <p className="text-[14px] leading-relaxed text-ligne">
              Au SMIC, les cotisations patronales tombent à{" "}
              <span className="font-semibold text-papier">3,09 % du brut</span>, contre 43,05 % à dix mille euros.
              Le salaire net médian du privé est de <span className="font-semibold text-papier">2 190 €</span>{" "}
              (INSEE 2024, net avant impôt, comme le chiffre que tu as donné). Personne ne publie ce seuil.
            </p>
          )
        ) : simulation.entree.versant === "fpe" && fonctionnaire ? (
          <p className="text-[14px] leading-relaxed text-ligne">
            La contribution de l’État à son propre régime de pension pèse{" "}
            <span className="font-semibold text-papier">82,28 % du traitement indiciaire</span>. La compter comme
            un prélèvement subi condamne d’avance, et le Conseil d’orientation des retraites écrit que ce taux ne
            peut pas être comparé à la contribution d’un employeur privé. Décoche « ce que ton employeur public
            verse en plus », à la pièce à conviction, pour voir le procès sans elle.
          </p>
        ) : (
          <p className="text-[14px] leading-relaxed text-ligne">
            Ce que l’employeur verse au régime de retraite l’emporte à tout niveau de revenu. Décoche cette ligne
            à la pièce à conviction : c’est le même dossier, sans le chiffre qui décide de tout.
          </p>
        )}
        <p className="text-[13px] leading-relaxed text-ligne">
          Le seuil dépend de ce que tu as coché et de tes réponses au commissaire :
          {complet ? " ici, tout est compté." : " ici, une ligne au moins est décochée."} Ce n’est pas un verdict
          sur toi, c’est un verdict sur le calcul.
        </p>
      </Volet>
    </Carte>
  );
}
