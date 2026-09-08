/**
 * Le lien partagé : ce qu'il transporte, et comment on le relit.
 *
 * Un dossier partagé doit ROUVRIR le dossier de celui qui l'a partagé, sinon
 * le destinataire voit un cas type qui n'a rien à voir avec le chiffre annoncé
 * dans le message. Le lien porte donc TOUT ce qui change le verdict : le net,
 * la qualité de la victime, sa forme juridique ou son versant, et le périmètre
 * coché. En oublier un suffit : partager un procès-verbal de fonctionnaire qui
 * se rouvre en salarié du privé afficherait un autre montant sous le même
 * lien, ce qui est pire qu'un lien mort.
 *
 * Encodage et lecture vivent dans le MÊME fichier, volontairement : deux
 * moitiés écrites à deux endroits finissent toujours par diverger d'un
 * paramètre, et la panne est silencieuse.
 */

import {
  CRANS_FRAIS,
  CRANS_RENDEMENT,
  HABITUDES,
  HABITUDES_DEFAUT,
  PALIERS,
  PALIERS_DEFAUT,
  PERIMETRE_DEFAUT,
  type Habitudes,
  type Paliers,
  type Perimetre,
  type Statut,
} from "./moteur";
import type { Activite, CategorieMicro, FormeTpe, Versant } from "./statuts";

export type Cas = {
  netMensuel: number;
  statut: Statut;
  formeTpe?: FormeTpe;
  versant: Versant;
  activite: Activite;
  categorieMicro: CategorieMicro;
  versementLiberatoire: boolean;
  couple: boolean;
  enfants: number;
  perimetre: Perimetre;
  /** Les trois paliers du second plateau : ils changent le verdict. */
  paliers: Paliers;
  /** Où l'argent aurait été placé (cran du moteur) et à quels frais : c'est ce qui décide du verdict. */
  placementId: string;
  fraisId: string;
  /** Tabac, carburant, alcool : les accises comptent dans ce qui est pris. */
  habitudes: Habitudes;
  /**
   * « Content de votre cadeau ? » sur l'écran du butin. Ne change AUCUN
   * chiffre : c'est une réponse qu'on ressort à la personne au verdict, et
   * elle voyage donc avec le dossier, sinon un lien partagé rouvre un procès
   * où le commissaire cite une phrase que personne n'a dite.
   */
  cadeau: Cadeau;
};

/** La réponse à « Content de votre cadeau ? », ou rien tant qu'on n'a pas répondu. */
export type Cadeau = "partage" | "picotte" | null;

/** Le placement qu'on sert quand la personne n'a rien choisi : le fonds en euros, ce que la moitié des Français détient. */
export const PLACEMENT_DEFAUT_ID = "fonds-euros";
export const FRAIS_DEFAUT_ID = "aucun";

const STATUTS_VALIDES: Statut[] = ["salarie", "independant", "fonctionnaire", "tpe"];
const FORMES_VALIDES: FormeTpe[] = ["sarl-majoritaire", "sas"];
const VERSANTS_VALIDES: Versant[] = ["fpe", "fpt", "fph"];
const ACTIVITES_VALIDES: Activite[] = ["micro", "ssi", "cipav"];
const CATEGORIES_VALIDES: CategorieMicro[] = ["vente", "services", "liberal"];

/** Les quatre cases du périmètre, dans un ordre qui ne doit plus bouger. */
const ORDRE_PERIMETRE = [
  "salariales",
  "patronales",
  "impotRevenu",
  "consommation",
] as const;

function codePerimetre(p: Perimetre): string {
  return ORDRE_PERIMETRE.map((k) => (p[k] ? "1" : "0")).join("");
}

function litPerimetre(code: string | null): Perimetre | null {
  if (!code || !/^[01]{4}$/.test(code)) return null;
  const p = {} as Perimetre;
  ORDRE_PERIMETRE.forEach((k, i) => {
    p[k] = code[i] === "1";
  });
  return p;
}

/** La partie « ?… » du lien à partager, sans l'origine. */
export function requeteDuCas(cas: Cas): string {
  const q = new URLSearchParams({
    n: String(Math.round(cas.netMensuel)),
    s: cas.statut,
    p: codePerimetre(cas.perimetre),
  });
  if (cas.statut === "tpe" && cas.formeTpe) q.set("f", cas.formeTpe);
  if (cas.statut === "fonctionnaire") q.set("v", cas.versant);
  // Un libéral réglementé et un artisan n'ont ni le même prélèvement ni la même
  // pension : sans ce paramètre, le dossier d'un architecte se rouvrirait en
  // artisan, sous le même lien et avec un autre montant.
  if (cas.statut === "independant" && cas.activite !== "ssi") q.set("a", cas.activite);
  // La catégorie fait DOUBLER le prélèvement d'un micro : un lien qui l'oublie
  // rouvre un autre dossier sous la même adresse.
  if (cas.activite === "micro") {
    q.set("c", cas.categorieMicro);
    if (cas.versementLiberatoire) q.set("vl", "1");
  }
  // Le foyer divise l'impôt : un lien qui l'oublie rouvre un autre dossier.
  if (cas.couple) q.set("cp", "1");
  if (cas.enfants > 0) q.set("e", String(cas.enfants));
  // Les paliers font basculer le verdict : un lien qui les oublie rouvre un
  // coupable en relaxé. Ceux qui valent le défaut ne s'écrivent pas.
  if (cas.paliers.ecole !== PALIERS_DEFAUT.ecole) q.set("pe", cas.paliers.ecole);
  if (cas.paliers.sante !== PALIERS_DEFAUT.sante) q.set("ps", cas.paliers.sante);
  if (cas.paliers.chomage !== PALIERS_DEFAUT.chomage) q.set("pc", cas.paliers.chomage);
  // Le placement décide du verdict : un lien qui l'oublie rouvre un autre procès.
  if (cas.placementId !== PLACEMENT_DEFAUT_ID) q.set("pl", cas.placementId);
  if (cas.fraisId !== FRAIS_DEFAUT_ID) q.set("pf", cas.fraisId);
  if (cas.habitudes.tabac !== HABITUDES_DEFAUT.tabac) q.set("ht", cas.habitudes.tabac);
  if (cas.habitudes.carburant !== HABITUDES_DEFAUT.carburant) q.set("hc", cas.habitudes.carburant);
  if (cas.habitudes.alcool !== HABITUDES_DEFAUT.alcool) q.set("ha", cas.habitudes.alcool);
  if (cas.cadeau) q.set("cd", cas.cadeau);
  return `?${q.toString()}`;
}

