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
  entree: Required<Omit<Entree, "statut">> & { statut?: Statut };
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
    lignes: {
      retraite: LigneContrepartie;
      sante: LigneContrepartie;
      education: LigneContrepartie;
      chomage: LigneContrepartie;
    };
    fourchetteRetraite: { bas: number; haut: number };
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
  return placerSaRetraiteJs(simulation, placementId) as PlacementResultat;
}
