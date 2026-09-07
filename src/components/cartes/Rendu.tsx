"use client";

import { Carte, Chiffre, Ligne, Volet } from "./Carte";
import { Alibi } from "../Alibi";
import { Scelle } from "../papier";
import type { Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
import { PALIERS, type Paliers, type PosteDuPlateau, type Simulation } from "@/lib/moteur";

/**
 * Écran 9 : sur toute ta vie, ils t'auront rendu.
 *
 * La retraite est CALCULÉE, les trois autres lignes sont les paliers que la
 * personne vient de choisir. Taper une ligne de palier ramène à sa question.
 * L'alibi du million (la contre-expertise sur le placement) reste au clic,
 * pour qui veut aller plus loin.
 */
export function Rendu({
  pieces,
  simulation,
  paliers,
  numero,
  total,
  suivant,
  retour,
  allerAuPalier,
}: {
  pieces: Pieces;
  simulation: Simulation;
  paliers: Paliers;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
  allerAuPalier: (poste: PosteDuPlateau) => void;
}) {
  const { plateauDroit } = simulation;
  const { retraite, education, sante, chomage } = plateauDroit.lignes;
  const regime = simulation.entree.regime;
  const detail = plateauDroit.detailPension;

  const libellePalier = (poste: PosteDuPlateau) =>
    PALIERS[poste].choix.find((c) => c.id === paliers[poste])?.libelle ?? "";

  return (
    <Carte numero={numero} total={total} retour={retour} action={{ libelle: "Le verdict", onClick: suivant }}>
      <Scelle numero={4} nom="Le coffre, après" ratio="16:9" fichier={pieces[4]} legende="CLICHÉ 04 · CE QU’IL A LAISSÉ" rogneSurPetitEcran />

      <div className="flex flex-col gap-3">
        <p className="text-[24px] leading-tight font-medium">Et sur toute ta vie, ils t’auront rendu</p>
        <Chiffre couleur="bleu">{eurosSigne(plateauDroit.total)}</Chiffre>
        <p className="text-[16px] leading-relaxed text-encre-2 italic">
          Retraite comprise, jusqu’à 85 ans.
        </p>
      </div>

      <Volet titre="Quoi, exactement ?" couleur="bleu" ouvertParDefaut>
        <ul className="flex flex-col">
          <li>
            <Ligne
              libelle="Ta retraite, de 64 à 85 ans"
              sous={`${euros(plateauDroit.pensionMensuelle)} € par mois, pension seule`}
              montant={eurosSigne(retraite.montant ?? 0)}
            />
          </li>
          <li>
            <Ligne libelle="L’école" sous={libellePalier("ecole")} montant={eurosSigne(education.montant ?? 0)} onClick={() => allerAuPalier("ecole")} />
          </li>
          <li>
            <Ligne libelle="Les soins" sous={libellePalier("sante")} montant={eurosSigne(sante.montant ?? 0)} onClick={() => allerAuPalier("sante")} />
          </li>
          {chomage ? (
            <li>
              <Ligne libelle="Le chômage" sous={libellePalier("chomage")} montant={eurosSigne(chomage.montant ?? 0)} onClick={() => allerAuPalier("chomage")} />
            </li>
          ) : (
            <li>
              <Ligne libelle="Le chômage" sous="un fonctionnaire n’y cotise pas, et n’en touche pas" montant="—" eteinte />
            </li>
          )}
        </ul>
        <p className="text-[13px] leading-relaxed text-encre-2">
          Tape une ligne pour changer ton palier. La retraite, elle, se calcule :{" "}
          {regime === "tns" || regime === "cipav" || regime === "micro"
            ? "par les règles du régime, faute de tout taux de remplacement publié pour les indépendants."
            : regime === "fonctionnaire"
              ? "avec le taux de remplacement que le COR projette pour ta génération, le même que pour un salarié du privé."
              : "avec le taux de remplacement que le COR projette pour ta génération."}{" "}
          Le montant est le capital qu’il faudrait pour te servir cette pension jusqu’à 85 ans.
        </p>
        {detail && detail.brut ? (
          <p className="border-l-[3px] border-bleu bg-papier-3 px-3 py-2.5 text-[13px] leading-relaxed text-encre-2">
            La formule des pensions civiles, elle, rend {euros(detail.totale)} € par mois. Elle est
            BRUTE, donc on ne la met pas dans la balance : {detail.note}.
          </p>
        ) : null}
      </Volet>

      <Volet titre="Et si j’avais tout placé moi-même ?">
        <p className="text-[14px] leading-relaxed text-encre-2">
          La défense dit qu’avec la même somme placée, tu aurais un million à 64 ans. La
          contre-expertise, hypothèse par hypothèse.
        </p>
        <div className="-mx-5 sm:-mx-6">
          <Alibi pieces={pieces} simulation={simulation} />
        </div>
      </Volet>
    </Carte>
  );
}
