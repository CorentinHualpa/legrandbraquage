"use client";

import { EnTete, Feuille, Renvoi, Scelle } from "./papier";
import type { Pieces } from "./Instruction";
import { capitale, euros, eurosSigne, verdictEnLettres } from "@/lib/format";
import type { Perimetre, Simulation } from "@/lib/moteur";

export function Jugement({
  pieces,
  simulation,
  pivot,
  perimetre,
}: {
  pieces: Pieces;
  simulation: Simulation;
  pivot: number | null;
  perimetre: Perimetre;
}) {
  const { plateauGauche, plateauDroit, verdict } = simulation;
  const total = plateauGauche.total + plateauDroit.total;
  const partVerse = total > 0 ? (plateauGauche.total / total) * 100 : 50;
  const complet =
    perimetre.salariales &&
    perimetre.patronales &&
    perimetre.impotRevenu &&
    perimetre.consommation;
  const fonctionnaire = simulation.entree.regime === "fonctionnaire";

  return (
    <Feuille className="mt-10 border-t-2 border-dashed border-ligne pt-2">
      <EnTete nature="JUGEMENT · RENDU CE JOUR" titre="Le Grand Braquage" />

      <Scelle
        numero={11}
        nom="Le prétoire, vide"
        fichier="11-pretoire.jpg"
        ratio="16:9"
        legende="CLICHÉ 11 · LE JUGE, C’EST TOI"
        present={Boolean(pieces[11])}
      />

      <div className="flex justify-center py-1">
        <div
          className={`tampon rounded-[5px] border-[3px] px-5 py-2.5 text-center ${
            verdict.braquage ? "border-rouge" : "border-bleu"
          }`}
        >
          <p
            className={`font-mono text-[9.5px] tracking-[0.16em] ${verdict.braquage ? "text-rouge-texte" : "text-bleu"}`}
          >
            TRIBUNAL DES PRÉLÈVEMENTS
          </p>
          <p
            className={`text-[30px] leading-none font-bold tracking-[-0.01em] ${verdict.braquage ? "text-rouge-texte" : "text-bleu"}`}
          >
            {verdict.braquage ? "COUPABLE" : "RELAXE"}
          </p>
        </div>
      </div>

      <p className="px-2 text-center text-[16px] leading-snug text-encre-2 italic">
        {verdict.braquage
          ? "Il est reparti avec le sac. Le tien."
          : "Le masque tombe, et dessous il y a une infirmière."}
      </p>

      {/* Le compte, les deux plateaux face à face. */}
      <div className="flex flex-col gap-3 border-2 border-encre bg-papier-2 p-4">
        <div className="flex items-end justify-between gap-3">
          <span className="flex flex-col gap-0.5">
            <span className="font-mono text-[9.5px] tracking-[0.12em] text-encre-3">
              EMPORTÉ
            </span>
            <span className="chiffres font-mono text-[22px] font-semibold tracking-[-0.03em] sm:text-[25px]">
              {euros(plateauGauche.total)}
            </span>
          </span>
          <span className="pb-1 text-[15px] text-encre-3">contre</span>
          <span className="flex flex-col gap-0.5 text-right">
            <span className="font-mono text-[9.5px] tracking-[0.12em] text-encre-3">
              REPOSÉ
            </span>
            <span className="chiffres font-mono text-[22px] font-semibold tracking-[-0.03em] sm:text-[25px]">
              {euros(plateauDroit.total)}
            </span>
          </span>
        </div>

        <div
          className="flex h-2.5 border border-encre"
          role="img"
          aria-label={`${Math.round(partVerse)} % emporté, ${100 - Math.round(partVerse)} % reposé`}
        >
          <span
            className="bg-rouge transition-[width] duration-300"
            style={{ width: `${partVerse}%` }}
          />
          <span className="grow bg-bleu" />
        </div>

        <p className="border-t border-ligne pt-2.5 text-[14px] leading-relaxed">
          {verdict.braquage ? (
            <>
              <span className="font-semibold">
                {capitale(verdictEnLettres(verdict.ecart))} euros
              </span>{" "}
              de préjudice net. C’est un vrai vol. Et il ne fait pas un million :
              le braqueur a reposé{" "}
              {Math.round((plateauDroit.total / plateauGauche.total) * 100)} % de
              ce qu’il avait pris.
            </>
          ) : (
            <>
              <span className="font-semibold">
                {eurosSigne(verdict.ecart)} en ta faveur.
              </span>{" "}
              Personne ne te l’avait dit : ce cas-là ne fait pas une couverture
              de magazine.
            </>
          )}
        </p>
      </div>

      {/* Le salaire-pivot : le chiffre que personne ne publie. */}
      {pivot ? (
        <section className="flex flex-col gap-2 border-t-2 border-encre pt-5">
          <h3 className="font-mono text-[10px] tracking-[0.13em] text-rouge-texte">
            LE SEUIL OÙ LE VOLÉ DEVIENT VOLEUR
          </h3>
          <p className="flex items-baseline gap-2.5">
            <span className="chiffres font-mono text-[34px] font-semibold tracking-[-0.035em] sm:text-[40px]">
              {euros(pivot)} €
            </span>
            <span className="text-[14px] text-encre-3">net par mois</span>
          </p>
          <p className="text-[14px] leading-relaxed text-encre-2">
            En dessous, tu repars avec plus que tu n’as donné. Au-dessus,
            l’inverse.
          </p>
          {/*
            ⚠ Le rapprochement avec le salaire médian ne vaut QUE pour le privé.
            Le servir à un fonctionnaire comparerait son seuil à une médiane qui
            n'est pas la sienne, et la phrase deviendrait fausse sans qu'aucun
            chiffre ne bouge.
          */}
          {fonctionnaire ? (
            <p className="border-l-[3px] border-bleu bg-papier-3 px-3 py-2.5 text-[14px] leading-relaxed">
              Ce seuil est très en dessous de celui d’un salarié du privé, et
              c’est la part employeur qui l’explique presque entièrement : la
              contribution au régime de pension pèse{" "}
              <span className="font-semibold">37,65 % du traitement</span> à la
              CNRACL, contre un taux comparable de 16,67 % dans le privé selon le
              Conseil d’orientation des retraites. Ce même Conseil écrit que les
              deux ne se comparent pas : lis l’avertissement au procès-verbal
              avant de conclure quoi que ce soit.
            </p>
          ) : (
            <p className="border-l-[3px] border-bleu bg-papier-3 px-3 py-2.5 text-[14px] leading-relaxed">
              Ce n’est pas un avis, c’est le barème : au SMIC, les cotisations
              patronales tombent à{" "}
              <span className="font-semibold">3,09 % du brut</span>, contre
              43,05 % à dix mille euros. Le salaire net médian du privé est de{" "}
              <span className="font-semibold">2 190 €</span> (INSEE 2024), et le
              point de bascule tombe à trente euros de là :{" "}
              <span className="font-semibold">
                la moitié des salariés français reçoivent plus qu’ils ne versent,
                l’autre moitié l’inverse.
              </span>{" "}
              Personne ne publie ce chiffre.
            </p>
          )}
          {!complet ? (
            <p className="text-[13px] text-encre-3 italic">
              Ce seuil est calculé sur le périmètre que tu as coché. Il bouge
              quand tu changes de périmètre : c’est normal, ce n’est pas le même
              procès.
            </p>
          ) : null}
        </section>
      ) : (
        /*
          Aucun pivot sur la plage : la balance ne bascule à AUCUN niveau de
          revenu. C'est le cas du fonctionnaire d'État au périmètre complet, et
          c'est un résultat sur le dénominateur, pas sur les fonctionnaires.
          Le taire donnerait une page qui condamne sans jamais pouvoir relaxer.
        */
        <section className="flex flex-col gap-2 border-t-2 border-encre pt-5">
          <h3 className="font-mono text-[10px] tracking-[0.13em] text-rouge-texte">
            IL N’Y A PAS DE SEUIL
          </h3>
          <p className="text-[14.5px] leading-relaxed">
            Sur ce régime et ce périmètre, la balance ne penche en ta faveur à{" "}
            <span className="font-semibold">aucun niveau de revenu</span>. Ce
            n’est pas un verdict sur toi, c’est un verdict sur le calcul.
          </p>
          <p className="border-l-[3px] border-bleu bg-papier-3 px-3 py-3 text-[14px] leading-relaxed">
            La contribution de l’État à son propre régime de pension pèse{" "}
            <span className="font-semibold">82,28 % du traitement indiciaire</span>.
            La compter comme un prélèvement subi condamne d’avance, et le Conseil
            d’orientation des retraites écrit lui-même que ce taux{" "}
            <span className="font-semibold">
              ne peut pas être comparé à la contribution d’un employeur privé
            </span>
            . Décoche les cotisations patronales pour voir le procès sans elle :
            c’est le même dossier, sans le chiffre qui décide de tout.
          </p>
        </section>
      )}

      <Renvoi>
        {fonctionnaire ? (
          <>
            Le taux de remplacement retenu ici est celui que le Conseil
            d’orientation des retraites PROJETTE pour la génération 2000, comme
            pour le salarié du privé. Le taux réellement OBSERVÉ, lui, ne montre
            presque aucun écart entre public et privé :{" "}
            <span className="font-semibold">73,8 % contre 74,8 %</span> pour la
            génération 1950 à carrière complète. Les deux chiffres sont vrais et
            ne mesurent pas la même chose.
          </>
        ) : (
          <>
            Sur le seul périmètre des cotisations salariales, celles qu’on voit
            sur sa fiche de paie,{" "}
            <span className="font-semibold">aucun salarié n’est perdant net</span>
            , à aucun niveau de revenu. Le braquage n’apparaît qu’en ajoutant ce
            qui est prélevé avant la paie et après la paie. Ce qu’on voit ne
            suffit jamais à faire le procès.
          </>
        )}
      </Renvoi>
    </Feuille>
  );
}