/**
 * Relit un cas depuis une chaîne de requête.
 *
 * Rend `null` dès que le net manque ou n'est pas exploitable : un lien tronqué
 * ou bricolé à la main ne doit pas rouvrir un dossier à moitié rempli, il doit
 * se comporter comme une visite normale. Chaque champ est validé contre sa
 * liste : une valeur inconnue retombe sur le défaut, jamais sur une erreur.
 */
export function casDepuisRequete(recherche: string): Cas | null {
  const q = new URLSearchParams(recherche);

  const net = Number(q.get("n"));
  if (!Number.isFinite(net) || net <= 0 || net > 1_000_000) return null;

  const statutBrut = q.get("s") as Statut | null;
  const statut = statutBrut && STATUTS_VALIDES.includes(statutBrut) ? statutBrut : "salarie";

  const formeBrute = q.get("f") as FormeTpe | null;
  const formeTpe =
    formeBrute && FORMES_VALIDES.includes(formeBrute) ? formeBrute : undefined;

  const activiteBrute = q.get("a") as Activite | null;
  const activite =
    activiteBrute && ACTIVITES_VALIDES.includes(activiteBrute) ? activiteBrute : "ssi";

  const categorieBrute = q.get("c") as CategorieMicro | null;
  const categorieMicro =
    categorieBrute && CATEGORIES_VALIDES.includes(categorieBrute)
      ? categorieBrute
      : "liberal";

  const versantBrut = q.get("v") as Versant | null;
  const versant =
    versantBrut && VERSANTS_VALIDES.includes(versantBrut) ? versantBrut : "fpt";

  return {
    netMensuel: Math.round(net),
    statut,
    // Un patron de TPE sans forme juridique n'a pas de régime résolu et le
    // moteur lève. Plutôt que d'ouvrir un dossier qui plante, on rend la main
    // au visiteur : il choisira lui-même sa forme.
    formeTpe: statut === "tpe" ? formeTpe : undefined,
    versant,
    activite,
    categorieMicro,
    versementLiberatoire: q.get("vl") === "1",
    couple: q.get("cp") === "1",
    enfants: Math.min(6, Math.max(0, Number(q.get("e")) || 0)),
    perimetre: litPerimetre(q.get("p")) ?? PERIMETRE_DEFAUT,
    paliers: {
      ecole: litPalier("ecole", q.get("pe")) as Paliers["ecole"],
      sante: litPalier("sante", q.get("ps")) as Paliers["sante"],
      chomage: litPalier("chomage", q.get("pc")) as Paliers["chomage"],
    },
    placementId: litParmi(q.get("pl"), CRANS_RENDEMENT.map((c) => c.id), PLACEMENT_DEFAUT_ID),
    fraisId: litParmi(q.get("pf"), CRANS_FRAIS.map((f) => f.id), FRAIS_DEFAUT_ID),
    habitudes: {
      tabac: litParmi(q.get("ht"), HABITUDES.tabac.choix.map((c) => c.id), HABITUDES_DEFAUT.tabac),
      carburant: litParmi(q.get("hc"), HABITUDES.carburant.choix.map((c) => c.id), HABITUDES_DEFAUT.carburant),
      alcool: litParmi(q.get("ha"), HABITUDES.alcool.choix.map((c) => c.id), HABITUDES_DEFAUT.alcool),
    },
    cadeau: litCadeau(q.get("cd")),
  };
}

/** Une réponse inconnue vaut « pas répondu », jamais une erreur. */
function litCadeau(valeur: string | null): Cadeau {
  return valeur === "partage" || valeur === "picotte" ? valeur : null;
}

function litParmi(valeur: string | null, valides: string[], defaut: string): string {
  return valeur && valides.includes(valeur) ? valeur : defaut;
}

/** Un palier inconnu retombe sur le défaut du poste, jamais sur une erreur. */
function litPalier(poste: keyof Paliers, valeur: string | null): string {
  if (valeur && PALIERS[poste].choix.some((c) => c.id === valeur)) return valeur;
  return PALIERS_DEFAUT[poste];
}
