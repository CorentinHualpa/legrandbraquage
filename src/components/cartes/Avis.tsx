"use client";

import { useState } from "react";

import { Carte, Volet } from "./Carte";
import { Audition } from "../Audition";
import { CarteAvis } from "../CarteAvis";
import type { Pieces } from "@/lib/images";
import { requeteDuCas, type Cas } from "@/lib/lien";
import type { Simulation } from "@/lib/moteur";
import { SEUIL_ANNEES, anneesSansTravailler, objetPour } from "@/lib/objets";

/**
 * Écran 13 : l'avis de recherche, collé sur le mur.
 *
 * Le lien rouvre CE dossier, réponses comprises, sur l'écran du verdict. Le
 * Braqueur s'interroge ici, au clic. Et on peut tout refaire.
 */
export function Avis({
  pieces,
  simulation,
  cas,
  numero,
  total,
  retour,
  recommencer,
}: {
  pieces: Pieces;
  simulation: Simulation;
  cas: Cas;
  numero: number;
  total: number;
  retour: () => void;
  recommencer: () => void;
}) {
  const [copie, setCopie] = useState(false);
  const { plateauGauche, plateauDroit, verdict } = simulation;

  const annees = anneesSansTravailler(plateauGauche.total, simulation.netApresImpotActuel);
  const objet =
    plateauGauche.total >= SEUIL_ANNEES
      ? `${annees.toFixed(1).replace(".", ",")} années de vie sans travailler`
      : objetPour(plateauGauche.total).nom;

  const lien =
    typeof window === "undefined" ? "" : `${window.location.origin}/${requeteDuCas(cas)}#verdict`;

  async function partager() {
    if (!lien) return;
    const texte = verdict.braquage
      ? "Sur toute une carrière, ils m’auront pris plus qu’ils ne m’auront rendu. Chiffré sur les barèmes officiels."
      : "Sur toute une carrière, ils m’auront rendu plus qu’ils ne m’auront pris. Vérifie le tien.";
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
    <Carte
      numero={numero}
      total={total}
      nature="Pièce à placarder"
      retour={retour}
      photo={{ numero: 6, pieces, hauteur: 220 }}
      action={{ libelle: copie ? "Lien copié" : "Partager", onClick: partager }}
      actionSecondaire={{ libelle: "Refaire la déposition", onClick: recommencer }}
      pied={
        <p className="text-center text-[12.5px] text-ligne">
          Le lien porte ton salaire, ton statut et tes réponses, rien d’autre.{" "}
          <a href="/methode" className="underline underline-offset-2">Comment c’est calculé.</a>
        </p>
      }
    >
      <div className="-mt-6 -rotate-[1.5deg]">
        <CarteAvis
          preleve={plateauGauche.total}
          recu={plateauDroit.total}
          ecart={verdict.ecart}
          braquage={verdict.braquage}
          objet={objet}
          portrait={pieces[13]}
        />
      </div>

      <div className="grow" />

      <Volet titre="Interroger le Braqueur">
        <div className="-mx-5 bg-papier text-encre sm:-mx-6">
          <Audition pieces={pieces} simulation={simulation} ouvrirAudition={() => {}} />
        </div>
      </Volet>
    </Carte>
  );
}
