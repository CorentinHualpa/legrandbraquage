"use client";

import { useState } from "react";

import { CarteAvis } from "./CarteAvis";
import { EnTete, Feuille, PiecesVersees, Renvoi, Scelle } from "./papier";
import type { Pieces } from "./Instruction";
import { requeteDuCas, type Cas } from "@/lib/lien";
import type { Simulation } from "@/lib/moteur";
import { SEUIL_ANNEES, anneesSansTravailler, objetPour } from "@/lib/objets";

export function AvisDeRecherche({
  pieces,
  simulation,
  netMensuel,
  cas,
}: {
  pieces: Pieces;
  simulation: Simulation;
  netMensuel: number;
  /** Tout ce que le lien doit transporter pour rouvrir CE dossier. */
  cas: Cas;
}) {
  const [copie, setCopie] = useState(false);
  const { plateauGauche, plateauDroit, verdict } = simulation;

  /*
   * ⚠ On vit de ce qui RESTE, pas du net avant impôt qu'on a saisi. Convertir
   * un total en années de vie sans travailler sur le chiffre saisi les
   * raccourcirait toutes, puisque ce chiffre est plus haut que le vrai niveau
   * de vie.
   */
  const annees = anneesSansTravailler(
    plateauGauche.total,
    simulation.netApresImpotActuel,
  );
  const objet =
    plateauGauche.total >= SEUIL_ANNEES
      ? `${annees.toFixed(1).replace(".", ",")} années de vie sans travailler`
      : objetPour(plateauGauche.total).nom;

  /*
   * Le lien pointe sur le dossier lui-même, avec le cas en paramètres.
   *
   * Il visait `/avis`, une page qui n'a jamais existé : tout lien partagé
   * tombait en 404, et c'est exactement le lien sur lequel repose la page.
   * Rouvrir le dossier vaut mieux qu'une carte séparée : le destinataire voit
   * le chiffre annoncé, puis change le salaire pour le sien sans repartir de
   * zéro.
   */
  const lien =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/${requeteDuCas(cas)}`;

  async function partager() {
    if (!lien) return;
    const texte = verdict.braquage
      ? `On m'a braqué. Le dossier est chiffré sur les barèmes officiels.`
      : `Braquage non constaté : je reçois plus que je ne verse. Vérifiez le vôtre.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Le Grand Braquage", text: texte, url: lien });
        return;
      }
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 3000);
    } catch {
      // Partage refusé ou annulé : rien à signaler, la carte reste à l'écran.
    }
  }

  return (
    <Feuille id="avis-de-recherche" className="mt-10 border-t-2 border-dashed border-ligne pt-2">
      <EnTete nature="PIÈCE À PLACARDER" titre="Avis de recherche" />

      <Scelle
        numero={6}
        nom="L'avis de recherche"
        ratio="3:4"
        legende="CLICHÉ 06 · LE CADRE EST RESTÉ VIDE"
        fichier={pieces[6]}
        className="mx-auto max-w-[240px]"
      />

      <CarteAvis
        preleve={plateauGauche.total}
        recu={plateauDroit.total}
        ecart={verdict.ecart}
        braquage={verdict.braquage}
        objet={objet}
        portrait={pieces[13]}
      />

      <button
        type="button"
        onClick={partager}
        className="bg-rouge px-4 py-3.5 text-center text-[16px] font-semibold text-papier transition-colors hover:bg-rouge-sombre"
      >
        {copie ? "Lien copié" : "Placarder mon avis de recherche"}
      </button>

      <Renvoi>
        Le lien porte ton salaire et le périmètre que tu as coché, rien d’autre :
        pas de nom, pas d’adresse, aucun identifiant. Celui qui l’ouvre voit le
        même dossier que toi, recalculé chez lui.
      </Renvoi>

      <PiecesVersees />
    </Feuille>
  );
}
