"use client";

import { Carte, Chiffre, Commissaire, Kicker, Ligne, Volet } from "./Carte";
import type { Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
import { PALIERS, type Paliers, type PosteDuPlateau, type Simulation } from "@/lib/moteur";

/**
 * Écran 10 : sur toute ta vie, ils t'auront rendu. Juste avant la bourse et le verdict.
 *
 * La retraite est CALCULÉE, les trois autres lignes sont les réponses qu'on
 * vient de donner au commissaire. Taper une ligne ramène à sa question.
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
    <Carte
      numero={numero}
      total={total}
      nature="Ce qu’ils ont laissé"
      retour={retour}
      photo={{ numero: 14, pieces, hauteur: 300, legende: "CLICHÉ 14 · LE MOT DU BRAQUEUR" }}
      action={{ libelle: "Une dernière question", onClick: suivant }}
    >
      <Kicker couleur="bleu">Et sur toute ta vie, ils t’auront rendu</Kicker>
      <Chiffre>{eurosSigne(plateauDroit.total)}</Chiffre>
      <Commissaire>
        « Retraite comprise, jusqu’à 85 ans. {euros(plateauDroit.pensionMensuelle)} € par mois, pension seule.
        Je vous l’ai dit, ils ne sont pas si mauvais. »
      </Commissaire>

      <div className="grow" />

      <Volet titre="Quoi, exactement ?" ouvertParDefaut>
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
        <p className="text-[13px] leading-relaxed text-ligne">
          Tape une ligne pour changer ta réponse. La retraite, elle, se calcule :{" "}
          {regime === "tns" || regime === "cipav" || regime === "micro"
            ? "par les règles du régime, faute de tout taux de remplacement publié pour les indépendants."
            : "avec le taux de remplacement que le COR projette pour ta génération."}{" "}
          Le montant est le capital qu’il faudrait pour te servir cette pension jusqu’à 85 ans.
        </p>
        {detail && detail.brut ? (
          <p className="border-l-2 border-papier/40 pl-3 text-[13px] leading-relaxed text-ligne">
            La formule des pensions civiles, elle, rend {euros(detail.totale)} € par mois. Elle est BRUTE,
            donc on ne la met pas dans la balance : {detail.note}.
          </p>
        ) : null}
      </Volet>
    </Carte>
  );
}
