"use client";

import { Carte, Chiffre, Commissaire, Kicker, Reponse, Volet } from "./Carte";
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
 * Le commissaire pousse un gobelet, 1,20 € dont onze centimes de TVA, et
 * enchaîne sur trois questions : vous fumez, la voiture, un verre ? Chaque
 * réponse ajoute ses accises à la TVA, et le chiffre du mois bouge sous les
 * yeux. La TVA elle-même vient du taux d'effort moyen de ton niveau de vie ;
 * les accises, personne ne peut les deviner, donc c'est toi qui le dis.
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
  const tvaMois = parMois - accisesMois;

  return (
    <Carte
      numero={numero}
      total={total}
      nature="Le café"
      retour={retour}
      photo={{ numero: 26, pieces, hauteur: 260, legende: "CLICHÉ 26 · C’EST OFFERT" }}
      action={{ libelle: "Suivant", onClick: suivant }}
    >
      <Commissaire>
        « Café ? C’est offert. Enfin, 1,20 €, dont onze centimes de TVA. Mais ça, vous l’aviez déjà payé.
        Au fait, trois petites questions. »
      </Commissaire>

      {POSTES.map((poste) => (
        <div key={poste} className="flex flex-col gap-1.5">
          <Kicker>{HABITUDES[poste].question}</Kicker>
          <div className="grid grid-cols-3 gap-1.5">
            {HABITUDES[poste].choix.map((c) => (
              <Reponse key={c.id} actif={habitudes[poste] === c.id} onClick={() => choisir(poste, c.id)} centre>
                <span className="text-[13.5px] leading-tight">{c.libelle}</span>
              </Reponse>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-1 pt-1">
        <Kicker couleur="rouge">Chaque mois, rien qu’en passant en caisse</Kicker>
        <Chiffre taille={48}>{eurosSigne(parMois)}</Chiffre>
        <p className="text-[14.5px] leading-relaxed text-ligne italic">
          {euros(tvaMois)} € de TVA sur ce que tu achètes, {euros(accisesMois)} € d’accises sur ce que tu
          viens de dire. Sur la carrière, {eurosSigne(surLaCarriere)}.
        </p>
      </div>

      <div className="grow" />

      <Volet titre="Comment on sait ça ?">
        <p className="text-[14px] leading-relaxed text-ligne">
          La TVA : on ne connaît pas ton caddie, on applique à ce qu’il te reste après impôt le taux
          d’effort moyen de ton niveau de vie, tel que le Conseil des prélèvements obligatoires le mesure
          par décile. Le café, lui, est à 10 % : onze centimes sur 1,20 €.
        </p>
        <p className="text-[14px] leading-relaxed text-ligne">
          Les accises, à tes réponses : un paquet à {TABAC.prixPaquet.toFixed(2).replace(".", ",")} € dont{" "}
          {Math.round(TABAC.partTaxes * 100)} % de taxes, soit{" "}
          <span className="font-medium text-papier">{detail.taxesParPaquet.toFixed(2).replace(".", ",")} €</span> par paquet ;
          un plein de {CARBURANT.litres} L à {CARBURANT.prixPlein.toFixed(2).replace(".", ",")} € dont{" "}
          <span className="font-medium text-papier">{euros(detail.taxesParPlein)} €</span> de TICPE et de TVA ;
          l’alcool en ordre de grandeur, {ALCOOL.parfoisParAn} € par an pour une bouteille de vin par semaine,{" "}
          {ALCOOL.chaqueSoirParAn} € pour un verre chaque soir.
        </p>
        <p className="text-[13px] leading-relaxed text-ligne">
          {TABAC.source}. {CARBURANT.source}. {ALCOOL.source}.{" "}
          <a href="/methode" className="underline underline-offset-2">La méthode, ligne par ligne</a>.
        </p>
      </Volet>
    </Carte>
  );
}
