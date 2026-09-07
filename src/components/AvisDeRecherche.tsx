"use client";

import { useState } from "react";

import { CarteAvis } from "./CarteAvis";
import { EnTete, Feuille, PiecesVersees, Renvoi } from "./papier";
import type { Pieces } from "./Instruction";
import type { Perimetre, Simulation } from "@/lib/moteur";
import { SEUIL_ANNEES, anneesSansTravailler, objetPour } from "@/lib/objets";

function codePerimetre(p: Perimetre): string {
  return [p.salariales, p.patronales, p.impotRevenu, p.consommation]
    .map((b) => (b ? "1" : "0"))
    .join("");
}

export function AvisDeRecherche({
  pieces,
  simulation,
  netMensuel,
  perimetre,
}: {
  pieces: Pieces;
  simulation: Simulation;
  netMensuel: number;
  perimetre: Perimetre;
}) {
  const [copie, setCopie] = useState(false);
  const { plateauGauche, plateauDroit, verdict } = simulation;

  const annees = anneesSansTravailler(plateauGauche.total, netMensuel);
  const objet =
    plateauGauche.total >= SEUIL_ANNEES
      ? `${annees.toFixed(1).replace(".", ",")} années de vie sans travailler`
      : objetPour(plateauGauche.total).nom;

  const lien =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/avis?n=${netMensuel}&p=${codePerimetre(perimetre)}`;

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
    <Feuille className="mt-10 border-t-2 border-dashed border-ligne pt-2">
      <EnTete nature="PIÈCE À PLACARDER" titre="Avis de recherche" />

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
