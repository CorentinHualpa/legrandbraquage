import type { Metadata } from "next";

import { Parcours } from "@/components/Parcours";
import { piecesDeposees } from "@/lib/images";
import { casDepuisRequete } from "@/lib/lien";
import { uneDuCas } from "@/lib/une";

/**
 * Le parcours, en dix-sept cartes. Une seule chose est calculée ICI, côté
 * serveur : l'inventaire des pièces photographiques versées au dossier. Tout
 * le reste tourne dans le navigateur de la personne, et rien n'en sort.
 *
 * ⚠ Le seuil de bascule ne peut PAS être calculé une fois pour toutes : il
 * dépend du régime, du périmètre coché ET des paliers choisis, et il n'existe
 * pas du tout pour un fonctionnaire d'État.
 */

type Requete = Promise<Record<string, string | string[] | undefined>>;

/**
 * L'aperçu du lien porte les chiffres de CELUI qui partage.
 *
 * Un lien partagé transporte tout le dossier dans sa requête. Tant que
 * l'image OpenGraph était un fichier posé dans `public/`, WhatsApp et
 * LinkedIn affichaient la même vignette à tout le monde : le message annonçait
 * un million, l'aperçu en montrait un autre. `/api/avis` refabrique la une aux
 * valeurs du lien, et l'`alt` les redit en toutes lettres.
 *
 * ⚠ Lire la requête rend cette page dynamique. C'est le prix : le rendu reste
 * une coquille (tout le parcours est côté navigateur), mais le HTML n'est plus
 * mis en cache par le CDN.
 */
export async function generateMetadata({ searchParams }: { searchParams: Requete }): Promise<Metadata> {
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(params)) {
    if (typeof valeur === "string") q.set(cle, valeur);
  }
  const cas = casDepuisRequete(`?${q.toString()}`);
  if (!cas) return {};
  try {
    const une = uneDuCas(cas);
    const image = {
      url: `/api/avis?${q.toString()}`,
      width: 1200,
      height: 630,
      alt:
        `La Gazette des Prélèvements : braqué de ${une.preleve} sur une carrière. `
        + `Placés en ${une.placement}, ils auraient fait ${une.capital}, contre ${une.recu} rendus. `
        + `${une.braquage ? "Manque à gagner" : "En votre faveur"} : ${une.ecart}. `
        + `${une.braquage ? "Coupable" : "Relaxe"}.`,
    };
    return { openGraph: { images: [image] }, twitter: { card: "summary_large_image", images: [image.url] } };
  } catch {
    // Régime non instruit : on garde l'image par défaut plutôt qu'une fausse.
    return {};
  }
}

export default function Page() {
  return <Parcours pieces={piecesDeposees()} />;
}
