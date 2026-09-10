import type { Metadata } from "next";
import Link from "next/link";

import { EnTete, Feuille, PiecesVersees, Renvoi, Scelle, Tampon } from "@/components/papier";
import { piecesDeposees } from "@/lib/images";
import { euros, pourcent } from "@/lib/format";
import {
  CRANS_RENDEMENT,
  PALIERS_DEFAUT,
  PERIMETRE_COMPLET,
  salairePivot,
} from "@/lib/moteur";
import { aSourcer } from "@/lib/objets";

export const metadata: Metadata = {
  title: "La méthode",
  description:
    "Ce qui est calculé au centime, ce qui est un ordre de grandeur assumé, d'où viennent les barèmes, et ce qui reste ouvert. Le moteur de calcul est public.",
};

const DEPOT = "https://github.com/CorentinHualpa/legrandbraquage";

function Ligne({
  quoi,
  valeur,
  source,
}: {
  quoi: string;
  valeur: string;
  source: string;
}) {
  return (
    <li className="flex flex-col gap-0.5 border-b border-ligne py-2.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[14px]">{quoi}</span>
        <span className="chiffres shrink-0 font-mono text-[13px] font-medium">
          {valeur}
        </span>
      </span>
      <span className="font-mono text-[9.5px] tracking-[0.05em] text-encre-3">
        {source.toUpperCase()}
      </span>
    </li>
  );
}

