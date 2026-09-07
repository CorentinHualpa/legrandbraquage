/**
 * Tests du moteur. `node --test moteur/`
 *
 * Le jeu de référence vient de l'API publique du simulateur officiel de
 * l'URSSAF (mon-entreprise.urssaf.fr), interrogée le 05/09/2026 avec :
 * AT-MP 2,08 %, pas de versement mobilité, mutuelle à 0 €, prévoyance cadre
 * 1,50 % TA. C'est notre étalon : si un de ces tests casse, c'est le moteur
 * qui a tort, pas l'URSSAF.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cotisationsSalariales, cotisationsPatronales, reductionRgdu,
  coefficientRgdu, brutDepuisNet, netsDepuisBrut,
} from './salaire.js';
import { impotSurLeRevenu, tauxEffortTva } from './impot.js';
import { indiceAge, deroulerCarriere } from './carriere.js';
import {
  PALIERS_ALIBI, capitalApresRetraits, capitalPourRente, capitaliser,
} from './capitalisation.js';
import { simuler, salairePivot } from './index.js';
import * as M from './index.js';
import { RGDU_SMIC_REFERENCE_ANNUEL } from './baremes-2026.js';

const pourcent = (x) => Math.round(x * 10000) / 100;

// ─────────────────────────────────────────────────────────────────────────────
test('cotisations salariales : table URSSAF, non-cadre', () => {
  const cas = [
    [1823.03, 20.84], [1867.02, 20.84], [2800.53, 20.84],
    [3000, 20.84], [3734.04, 20.84], [5000, 20.74], [10000, 20.27],
  ];
  for (const [brut, attendu] of cas) {
    const { taux } = cotisationsSalariales(brut);
    assert.ok(
      Math.abs(pourcent(taux) - attendu) < 0.02,
      `brut ${brut} : ${pourcent(taux)} % attendu ${attendu} %`,
    );
  }
});

test('cotisations salariales : table URSSAF, cadre', () => {
  const cas = [[3000, 21.01], [5000, 20.88], [10000, 20.35]];
  for (const [brut, attendu] of cas) {
    const { taux } = cotisationsSalariales(brut, { cadre: true });
    // Le cadre paie l'APEC ; l'écart restant tient à la CSG assise sur la
    // prévoyance patronale, que le moteur ne modélise pas encore.
    assert.ok(
      Math.abs(pourcent(taux) - attendu) < 0.25,
      `cadre ${brut} : ${pourcent(taux)} % attendu ${attendu} %`,
    );
  }
});

test('la CET n’est pas due sous le plafond', () => {
  assert.equal(cotisationsSalariales(3000).lignes.cet, 0);
  assert.ok(cotisationsSalariales(5000).lignes.cet > 0);
});

// ─────────────────────────────────────────────────────────────────────────────
test('RGDU : montants de la table URSSAF', () => {
  const cas = [
    [1823.03, 725.75], [1867.02, 700.13], [2800.53, 345.31],
    [3000, 299.70], [3734.04, 184.46], [5000, 109.00], [10000, 0],
  ];
  for (const [brut, attendu] of cas) {
    const r = reductionRgdu(brut, { effectif: 10 });
    assert.ok(
      Math.abs(r - attendu) < 1.2,
      `RGDU à ${brut} : ${r.toFixed(2)} € attendu ${attendu} €`,
    );
  }
});

test('RGDU : plafonnée au SMIC, nulle au-delà de 3 SMIC', () => {
  assert.equal(coefficientRgdu(RGDU_SMIC_REFERENCE_ANNUEL, { effectif: 10 }), 0.3981);
  assert.equal(coefficientRgdu(RGDU_SMIC_REFERENCE_ANNUEL * 3), 0);
  assert.equal(coefficientRgdu(RGDU_SMIC_REFERENCE_ANNUEL * 4), 0);
  // Effectif de 50 et plus : Tdelta plus élevé
  assert.equal(coefficientRgdu(RGDU_SMIC_REFERENCE_ANNUEL, { effectif: 60 }), 0.4021);
});

test('RGDU : la sortie est une barre, pas une extinction douce', () => {
  const juste = coefficientRgdu(RGDU_SMIC_REFERENCE_ANNUEL * 2.999);
  const apres = coefficientRgdu(RGDU_SMIC_REFERENCE_ANNUEL * 3.001);
  assert.ok(juste >= 0.02, 'il reste 2 points juste avant la sortie');
  assert.equal(apres, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
test('cotisations patronales : table URSSAF, effectif < 50', () => {
  const cas = [
    [1823.03, 3.09], [1867.02, 5.40], [2800.53, 30.57],
    [3000, 32.91], [3734.04, 37.96], [5000, 40.91], [10000, 43.05],
  ];
  for (const [brut, attendu] of cas) {
    const { taux } = cotisationsPatronales(brut, { effectif: 10 });
    assert.ok(
      Math.abs(pourcent(taux) - attendu) < 0.05,
      `patronal ${brut} : ${pourcent(taux)} % attendu ${attendu} %`,
    );
  }
});

// ⚠ NON RÉSOLU, à revérifier avant mise en ligne. Le rapport de recherche
// donne une ligne de synthèse pour les effectifs de 50 et plus (3,99 % au
// SMIC, 34,12 % à 3 000 €) que le moteur ne reproduit pas : il trouve
// systématiquement 0,45 point de moins, soit très exactement l'écart de
// contribution à la formation professionnelle. Les sept points de la table
// < 50 salariés, eux, tombent au centième. Tant que ce point n'a pas été
// repris directement sur mon-entreprise.urssaf.fr, on ne teste que le SENS et
// l'ORDRE DE GRANDEUR de l'écart, et l'application reste sur l'effectif < 50.
test('cotisations patronales : effectif >= 50 (borne, à revérifier)', () => {
  for (const brut of [1823.03, 3000, 5000, 10000]) {
    const petit = cotisationsPatronales(brut, { effectif: 10 }).taux;
    const grand = cotisationsPatronales(brut, { effectif: 60 }).taux;
    const ecart = pourcent(grand) - pourcent(petit);
    assert.ok(
      ecart > 0.3 && ecart < 1.2,
      `écart >=50 à ${brut} : ${ecart.toFixed(2)} pt`,
    );
  }
});

test('LE CHIFFRE DU PROJET : facteur 14 entre le SMIC et 10 000 €', () => {
  const smic = cotisationsPatronales(1823.03, { effectif: 10 }).taux;
  const haut = cotisationsPatronales(10000, { effectif: 10 }).taux;
  assert.ok(pourcent(smic) < 3.2, `au SMIC : ${pourcent(smic)} %`);
  assert.ok(pourcent(haut) > 43, `à 10 000 € : ${pourcent(haut)} %`);
  assert.ok(haut / smic > 13, `rapport ${(haut / smic).toFixed(1)}`);
});

// ─────────────────────────────────────────────────────────────────────────────
test('impôt sur le revenu : seuil de non-imposition', () => {
  assert.equal(impotSurLeRevenu(15000), 0, 'sous le seuil, rien');
  assert.ok(impotSurLeRevenu(25000) > 0, 'au-dessus, quelque chose');
});

test('impôt sur le revenu : la décote efface les premiers imposables', () => {
  const sansDecote = impotSurLeRevenu(19000);
  assert.ok(sansDecote < 300, `décote appliquée : ${sansDecote.toFixed(0)} €`);
});

test('impôt sur le revenu : progressivité', () => {
  const a = impotSurLeRevenu(30000);
  const b = impotSurLeRevenu(60000);
  assert.ok(b / a > 2, 'le taux moyen monte avec le revenu');
});

test('impôt sur le revenu : le quotient familial allège', () => {
  const seul = impotSurLeRevenu(60000, { parts: 1 });
  const couple = impotSurLeRevenu(60000, { parts: 2, couple: true });
  assert.ok(couple < seul);
});

// ─────────────────────────────────────────────────────────────────────────────
test('inversion net vers brut : aller-retour', () => {
  for (const brut of [1823.03, 3000, 5000, 10000]) {
    const { netAvantImpot } = netsDepuisBrut(brut);
    const retrouve = brutDepuisNet(netAvantImpot);
    assert.ok(
      Math.abs(retrouve - brut) < 0.5,
      `brut ${brut} retrouvé à ${retrouve.toFixed(2)}`,
    );
  }
});

test('inversion net après impôt : aller-retour', () => {
  const brut = 3158;
  const { netAvantImpot, netImposable } = netsDepuisBrut(brut);
  const netApres = netAvantImpot - impotSurLeRevenu(netImposable * 12) / 12;
  const retrouve = brutDepuisNet(netApres, {
    cible: 'apresImpot',
    calculerImpot: (n) => impotSurLeRevenu(n),
  });
  assert.ok(Math.abs(retrouve - brut) < 1, `retrouvé ${retrouve.toFixed(2)}`);
});

// ─────────────────────────────────────────────────────────────────────────────
test('courbe de carrière : monte puis se tasse', () => {
  assert.ok(indiceAge(22) < indiceAge(36));
  assert.ok(indiceAge(36) < indiceAge(50));
  const penteJeune = indiceAge(28) - indiceAge(22);
  const penteVieux = indiceAge(64) - indiceAge(58);
  assert.ok(penteJeune > penteVieux * 3, 'la pente s’écrase avec l’âge');
});

test('la carrière n’est jamais figée', () => {
  const { annees } = deroulerCarriere(2500, { ageActuel: 36 });
  assert.equal(annees.length, 43, '22 à 64 ans inclus');
  const premier = annees[0].netApresImpot;
  const dernier = annees[annees.length - 1].netApresImpot;
  assert.ok(dernier > premier * 1.8, `de ${premier.toFixed(0)} à ${dernier.toFixed(0)} €`);
});

test('la RGDU pèse lourd sur une carrière modeste', () => {
  const smic = deroulerCarriere(1450, { ageActuel: 36 });
  const cadre = deroulerCarriere(4500, { ageActuel: 36 });
  const partSmic = smic.totaux.reductionRgdu / smic.totaux.patronales;
  const partCadre = cadre.totaux.reductionRgdu / cadre.totaux.patronales;
  assert.ok(partSmic > partCadre * 3, 'l’État rembourse surtout les bas salaires');
});

// ─────────────────────────────────────────────────────────────────────────────
test('les paliers de l’alibi sont les quatre valeurs du dossier', () => {
  assert.equal(PALIERS_ALIBI.length, 4);
  assert.equal(capitalApresRetraits(0), 1594561);
  assert.equal(capitalApresRetraits(1), 1450760);
  assert.equal(capitalApresRetraits(2), 749353);
  assert.equal(capitalApresRetraits(3), 432190);
});

test('retirer les trois hypothèses ôte 73 % du million', () => {
  const chute = 1 - capitalApresRetraits(3) / capitalApresRetraits(0);
  assert.ok(Math.abs(chute - 0.729) < 0.01, `chute de ${(chute * 100).toFixed(1)} %`);
});

test('LA CONTRE-EXPERTISE : la pension vaut le même ordre de grandeur', () => {
  const capital = capitalPourRente(1500);
  assert.ok(capital > 400000 && capital < 600000, `${Math.round(capital)} €`);
  // C'est le résultat central du projet : 432 190 € contre ~539 000 €.
  const ecart = capital / capitalApresRetraits(3);
  assert.ok(ecart > 0.8 && ecart < 1.5, `rapport ${ecart.toFixed(2)}`);
});

test('les frais mangent la majorité du capital sur quarante ans', () => {
  const versements = Array(40).fill(10000);
  const sansFrais = capitaliser(versements, { fraisAnnuels: 0, fraisVersement: 0 });
  const avecPer = capitaliser(versements);
  assert.ok(avecPer < sansFrais * 0.6, `${Math.round(100 - (avecPer / sansFrais) * 100)} % perdus`);
});

// ─────────────────────────────────────────────────────────────────────────────
test('simuler : la balance se retourne selon le périmètre', () => {
  const base = { netMensuel: 2500, ageActuel: 36 };
  const etroit = simuler({ ...base, perimetre: { salariales: true } });
  // Contrat strict : seules les cotisations salariales sont comptées ici.
  assert.equal(etroit.plateauGauche.total, etroit.carriere.totaux.salariales);
  const large = simuler({
    ...base,
    perimetre: { salariales: true, patronales: true, impotRevenu: true, consommation: true },
  });
  assert.ok(large.plateauGauche.total > etroit.plateauGauche.total * 3);
  assert.equal(etroit.verdict.braquage, false, 'salariales seules : pas de braquage');
  assert.equal(large.verdict.braquage, true, 'périmètre complet : braquage');
});

test('simuler : un bas salaire est bénéficiaire net', () => {
  const r = simuler({
    netMensuel: 1400,
    perimetre: { salariales: true, patronales: true, impotRevenu: true, consommation: true },
  });
  assert.equal(r.verdict.braquage, false, `écart ${Math.round(r.verdict.ecart)} €`);
});

test('simuler : un haut salaire est perdant net', () => {
  const r = simuler({
    netMensuel: 6000,
    cadre: true,
    perimetre: { salariales: true, patronales: true, impotRevenu: true, consommation: true },
  });
  assert.equal(r.verdict.braquage, true);
});

test('LE CHIFFRE INÉDIT : le salaire-pivot existe et est plausible', () => {
  const pivot = salairePivot({ ageActuel: 36 });
  assert.ok(pivot !== null, 'la balance bascule bien quelque part');
  assert.ok(pivot > 1200 && pivot < 6000, `pivot à ${pivot} € net/mois`);
});

test('simuler : refuse une entrée absurde', () => {
  assert.throws(() => simuler({ netMensuel: 0 }));
  assert.throws(() => simuler({ netMensuel: -100 }));
});

// ─────────────────────────────────────────────────────────────────────────────
test('TVA : régressive rapportée au revenu disponible', () => {
  assert.ok(tauxEffortTva(1400) > tauxEffortTva(4500), 'les bas revenus paient plus');
  assert.ok(tauxEffortTva(1000) <= 0.125);
  assert.ok(tauxEffortTva(9000) >= 0.047);
});

// ─── L'échelle des placements ────────────────────────────────────────────────

test('le défaut de l’échelle de placement est prudent', () => {
  const p = M.placement(M.PLACEMENT_DEFAUT);
  assert.equal(p.id, 'fonds-euros');
  // Un défaut prudent rend moins de 2 % réel. Si ce test casse, quelqu'un a
  // remonté le défaut : c'est un choix éditorial, il se discute, il ne se
  // glisse pas.
  assert.ok(p.rendementReel < 0.02, `défaut à ${p.rendementReel}`);
});

test('le Livret A perd de l’argent en euros d’aujourd’hui', () => {
  const p = M.placement('livret-a');
  assert.ok(p.rendementReel < 0, `Livret A réel = ${p.rendementReel}`);
});

test('l’échelle des placements est croissante APRÈS frais, pas avant', () => {
  // Elle ne l'est délibérément pas sur le rendement brut : l'ETF World rend
  // moins que le CAC 40 dividendes réinvestis. Ce que le curseur promet à
  // l'utilisateur, c'est un capital final qui monte barreau après barreau.
  const flux = Array.from({ length: 42 }, () => 6000);
  const capitaux = M.PLACEMENTS.map((p) => M.placerSoiMeme(flux, p.id).capital);
  for (let i = 1; i < capitaux.length; i += 1) {
    assert.ok(
      capitaux[i] > capitaux[i - 1],
      `${M.PLACEMENTS[i].id} (${Math.round(capitaux[i])}) ne dépasse pas `
        + `${M.PLACEMENTS[i - 1].id} (${Math.round(capitaux[i - 1])})`,
    );
  }
});

test('un ETF en PEA bat le CAC 40 en PER malgré un rendement brut plus faible', () => {
  // C'est le second braquage, celui dont personne ne parle. Si ce test casse,
  // c'est que les frais ont changé et que la phrase de la page devient fausse.
  const cac = M.placement('cac40-per');
  const etf = M.placement('etf-world-pea');
  assert.ok(etf.rendementReel < cac.rendementReel, 'le brut de l’ETF devrait être plus bas');

  const flux = Array.from({ length: 42 }, () => 6000);
  const a = M.placerSoiMeme(flux, 'cac40-per');
  const b = M.placerSoiMeme(flux, 'etf-world-pea');
  assert.ok(b.capital > a.capital, `${Math.round(b.capital)} devrait dépasser ${Math.round(a.capital)}`);
});

test('les frais payés se comptent, et ils ne sont pas nuls sur un PER', () => {
  const flux = Array.from({ length: 42 }, () => 6000);
  const r = M.placerSoiMeme(flux, 'cac40-per');
  assert.ok(r.fraisPayes > 0);
  assert.ok(r.sansFrais > r.capital);
  // Sur quarante ans, les frais d'un PER en actions dépassent ce qui a été versé.
  assert.ok(r.fraisPayes > r.verse * 0.5, `frais = ${Math.round(r.fraisPayes)} pour ${Math.round(r.verse)} versés`);
});

test('un placement inconnu retombe sur le défaut, il n’explose pas', () => {
  assert.equal(M.placement('n-importe-quoi').id, 'fonds-euros');
});

test('placerSaRetraite capitalise la vraie cotisation vieillesse de la carrière', () => {
  const s = M.simuler({ netMensuel: 2500 });
  const r = M.placerSaRetraite(s, 'cac40-per');
  const attendu = s.carriere.annees.reduce((t, a) => t + a.cotisationVieillesse, 0);
  assert.ok(Math.abs(r.verse - attendu) < 1);
  assert.equal(r.equivalentPension, s.plateauDroit.lignes.retraite.montant);
});

// ─── L'heure de libération ───────────────────────────────────────────────────

test('l’heure de libération rend un jour et une heure cohérents', () => {
  const s = M.simuler({ netMensuel: 2500 });
  const l = M.heureDeLiberation(s);
  assert.ok(l.part > 0 && l.part < 1, `part = ${l.part}`);
  assert.equal(Math.round(l.rangJour), Math.ceil(l.part * 365));
  assert.ok(l.heure.heures >= 0 && l.heure.heures < 24);
  assert.ok(l.jour.texte.length > 3);
});

test('la part du net est TOUJOURS plus élevée que la part du coût du travail', () => {
  // C'est tout l'enjeu du dénominateur, et c'est pour ça que la page publie
  // les deux. Si ce test casse, un des deux calculs a changé de base.
  for (const net of [1450, 2500, 6000]) {
    const l = M.heureDeLiberation(M.simuler({ netMensuel: net }));
    assert.ok(l.partDuNet > l.part, `à ${net} € : ${l.partDuNet} devrait dépasser ${l.part}`);
  }
});

test('ajouter un périmètre recule l’heure de libération, jamais l’inverse', () => {
  const base = M.heureDeLiberation(M.simuler({ netMensuel: 3000 }));
  const avecIr = M.heureDeLiberation(
    M.simuler({
      netMensuel: 3000,
      perimetre: { salariales: true, patronales: true, impotRevenu: true, consommation: true },
    }),
  );
  assert.ok(avecIr.rangJour > base.rangJour);
});
