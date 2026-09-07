"use client";

import { Carte, Chiffre, Commissaire, Kicker, Volet } from "./Carte";
import type { Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
import type { Simulation } from "@/lib/moteur";

/**
 * Écran 3 : le café du commissariat.
 *
 * Le commissaire pousse un gobelet. C'est offert, enfin, 1,20 € dont onze
 * centimes de TVA, mais ça, vous l'aviez déjà payé. Un seul chiffre : ce qui
 * part chaque mois en passant en caisse. C'est la première fois qu'on
 * comprend que le braquage passe par le caddie, avant de voir le total.
 */
export function Cafe({
  pieces,
  simulation,
  numero,
  total,
  suivant,
  retour,
}: {
  pieces: Pieces;
  simulation: Simulation;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
}) {
  const annee =
    simulation.carriere.annees.find((a) => a.age === simulation.entree.ageActuel)
    ?? simulation.carriere.annees[0];
  const parMois = annee.taxesConsommation / 12;
  const surLaCarriere = simulation.carriere.totaux.taxesConsommation;

  return (
    <Carte
      numero={numero}
      total={total}
      nature="Le café"
      retour={retour}
      photo={{ numero: 26, pieces, hauteur: 320, legende: "CLICHÉ 26 · C’EST OFFERT" }}
      action={{ libelle: "Suivant", onClick: suivant }}
    >
      <Commissaire>
        « Café ? C’est offert. Enfin, 1,20 €, dont onze centimes de TVA. Mais ça, vous l’aviez déjà payé. »
      </Commissaire>

      <Kicker couleur="rouge">Chaque mois, rien qu’en passant en caisse</Kicker>
      <Chiffre>{eurosSigne(parMois)}</Chiffre>
      <p className="text-[16px] leading-relaxed text-ligne italic">
        TVA, essence, alcool, tabac. Sans reçu, ou plutôt avec un reçu que personne ne lit. Sur la
        carrière, {eurosSigne(surLaCarriere)}.
      </p>

      <div className="grow" />

      <Volet titre="Comment on sait ça ?">
        <p className="text-[14px] leading-relaxed text-ligne">
          On ne connaît pas ton caddie. On applique à ce qu’il te reste après impôt le taux d’effort
          moyen des taxes sur la consommation de ton niveau de vie, tel que l’INSEE le mesure par
          décile : la TVA à tous les taux, plus les accises sur les carburants, l’alcool et le tabac.
          Ce mois-ci, ça fait <span className="font-medium text-papier">{euros(parMois)} €</span>. Le
          café, lui, est à 10 % : onze centimes sur 1,20 €.{" "}
          <a href="/methode" className="underline underline-offset-2">La méthode, ligne par ligne</a>.
        </p>
      </Volet>
    </Carte>
  );
}
