"use client";

import { Carte, Chiffre, Commissaire, Kicker, Lien, Reponse, Volet } from "./Carte";
import type { Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
import {
  ALCOOL,
  CARBURANT,
  HABITUDES,
  TABAC,
  detailAccises,
  type Habitudes,
  type PosteHabitude,
  type Simulation,
} from "@/lib/moteur";

const POSTES: PosteHabitude[] = ["tabac", "carburant", "alcool"];

/**
 * Écran 3 : le café du commissariat.
 *
 * Le commissaire pousse un gobelet, puis pose trois questions. Chaque réponse
 * ajoute ses taxes au total du mois, et le chiffre bouge sous les yeux.
 *
 * ⚠ Le texte de cet écran a été jugé « trop technique, pas assez RP » (Coq,
 * 08/09/2026). Règle pour la suite : à l'écran, on dit ce qui se passe (« ils
 * prennent leur part à chaque passage en caisse »), jamais le nom du
 * mécanisme. « TVA », « accises » et « taux d'effort » vivent dans le volet,
 * avec leurs sources, et nulle part ailleurs.
 */
export function Cafe({
  pieces,
  simulation,
  habitudes,
  choisir,
  numero,
  total,
  suivant,
  retour,
}: {
  pieces: Pieces;
  simulation: Simulation;
  habitudes: Habitudes;
  choisir: (poste: PosteHabitude, id: string) => void;
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
  const detail = detailAccises(habitudes);
  const accisesMois = (detail.tabac + detail.carburant + detail.alcool) / 12;

  return (
    <Carte
      numero={numero}
      total={total}
      nature="Le café"
      retour={retour}
      photo={{ numero: 26, pieces, hauteur: 250, legende: "CLICHÉ 26 · C’EST OFFERT" }}
      action={{ libelle: "Suivant", onClick: suivant }}
    >
      <Commissaire>
        « Café ? Cadeau. Enfin, 1,20 €, dont onze centimes qui repartent chez eux. Vous les aviez déjà
        payés, remarquez. Trois questions et je vous laisse boire. »
      </Commissaire>

      {POSTES.map((poste) => (
        <div key={poste} className="flex flex-col gap-1.5">
          <Kicker>{HABITUDES[poste].question}</Kicker>
          <div className="flex flex-col gap-1.5">
            {HABITUDES[poste].choix.map((c) => (
              <Reponse key={c.id} actif={habitudes[poste] === c.id} onClick={() => choisir(poste, c.id)}>
                <span className="block text-[15.5px] leading-tight">{c.libelle}</span>
                <span className={`block text-[12.5px] leading-snug ${habitudes[poste] === c.id ? "text-encre-3" : "text-ligne"}`}>
                  {c.pointe}
                </span>
              </Reponse>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-1 pt-1">
        <Kicker couleur="rouge">Chaque mois, à la caisse, sans rien signer</Kicker>
        <Chiffre taille={48}>{eurosSigne(parMois)}</Chiffre>
        <p className="text-[15px] leading-relaxed text-ligne italic">
          Ils prennent leur part sur tout ce que vous achetez, du pain au plein d’essence, et vous ne
          voyez jamais passer la note. Sur une carrière, {eurosSigne(surLaCarriere)}.
        </p>
      </div>

      <div className="grow" />

      <Volet titre="D’où sortent ces chiffres ?">
        <p className="text-[14px] leading-relaxed text-ligne">
          Sur tout ce que vous achetez, la TVA se cache dans le prix affiché. On ne connaît pas votre
          caddie : on applique à ce qu’il vous reste après impôt le taux d’effort moyen des gens qui
          vivent comme vous, mesuré par décile de niveau de vie. Ça fait{" "}
          <span className="font-medium text-papier">{euros(parMois - accisesMois)} €</span> par mois. Le
          café du commissaire, lui, est à 10 % : onze centimes sur 1,20 €.
        </p>
        <p className="text-[14px] leading-relaxed text-ligne">
          S’y ajoutent les taxes sur ce que vous venez de dire,{" "}
          <span className="font-medium text-papier">{euros(accisesMois)} €</span> par mois : un paquet à{" "}
          {TABAC.prixPaquet.toFixed(2).replace(".", ",")} € dont {Math.round(TABAC.partTaxes * 100)} % de
          taxes, soit <span className="font-medium text-papier">{detail.taxesParPaquet.toFixed(2).replace(".", ",")} €</span>{" "}
          par paquet ; un plein de {CARBURANT.litres} litres à{" "}
          {CARBURANT.prixPlein.toFixed(2).replace(".", ",")} € dont{" "}
          <span className="font-medium text-papier">{euros(detail.taxesParPlein)} €</span> de taxes ;
          l’alcool en ordre de grandeur, {ALCOOL.parfoisParAn} € par an pour une bouteille par semaine,{" "}
          {ALCOOL.chaqueSoirParAn} € pour un verre chaque soir.
        </p>
        <p className="text-[13px] leading-relaxed text-ligne">
          Ce sont des ESTIMATIONS, et l’alcool est celle qui l’assume le plus : le droit dépend du
          produit, un verre de vin n’est presque pas taxé, un verre de spiritueux beaucoup. {TABAC.source}.{" "}
          {CARBURANT.source}. {ALCOOL.source}.
        </p>
        <Lien href="/methode">La méthode, ligne par ligne</Lien>
      </Volet>
    </Carte>
  );
}
