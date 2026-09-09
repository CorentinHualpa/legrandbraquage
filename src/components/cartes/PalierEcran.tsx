"use client";

import { Carte, Commissaire, Lien, Reponse, Volet } from "./Carte";
import type { NumeroPiece, Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
import { dit } from "@/lib/repliques";
import {
  PALIERS,
  PRIX_CHOMAGE,
  PRIX_ECOLE,
  PRIX_SANTE,
  montantDuPalier,
  santeSurUneVie,
  type Paliers,
  type PosteDuPlateau,
} from "@/lib/moteur";

const PIECE: Record<PosteDuPlateau, { numero: NumeroPiece; legende: string }> = {
  ecole: { numero: 23, legende: "CLICHÉ 23 · L’INTERROGATOIRE COMMENCE" },
  sante: { numero: 16, legende: "CLICHÉ 16 · SALLE D’EXAMEN" },
  chomage: { numero: 17, legende: "CLICHÉ 17 · L’OPEN SPACE, 18 H" },
};

const NOTE: Record<PosteDuPlateau, string> = {
  ecole: "Il note dans le PV · reçu, école",
  sante: "Il note dans le PV · reçu, soins",
  chomage: "Il note dans le PV · reçu, chômage",
};

/**
 * Écrans 8, 9 et 10 : l'interrogatoire. Et eux, ils t'auront donné quoi ?
 *
 * Le commissaire pose la question, la personne répond à sa voix, et il note
 * le montant dans le PV. Le site ne fournit que le prix unitaire, sourcé,
 * au clic.
 */
export function PalierEcran({
  poste,
  rang,
  pieces,
  paliers,
  choisir,
  numero,
  total,
  suivant,
  retour,
  libelleSuivant,
}: {
  poste: PosteDuPlateau;
  /** « 1 sur 3 » : le rang de la question dans l'interrogatoire. */
  rang: string;
  pieces: Pieces;
  paliers: Paliers;
  choisir: (id: string) => void;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
  libelleSuivant: string;
}) {
  const definition = PALIERS[poste];
  const actif = paliers[poste];
  const montant = montantDuPalier(poste, actif);
  const choix = definition.choix.find((c) => c.id === actif);
  const piece = PIECE[poste];

  return (
    <Carte
      numero={numero}
      total={total}
      nature={`Interrogatoire · ${rang}`}
      retour={retour}
      photo={{ numero: piece.numero, pieces, hauteur: 210, legende: piece.legende }}
      action={{ libelle: libelleSuivant, onClick: suivant }}
    >
      <Commissaire qui="L’avocate des braqueurs" couleur="bleu">{dit(poste)}</Commissaire>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label={definition.question}>
        {definition.choix.map((c) => (
          <Reponse key={c.id} actif={c.id === actif} onClick={() => choisir(c.id)} repere={c.repere}>
            {c.libelle}
          </Reponse>
        ))}
      </div>

      {/* La note du PV : kraft et encre bleue, pour ne pas se confondre avec la réponse choisie. */}
      <div
        className="flex flex-col gap-0.5 border-l-4 border-bleu bg-[#cdb98d] px-3.5 py-2.5 text-encre shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
        style={{ transform: `rotate(${poste === "sante" ? 0.7 : -0.7}deg)` }}
      >
        <span className="font-mono text-[9.5px] tracking-[0.14em] text-[#5a4a2a] uppercase">{NOTE[poste]}</span>
        <span className="chiffres montant-anime font-mono text-[30px] leading-none font-semibold tracking-[-0.03em] text-bleu">
          {eurosSigne(montant)}
        </span>
        <span className="text-[12.5px] leading-snug text-[#3d3220]">{choix?.regle}</span>
      </div>

      <div className="grow" />

      <Volet titre="D’où sort ce prix ?">
        {poste === "ecole" ? (
          <>
            <p className="text-[14px] leading-relaxed text-ligne">
              Ce que l’école coûte par élève et par an, tous financeurs :{" "}
              <span className="font-medium text-papier">{euros(PRIX_ECOLE.maternelle)} €</span> en maternelle,{" "}
              <span className="font-medium text-papier">{euros(PRIX_ECOLE.elementaire)} €</span> en primaire,{" "}
              <span className="font-medium text-papier">{euros(PRIX_ECOLE.college)} €</span> au collège,{" "}
              <span className="font-medium text-papier">{euros(PRIX_ECOLE.lyceeGeneral)} €</span> au lycée,{" "}
              <span className="font-medium text-papier">{euros(PRIX_ECOLE.universite)} €</span> à l’université.
            </p>
            <p className="text-[13px] leading-relaxed text-ligne">
              Une école supérieure privée, c’est la famille qui paie : on ne compte alors que jusqu’au bac.
              Une école privée sous contrat avant le bac coûte à l’État presque autant que le public, il en paie
              les professeurs : on ne la distingue pas.
            </p>
            <p className="text-[13px] leading-relaxed text-ligne">{PRIX_ECOLE.source}.</p>
            <Lien href={PRIX_ECOLE.url}>La note de la DEPP (PDF)</Lien>
          </>
        ) : poste === "sante" ? (
          <>
            <p className="text-[14px] leading-relaxed text-ligne">Ce que la Sécu rembourse par personne et par an, à chaque âge :</p>
            <ul className="grid grid-cols-3 gap-x-3 gap-y-1 text-[13px]">
              {PRIX_SANTE.tranches.map(([de, a, prix]) => (
                <li key={de} className="flex justify-between border-b border-papier/15 pb-0.5">
                  <span className="text-ligne">{a >= 100 ? `${de} ans et +` : `${de}-${a} ans`}</span>
                  <span className="chiffres font-mono font-medium text-papier">{euros(prix)} €</span>
                </li>
              ))}
            </ul>
            <p className="text-[13px] leading-relaxed text-ligne">
              De la naissance à {PRIX_SANTE.dernierAge + 1} ans, ça fait{" "}
              <span className="font-medium text-papier">{eurosSigne(santeSurUneVie())}</span>. Ce cumul est un
              calcul à nous, la DREES publie les tranches. Et c’est la part remboursée, pas ce que vous avez payé.
            </p>
            <p className="text-[13px] leading-relaxed text-ligne">{PRIX_SANTE.source}.</p>
            <Lien href={PRIX_SANTE.url}>Le jeu de données de la DREES</Lien>
          </>
        ) : (
          <>
            <p className="text-[14px] leading-relaxed text-ligne">
              L’allocation chômage moyenne réellement versée est de{" "}
              <span className="font-medium text-papier">{euros(PRIX_CHOMAGE.allocationNetteMensuelle)} € nets par mois</span>.
              Six mois, {eurosSigne(6 * PRIX_CHOMAGE.allocationNetteMensuelle)}. Deux ans,{" "}
              {eurosSigne(24 * PRIX_CHOMAGE.allocationNetteMensuelle)}. Sept indemnisés sur dix le sont moins d’un an.
            </p>
            <p className="text-[13px] leading-relaxed text-ligne">{PRIX_CHOMAGE.source}.</p>
            <Lien href={PRIX_CHOMAGE.url}>La publication de l’Unédic</Lien>
          </>
        )}
      </Volet>
    </Carte>
  );
}
