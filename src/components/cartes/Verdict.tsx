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
 * Il se juge sur le SOLDE, rendu moins pris, depuis le 15/09/2026, et il a
 * TROIS issues : au médian, l'écart vaut 8,9 % du pris, moins que l'effet
 * d'une seule convention du dossier, donc on ne tranche pas et on le dit.
 *
 * ⚠ Ce que cet écran a affiché jusque-là : COUPABLE à quelqu'un dont la page
 * venait d'afficher, deux cartes plus tôt, qu'il reçoit 1 040 463 € pour
 * 989 940 € versés. Le tampon tenait au coût d'opportunité, calculé sur la
 * TOTALITÉ du prélevé, santé, famille, impôt et TVA compris. Ce scénario reste
 * à l'écran, sous le verdict, nommé pour ce qu'il est.
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
  equilibre,
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
  /** Le salaire où les deux plateaux s'égalisent. `null` s'il n'y a pas de bascule. */
  equilibre: number | null;
  perimetre: Perimetre;
  placementId: string;
  cadeau: Cadeau;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
}) {
  const { plateauGauche, plateauDroit, verdict } = simulation;
  const cran = CRANS_RENDEMENT.find((c) => c.id === placementId) ?? CRANS_RENDEMENT[0];
  const capital = verdict.scenario?.capital ?? plateauGauche.total;
  const fonctionnaire = simulation.entree.regime === "fonctionnaire";
  const complet = Object.values(perimetre).every(Boolean);
  const coupable = verdict.issue === "coupable";
  const MOT = { coupable: "COUPABLE", "non-lieu": "NON-LIEU", relaxe: "RELAXE" } as const;
  /* ⚠ Classes ÉCRITES EN ENTIER : Tailwind lit le source, un `text-${x}` ne sort pas. */
  const TAMPON = {
    coupable: "border-rouge text-rouge",
    "non-lieu": "border-encre-2 text-encre-2",
    relaxe: "border-vert text-vert",
  } as const;
  const CHIFFRE = {
    coupable: "text-rouge",
    "non-lieu": "text-encre",
    relaxe: "text-vert",
  } as const;

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
        <div className={`tampon rounded-[5px] border-[3px] px-5 py-2 ${TAMPON[verdict.issue]}`}>
          <p className="font-mono text-[8.5px] tracking-[0.16em]">TRIBUNAL DES PRÉLÈVEMENTS</p>
          <p className="text-[38px] leading-[1.05] font-extrabold">{MOT[verdict.issue]}</p>
        </div>
        <p className="font-mono text-[10px] tracking-[0.12em] text-encre-3 uppercase">
          {coupable
            ? "Les prélèvements, sur votre cas"
            : verdict.issue === "relaxe"
              ? "Les prélèvements, sur votre cas · non retenu"
              : "Les prélèvements, sur votre cas · l’écart est dans l’épaisseur du trait"}
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
              Ce qu’ils vous auront pris, sur toute la carrière
            </span>
            <span className="chiffres shrink-0 font-mono text-[14px] font-semibold text-encre">
              {euros(plateauGauche.total)} €
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-encre pb-1.5">
            <span className="text-[13.5px] leading-tight text-encre-2">
              Moins ce qu’ils vous auront rendu, en retraite, école, soins et chômage
            </span>
            <span className="chiffres shrink-0 font-mono text-[14px] font-semibold text-vert">
              − {euros(plateauDroit.total)} €
            </span>
          </div>
        </div>
        <span className={`chiffres font-mono text-[40px] leading-none font-semibold tracking-[-0.03em] ${CHIFFRE[verdict.issue]}`}>
          {eurosSigne(verdict.solde)}
        </span>
        <p className="text-[16px] leading-snug text-encre-2">
          {coupable
            ? "à votre charge, une fois tout déduit."
            : verdict.issue === "relaxe"
              ? "en votre faveur, une fois tout déduit."
              : `d’écart, soit moins de 10 % de ce qui est pris. Sous cette barre, le dossier ne tranche pas.`}
        </p>

        {/*
          LE PLACEMENT PASSE DERRIÈRE, et il reste. C'est la question que tout le
          monde se pose, et c'est une HYPOTHÈSE : quarante-trois ans de suite,
          sans y toucher, sur la totalité du prélevé, santé et impôt compris.
          Elle a fait le verdict pendant une semaine ; elle informe, elle ne
          juge plus.
        */}
        <div className="mt-1 w-full border-t border-cadre-bord pt-2 text-left">
          <p className="font-mono text-[9px] tracking-[0.12em] text-encre-3 uppercase">
            Le scénario de la défense
          </p>
          <p className="text-[13.5px] leading-snug text-encre-2">
            Si tout cela avait été placé en {cran.nom} à {taux(cran.reel)} par an, vous auriez{" "}
            <span className="chiffres font-mono font-semibold text-encre">{euros(capital)} €</span> à 64 ans,
            soit{" "}
            <span className="chiffres font-mono font-semibold text-encre">
              {eurosSigne(Math.abs(verdict.scenario?.ecart ?? 0))}
            </span>{" "}
            {(verdict.scenario?.ecart ?? 0) > 0 ? "de plus" : "de moins"} que ce qui vous est rendu.
            Personne ne place quarante-trois ans sans y toucher : c’est une hypothèse, pas le verdict.
          </p>
        </div>
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
      {/*
        ⚠ CETTE PHRASE ÉTAIT FAUSSE. Elle annonçait « moins de 2 038 € net par
        mois, lui, reçoit plus qu'on ne lui prend » en affichant le seuil du
        PLACEMENT, alors que les deux plateaux, eux, s'égalisent à 2 297 €.
        Entre les deux, elle disait à des gens qui reçoivent plus qu'ils ne
        versent qu'ils sont du mauvais côté de la barre.
      */}
      <Commissaire qui="Le commissaire, en sortant">
        {equilibre ? (
          <>« Quelqu’un qui gagne moins de {euros(equilibre)} € net par mois, lui, reçoit plus qu’on ne lui prend. Vous, vous savez déjà. Ne me citez pas. »</>
        ) : coupable ? (
          <>« Sur ce régime, la balance ne penche jamais du côté de l’agent, à aucun traitement. Ne me citez pas. »</>
        ) : (
          <>« Sur ce régime, la balance penche de votre côté à tous les niveaux. Vous pouvez me citer. »</>
        )}
      </Commissaire>

      <div className="grow" />

      {/*
        ⚠ CE QUI N'EST PAS COMPTÉ EST OUVERT, PAS REPLIÉ. L'écran écrivait
        « ici, tout est compté » alors que le plateau droit ne contient que
        quatre lignes : c'est la phrase qu'un lecteur hostile cite en premier,
        et il a raison. Un dossier à charge qui nomme lui-même ses angles morts
        est le seul qui tienne en contradictoire.
      */}
      <div className="border border-ligne/30 bg-papier/[0.04] px-4 py-3.5">
        <p className="font-mono text-[10px] tracking-[0.12em] text-ligne uppercase">
          Ce que ce calcul ne compte pas
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-papier-2">
          En face de ce qui est pris, on ne met que quatre lignes : votre retraite, votre école, vos
          soins et votre chômage. Il manque donc la police, la justice, les routes, l’armée, la
          recherche, l’école de vos enfants, les allocations familiales, les aides au logement, la
          prime d’activité, les indemnités journalières, l’invalidité et la dépendance. Toutes sont
          payées par des lignes qui, elles, sont comptées dans ce qui vous est pris.
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-papier-2">
          L’INSEE, qui compte ces services-là, trouve que{" "}
          <span className="font-semibold text-papier">56 % des personnes reçoivent plus qu’elles ne
          contribuent</span>{" "}
          (Insee Analyses n° 118, avril 2026). Sa mesure porte sur une ANNÉE et sur toute la
          population, enfants et retraités compris ; la nôtre suit une carrière de quarante-trois
          ans. Les deux sont vraies, elles ne mesurent pas la même chose.
        </p>
      </div>

      <Volet titre="Pourquoi ce verdict ?">
        <p className="text-[14px] leading-relaxed text-ligne">
          On additionne ce qui vous est pris chaque année (au périmètre coché à la pièce à conviction),
          et on en retire ce qu’ils vous rendent : votre retraite jusqu’à 85 ans, l’école, les soins et
          le chômage tels que vous les avez déclarés. Le solde décide. Tant qu’il reste sous 10 % de ce
          qui est pris, le dossier prononce un non-lieu : à ce niveau, changer une seule convention de
          calcul retournerait le résultat.
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
          Le seuil dépend de ce que vous avez coché et de vos réponses au commissaire :
          {complet
            ? " ici, les quatre lignes du prélèvement sont comptées."
            : " ici, une ligne au moins du prélèvement est décochée."}{" "}
          Le salaire net médian du privé est de 2 190 € (INSEE 2024, net avant impôt). Ce n’est pas un
          verdict sur vous, c’est un verdict sur le calcul.
        </p>
      </Volet>
    </Carte>
  );
}