export default function Methode() {
  const pieces = piecesDeposees();
  /*
   * Le seuil publié : périmètre complet, réponses par défaut au commissaire
   * (bac, santé comme tout le monde, un trou d’air), argent placé en fonds
   * en euros sans frais. C’est le cas que l’image de partage affiche.
   */
  const fondsEuros = CRANS_RENDEMENT.find((c) => c.id === "fonds-euros") ?? CRANS_RENDEMENT[0];
  const pivot = salairePivot({
    perimetre: PERIMETRE_COMPLET,
    paliers: PALIERS_DEFAUT,
    placement: { rendementReel: fondsEuros.reel },
  });
  const pivotPensionSeule = salairePivot({ perimetre: PERIMETRE_COMPLET });
  const restant = aSourcer();

  return (
    <main className="min-h-dvh bg-papier pb-16">
      <Feuille>
        <EnTete
          nature="NOTE DE MÉTHODE · VERSÉE AU DOSSIER"
          titre="Comment on a compté"
          tampon={<Tampon couleur="bleu" sens="droite">PUBLIC</Tampon>}
        />

        <Scelle
          numero={3}
          nom="Le tableau d'enquête"
          ratio="16:9"
          legende="CLICHÉ 03 · LE MUR DE LIÈGE"
          fichier={pieces[3]}
        />

        <p className="text-[15.5px] leading-relaxed">
          Cette page existe pour une raison simple : un simulateur qui refuse de
          montrer son calcul ne vaut pas mieux que le chiffre qu’il conteste.{" "}
          <a
            href={DEPOT}
            className="font-semibold text-rouge-texte underline"
            rel="noreferrer"
          >
            Le moteur est ouvert
          </a>
          , il n’a aucune dépendance, il se rejoue en une commande, et chaque
          barème y renvoie à son texte officiel.
        </p>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-rouge-texte">
            L’ÉTALON
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            Les taux de cotisation sont vérifiés contre l’
            <span className="font-semibold">
              API publique du simulateur officiel de l’URSSAF
            </span>{" "}
            (<span className="font-mono text-[13px]">mon-entreprise.urssaf.fr</span>
            ), interrogée sur sept points de salaire. Les sept tombent au
            centième. Si un de ces tests casse un jour, c’est le moteur qui a
            tort, pas l’URSSAF.
          </p>
          <ul className="flex flex-col border-t border-ligne">
            <Ligne
              quoi="Cotisations patronales au SMIC"
              valeur="3,09 %"
              source="URSSAF, barème 2026, effectif < 50"
            />
            <Ligne
              quoi="Cotisations patronales à 10 000 € brut"
              valeur="43,05 %"
              source="URSSAF, barème 2026"
            />
            <Ligne
              quoi="Réduction générale dégressive unique au SMIC"
              valeur="725,75 €"
              source="LFSS 2026, la RGDU remplace Fillon et sort à 3 SMIC"
            />
            <Ligne
              quoi="Salaire net médian du privé"
              valeur="2 190 €"
              source="INSEE 2024, net EQTP"
            />
            {pivot ? (
              <Ligne
                quoi="Salaire où le verdict bascule : périmètre complet, réponses par défaut, argent placé en fonds en euros"
                valeur={`${euros(pivot)} €`}
                source="calculé par dichotomie, moteur/index.js"
              />
            ) : null}
            {pivotPensionSeule ? (
              <Ligne
                quoi="Le même seuil, pension seule en face et argent non placé"
                valeur={`${euros(pivotPensionSeule)} €`}
                source="l’ancien verdict, gardé pour comparaison"
              />
            ) : null}
          </ul>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-bleu">
            CE QUI EST CALCULÉ, ET CE QUI NE L’EST PAS
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            <span className="font-semibold">Défendable au centime :</span> toutes
            les cotisations ligne par ligne, la RGDU, l’impôt sur le revenu avec
            décote et quotient familial, l’inversion du net vers le brut, la
            projection de carrière sur les courbes de salaire par âge de l’INSEE,
            et le capital équivalent à la pension.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            <span className="font-semibold">
              Ce que le moteur refuse de chiffrer tout seul :
            </span>{" "}
            la santé, l’école et le chômage. Ils portaient des ordres de
            grandeur sans source opposable, et un lecteur hostile n’avait qu’à
            demander d’où ils sortaient : ils ont été retirés du calcul. Ils
            restent nommés, parce que leur absence donnerait prise à « vous avez
            oublié », mais ils ne comptent que si vous les chiffrez vous-même,
            aux paliers que le commissaire vous fait choisir. Les prix unitaires
            de ces paliers, eux, sont sourcés : la{" "}
            <span className="font-semibold">DEPP</span> pour le coût par élève
            et par an, la <span className="font-semibold">DREES</span> pour la
            dépense de santé remboursée par tranche d’âge, l’
            <span className="font-semibold">Unédic</span> pour l’allocation
            mensuelle. Le poste retraite, lui, est calculé.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            <span className="font-semibold">La carrière n’a pas la même forme
            partout.</span>{" "}
            Le salaire ne reste pas figé pendant quarante-trois ans : il suit une
            courbe par âge, et cette page en utilise{" "}
            <span className="font-semibold">quatre</span>, une pour le privé et une
            par versant de la fonction publique (INSEE, séries longues, salaires nets
            annuels moyens par tranche d’âge). Elles ne se ressemblent pas : la
            territoriale est nettement plus plate que le privé, l’État plus pentu.
            Servir la courbe du privé à un fonctionnaire, ce que faisait cette page
            jusqu’au 9 septembre 2026, faussait sa pension, qui se calcule sur le
            traitement de fin de carrière.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            <span className="font-semibold">Deux conventions, et elles sont de nous.</span>{" "}
            La fonction publique n’est publiée qu’en six tranches d’âge, jamais au
            quinquennat : les points sont posés au milieu de chaque tranche. Et la
            dernière tranche, « 60 ans et plus », est{" "}
            <span className="italic">plafonnée</span> : elle mesure une population à
            un instant, pas une carrière suivie, et dans l’hospitalière elle est tirée
            par les praticiens hospitaliers, qui n’ont rien à voir avec le reste du
            versant. Au-delà de 55 ans, la progression retenue est donc celle, très
            plate, que la courbe du privé applique déjà pour la même raison. Sans ce
            plafond, un agent hospitalier se verrait annoncer une pension de 2 049 €
            au lieu de 1 614 €.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            <span className="font-semibold">Le taux d’effort de TVA</span> suit
            la courbe du Conseil des prélèvements obligatoires par décile de
            niveau de vie, rapportée au revenu disponible : 12,5 % pour le
            premier décile, un plateau autour de 8 % du deuxième au neuvième,
            puis 4,7 % pour le dernier. Le dénominateur tranche le débat et il
            est affiché : rapportée à la{" "}
            <span className="italic">consommation</span> et non au revenu, la
            même TVA est plate, et même légèrement progressive.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            <span className="font-semibold">Provenance inégale, et on le dit :</span>{" "}
            le rapport ne chiffre que le premier et le dernier décile ; le
            deuxième est imprimé dans un rapport ultérieur du même conseil ; les
            sept du milieu n’existent que sous forme de graphique et ont été lus
            dessus. Deux approximations restent, en sens contraire : le conseil
            classe des <span className="italic">ménages</span> par niveau de vie
            quand cette page ne connaît que le salaire d’une{" "}
            <span className="italic">personne</span>, et nous ne disposons que
            de trois bornes de la distribution des salaires, le premier décile,
            la médiane et le neuvième. La série date enfin de l’enquête Budget
            de famille 2011 ; l’estimation INSEE la plus récente décrit une
            courbe plus plate, donc ce dossier retient l’hypothèse la plus
            sévère des deux.
          </p>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-rouge-texte">
            L’UNITÉ : DES EUROS D’AUJOURD’HUI
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            Tout est en euros constants, inflation corrigée. Ce n’est pas un
            détail de présentation, c’est le piège méthodologique numéro un de ce
            type d’outil : additionner quarante ans de cotisations en euros
            courants gonfle le total de plusieurs dizaines de pour cent sans que
            rien ne le signale. Aucun chiffre de ce site n’est un cumul nominal.
          </p>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-bleu">
            LE DÉNOMINATEUR, ET POURQUOI ON DONNE LES DEUX
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            L’heure de libération rapporte les prélèvements au{" "}
            <span className="font-semibold">coût employeur</span>, c’est-à-dire à
            ce que le travail coûte. C’est le dénominateur le plus défavorable
            aux prélèvements, et c’est celui qu’emploient les publications qui
            militent pour leur baisse. On le retient quand même, à une condition :
            que la page le dise, et qu’elle affiche à côté le même montant
            rapporté à ce qui arrive réellement sur le compte. Les deux chiffres
            sont vrais et ne racontent pas la même histoire.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            Même règle sur la TVA : elle est régressive rapportée au revenu
            disponible, à peu près proportionnelle rapportée à la consommation.
            Le paramétrage tranche le débat, donc le paramétrage s’affiche.
          </p>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-rouge-texte">
            LE VERDICT SE JUGE SUR LE COÛT D’OPPORTUNITÉ
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            Le tribunal ne compare pas ce qui a été pris à ce qui a été rendu :
            il compare ce que l’argent pris <span className="font-semibold">serait devenu</span>,
            placé là où la personne dit qu’elle l’aurait mis, à ce qui a été
            rendu. Chaque année de carrière, le prélèvement du périmètre coché
            est capitalisé au taux réel du placement choisi, frais compris,
            jusqu’à 64 ans. En face : le capital équivalent à la pension jusqu’à
            85 ans, plus l’école, les soins et le chômage aux paliers déclarés.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            L’enveloppe par défaut est le fonds en euros, ce que la moitié des
            Français détient, sans frais : un simulateur qui ouvrirait sur le
            rendement le plus flatteur ne mesurerait plus rien, il vendrait une
            conclusion. Les taux sont RÉELS, inflation retirée, parce que tout le
            dossier est en euros d’aujourd’hui ; le Livret A est négatif, et ce
            n’est pas une provocation.
          </p>
          <ul className="flex flex-col border-t border-ligne">
            {CRANS_RENDEMENT.map((c) => (
              <Ligne
                key={c.id}
                quoi={c.nom}
                valeur={`${pourcent(c.reel, 2)} réel`}
                source={c.source}
              />
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-bleu">
            LE CAS DU FONCTIONNAIRE, ET LE CHIFFRE QU’ON NE DOIT PAS LIRE DE TRAVERS
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            Le fonctionnaire cotise sur une assiette amputée : les primes, un
            quart du brut en moyenne, sont hors de l’assiette de pension. Il
            retient donc deux points de moins qu’un salarié du privé, et son
            employeur verse beaucoup plus.
          </p>
          <ul className="flex flex-col border-t border-ligne">
            <Ligne
              quoi="Retenue pour pension, sur le seul traitement indiciaire"
              valeur="11,10 %"
              source="art. L61 CPCMR ; décret 2010-1749 modifié"
            />
            <Ligne
              quoi="Contribution employeur au CAS Pensions, État"
              valeur="82,28 %"
              source="décret 2025-1341 du 26/12/2025"
            />
            <Ligne
              quoi="Contribution employeur CNRACL, territoriale et hospitalière"
              valeur="37,65 %"
              source="décret 2025-86 ; 40,65 % en 2027, 43,65 % en 2028"
            />
            <Ligne
              quoi="Taux employeur comparable dans le privé, tel que le COR le pose"
              valeur="16,67 %"
              source="COR, rapport annuel juin 2026, p. 17"
            />
          </ul>
          <p className="border-l-[3px] border-bleu bg-papier-3 px-3 py-3 text-[14px] leading-relaxed">
            <span className="font-semibold">
              Ces taux ne se comparent pas, et c’est le COR qui l’écrit.
            </span>{" "}
            La contribution publique « ne résulte pas d’une générosité plus
            importante du régime public » et « ne peut pas être comparée à la
            contribution des employeurs du secteur privé ». Elle mesure une
            démographie : 1,29 cotisant par retraité contre 2,25 au régime
            général. Le taux qui financerait les seuls droits, hors invalidité
            et départs anticipés, serait de 34,7 %. La page affiche cet
            avertissement à côté du chiffre, pas en note de bas de page.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            Dans l’autre sens : un employeur public ne cotise pas au chômage, il
            s’auto-assure. Le coût existe et ne figure sur aucune ligne, ce qui
            biaise la comparaison des parts patronales EN FAVEUR du public. La
            contrepartie chômage disparaît donc aussi du second plateau, plutôt
            que d’être portée au crédit de quelqu’un qui ne l’a pas payée.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            Enfin, le taux de remplacement retenu est celui que le COR PROJETTE
            pour la génération 2000, comme pour le salarié du privé. Le taux
            réellement OBSERVÉ, lui, ne montre presque aucun écart entre public
            et privé : 73,8 % contre 74,8 % pour la génération 1950 à carrière
            complète. Les deux chiffres sont vrais et ne mesurent pas la même
            chose.
          </p>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-bleu">
            CE QUI RESTE OUVERT
          </h2>
          <ul className="flex flex-col gap-2.5 text-[14px] leading-relaxed">
            <li className="border-l-[3px] border-cadre-bord pl-3">
              <span className="font-semibold">
                Les entreprises de cinquante salariés et plus.
              </span>{" "}
              Le moteur trouve 0,45 point de moins que la ligne de synthèse d’un
              rapport de référence, soit exactement l’écart de contribution à la
              formation professionnelle. Les sept points de la table des moins de
              cinquante tombent au centième, donc le doute porte sur la ligne de
              référence. L’application reste sur l’effectif inférieur à cinquante
              en attendant. Le moteur sait calculer les deux : l’écart pèse
              <span className="font-semibold"> 1,4 %</span> du total prélevé,
              soit environ 11 500 € sur une carrière au salaire médian.
            </li>
            <li className="border-l-[3px] border-rouge pl-3">
              <span className="font-semibold">
                Deux décrets se contredisent sur le taux du micro-entrepreneur.
              </span>{" "}
              Le décret 2024-484 programmait 26,1 % de cotisations en 2026 pour
              les prestations libérales, et beaucoup de sites le répètent
              encore ; le décret 2025-943 a réécrit l’article D613-4 du code de
              la sécurité sociale avant cette entrée en vigueur, et la valeur
              applicable est <span className="font-semibold">25,6 %</span>. Nous
              retenons le texte en vigueur.
            </li>
            <li className="border-l-[3px] border-cadre-bord pl-3">
              <span className="font-semibold">
                Les trimestres de retraite d’un micro-entrepreneur.
              </span>{" "}
              L’URSSAF ne publie plus de chiffre d’affaires minimal par
              trimestre, sauf pour la CIPAV (2 792 € en 2026). Pour tous les
              autres, seule la formule de la circulaire Cnav est officielle :
              nous l’appliquons et nous présentons le résultat comme calculé, pas
              comme un seuil publié.
            </li>
            <li className="border-l-[3px] border-rouge pl-3">
              <span className="font-semibold">
                Deux sources officielles se contredisent sur le barème CIPAV.
              </span>{" "}
              L’URSSAF publie 8,73 % de retraite de base et 11 % puis 21 % de
              complémentaire ; la fiche pratique 2026 de la CIPAV elle-même
              annonce 8,23 %, puis 9 % et 22 %. Aucune des deux ne mentionne
              l’autre. Nous retenons l’URSSAF, parce que c’est elle qui recouvre
              ces cotisations depuis 2023 et que ses taux sont ceux du décret
              2024-688. Un libéral qui compare avec sa fiche CIPAV verra donc un
              écart, et il aura raison de le signaler : c’est écrit ici pour
              qu’il sache d’où il vient.
            </li>
            <li className="border-l-[3px] border-cadre-bord pl-3">
              <span className="font-semibold">
                Les points de retraite de base d’un libéral.
              </span>{" "}
              La CIPAV publie dans la même phrase un ratio d’un point pour
              89,71 € de revenus et un plafond de 557 points, or les deux ne se
              réconcilient pas : au plafond de la tranche, le ratio ne rend que
              536 points. Nous appliquons les deux tels qu’ils sont publiés
              plutôt que d’en corriger un pour faire tomber l’autre juste. La
              pension de base s’en trouve minorée d’environ 4 %.
            </li>
            <li className="border-l-[3px] border-cadre-bord pl-3">
              <span className="font-semibold">
                L’étalon de l’indépendant n’est pas celui du salarié.
              </span>{" "}
              Le simulateur officiel de l’URSSAF sert encore l’ancien barème pour
              ce régime, alors que la réforme de l’assiette unique s’applique
              depuis avril 2026. Sa table de référence est donc reconstruite
              depuis le barème opposable, article par article, et vérifiée sur
              quinze points de revenu.
            </li>
            <li className="border-l-[3px] border-cadre-bord pl-3">
              <span className="font-semibold">
                Le président de SAS et l’assurance chômage.
              </span>{" "}
              Il n’y cotise pas, alors que le moteur lui applique aujourd’hui le
              calcul complet du salarié. L’écart est de quelques dixièmes de
              point, et il joue en sa défaveur : son prélèvement est légèrement
              surestimé.
            </li>
            <li className="border-l-[3px] border-cadre-bord pl-3">
              <span className="font-semibold">
                La courbe de carrière du secteur public.
              </span>{" "}
              Elle existe à l’INSEE et nous ne l’avons pas encore. Le
              fonctionnaire est donc projeté sur la courbe de salaire par âge du
              privé, ce qui donne la bonne forme de carrière et pas
              nécessairement la bonne pente.
            </li>
            {restant.length > 0 ? (
              <li className="border-l-[3px] border-cadre-bord pl-3">
                <span className="font-semibold">
                  Les prix du convertisseur d’objets.
                </span>{" "}
                {restant.length} entrées attendent encore leur relevé officiel.
                L’absurdité doit venir de la quantité, jamais du prix unitaire :
                c’est le seul chiffre de cette page que le lecteur peut vérifier
                de tête.
              </li>
            ) : null}
          </ul>
        </section>

        <Renvoi>
          Trois règles ont présidé à tout le dossier. On concède ce qui est juste
          chez la partie adverse, parce que ne pas concéder ferait de cette page
          un tract. On ne source jamais sur un essai, seulement sur des
          organismes publics. Et on ne touche pas au terrain personnel : on reste
          sur les chiffres.
        </Renvoi>

        <p className="text-[14px]">
          <Link href="/" className="font-semibold text-rouge-texte underline">
            ← Retour au dossier
          </Link>
        </p>

        <PiecesVersees />
      </Feuille>
    </main>
  );
}
