import type { Metadata } from "next";

import { EnTete, Feuille, PiecesVersees, Renvoi, Scelle, Tampon } from "@/components/papier";
import { piecesDeposees } from "@/lib/images";
import { euros, pourcent } from "@/lib/format";
import { PERIMETRE_COMPLET, PLACEMENTS, salairePivot } from "@/lib/moteur";
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
  const pivot = salairePivot({ perimetre: PERIMETRE_COMPLET });
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
          fichier="03-tableau-enquete.jpg"
          ratio="16:9"
          legende="CLICHÉ 03 · LE MUR DE LIÈGE"
          present={Boolean(pieces[3])}
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
                quoi="Salaire où la balance bascule, périmètre complet"
                valeur={`${euros(pivot)} €`}
                source="calculé par dichotomie, moteur/index.js"
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
            projection de carrière sur la courbe de salaire par âge de l’INSEE,
            et le capital équivalent à la pension.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            <span className="font-semibold">
              Ordres de grandeur assumés, à remplacer par un chiffrage par
              décile :
            </span>{" "}
            santé (216 000 €), éducation (127 000 €), chômage (47 000 €). Ils
            s’affichent avec leur réserve partout où ils apparaissent. Le poste
            retraite, lui, est calculé.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            <span className="font-semibold">Approximation signalée :</span> le
            taux d’effort de TVA est interpolé linéairement entre le premier et
            le dernier décile, alors que le Conseil des prélèvements obligatoires
            décrit une courbe proportionnelle jusqu’au huitième décile puis
            régressive. La table complète est dans un rapport que nous n’avons
            pas pu ouvrir. À corriger dès qu’on l’a.
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
            L’ÉCHELLE DE PLACEMENT
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            Le curseur part au barreau le plus prudent, et c’est un choix : un
            simulateur qui ouvre sur le rendement le plus flatteur ne mesure plus
            rien, il vend une conclusion. Chaque barreau porte sa propre
            hypothèse de frais, parce que c’est là que tout se joue.
          </p>
          <ul className="flex flex-col border-t border-ligne">
            {PLACEMENTS.map((p) => (
              <Ligne
                key={p.id}
                quoi={p.nom}
                valeur={`${pourcent(p.rendementReel, 2)} réel`}
                source={p.source}
              />
            ))}
          </ul>
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
              en attendant.
            </li>
            <li className="border-l-[3px] border-cadre-bord pl-3">
              <span className="font-semibold">
                Les statuts autres que salarié du privé.
              </span>{" "}
              L’indépendant et le fonctionnaire ont chacun leur propre régime, et
              leurs barèmes sont en cours de vérification. Tant qu’ils ne sont
              pas instruits, la page le dit au lieu de leur servir le calcul du
              salarié. Le patron de TPE, lui, n’est pas un troisième régime : un
              gérant majoritaire de SARL cotise comme un travailleur non salarié,
              un président de SAS comme un assimilé salarié.
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
          <a href="/" className="font-semibold text-rouge-texte underline">
            ← Retour au dossier
          </a>
        </p>

        <PiecesVersees />
      </Feuille>
    </main>
  );
}
