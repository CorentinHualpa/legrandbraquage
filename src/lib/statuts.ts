import { regimeDuStatut } from "@moteur/index.js";

import type { Statut } from "./moteur";

/**
 * Les quatre qualités de victime, et ce que chacune vaut dans le moteur.
 *
 * ⚠ Le patron de TPE n'est PAS un troisième régime, et c'est ce qui fait tenir
 * la v1 : un gérant majoritaire de SARL cotise comme un travailleur non
 * salarié, un président de SAS comme un assimilé salarié. Le bouton pose donc
 * une question de forme juridique et aiguille, il ne calcule rien de neuf.
 *
 * La correspondance statut → régime vit dans le MOTEUR, pas ici : c'est une
 * règle de droit, elle a sa place là où elle est testée.
 */

export type Regime = "salarie" | "tns" | "fonctionnaire";
export type FormeTpe = "sarl-majoritaire" | "sas";
export type Versant = "fpe" | "fpt" | "fph";

export const STATUTS: Array<{ id: Statut; libelle: string; precision: string }> = [
  { id: "salarie", libelle: "Salarié du privé", precision: "un bulletin de paie chaque mois" },
  {
    id: "independant",
    libelle: "Indépendant",
    precision: "freelance, artisan, commerçant, profession libérale",
  },
  {
    id: "fonctionnaire",
    libelle: "Fonctionnaire",
    precision: "titulaire, État, territoriale ou hospitalière",
  },
  { id: "tpe", libelle: "Patron de TPE", precision: "vous vous versez une rémunération" },
];

export const FORMES_TPE: Array<{
  id: FormeTpe;
  libelle: string;
  precision: string;
}> = [
  {
    id: "sarl-majoritaire",
    libelle: "Gérant majoritaire de SARL ou EURL",
    precision: "vous cotisez comme un travailleur non salarié",
  },
  {
    id: "sas",
    libelle: "Président de SAS ou SASU",
    precision: "vous cotisez comme un salarié, sans l’assurance chômage",
  },
];

export const VERSANTS: Array<{ id: Versant; libelle: string; precision: string }> = [
  { id: "fpt", libelle: "Territoriale", precision: "commune, département, région" },
  { id: "fph", libelle: "Hospitalière", precision: "hôpital public, EHPAD public" },
  { id: "fpe", libelle: "État", precision: "ministères, enseignement, police" },
];

/**
 * Les régimes que le moteur sait réellement calculer.
 *
 * Cette liste est la SEULE source de vérité de ce que la page a le droit de
 * chiffrer. Tant qu'un régime n'y est pas, son bouton dit ce qu'il en est au
 * lieu d'afficher un résultat emprunté à un autre statut : servir le calcul du
 * salarié à un indépendant serait exactement le genre de faux chiffre que ce
 * dossier reproche à la partie adverse. Le moteur lève d'ailleurs plutôt que
 * de deviner ; cette liste existe pour que l'écran le dise AVANT le calcul.
 */
export const REGIMES_DISPONIBLES: Regime[] = ["salarie", "fonctionnaire", "tns"];

export function regimeDe(statut: Statut, forme?: FormeTpe): Regime | null {
  return (regimeDuStatut(statut, forme) as Regime | null) ?? null;
}

export function regimeCalculable(regime: Regime | null): boolean {
  return regime !== null && REGIMES_DISPONIBLES.includes(regime);
}

export const NOMS_REGIME: Record<Regime, string> = {
  salarie: "salarié du privé",
  tns: "travailleur non salarié",
  fonctionnaire: "fonctionnaire",
};
