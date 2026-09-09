import fs from "node:fs";
import path from "node:path";

/**
 * CE QUE LE COMMISSAIRE A DANS SA BASE, LU DEPUIS LE DÉPÔT.
 *
 * La page « Les coulisses » annonce combien de fiches il consulte et sur quels
 * organismes elles s'appuient. Ces deux chiffres ne sont PAS écrits à la main :
 * ils sont comptés dans `agent/savoir/`, qui est la source de la base (le
 * script `braquage-pousser-savoir.ts` la pousse de là vers Dale Voz).
 *
 * ⚠ La raison est simple : une page qui annonce « dix-neuf fiches » pendant
 * que l'agent en a vingt-deux est un mensonge qui se fabrique tout seul, et
 * personne ne le verra jamais. Ici, ajouter une fiche met la page à jour.
 *
 * Lu au rendu, côté serveur, comme `piecesDeposees()` pour les images.
 */

export interface EtatSavoir {
  /** Combien de fiches le commissaire a réellement sous les yeux. */
  fiches: number;
  /** Les organismes cités en source, dédoublonnés, dans l'ordre alphabétique. */
  sources: string[];
}

/** Le nom lisible d'un organisme depuis l'hôte d'une URL de source. */
const ORGANISMES: Record<string, string> = {
  "urssaf.fr": "URSSAF",
  "mon-entreprise.urssaf.fr": "URSSAF",
  "insee.fr": "INSEE",
  "cor-retraites.fr": "COR",
  "www.cor-retraites.fr": "COR",
  "fipeco.fr": "Fipeco",
  "impots.gouv.fr": "DGFiP",
  "drees.solidarites-sante.gouv.fr": "DREES",
  "legifrance.gouv.fr": "Légifrance",
  "www.legifrance.gouv.fr": "Légifrance",
};

export function etatDuSavoir(): EtatSavoir {
  const dossier = path.join(process.cwd(), "agent", "savoir");
  let fichiers: string[] = [];
  try {
    fichiers = fs.readdirSync(dossier).filter((f) => f.endsWith(".md") && !f.startsWith("LISEZ-MOI"));
  } catch {
    // Dépôt partiel ou build hors contexte : on n'invente pas de chiffre.
    return { fiches: 0, sources: [] };
  }

  const sources = new Set<string>();
  for (const f of fichiers) {
    const brut = fs.readFileSync(path.join(dossier, f), "utf8");
    const m = /^source:\s*"?([^"\n\r]+)"?/m.exec(brut);
    if (!m) continue;
    try {
      const hote = new URL(m[1]!.trim()).hostname;
      const nom = ORGANISMES[hote] ?? ORGANISMES[hote.replace(/^www\./, "")];
      if (nom) sources.add(nom);
    } catch {
      // Une source qui n'est pas une URL ne compte pas comme un organisme.
    }
  }

  return { fiches: fichiers.length, sources: [...sources].sort((a, b) => a.localeCompare(b, "fr")) };
}
