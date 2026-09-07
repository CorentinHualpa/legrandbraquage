import { Parcours } from "@/components/Parcours";
import { piecesDeposees } from "@/lib/images";

/**
 * Le parcours, en onze cartes. Une seule chose est calculée ICI, côté
 * serveur : l'inventaire des pièces photographiques versées au dossier. Tout
 * le reste tourne dans le navigateur de la personne, et rien n'en sort.
 *
 * ⚠ Le seuil de bascule ne peut PAS être calculé une fois pour toutes : il
 * dépend du régime, du périmètre coché ET des paliers choisis, et il n'existe
 * pas du tout pour un fonctionnaire d'État.
 */
export default function Page() {
  return <Parcours pieces={piecesDeposees()} />;
}
