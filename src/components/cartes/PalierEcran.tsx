"use client";

import { Carte, Chiffre, Kicker, Lien, Question, Volet } from "./Carte";
import { Scelle } from "../papier";
import type { Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
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

const PIECE: Record<PosteDuPlateau, { numero: 15 | 16 | 17; nom: string; legende: string }> = {
  ecole: { numero: 15, nom: "Le bulletin sous scellé", legende: "CLICHÉ 15 · LE PUPITRE" },
  sante: { numero: 16, nom: "Le bracelet d’hôpital", legende: "CLICHÉ 16 · SALLE D’EXAMEN" },
  chomage: { numero: 17, nom: "Le bureau vidé", legende: "CLICHÉ 17 · L’OPEN SPACE, 18 H" },
};

const TITRE_MONTANT: Record<PosteDuPlateau, string> = {
  ecole: "Ils auront payé, pour t’instruire",
  sante: "Ils auront payé, pour te soigner",
  chomage: "Ils t’auront versé",
};

const SUIVANT: Record<PosteDuPlateau, string> = {
  ecole: "Suivant : la santé",
  sante: "Suivant : le chômage",
  chomage: "Voir ce qu’ils m’auront rendu",
};

/**
 * Écrans 6, 7 et 8 : et eux, ils t'auront donné quoi ?
 *
 * Le site ne fournit que le prix unitaire, sourcé. La personne choisit son
 * palier, à sa voix, et le montant tombe. Le prix et sa source sont au clic.
 */
export function PalierEcran({
  poste,
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
  pieces: Pieces;
  paliers: Paliers;
  choisir: (id: string) => void;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
  libelleSuivant?: string;
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
      retour={retour}
      action={{ libelle: libelleSuivant ?? SUIVANT[poste], onClick: suivant, couleur: "bleu" }}
    >
      <Scelle numero={piece.numero} nom={piece.nom} ratio="16:9" fichier={pieces[piece.numero]} legende={piece.legende} rogneSurPetitEcran />

      <div className="flex flex-col gap-1.5">
        <Kicker couleur="bleu">Et eux, ils t’auront donné quoi ?</Kicker>
        <Question>{definition.question}</Question>
      </div>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label={definition.question}>
        {definition.choix.map((c) => {
          const on = c.id === actif;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => choisir(c.id)}
              className={`flex min-h-[52px] items-center justify-between gap-3 px-3.5 py-3 text-left text-[16px] transition-colors ${
                on ? "bg-bleu text-papier" : "border border-cadre-bord text-encre hover:border-encre"
              }`}
            >
              <span>{c.libelle}</span>
              <span className={`shrink-0 font-mono text-[12px] ${on ? "text-papier/85" : "text-encre-3"}`}>{c.repere}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-2 border-bleu bg-papier-2 px-4 py-3.5">
        <Kicker couleur="bleu">{TITRE_MONTANT[poste]}</Kicker>
        <Chiffre couleur="bleu" taille={40}>{eurosSigne(montant)}</Chiffre>
        <p className="text-[14px] leading-relaxed text-encre-2">{choix?.regle}</p>
      </div>

      <Volet titre="D’où sort ce prix ?" couleur="bleu">
        {poste === "ecole" ? (
          <>
            <p className="text-[14.5px] leading-relaxed text-encre-2">
              Ce que l’école coûte par élève et par an, tous financeurs :{" "}
              <span className="font-medium text-encre">{euros(PRIX_ECOLE.maternelle)} €</span> en maternelle,{" "}
              <span className="font-medium text-encre">{euros(PRIX_ECOLE.elementaire)} €</span> en primaire,{" "}
              <span className="font-medium text-encre">{euros(PRIX_ECOLE.college)} €</span> au collège,{" "}
              <span className="font-medium text-encre">{euros(PRIX_ECOLE.lyceeGeneral)} €</span> au lycée,{" "}
              <span className="font-medium text-encre">{euros(PRIX_ECOLE.universite)} €</span> à l’université.
            </p>
            <p className="text-[13px] leading-relaxed text-encre-2">{PRIX_ECOLE.source}.</p>
            <Lien href={PRIX_ECOLE.url}>La note de la DEPP (PDF)</Lien>
          </>
        ) : poste === "sante" ? (
          <>
            <p className="text-[14.5px] leading-relaxed text-encre-2">
              Ce que la Sécu rembourse par personne et par an, à chaque âge :
            </p>
            <ul className="grid grid-cols-3 gap-x-3 gap-y-1 text-[13.5px]">
              {PRIX_SANTE.tranches.map(([de, a, prix]) => (
                <li key={de} className="flex justify-between border-b border-ligne pb-0.5">
                  <span className="text-encre-2">{a >= 100 ? `${de} ans et +` : `${de}-${a} ans`}</span>
                  <span className="chiffres font-mono font-medium">{euros(prix)} €</span>
                </li>
              ))}
            </ul>
            <p className="text-[13.5px] leading-relaxed text-encre-2">
              De la naissance à {PRIX_SANTE.dernierAge + 1} ans, ça fait{" "}
              <span className="font-medium text-encre">{eurosSigne(santeSurUneVie())}</span>. Ce cumul est
              un calcul à nous : la DREES publie les tranches, pas la vie entière. Et
              c’est la part remboursée, pas ce que tu as payé de ta poche.
            </p>
            <p className="text-[13px] leading-relaxed text-encre-2">{PRIX_SANTE.source}.</p>
            <Lien href={PRIX_SANTE.url}>Le jeu de données de la DREES</Lien>
          </>
        ) : (
          <>
            <p className="text-[14.5px] leading-relaxed text-encre-2">
              L’allocation chômage moyenne réellement versée est de{" "}
              <span className="font-medium text-encre">{euros(PRIX_CHOMAGE.allocationNetteMensuelle)} € nets par mois</span>.
              Six mois, {eurosSigne(6 * PRIX_CHOMAGE.allocationNetteMensuelle)}. Deux ans,{" "}
              {eurosSigne(24 * PRIX_CHOMAGE.allocationNetteMensuelle)}.
            </p>
            <p className="text-[13.5px] leading-relaxed text-encre-2">
              Sept indemnisés sur dix le sont moins d’un an. La durée, elle, est la tienne : personne ne la publie.
            </p>
            <p className="text-[13px] leading-relaxed text-encre-2">{PRIX_CHOMAGE.source}.</p>
            <Lien href={PRIX_CHOMAGE.url}>La publication de l’Unédic</Lien>
          </>
        )}
      </Volet>
    </Carte>
  );
}
