/**
 * Le pont entre le moteur de calcul et le site.
 *
 * Le moteur vit dans `moteur/`, en modules ES natifs sans dépendance, et il est
 * publié tel quel : c'est la seule façon de rendre le résultat opposable. Ce
 * fichier ne calcule RIEN, il ne fait que typer ce que le moteur rend. Toute
 * règle de calcul qu'on serait tenté d'écrire ici a sa place dans `moteur/`,
 * où elle sera couverte par `node --test moteur/`.
 */

import {
  simuler as simulerJs,
  salairePivot as salairePivotJs,
  PALIERS_ALIBI as PALIERS_ALIBI_JS,
  ALIBI_INDICE_NU as ALIBI_INDICE_NU_JS,
  capitalApresRetraits as capitalApresRetraitsJs,
  heureDeLiberation as heureDeLiberationJs,
  placerSaRetraite as placerSaRetraiteJs,
  PLACEMENTS as PLACEMENTS_JS,
  PLACEMENT_DEFAUT as PLACEMENT_DEFAUT_JS,
} from "@moteur/index.js";

export type Statut = "salarie" | "independant" | "fonctionnaire" | "tpe";

/** Ce que l'utilisateur empile lui-même, dans cet ordre. */
export type Perimetre = {
  salariales: boolean;
  patronales: boolean;
  impotRevenu: boolean;
  consommation: boolean;
};

export type Entree = {
  netMensuel: number;
  statut?: Statut;
  /** Obligatoire pour un patron de TPE : c'est elle qui décide du régime. */
  formeTpe?: "sarl-majoritaire" | "sas";
  /** Versant de la fonction publique. Sans effet sur les autres statuts. */
  versant?: "fpe" | "fpt" | "fph";
  /**
   * Sous quel régime cotise un indépendant. Sans effet sur les autres statuts.
   * Absent, il vaut la sécurité sociale des indépendants : c'est le régime de
   * la très grande majorité, libéraux non réglementés compris depuis 2019.
   */
  activite?: "ssi" | "cipav";
  ageActuel?: number;
  cadre?: boolean;
  effectif?: number;
  parts?: number;
  perimetre?: Perimetre;
};

export type LigneContrepartie = {
  montant: number;
  libelle: string;
  /** true = chiffré au centime, false = ordre de grandeur assumé. */
  calcule: boolean;
  note: string;
};

export type Simulation = {
  entree: {
    netMensuel: number;
    statut: Statut;
    regime: string;
    versant: string;
    ageActuel: number;
    cadre: boolean;
    effectif: number;
    parts: number;
    perimetre: Perimetre;
  };
  carriere: {
    /** Une ligne par année de carrière, en euros d'aujourd'hui. */
    annees: Array<{
      age: number;
      brut: number;
      netApresImpot: number;
      salariales: number;
      patronales: number;
      reductionRgdu: number;
      impotRevenu: number;
      taxesConsommation: number;
      coutEmployeur: number;
      cotisationVieillesse: number;
      /** Traitement indiciaire. Vaut le brut pour un régime qui n'en distingue pas. */
      tib: number;
      primes: number;
    }>;
    totaux: {
      salariales: number;
      patronales: number;
      impotRevenu: number;
      taxesConsommation: number;
      cotisationVieillesse: number;
      reductionRgdu: number;
    };
  };
  plateauGauche: {
    total: number;
    lignes: {
      salariales: number;
      patronales: number;
      impotRevenu: number;
      consommation: number;
    };
    reductionRgdu: number;
  };
  plateauDroit: {
    total: number;
    pensionMensuelle: number;
    tauxRemplacement: number;
    /** `chomage` est ABSENT pour un fonctionnaire : il ne cotise pas au chômage. */
    lignes: {
      retraite: LigneContrepartie;
      sante: LigneContrepartie;
      education: LigneContrepartie;
      chomage?: LigneContrepartie;
    };
    fourchetteRetraite: { bas: number; haut: number };
    /**
     * La pension rendue par la FORMULE, quand le régime en publie une. Elle est
     * BRUTE, contrairement à la pension du plateau : ne jamais l'utiliser pour
     * la balance, seulement pour la montrer.
     */
    detailPension:
      | {
          brut: true;
          base: number;
          renteRafp: number;
          points: number;
          totale: number;
          minimumGaranti: boolean;
          note: string;
          versant?: string;
        }
      | {
          brut: false;
          regime: "tns";
          base: number;
          complementaire: number;
          points: number;
          revenuAnnuelMoyen: number;
          totale: number;
          anneesRetenues: number;
          note: string;
          ecartAvecLObserve: {
            pensionMoyenneObservee: number;
            source: string;
            pourquoi: string;
          };
        }
      /**
       * ⚠ La pension d'un libéral CIPAV n'a PAS la même forme que celle d'un
       * artisan, et le type le disait faux : `ecartAvecLObserve` y était promis
       * pour toute pension non brute, alors qu'elle n'existe que chez
       * l'artisan. L'écran lisait donc une propriété absente et la page tombait
       * entière. Le champ `regime` est le discriminant, on ne devine plus
       * d'après les clés présentes.
       */
      | {
          brut: false;
          regime: "cipav";
          base: number;
          complementaire: number;
          points: number;
          pointsBase: number;
          totale: number;
          anneesRetenues: number;
          note: string;
          reserve: { quoi: string; effet: string; source: string };
        }
      | null;
  };
  verdict: {
    braquage: boolean;
    ecart: number;
    libelle: string;
  };
};

