/**
 * Ce que la une du journal affiche, calculé une fois pour deux rendus.
 *
 * La une existe en DEUX exemplaires : le composant React de l'écran de fin,
 * et l'image PNG que la route `/api/avis` fabrique pour les réseaux. Les deux
 * doivent annoncer exactement les mêmes chiffres, sinon un partage contredit
 * la page qu'il annonce. Ce module est donc le seul endroit qui traduit un
 * dossier en lignes de une ; les deux vues ne font que le mettre en page.
 */

import { ETIQUETTES_PLACEMENT } from "./placements";
import { euros, eurosSigne } from "./format";
import type { Cas } from "./lien";
import { CRANS_FRAIS, CRANS_RENDEMENT, simuler } from "./moteur";
import { SEUIL_ANNEES, anneesSansTravailler, objetPour } from "./objets";
import { partsFiscales } from "./statuts";

export type Une = {
  preleve: string;
  placement: string;
  capital: string;
  recu: string;
  ecart: string;
  braquage: boolean;
  objet: string;
};

/** 0,0677 → « 6,8 % », −0,0024 → « −0,2 % ». Le taux RÉEL, inflation retirée. */
export function tauxReel(reel: number): string {
  return `${(reel * 100).toFixed(1).replace(".", ",").replace("-", "−")} %`;
}

/** Le dossier d'un cas, en lignes de une. Lève si le régime n'est pas instruit. */
export function uneDuCas(cas: Cas): Une {
  const cran = CRANS_RENDEMENT.find((c) => c.id === cas.placementId) ?? CRANS_RENDEMENT[0];
  const frais = CRANS_FRAIS.find((f) => f.id === cas.fraisId) ?? CRANS_FRAIS[0];
  const s = simuler({
    netMensuel: cas.netMensuel,
    statut: cas.statut,
    formeTpe: cas.formeTpe,
    versant: cas.versant,
    activite: cas.activite,
    categorieMicro: cas.categorieMicro,
    versementLiberatoire: cas.versementLiberatoire,
    parts: partsFiscales(cas.couple, cas.enfants),
    couple: cas.couple,
    perimetre: cas.perimetre,
    paliers: cas.paliers,
    habitudes: cas.habitudes,
    placement: {
      rendementReel: cran.reel,
      fraisAnnuels: frais.annuels,
      fraisVersement: frais.versement,
    },
  });
  /*
   * ⚠ LE PÉRIMÈTRE VOYAGE AVEC LA UNE. Décocher les quatre lignes de l’écran
   * « pièce à conviction » est autorisé et c’est même l’intérêt du site : on
   * compte ce qu’on veut bien compter. Mais l’image partagée n’en disait rien.
   * Un dossier à périmètre vide produisait une une parfaitement crédible qui
   * annonçait « BRAQUÉ DE 0 € » et « en votre faveur 1 040 463 € », avec le
   * tampon RELAXE, sans qu’un lecteur puisse deviner qu’il manquait trois
   * lignes sur quatre. Le dossier se défend en montrant son périmètre, pas en
   * le taisant. Constaté le 10/09/2026.
   */
  const postes = [
    cas.perimetre.salariales,
    cas.perimetre.patronales,
    cas.perimetre.impotRevenu,
    cas.perimetre.consommation,
  ];
  const comptes = postes.filter(Boolean).length;
  const mention =
    comptes === postes.length ? "" : ` · ${comptes} POSTE${comptes > 1 ? "S" : ""} SUR ${postes.length}`;

  const preleve = s.plateauGauche.total;
  const annees = anneesSansTravailler(preleve, s.netApresImpotActuel);
  return {
    preleve: `${euros(preleve)} €`,
    placement: `${ETIQUETTES_PLACEMENT[cran.id] ?? cran.nom} à ${tauxReel(cran.reel)}${mention}`,
    capital: `${euros(s.opportunite?.capital ?? preleve)} €`,
    recu: `${euros(s.plateauDroit.total)} €`,
    ecart: eurosSigne(s.verdict.ecart),
    braquage: s.verdict.braquage,
    objet:
      preleve >= SEUIL_ANNEES
        ? `${annees.toFixed(1).replace(".", ",")} années de vie sans travailler`
        : objetPour(preleve).nom,
  };
}
