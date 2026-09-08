"use client";

import { Carte, Chiffre, Commissaire, Kicker, Ligne, Volet } from "./Carte";
import type { Pieces } from "@/lib/images";
import { texte } from "@/lib/repliques";
import { euros, eurosSigne } from "@/lib/format";
import type { Simulation } from "@/lib/moteur";
import { NOMS_REGIME, type Regime } from "@/lib/statuts";

/**
 * Écran 6 : le témoin.
 *
 * « On a un témoin. Votre voisin. Même net que vous, mais pas le même
 * statut. » Le même net en salarié et en indépendant, côte à côte : deux
 * chiffres, une phrase. C'est la comparaison qui manquait depuis le départ,
 * et elle tient dans le registre du commissariat.
 *
 * ⚠ Le témoin est calculé sur le NET AVANT IMPÔT de la personne, pas sur ce
 * qu'elle a saisi : un micro saisit son chiffre d'affaires, et lui coller un
 * voisin salarié « au même chiffre » comparerait un CA à une paie.
 */
export function Temoin({
  pieces,
  simulation,
  temoin,
  numero,
  total,
  suivant,
  retour,
}: {
  pieces: Pieces;
  simulation: Simulation;
  /** La même personne, dans l'autre statut. Null quand le voisin n'a pas pu être calculé. */
  temoin: Simulation | null;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
}) {
  const moi = simulation.plateauGauche.total;
  const lui = temoin?.plateauGauche.total ?? null;
  const regimeMoi = NOMS_REGIME[simulation.entree.regime as Regime];
  const regimeLui = temoin ? NOMS_REGIME[temoin.entree.regime as Regime] : "";
  const ecart = lui !== null ? moi - lui : 0;

  return (
    <Carte
      numero={numero}
      total={total}
      nature="Le témoin"
      retour={retour}
      photo={{ numero: 27, pieces, hauteur: 300, legende: "CLICHÉ 27 · DERRIÈRE LA VITRE" }}
      action={{ libelle: "Suivant", onClick: suivant }}
    >
      <Commissaire>
        « {texte("temoin")} Même net que vous, {euros(simulation.netAvantImpotActuel)} € par mois,
        mais {regimeLui ? `en ${regimeLui}` : "pas le même statut"}. »
      </Commissaire>

      {lui !== null ? (
        <>
          <Kicker couleur="rouge">Lui, sur 43 ans, ils lui auront pris</Kicker>
          <Chiffre taille={44}>{eurosSigne(lui)}</Chiffre>
          <p className="text-[16px] leading-relaxed text-ligne italic">
            {ecart > 0
              ? `${eurosSigne(ecart)} de moins que vous. `
              : `${eurosSigne(-ecart)} de plus que vous. `}
            {temoin && temoin.plateauDroit.pensionMensuelle < simulation.plateauDroit.pensionMensuelle
              ? `Mais sa pension sera de ${euros(temoin.plateauDroit.pensionMensuelle)} € par mois, contre ${euros(simulation.plateauDroit.pensionMensuelle)} € pour vous.`
              : temoin
                ? `Et sa pension sera de ${euros(temoin.plateauDroit.pensionMensuelle)} € par mois, contre ${euros(simulation.plateauDroit.pensionMensuelle)} € pour vous.`
                : ""}
          </p>
        </>
      ) : (
        <p className="text-[16px] leading-relaxed text-ligne italic">
          Le voisin n’a pas voulu parler. Son régime n’est pas instruit.
        </p>
      )}

      <div className="grow" />

      {temoin ? (
        <Volet titre="Vous deux, ligne par ligne">
          <ul className="flex flex-col">
            <li><Ligne libelle={`Vous, ${regimeMoi}`} montant={eurosSigne(moi)} /></li>
            <li><Ligne libelle={`Lui, ${regimeLui}`} montant={eurosSigne(lui ?? 0)} /></li>
            <li><Ligne libelle="Votre pension, par mois" montant={`${euros(simulation.plateauDroit.pensionMensuelle)} €`} /></li>
            <li><Ligne libelle="La sienne, par mois" montant={`${euros(temoin.plateauDroit.pensionMensuelle)} €`} /></li>
          </ul>
          <p className="text-[13px] leading-relaxed text-ligne">
            Même net avant impôt, même foyer, mêmes réponses. Ce qui change : la part employeur, qui
            n’existe pas chez un indépendant, et les règles de sa retraite, calculées faute de tout
            taux de remplacement publié. Ce n’est pas un classement, c’est un dénominateur.
          </p>
        </Volet>
      ) : null}
    </Carte>
  );
}
