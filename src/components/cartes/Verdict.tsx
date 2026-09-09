"use client";

import { Carte, Commissaire, Papier, Volet } from "./Carte";
import { taux } from "./Bourse";
import type { Cadeau } from "@/lib/lien";
import type { Pieces } from "@/lib/images";
import { dit } from "@/lib/repliques";
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
/**
 * Ce que le commissaire ressort de la réponse donnée sur l'écran du butin.
 * C'est tout l'intérêt de la question : sur le moment elle ne coûte rien, ici
 * elle est confrontée au chiffre.
 */
const RAPPEL: Record<"partage" | "picotte", string> = {
  partage:
    "« Vous m’avez dit que ça faisait toujours plaisir de partager. Je vous ai chiffré le plaisir. »",
  picotte: "« Vous m’aviez dit que ça picottait un peu. Vous aviez le bon mot, et le mauvais ordre de grandeur. »",
};

export function Verdict({
  pieces,
  simulation,
  pivot,
  perimetre,
  placementId,
  cadeau,
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
  cadeau: Cadeau;
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
      nature="Le verdict"
      retour={retour}
      photo={{ numero: 24, pieces, hauteur: 300, legende: "CLICHÉ 24 · IL SORT", position: "50% 30%" }}
      action={{ libelle: "Placarder l’avis de recherche", onClick: suivant }}
    >
      {/* Le flash : il tombe sur le verdict, une seule fois, et s’efface. */}
      <div aria-hidden className="flash-verdict pointer-events-none fixed inset-0 z-30 bg-papier" />

      {/*
        ⚠ LE TAMPON DOIT DIRE QUI EST COUPABLE. Un aplat rouge « COUPABLE » sur
        l'écran de quelqu'un qui vient de raconter sa vie se lit comme un
        verdict sur LUI : c'est le contresens le plus cher du parcours, et il
        arrive sur la carte qui porte la conclusion. La ligne du dessous nomme
        l'accusé, elle n'est pas décorative.

        Le titre du tribunal était écrit deux fois, dans le bandeau et dans le
        tampon. Une seule suffit, et c'est celle du tampon qui compte.
      */}
      <Papier rotation={0.8} className="-mt-10 flex flex-col items-center gap-2.5 px-4 pt-4 pb-3.5 text-center">
        <div className={`tampon rounded-[5px] border-[3px] px-5 py-2 ${verdict.braquage ? "border-rouge text-rouge" : "border-bleu text-bleu"}`}>
          <p className="font-mono text-[8.5px] tracking-[0.16em]">TRIBUNAL DES PRÉLÈVEMENTS</p>
          <p className="text-[38px] leading-[1.05] font-extrabold">{verdict.braquage ? "COUPABLE" : "RELAXE"}</p>
        </div>
        <p className="font-mono text-[10px] tracking-[0.12em] text-encre-3 uppercase">
          {verdict.braquage ? "Les prélèvements, sur votre cas" : "Les prélèvements, sur votre cas · non retenu"}
        </p>

        {/*
          Le calcul est POSÉ, en soustraction, au lieu d'être raconté en prose.
          Les deux montants ne sont pas comparables de tête (l'un est un capital
          sur quarante-trois ans, l'autre une somme de prestations) : les mettre
          l'un sous l'autre avec un trait fait le travail qu'une phrase ne
          faisait pas.
        */}
        <div className="flex w-full flex-col gap-1 pt-0.5 text-left">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13.5px] leading-tight text-encre-2">
              Ce que les {eurosSigne(simulation.plateauGauche.total)} pris vous auraient rapporté,
              placés en {cran.nom} à {taux(cran.reel)}
            </span>
            <span className="chiffres shrink-0 font-mono text-[14px] font-semibold text-encre">{euros(capital)} €</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-encre pb-1.5">
            <span className="text-[13.5px] leading-tight text-encre-2">
              Moins ce qu’ils vous ont rendu, en retraite, école, soins et chômage
            </span>
            <span className="chiffres shrink-0 font-mono text-[14px] font-semibold text-encre">
              − {euros(plateauDroit.total)} €
            </span>
          </div>
        </div>
        <span className={`chiffres font-mono text-[40px] leading-none font-semibold tracking-[-0.03em] ${verdict.braquage ? "text-rouge" : "text-bleu"}`}>
          {eurosSigne(verdict.ecart)}
        </span>
        <p className="text-[16px] leading-snug text-encre-2">
          {verdict.braquage ? "de manque à gagner, pour vous." : "de mieux pour vous, grâce à eux."}
        </p>
      </Papier>

      <Commissaire>{dit("verdict")}</Commissaire>

      {/* Sa propre réponse, ressortie. Rien si la question a été sautée. */}
      {cadeau ? <Commissaire>{RAPPEL[cadeau]}</Commissaire> : null}

      {/*
        ⚠ Le seuil est la phrase la plus dense de la carte, et elle arrivait
        sans dire de qui elle parle : « en dessous de tant, vous seriez gagnant »
        laisse croire à une autre version du SIEN de verdict. Elle parle d'une
        AUTRE personne, celle qui gagne moins. L'information passe avant la
        formule de sortie, qui reste parce que c'est le personnage.
      */}
      <Commissaire qui="Le commissaire, en sortant">
        {pivot ? (
          <>« Quelqu’un qui gagne moins de {euros(pivot)} € net par mois, lui, reçoit plus qu’on ne lui prend. Vous, vous savez déjà. Ne me citez pas. »</>
        ) : verdict.braquage ? (
          <>« Avec ce placement, personne n’est gagnant, à aucun salaire. Ne me citez pas. »</>
        ) : (
          <>« Avec ce placement, tout le monde est gagnant, à tous les salaires. Vous pouvez me citer. »</>
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