export type PalierAlibi = {
  id: string;
  montant: number;
  titre: string;
  detail: string;
  source?: string;
};

/** Le périmètre de départ : ce qu'on voit sur sa fiche de paie, rien de plus. */
export const PERIMETRE_DEFAUT: Perimetre = {
  salariales: true,
  patronales: true,
  impotRevenu: false,
  consommation: false,
};

/** Le périmètre complet, celui qui sert à publier le salaire-pivot. */
export const PERIMETRE_COMPLET: Perimetre = {
  salariales: true,
  patronales: true,
  impotRevenu: true,
  consommation: true,
};

export const LIGNES_PERIMETRE = [
  {
    cle: "salariales" as const,
    geste: "Pris sur ta paie, sous tes yeux",
    nom: "cotisations salariales",
  },
  {
    cle: "patronales" as const,
    geste: "Pris avant ta paie, sans te le dire",
    nom: "cotisations patronales",
  },
  {
    cle: "impotRevenu" as const,
    geste: "Repris une fois par an, par courrier",
    nom: "impôt sur le revenu",
  },
  {
    cle: "consommation" as const,
    geste: "Repris à chaque caddie, sans reçu",
    nom: "TVA et taxes de consommation",
  },
];

export function simuler(entree: Entree): Simulation {
  return simulerJs(entree) as Simulation;
}

/**
 * Le salaire où la balance bascule, pour un régime et un périmètre donnés.
 *
 * Rend `null` quand il n'y a AUCUNE bascule sur la plage, ce qui est un
 * résultat et non une panne : pour un fonctionnaire d'État au périmètre
 * complet, la balance ne penche en faveur de l'agent à aucun niveau de
 * traitement, parce que la contribution de l'État à son propre régime pèse
 * 82,28 % du traitement indiciaire. Toute surface qui affiche ce cas doit
 * afficher l'avertissement du COR avec.
 */
export function salairePivot(opts: Partial<Entree> = {}): number | null {
  return salairePivotJs(opts) as number | null;
}

export const PALIERS_ALIBI = PALIERS_ALIBI_JS as PalierAlibi[];
export const ALIBI_INDICE_NU = ALIBI_INDICE_NU_JS as number;

export function capitalApresRetraits(n: number): number {
  return capitalApresRetraitsJs(n) as number;
}

export type Liberation = {
  /** Part des prélèvements dans le COÛT DU TRAVAIL. Le dénominateur est nommé. */
  part: number;
  /** Les mêmes prélèvements rapportés à ce qui arrive sur le compte. */
  partDuNet: number;
  preleve: number;
  coutEmployeur: number;
  net: number;
  jour: { jour: number; mois: string; texte: string };
  rangJour: number;
  heure: { heures: number; minutes: number };
  heureTexte: string;
};

export function heureDeLiberation(
  simulation: Simulation,
  opts?: { avecConsommation?: boolean },
): Liberation {
  return heureDeLiberationJs(simulation, opts) as Liberation;
}

export type Placement = {
  id: string;
  nom: string;
  detail: string;
  rendementReel: number;
  fraisAnnuels: number;
  fraisVersement: number;
  source: string;
  note: string;
  defaut?: boolean;
};

export type PlacementResultat = {
  placement: Placement;
  verse: number;
  capital: number;
  sansFrais: number;
  fraisPayes: number;
  equivalentPension: number;
  ecart: number;
  gagnant: boolean;
};

export const PLACEMENTS = PLACEMENTS_JS as Placement[];
export const PLACEMENT_DEFAUT = PLACEMENT_DEFAUT_JS as string;

export function placerSaRetraite(
  simulation: Simulation,
  placementId?: string,
): PlacementResultat {
  // Le moteur n'a besoin que du flux de cotisation vieillesse et du capital
  // équivalent à la pension. Le type inféré depuis le JS est structurellement
  // plus strict que le nôtre sur des champs que cette fonction ne lit pas
  // (le chômage, absent chez un fonctionnaire) : on la nourrit telle quelle.
  return placerSaRetraiteJs(
    simulation as unknown as Parameters<typeof placerSaRetraiteJs>[0],
    placementId,
  ) as PlacementResultat;
}
