"use client";

import { useEffect } from "react";

import { AGENT, HOTE, identifiantVisiteur } from "@/lib/dalevoz";

/**
 * LE COMMISSAIRE, JOIGNABLE DEPUIS N'IMPORTE QUELLE CARTE.
 *
 * ⚠ Avant, il n'était atteignable que par un volet replié sur la toute
 * dernière carte, sous un titre (« Parler au commissaire ») que personne
 * n'ouvre après avoir lu son verdict : le seul endroit du parcours où on peut
 * poser une question arrivait quand on n'en a plus (Coq, 09/09/2026, « ça
 * devrait être accessible tout le temps »). Le lanceur du widget vit donc en
 * bas à droite, sur les quatorze cartes.
 *
 * Le script est injecté UNE fois pour toute la visite, pas à chaque carte : le
 * widget monte son propre lanceur, garde son fil ouvert d'un écran à l'autre,
 * et une seconde instance dupliquerait la bulle en perdant la conversation.
 *
 * Il reçoit au passage le contexte du dossier (`src/lib/dalevoz.ts`), donc il
 * sait déjà le salaire, le statut et le verdict : on lui demande POURQUOI, on
 * ne lui redonne pas les chiffres.
 */
export function Commissariat() {
  const cle = process.env.NEXT_PUBLIC_DALEVOZ_KEY;

  useEffect(() => {
    if (!cle) return;
    if (document.querySelector("script[data-dalevoz-lanceur]")) return;

    const script = document.createElement("script");
    script.src = `${HOTE}/dalevoz-widget.js`;
    script.async = true;
    script.setAttribute("data-dalevoz-lanceur", "1");
    script.setAttribute("data-agent", AGENT);
    script.setAttribute("data-key", cle);
    script.setAttribute("data-host", HOTE);
    script.setAttribute("data-locale", "fr");
    // Pas de `data-mode` : le mode par défaut du widget EST le lanceur flottant.
    script.setAttribute("data-uid", identifiantVisiteur());
    script.setAttribute("data-title", "Le commissaire");
    document.body.appendChild(script);
  }, [cle]);

  return null;
}

/** Ouvre le fil depuis n'importe quel bouton du dossier. */
export function ouvrirLeCommissaire(): void {
  const w = window as unknown as { dalevoz?: { ouvrir?: () => void } };
  w.dalevoz?.ouvrir?.();
}
