import type { Statut } from "./moteur";

/**
 * Les quatre qualités de victime, et ce que chacune vaut réellement dans le
 * moteur aujourd'hui.
 *
 * ⚠ Le patron de TPE n'est PAS un troisième régime, et c'est ce qui fait tenir
 * la v1 : un gérant majoritaire de SARL est un travailleur non salarié, donc
 * exactement le moteur de l'indépendant ; un président de SAS est un assimilé
 * salarié, donc le moteur du salarié moins l'assurance chômage. Le bouton TPE
 * pose donc une question de forme juridique et aiguille, il ne calcule rien de
 * neuf. Deux chantiers, pas trois.
 */

export type Regime = "salarie" | "tns" | "fonctionnaire" | "assimile-salarie";

export type FormeTpe = "sarl-majoritaire" | "sas";

export const STATUTS: Array<{
  id: Statut;
  libelle: string;
  /** Ce que dit la fiche de paie, ou son absence. */
  precision: string;
}> = [
  { id: "salarie", libelle: "Salarié du privé", precision: "un bulletin de paie chaque mois" },
  { id: "independant", libelle: "Indépendant", precision: "freelance, artisan, commerçant, profession libérale" },
  { id: "fonctionnaire", libelle: "Fonctionnaire", precision: "État, territoriale ou hospitalière" },
  { id: "tpe", libelle: "Patron de TPE", precision: "vous vous versez une rémunération" },
];

export const FORMES_TPE: Array<{
  id: FormeTpe;
  libelle: string;
  precision: string;
  regime: Regime;
}> = [
  {
    id: "sarl-majoritaire",
    libelle: "Gérant majoritaire de SARL ou EURL",
    precision: "vous cotisez comme un travailleur non salarié",
    regime: "tns",
  },
  {
    id: "sas",
    libelle: "Président de SAS ou SASU",
    precision: "vous cotisez comme un salarié, sans l’assurance chômage",
    regime: "assimile-salarie",
  },
];

/**
 * Les régimes que le moteur sait réellement calculer aujourd'hui.
 *
 * Cette liste est la SEULE source de vérité de ce que la page a le droit de
 * chiffrer. Tant qu'un régime n'y est pas, son bouton dit ce qu'il en est au
 * lieu d'afficher un résultat emprunté à un autre statut : servir le calcul du
 * salarié à un indépendant serait exactement le genre de faux chiffre que ce
 * dossier reproche à la partie adverse.
 */
export const REGIMES_DISPONIBLES: Regime[] = ["salarie", "assimile-salarie"];

export function regimeDe(statut: Statut, forme?: FormeTpe): Regime | null {
  if (statut === "salarie") return "salarie";
  if (statut === "independant") return "tns";
  if (statut === "fonctionnaire") return "fonctionnaire";
  if (statut === "tpe") {
    if (!forme) return null;
    return FORMES_TPE.find((f) => f.id === forme)?.regime ?? null;
  }
  return null;
}

export function regimeCalculable(regime: Regime | null): boolean {
  return regime !== null && REGIMES_DISPONIBLES.includes(regime);
}
