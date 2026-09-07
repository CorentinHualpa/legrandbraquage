import { Instruction } from "@/components/Instruction";
import { piecesDeposees } from "@/lib/images";
import { PERIMETRE_COMPLET, salairePivot } from "@/lib/moteur";

/**
 * Le dossier d'instruction. Tout se joue sur cette page : dépôt de plainte,
 * procès-verbal, expertise contradictoire, jugement.
 *
 * Deux choses sont calculées ICI, côté serveur, une fois pour toutes :
 * l'inventaire des pièces photographiques versées au dossier, et le salaire
 * pivot, qui coûte quarante simulations et ne dépend d'aucune saisie. Tout le
 * reste tourne dans le navigateur de la personne, et rien n'en sort.
 */
export default function Page() {
  const pieces = piecesDeposees();
  const pivot = salairePivot({ perimetre: PERIMETRE_COMPLET });

  return <Instruction pieces={pieces} pivot={pivot} />;
}
