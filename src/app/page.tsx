import { Instruction } from "@/components/Instruction";
import { piecesDeposees } from "@/lib/images";

/**
 * Le dossier d'instruction. Tout se joue sur cette page : dépôt de plainte,
 * procès-verbal, expertise contradictoire, jugement.
 *
 * Une seule chose est calculée ICI, côté serveur : l'inventaire des pièces
 * photographiques versées au dossier. Tout le reste tourne dans le navigateur
 * de la personne, et rien n'en sort.
 *
 * ⚠ Le salaire pivot, lui, ne peut PAS être calculé une fois pour toutes : il
 * dépend du régime, du versant et du périmètre coché, et il n'existe pas du
 * tout pour un fonctionnaire d'État. Le figer côté serveur reviendrait à servir
 * le seuil du salarié du privé à tout le monde.
 */
export default function Page() {
  return <Instruction pieces={piecesDeposees()} />;
}
