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
import { CRANS_FRAIS, CRANS_RENDEMENT, simuler, type Issue } from "./moteur";
import { SEUIL_ANNEES, anneesSansTravailler, objetPour } from "./objets";
import { partsFiscales } from "./statuts";

export type Une = {
  /** Ce qui est parti sur la carrière. */
  preleve: string;
  /** Ce qui revient, sur toute la vie. Il PASSE DEVANT le pris jusqu'à 2 297 €. */
  recu: string;
  /** Rendu moins pris, signé. C'est lui qui décide, depuis le 15/09/2026. */
  solde: string;
  issue: Issue;
  /** Le scénario du placement : son étiquette, son capital, son écart. Jamais le verdict. */
  placement: string;
  capital: string;
  ecartPlace: string;
  /** Le solde, traduit en objet ou en années. Le titre dit dans quel sens il penche. */
  objetTitre: string;
  objet: string;
};

/** 0,0677 → « 6,8 % », −0,0024 → « −0,2 % ». Le taux RÉEL, inflation retirée. */
export function tauxReel(reel: number): string {
  return `${(reel * 100).toFixed(1).replace(".", ",").replace("-", "−")} %`;
}

/**
 * Le solde, traduit en objet ou en années, avec le titre qui dit son sens.
 *
 * ⚠ Partagé par la une de l'écran et par l'image de partage, parce que les deux
 * l'affichaient chacune de leur côté et sur le montant BRUT : 39,4 années au
 * médian, 56 ans à 5 000 €, c'est-à-dire plus que la carrière simulée.
 */
export function objetDuSolde(solde: number, netApresImpotActuel: number, issue: Issue) {
  const ecartNet = Math.abs(solde);
  const annees = anneesSansTravailler(ecartNet, netApresImpotActuel);
  return {
    titre:
      issue === "coupable"
        ? "CE QU’ILS ONT PRIS EN TROP, AUTREMENT DIT"
        : issue === "relaxe"
          ? "CE QU’ILS VOUS ONT RENDU EN PLUS, AUTREMENT DIT"
          : "L’ÉCART ENTRE LES DEUX, AUTREMENT DIT",
    texte:
      ecartNet >= SEUIL_ANNEES
        ? `${annees.toFixed(1).replace(".", ",")} années de votre niveau de vie`
        : objetPour(ecartNet).nom,
  };
}

/**
 * Le texte de remplacement de l'image, CALCULÉ, jamais tapé à la main.
 *
 * Il a décrit pendant des semaines un dossier que le moteur ne produisait plus.
 * Écrit ici une seule fois, il sert la page d'accueil et chaque lien partagé.
 */
export function texteAlternatif(une: Une): string {
  const issue =
    une.issue === "coupable" ? "Coupable" : une.issue === "relaxe" ? "Relaxe" : "Non-lieu";
  return (
    `La Gazette des Prélèvements : pris ${une.preleve}, rendu ${une.recu} sur une carrière, `
    + `soit ${une.solde} au bout du compte. ${issue}. `
    + `Scénario de la défense : tout placé en ${une.placement}, ça aurait fait ${une.capital}, `
    + `soit ${une.ecartPlace} contre ce qui est rendu.`
  );
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
  const solde = s.verdict.solde;
  /*
   * ⚠ L'OBJET SE CALCULE SUR LE SOLDE, PLUS SUR LE BRUT. La une titrait
   * « BRAQUÉ DE 989 940 € » et traduisait ce brut en « 39,4 années de votre vie
   * sans travailler », ce qui donnait 56 ans à 5 000 € de net, soit plus que la
   * carrière entière qu'on venait de simuler. Le chiffre qui se partage doit
   * être celui qui reste une fois déduit ce qui revient.
   */
  const objet = objetDuSolde(solde, s.netApresImpotActuel, s.verdict.issue);
  return {
    preleve: `${euros(preleve)} €`,
    recu: `${euros(s.plateauDroit.total)} €`,
    solde: eurosSigne(solde),
    issue: s.verdict.issue,
    placement: `${ETIQUETTES_PLACEMENT[cran.id] ?? cran.nom} à ${tauxReel(cran.reel)}${mention}`,
    capital: `${euros(s.verdict.scenario?.capital ?? preleve)} €`,
    ecartPlace: eurosSigne(s.verdict.scenario?.ecart ?? preleve - s.plateauDroit.total),
    objetTitre: objet.titre,
    objet: objet.texte,
  };
}
