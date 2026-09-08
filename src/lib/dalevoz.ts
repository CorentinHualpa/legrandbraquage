/**
 * CE QUE LA PAGE DIT AU COMMISSAIRE.
 *
 * La plateforme expose deux fonctions sous `window.dalevoz` : `contexte()`, un
 * ÉTAT qui s'écrase à chaque envoi, et `evenement()`, un INSTANT qui passe.
 * Le contexte entre dans le prompt du commissaire comme un bloc de FAITS, donc
 * il sait où en est le visiteur sans le lui redemander.
 *
 * ⚠ Le widget n'est monté qu'à l'ouverture de l'audition, et le parcours, lui,
 * parle bien avant. Sans file d'attente, tout ce que la page déclare entre la
 * déposition et le verdict serait perdu, et le commissaire recommencerait par
 * demander le salaire. Le stub ci-dessous empile les appels ; le widget les
 * rejoue à son montage.
 *
 * ⚠ Ce qu'on envoie est TOUT ce que l'agent acceptera : les variables sont
 * DÉCLARÉES sur lui, et le serveur refuse en silence toute clé inconnue. Ajouter
 * un champ ici sans le déclarer là-bas ne produit aucune erreur, juste une
 * variable qui n'arrive jamais. Les huit noms ci-dessous sont ceux de la
 * déclaration, au caractère près.
 */

type AppelEnAttente = [string, ...unknown[]];

interface ApiDaleVoz {
  q?: AppelEnAttente[];
  contexte?: (valeurs: Record<string, unknown>) => void;
  evenement?: (nom: string, donnees?: Record<string, unknown>) => void;
}

function api(): ApiDaleVoz | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { dalevoz?: ApiDaleVoz };
  if (!w.dalevoz) {
    const file: AppelEnAttente[] = [];
    w.dalevoz = {
      q: file,
      contexte: (valeurs) => file.push(["contexte", valeurs]),
      evenement: (nom, donnees) => file.push(["evenement", nom, donnees]),
    };
  }
  return w.dalevoz;
}

/** Ce que la page sait. Fusionne, idempotent, appelable à chaque rendu. */
export function contexte(valeurs: Record<string, unknown>) {
  api()?.contexte?.(valeurs);
}

/** Un instant. La réaction est décidée sur l'agent, jamais ici. */
export function evenement(nom: string, donnees?: Record<string, unknown>) {
  api()?.evenement?.(nom, donnees);
}
