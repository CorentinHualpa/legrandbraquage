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

import { PERIMETRE_DEFAUT, type Perimetre, type Statut } from "./moteur";
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
};

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
  };
}
