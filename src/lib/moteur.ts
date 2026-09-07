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
  CRANS_RENDEMENT as CRANS_RENDEMENT_JS,
  CRANS_FRAIS as CRANS_FRAIS_JS,
  placerSaRetraiteAuTaux as placerSaRetraiteAuTauxJs,
  PLACEMENT_DEFAUT as PLACEMENT_DEFAUT_JS,
  PALIERS as PALIERS_JS,
  PALIERS_DEFAUT as PALIERS_DEFAUT_JS,
  PRIX_ECOLE as PRIX_ECOLE_JS,
  PRIX_SANTE as PRIX_SANTE_JS,
  PRIX_CHOMAGE as PRIX_CHOMAGE_JS,
  montantEcole as montantEcoleJs,
  montantSante as montantSanteJs,
  montantChomage as montantChomageJs,
  santeSurUneVie as santeSurUneVieJs,
} from "@moteur/index.js";

/**
 * Le second plateau, chiffré par la personne en paliers. Les identifiants
 * sont ceux de `moteur/paliers.js`, et un identifiant inconnu fait LEVER le
 * moteur au lieu de compter zéro.
 */
export type PalierEcole = "rien" | "bac" | "etudes";
export type PalierSante = "fer" | "normal" | "fragile";
export type PalierChomage = "jamais" | "trou" | "deuxAns";
export type Paliers = {
  ecole: PalierEcole;
  sante: PalierSante;
  chomage: PalierChomage;
};
export type PosteDuPlateau = keyof Paliers;

export type ChoixPalier = {
  id: string;
  /** À la voix de la personne. */
  libelle: string;
  /** Le petit repère à droite : « BAC », « ×2,5 », « 6 MOIS ». */
  repere: string;
  /** Ce qui est compté, en mots. */
  regle: string;
};

export type DefinitionPalier = {
  question: string;
  defaut: string;
  choix: ChoixPalier[];
};

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
  activite?: "micro" | "ssi" | "cipav";
  /** Catégorie du micro. Sans effet sur les autres régimes. */
  categorieMicro?: "vente" | "services" | "liberal";
  /** Option du micro : l'impôt devient un pourcentage du chiffre d'affaires. */
  versementLiberatoire?: boolean;
  ageActuel?: number;
  cadre?: boolean;
  effectif?: number;
  parts?: number;
  /** Imposition commune : la décote est celle d'un couple. */
  couple?: boolean;
  perimetre?: Perimetre;
  /** Absent, école, santé et chômage restent nommés sans montant. */
  paliers?: Paliers;
};

export type LigneContrepartie = {
  /** null = nommée, mais non chiffrée : elle ne compte pas dans le total. */
  montant: number | null;
  libelle: string;
  /** true = chiffré au centime, false = ordre de grandeur assumé. */
  calcule: boolean;
  note: string;
  /** Le palier qui a produit le montant, quand il vient de la personne. */
  palier?: string;
  source?: string;
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
    paliers: Paliers | null;
  };
  carriere: {
    /** Une ligne par année de carrière, en euros d'aujourd'hui. */
    annees: Array<{
      age: number;
      brut: number;
      netAvantImpot: number;
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
  /** Ce qui arrive réellement sur le compte cette année, impôt déduit. */
  netApresImpotActuel: number;
  brutActuel: number;
  netAvantImpotActuel: number;
  cotisationsActuelles: number;
  saisieEstLeBrut: boolean;
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
/*
 * ⚠ Tout coché à l'ouverture. Le gros chiffre doit être le VRAI total, impôt et
 * TVA compris : deux cases éteintes par défaut faisaient afficher un braquage
 * amputé de sa moitié, et un lecteur qui ne comprenait pas les cases repartait
 * avec ce chiffre-là. Décocher reste possible, pour voir le procès poste par
 * poste.
 */
export const PERIMETRE_DEFAUT: Perimetre = {
  salariales: true,
  patronales: true,
  impotRevenu: true,
  consommation: true,
};

/** Le périmètre complet, celui qui sert à publier le salaire-pivot. */
export const PERIMETRE_COMPLET: Perimetre = {
  salariales: true,
  patronales: true,
  impotRevenu: true,
  consommation: true,
};


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

export const PALIERS = PALIERS_JS as Record<PosteDuPlateau, DefinitionPalier>;
export const PALIERS_DEFAUT = PALIERS_DEFAUT_JS as Paliers;
export const PRIX_ECOLE = PRIX_ECOLE_JS as {
  maternelle: number; elementaire: number; college: number; lyceeGeneral: number;
  universite: number; source: string; url: string;
};
export const PRIX_SANTE = PRIX_SANTE_JS as {
  tranches: Array<[number, number, number]>; dernierAge: number; source: string; url: string;
};
export const PRIX_CHOMAGE = PRIX_CHOMAGE_JS as {
  allocationNetteMensuelle: number; source: string; url: string;
};
export function montantEcole(id: PalierEcole): number {
  return montantEcoleJs(id) as number;
}
export function montantSante(id: PalierSante): number {
  return montantSanteJs(id) as number;
}
export function montantChomage(id: PalierChomage): number {
  return montantChomageJs(id) as number;
}
export function santeSurUneVie(): number {
  return santeSurUneVieJs() as number;
}
/** Le montant d'un palier, quel que soit le poste. */
export function montantDuPalier(poste: PosteDuPlateau, id: string): number {
  if (poste === "ecole") return montantEcole(id as PalierEcole);
  if (poste === "sante") return montantSante(id as PalierSante);
  return montantChomage(id as PalierChomage);
}
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


export type CranRendement = {
  id: string;
  nom: string;
  reel: number;
  nominal: number | null;
  source: string;
};

export type CranFrais = {
  id: string;
  nom: string;
  annuels: number;
  versement: number;
  source: string;
};

export const CRANS_RENDEMENT = CRANS_RENDEMENT_JS as CranRendement[];
export const CRANS_FRAIS = CRANS_FRAIS_JS as CranFrais[];

export type PlacementAuTaux = {
  reglage: { rendementReel: number; fraisAnnuels: number; fraisVersement: number };
  verse: number;
  capital: number;
  sansFrais: number;
  fraisPayes: number;
  equivalentPension: number;
  ecart: number;
  gagnant: boolean;
};

export function placerSaRetraiteAuTaux(
  simulation: Simulation,
  reglage: { rendementReel: number; fraisAnnuels: number; fraisVersement: number },
): PlacementAuTaux {
  return placerSaRetraiteAuTauxJs(simulation, reglage) as PlacementAuTaux;
}
