"use client";

import { Carte, Commissaire, Papier, Volet } from "./Carte";
import { taux } from "./Bourse";
import type { Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
import { CRANS_RENDEMENT, type Perimetre, type Simulation } from "@/lib/moteur";

/**
 * Écran 12 : le verdict. Le tampon sur le papier, dans le prétoire.
 *
 * Il se juge sur le COÛT D'OPPORTUNITÉ : ce que le prélèvement serait devenu,
 * placé là où la personne l'a dit, contre ce qui a été rendu. Le seuil est
 * le chiffre inédit de la page ; il peut ne pas exister (avec un placement
 * en actions, la balance penche du même côté à tout niveau), et c'est un
 * résultat. Le commissaire le lâche en sortant.
 */
export function Verdict({
  pieces,
  simulation,
  pivot,
  perimetre,
  placementId,
  numero,
  total,
  suivant,
  retour,
}: {
  pieces: Pieces;
  simulation: Simulation;
  pivot: number | null;
  perimetre: Perimetre;
  placementId: string;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
}) {
  const { plateauDroit, verdict, opportunite } = simulation;
  const cran = CRANS_RENDEMENT.find((c) => c.id === placementId) ?? CRANS_RENDEMENT[0];
  const capital = opportunite?.capital ?? simulation.plateauGauche.total;
  const fonctionnaire = simulation.entree.regime === "fonctionnaire";
  const complet = Object.values(perimetre).every(Boolean);

  return (
    <Carte
      numero={numero}
      total={total}
      nature="Tribunal des prélèvements"
      retour={retour}
      photo={{ numero: 24, pieces, hauteur: 300, legende: "CLICHÉ 24 · IL SORT", position: "50% 30%" }}
      action={{ libelle: "Placarder l’avis de recherche", onClick: suivant }}
    >
      <Papier rotation={0.8} className="-mt-10 flex flex-col items-center gap-2.5 px-4 pt-4 pb-3.5 text-center">
        <div className={`tampon rounded-[5px] border-[3px] px-5 py-2 ${verdict.braquage ? "border-rouge text-rouge" : "border-bleu text-bleu"}`}>
          <p className="font-mono text-[8.5px] tracking-[0.16em]">TRIBUNAL DES PRÉLÈVEMENTS</p>
          <p className="text-[38px] leading-[1.05] font-extrabold">{verdict.braquage ? "COUPABLE" : "RELAXE"}</p>
        </div>
        <p className="text-[15.5px] leading-snug text-encre-2">
          Placé en {cran.nom} à {taux(cran.reel)}, votre argent aurait fait {eurosSigne(capital)}.
          Ils vous auront rendu {eurosSigne(plateauDroit.total)}.
        </p>
        <span className={`chiffres font-mono text-[40px] leading-none font-semibold tracking-[-0.03em] ${verdict.braquage ? "text-rouge" : "text-bleu"}`}>
          {eurosSigne(verdict.ecart)}
        </span>
        <p className="text-[16px] leading-snug text-encre-2">
          {verdict.braquage ? "de manque à gagner, pour vous." : "de mieux, grâce à eux."}
        </p>
        <div className="flex w-full justify-between border-t border-ligne pt-2">
          <span className="font-mono text-[10px] tracking-[0.1em] text-rouge-texte">PLACÉ {euros(capital)} €</span>
          <span className="font-mono text-[10px] tracking-[0.1em] text-bleu">RENDU {euros(plateauDroit.total)} €</span>
        </div>
      </Papier>

      <Commissaire qui="Le commissaire, en sortant">
        {pivot ? (
          <>« En dessous de {euros(pivot)} € par mois, vous seriez gagnant. Au-dessus, vous savez déjà. Ne me citez pas. »</>
        ) : verdict.braquage ? (
          <>« Avec ce placement, il n’y a pas de seuil : ça penche de leur côté à tous les niveaux de revenu. Ne me citez pas. »</>
        ) : (
          <>« Avec ce placement, il n’y a pas de seuil : ça penche de votre côté à tous les niveaux de revenu. Vous pouvez me citer. »</>
        )}
      </Commissaire>

      <div className="grow" />

      <Volet titre="Pourquoi ce verdict ?">
        <p className="text-[14px] leading-relaxed text-ligne">
          Chaque année de votre carrière, ce qui vous a été pris (au périmètre coché à la pièce à conviction)
          est placé à {taux(cran.reel)} par an, en réel, frais compris, jusqu’à 64 ans. Le capital
          obtenu est comparé à ce qu’ils vous auront rendu : votre retraite jusqu’à 85 ans, l’école, les soins
          et le chômage tels que vous les avez déclarés. Changez d’enveloppe, le verdict change.
        </p>
        {fonctionnaire ? (
          <p className="text-[14px] leading-relaxed text-ligne">
            Chez un fonctionnaire, c’est la part employeur qui pèse : la contribution au régime de pension
            vaut <span className="font-semibold text-papier">37,65 % du traitement</span> à la CNRACL,
            82,28 % pour l’État, et le Conseil d’orientation des retraites écrit lui-même que ces taux ne
            se comparent pas à ceux d’un employeur privé. Décochez cette ligne à la pièce à conviction pour
            voir le procès sans elle.
          </p>
        ) : null}
        <p className="text-[13px] leading-relaxed text-ligne">
          Le seuil dépend de ce que vous avez coché, de vos réponses au commissaire et de l’enveloppe :
          {complet ? " ici, tout est compté." : " ici, une ligne au moins est décochée."} Le salaire net
          médian du privé est de 2 190 € (INSEE 2024, net avant impôt). Ce n’est pas un verdict sur vous,
          c’est un verdict sur le calcul.
        </p>
      </Volet>
    </Carte>
  );
}
