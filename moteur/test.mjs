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
import { readFileSync } from 'node:fs';

import {
  cotisationsSalariales, cotisationsPatronales, reductionRgdu,
  coefficientRgdu, brutDepuisNet, netsDepuisBrut,
} from './salaire.js';
import { impotSurLeRevenu, tauxEffortTva, taxesConsommationAnnuelles } from './impot.js';
import { indiceAge, deroulerCarriere, regimeDe } from './carriere.js';
import {
  PALIERS_ALIBI, capitalApresRetraits, capitalPourRente, capitaliser,
} from './capitalisation.js';
import { simuler, salairePivot } from './index.js';
import * as M from './index.js';
import { RGDU_SMIC_REFERENCE_ANNUEL, SALAIRES_REFERENCE, COURBES_AGE } from './baremes-2026.js';

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

test('TVA : les trois valeurs PUBLIÉES du CPO sont servies telles quelles', () => {
  const { d1, median, d9 } = SALAIRES_REFERENCE;
  // D1 et D10 sont imprimés dans Boutchenik 2015, D2 dans le rapport CPO 2022.
  assert.equal(tauxEffortTva(d1), 0.125, 'premier décile');
  assert.equal(tauxEffortTva(d9 * 2), 0.047, 'dernier décile');
  // Le deuxième décile tombe au quart du chemin entre d1 et la médiane.
  assert.ok(Math.abs(tauxEffortTva(d1 + (median - d1) / 4) - 0.095) < 1e-9, 'deuxième décile');
});

test('TVA : la courbe a la FORME du CPO, deux falaises et un plateau', () => {
  /*
   * C'est ce test qui manquait, et son absence a laissé passer une
   * interpolation linéaire pendant des semaines : l'ancienne version était
   * monotone décroissante et bornée, donc elle passait les trois assertions
   * ci-dessus sans avoir la bonne forme nulle part au milieu.
   *
   * Sur le REVENU (et non sur la consommation, où la TVA est plate), le CPO
   * donne une chute brutale de D1 à D2, une pente très douce jusqu'à D9, puis
   * une falaise sur le dernier décile.
   */
  const { d1, median, d9 } = SALAIRES_REFERENCE;
  const auRang = (r) => (r <= 5 ? d1 + ((r - 1) * (median - d1)) / 4 : median + ((r - 5) * (d9 - median)) / 4);

  const chuteD1D2 = tauxEffortTva(auRang(1)) - tauxEffortTva(auRang(2));
  const penteD2D9 = tauxEffortTva(auRang(2)) - tauxEffortTva(auRang(9));
  const falaiseD9D10 = tauxEffortTva(auRang(9)) - tauxEffortTva(d9 * 2);

  assert.ok(chuteD1D2 > 0.025, `D1 vers D2 doit décrocher de 3 points, vu ${chuteD1D2}`);
  assert.ok(penteD2D9 < 0.025, `D2 vers D9 doit être un plateau, vu ${penteD2D9}`);
  assert.ok(falaiseD9D10 > 0.02, `D9 vers D10 doit décrocher, vu ${falaiseD9D10}`);
  // La pente du milieu est plus douce que CHACUNE des deux falaises : c'est
  // exactement ce qu'une droite entre D1 et D10 ne peut pas produire.
  assert.ok(penteD2D9 < chuteD1D2 && penteD2D9 < falaiseD9D10, 'le plateau doit être le segment le plus plat');
});

test('TVA : le rang se lit sur le salaire AVANT impôt, la base est le disponible', () => {
  /*
   * Deux quantités distinctes. Passer le seul revenu disponible classait la
   * personne un cran trop bas dans la distribution et gonflait son taux.
   */
  const disponible = 1900;
  const avantImpot = 2190;
  const avecRang = taxesConsommationAnnuelles(disponible, { salairePourRang: avantImpot });
  const sansRang = taxesConsommationAnnuelles(disponible);
  assert.ok(avecRang < sansRang, 'classé plus haut, donc taux plus bas');
  assert.equal(avecRang, disponible * 12 * tauxEffortTva(avantImpot));
  // Sans la clé, on retombe sur l'assiette : les appelants d'avant ne cassent pas.
  assert.equal(sansRang, disponible * 12 * tauxEffortTva(disponible));
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

// ─── Le régime du fonctionnaire ──────────────────────────────────────────────
// L'étalon vient du rapport de recherche du 06/09/2026, lui-même monté sur les
// textes (décret 2025-1341 pour le CAS Pensions, décret 2025-86 pour la CNRACL,
// URSSAF secteur public au 01/01/2026) et sur les parts de primes DGAFP 2023.
// Si un de ces tests casse, c'est le moteur qui a tort, pas les textes.

import * as FP from './fonction-publique.js';
import { VERSANTS, TAUX_REMPLACEMENT } from './baremes-fonction-publique.js';

test('fonction publique : taux de retenue salariale par versant', () => {
  const cas = [['fpe', 18.64], ['fpt', 18.57], ['fph', 18.79]];
  for (const [v, attendu] of cas) {
    const { taux } = FP.retenuesSalariales(3000, { versant: v });
    assert.ok(
      Math.abs(pourcent(taux) - attendu) < 0.02,
      `${v} : ${pourcent(taux)} % attendu ${attendu} %`,
    );
  }
});

test('fonction publique : taux de cotisation patronale par versant', () => {
  const cas = [['fpe', 78.70], ['fpt', 46.10], ['fph', 47.57]];
  for (const [v, attendu] of cas) {
    const { taux } = FP.cotisationsPatronales(3000, { versant: v });
    assert.ok(
      Math.abs(pourcent(taux) - attendu) < 0.02,
      `${v} : ${pourcent(taux)} % attendu ${attendu} %`,
    );
  }
});

test('fonction publique : le taux ne dépend PAS du niveau de traitement', () => {
  // Aucune réduction générale, aucun plafond de tranche : le taux est constant
  // tant qu'on reste sous quatre plafonds de sécurité sociale. C'est ce qui
  // distingue le plus nettement ce régime de celui du privé.
  const a = FP.cotisationsPatronales(2000, { versant: 'fpt' }).taux;
  const b = FP.cotisationsPatronales(6000, { versant: 'fpt' }).taux;
  assert.ok(Math.abs(a - b) < 1e-9, `${pourcent(a)} % contre ${pourcent(b)} %`);
});

test('fonction publique : aucune réduction générale, par construction', () => {
  for (const v of Object.keys(VERSANTS)) {
    assert.equal(FP.cotisationsPatronales(1900, { versant: v }).reduction, 0);
  }
});

test('fonction publique : l’assiette RAFP est plafonnée à 20 % du traitement', () => {
  // Un agent très primé ne cotise pas davantage au régime additionnel.
  assert.equal(FP.assietteRafp(1000, 500), 200);
  // Un agent peu primé cotise sur ses seules primes.
  assert.equal(FP.assietteRafp(1000, 120), 120);
});

test('fonction publique : inversion net vers brut, aller-retour', () => {
  for (const v of Object.keys(VERSANTS)) {
    for (const brut of [2000, 3000, 5000]) {
      const { netAvantImpot } = FP.netsDepuisBrut(brut, { versant: v });
      const retrouve = FP.brutDepuisNet(netAvantImpot, { versant: v });
      assert.ok(
        Math.abs(retrouve - brut) < 0.5,
        `${v} brut ${brut} retrouvé à ${retrouve.toFixed(2)}`,
      );
    }
  }
});

test('fonction publique : la pension se calcule sur le TRAITEMENT, pas sur le brut', () => {
  // 75 % du traitement indiciaire, primes exclues. Le régime additionnel
  // s'ajoute et pèse peu : c'est tout le sujet de ce régime.
  const p = FP.pension(2894, { primesMensuelles: 951, anneesRafp: 40, ageLiquidation: 62 });
  assert.ok(Math.abs(p.base - 2170.5) < 1, `base = ${p.base.toFixed(0)}`);
  assert.ok(p.renteRafp > 50 && p.renteRafp < 150, `RAFP = ${p.renteRafp.toFixed(0)} €/mois`);
  assert.ok(
    p.renteRafp / p.totale < 0.08,
    `le régime additionnel pèse ${pourcent(p.renteRafp / p.totale)} % de la pension`,
  );
});

test('fonction publique : le minimum garanti prend le relais en bas de grille', () => {
  const p = FP.pension(900, { primesMensuelles: 100 });
  assert.equal(p.minimumGaranti, true);
  assert.ok(p.totale >= 1366.35);
});

test('un régime non instruit LÈVE, il ne retombe pas sur le salarié', () => {
  // La garde qui protège le dossier : servir le calcul d'un régime à un autre
  // produirait un chiffre faux et parfaitement crédible. Les trois régimes du
  // moteur sont instruits ; tout ce qui n'est pas dans la table doit lever.
  assert.throws(() => deroulerCarriere(2500, { regime: 'micro-entrepreneur' }), /non instruit/);
  assert.throws(() => M.simuler({ netMensuel: 2500, regime: 'agriculteur' }), /non instruit/);
});

test('un patron de TPE doit dire sa forme juridique, sinon on refuse', () => {
  assert.throws(() => M.simuler({ netMensuel: 4000, statut: 'tpe' }), /forme/);
  /*
   * ⚠ CE TEST EXIGEAIT L'ÉGALITÉ, et il verrouillait donc un défaut.
   *
   * « Un président de SAS est un assimilé salarié : même moteur que le privé »
   * est vrai pour le RÉGIME et faux pour le TOTAL. Assimilé salarié veut dire
   * qu'il relève du régime général de la sécurité sociale ; il reste mandataire
   * social, sans contrat de travail, donc hors de l'assurance chômage et hors
   * de l'AGS. Le moteur lui facturait les deux, l'égalité passait, et le bouton
   * du parcours annonçait pourtant « sans l'assurance chômage » depuis le début.
   */
  const sas = M.simuler({ netMensuel: 4000, statut: 'tpe', formeTpe: 'sas' });
  const salarie = M.simuler({ netMensuel: 4000, statut: 'salarie' });
  assert.ok(
    sas.plateauGauche.total < salarie.plateauGauche.total,
    'le président de SAS ne cotise ni au chômage ni à l’AGS',
  );
  // Mais il reste au régime général : l'écart est celui des DEUX lignes, pas
  // celui d'un autre régime. Au-delà de 10 %, c'est qu'autre chose a bougé.
  const ecart = (salarie.plateauGauche.total - sas.plateauGauche.total) / salarie.plateauGauche.total;
  assert.ok(ecart > 0.03 && ecart < 0.10, `écart de ${(ecart * 100).toFixed(1)} %, attendu entre 3 et 10 %`);
});

test('fonctionnaire : le taux de remplacement reste dans la fourchette du COR', () => {
  const s = M.simuler({ netMensuel: 2400, statut: 'fonctionnaire', versant: 'fpt' });
  assert.equal(s.plateauDroit.tauxRemplacement, TAUX_REMPLACEMENT.projeteCatBGeneration2000);
  // Garde contre le retour du bug : une pension BRUTE comparée à un net donnait
  // 83 %, très au-dessus de tout ce que le COR publie, dans les deux sens.
  assert.ok(
    s.plateauDroit.tauxRemplacement > 0.5 && s.plateauDroit.tauxRemplacement < 0.78,
    `taux de remplacement à ${pourcent(s.plateauDroit.tauxRemplacement)} %`,
  );
});

test('fonctionnaire : le chômage disparaît des DEUX plateaux', () => {
  // Ni l'agent ni l'employeur ne cotisent au chômage : porter au crédit du
  // fonctionnaire une contrepartie qu'il n'a pas payée fausserait la balance.
  const f = M.simuler({ netMensuel: 2400, statut: 'fonctionnaire', versant: 'fpt' });
  const s = M.simuler({ netMensuel: 2400, statut: 'salarie' });
  assert.equal(f.plateauDroit.lignes.chomage, undefined);
  // Chez le salarié la ligne EXISTE, nommée, mais elle ne porte plus de
  // montant : depuis le 07/09/2026 seule la pension est chiffrée en face.
  assert.ok('chomage' in s.plateauDroit.lignes);
  assert.equal(s.plateauDroit.lignes.chomage.montant, null);
});

test('le second plateau ne compte QUE ce qui est calculé', () => {
  // Santé, école et chômage restent nommés, sans montant, et ne pèsent rien.
  // Un montant inventé pour équilibrer la balance serait exactement ce que ce
  // dossier reproche à la partie adverse. Conséquence assumée : à 2 500 €, le
  // reçu d'un salarié est le seul capital équivalent à sa pension.
  const s = M.simuler({ netMensuel: 2500 });
  const lignes = s.plateauDroit.lignes;
  assert.ok(lignes.retraite.montant > 0);
  assert.equal(lignes.sante.montant, null);
  assert.equal(lignes.education.montant, null);
  assert.ok(Math.abs(s.plateauDroit.total - lignes.retraite.montant) < 0.01);
});

test('fonctionnaire : la formule de pension reste exposée, marquée BRUTE', () => {
  const s = M.simuler({ netMensuel: 2400, statut: 'fonctionnaire', versant: 'fpe' });
  assert.equal(s.plateauDroit.detailPension.brut, true);
  assert.ok(s.plateauDroit.detailPension.base > 0);
  assert.equal(M.simuler({ netMensuel: 2400 }).plateauDroit.detailPension, null);
});

test('LE SECOND CHIFFRE DU PROJET : le pivot du fonctionnaire n’est pas celui du privé', () => {
  const p = { salariales: true, patronales: true, impotRevenu: true, consommation: true };

  // ⚠ Depuis que seule la pension est comptée en face, AUCUN versant n'a de
  // pivot : la contribution employeur publique (37,65 % à la CNRACL, 82,28 %
  // pour l'État) l'emporte à tout niveau. La territoriale en avait un
  // (1 383 €) quand santé, école et chômage pesaient encore 390 000 €.
  const fpt = M.salairePivot({ statut: 'fonctionnaire', versant: 'fpt', perimetre: p });
  assert.equal(fpt, null, 'la territoriale ne bascule plus nulle part');
  assert.ok(
    M.simuler({ netMensuel: 1000, statut: 'fonctionnaire', versant: 'fpt', perimetre: p })
      .verdict.braquage,
    'braquée dès le plancher',
  );

  // ⚠ État : il n'y en a AUCUN. À aucun niveau de traitement la balance ne
  // penche en faveur de l'agent, parce que la contribution de l'État à son
  // propre régime de pension pèse 82,28 % du traitement.
  //
  // Ce n'est PAS un résultat sur les fonctionnaires, c'est un résultat sur le
  // dénominateur, et le COR écrit lui-même que ce taux ne se compare pas à
  // celui d'un employeur privé. Le publier sans cet avertissement fabriquerait
  // exactement le genre de titre que ce dossier reproche à la partie adverse.
  // Si ce test se met à rendre un nombre un jour, c'est que quelqu'un a changé
  // le traitement de la part employeur publique : il faut alors relire la page
  // méthode avant de laisser passer le chiffre.
  assert.equal(
    M.salairePivot({ statut: 'fonctionnaire', versant: 'fpe', perimetre: p }),
    null,
  );
});

// ─── Le régime du travailleur non salarié ────────────────────────────────────
// ⚠ L'étalon N'EST PAS l'API de mon-entreprise.urssaf.fr : elle sert encore
// l'ancien barème (17,75 %, plafond PRCI à 43 891 €, CSG assise sur l'assiette
// PLUS les cotisations). La table ci-dessous est reconstruite depuis le barème
// opposable, et chacune de ses lignes se recalcule à la main.

import * as TNS from './tns.js';

test('TNS : les six points de contrôle du barème opposable', () => {
  // 1. Le plafond porte sur l'ABATTEMENT, et il mord à 5 PASS PILE.
  assert.equal(Math.round(TNS.assietteUnique(240300).abattement), 62478);
  assert.equal(
    Math.round(TNS.assietteUnique(400000).abattement),
    Math.round(TNS.assietteUnique(240300).abattement),
    'au-delà de 5 PASS l’abattement ne bouge plus',
  );
  // 2. Le plancher d'abattement, souvent oublié.
  assert.ok(Math.abs(TNS.assietteUnique(3000).abattement - 845.86) < 0.01);
  // 3. Entre les deux, l'assiette vaut 74 % pile.
  assert.equal(Math.round(TNS.assietteUnique(100000).assiette), 74000);
  // 4. Le plancher de retraite de base, au SMIC du 1er JANVIER.
  assert.equal(Math.round(TNS.cotisationsAnnuelles(1).lignes.retraiteBase), 967);
  // 5. La valeur du texte, pas celle de la page de l'URSSAF qui dit 17 494 €.
  assert.equal(
    Math.round(TNS.cotisationsAnnuelles(400000).lignes.retraiteComplementaire),
    17013,
  );
  // 6. LE PLUS DISCRIMINANT : taux progressif et non barème marginal. Un
  // barème marginal donnerait environ 74 € au lieu de 505 € brut. Facteur 7.
  const c = TNS.cotisationsAnnuelles(30000);
  assert.equal(Math.round(c.assiette), 22200);
  assert.equal(Math.round(c.lignes.ij), 111);
  assert.equal(Math.round(c.lignes.maladie), 394);
});

test('TNS : la table de référence complète, au centime', () => {
  const table = [
    [5000, 1914], [10000, 2951], [15000, 4320], [20000, 5711], [30000, 8833],
    [40000, 12272], [50000, 15593], [64946, 20772], [80000, 24822],
    [100000, 30489], [150000, 42436], [200000, 54488], [240300, 63172],
    [300000, 76435], [400000, 96455],
  ];
  for (const [rbs, attendu] of table) {
    const total = Math.round(TNS.cotisationsAnnuelles(rbs).total);
    assert.ok(
      Math.abs(total - attendu) <= 3,
      `revenu ${rbs} : ${total} € attendu ${attendu} €`,
    );
  }
});

test('TNS : le taux effectif est une CLOCHE, pas une droite', () => {
  // C'est le résultat le plus utile de ce régime pour la page méthode, et il
  // contredit l'intuition : le taux monte, culmine au voisinage d'un plafond
  // d'assiette, puis REDESCEND. Un moteur qui rend une droite est faux.
  const t = (rbs) => TNS.cotisationsAnnuelles(rbs).taux;
  assert.ok(t(64946) > t(20000), 'il monte jusqu’au sommet');
  assert.ok(t(64946) > t(200000), 'puis il redescend');
  assert.ok(Math.abs(t(64946) * 100 - 31.98) < 0.02, `sommet à ${(t(64946) * 100).toFixed(2)} %`);
});

test('TNS : aucune part employeur, et c’est le régime qui le dit', () => {
  // Un indépendant voit cent pour cent de ce qu'il verse. Zéro n'est pas un
  // trou dans le calcul, c'est le résultat.
  const s = M.simuler({ netMensuel: 3000, statut: 'independant' });
  assert.equal(s.plateauGauche.lignes.patronales, 0);
  assert.ok(s.plateauGauche.lignes.salariales > 0);
});

test('TNS : la pension se CALCULE, faute de taux de remplacement publié', () => {
  const s = M.simuler({ netMensuel: 3000, statut: 'independant' });
  const d = s.plateauDroit.detailPension;
  assert.equal(d.brut, false);
  assert.ok(d.base > 0 && d.complementaire > 0);
  // Vingt-cinq meilleures années, chacune plafonnée au plafond de sécurité
  // sociale : la base ne peut pas dépasser la moitié de ce plafond mensuel.
  assert.ok(d.base <= (48060 / 2) / 12 + 0.01, `base = ${d.base.toFixed(0)} €/mois`);
  assert.equal(d.anneesRetenues, 25);
  assert.equal(s.plateauDroit.pensionMensuelle, d.totale);
});

test('TNS : inversion du disponible vers le revenu brut social', () => {
  for (const rbs of [2000, 4000, 8000]) {
    const { netAvantImpot } = TNS.netsDepuisBrut(rbs);
    assert.ok(
      Math.abs(TNS.brutDepuisNet(netAvantImpot) - rbs) < 0.5,
      `revenu ${rbs} retrouvé à ${TNS.brutDepuisNet(netAvantImpot).toFixed(2)}`,
    );
  }
});

test('un patron de TPE en SARL passe bien par le régime des indépendants', () => {
  const sarl = M.simuler({ netMensuel: 4000, statut: 'tpe', formeTpe: 'sarl-majoritaire' });
  const independant = M.simuler({ netMensuel: 4000, statut: 'independant' });
  assert.equal(sarl.entree.regime, 'tns');
  assert.equal(
    Math.round(sarl.plateauGauche.total),
    Math.round(independant.plateauGauche.total),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Le professionnel libéral réglementé (CIPAV)
import * as CIPAV from './cipav.js';

test('CIPAV : la table de référence, poste par poste, au centime', () => {
  // Reconstruite depuis le barème opposable de l'URSSAF (mise à jour du
  // 27/02/2026), et non depuis l'API mon-entreprise, qui ne sert pas ce régime.
  // Chaque ligne est un calcul indépendant : si une seule casse, c'est ce
  // poste-là qui a bougé, pas le barème entier.
  //
  // ⚠ La retraite de base tombe un euro sous la ligne du rapport de recherche à
  // partir d'un plafond d'assiette (5 579 contre 5 580). Le rapport arrondit
  // chaque tranche AVANT de les additionner ; le moteur additionne puis
  // arrondit. C'est le rapport qui a une décimale de retard, pas le barème.
  const cas = [
    // revenu brut social, assiette, retraite base, retraite compl., invalidité
    [25000, 18500, 1961, 2035, 93],
    [50000, 37000, 3922, 4070, 185],
    [100000, 74000, 5579, 10734, 370],
    [150000, 111000, 6271, 18504, 445],
    [250000, 187522, 7702, 34574, 445],
  ];
  for (const [rbs, assiette, base, compl, invalidite] of cas) {
    const c = CIPAV.cotisationsAnnuelles(rbs);
    assert.equal(Math.round(c.assiette), assiette, `assiette pour ${rbs}`);
    assert.equal(Math.round(c.lignes.retraiteBase), base, `retraite de base pour ${rbs}`);
    assert.equal(
      Math.round(c.lignes.retraiteComplementaire), compl,
      `retraite complémentaire pour ${rbs}`,
    );
    assert.equal(
      Math.round(c.lignes.invaliditeDeces), invalidite,
      `invalidité-décès pour ${rbs}`,
    );
  }
});

test('CIPAV : les deux tranches de retraite de base portent sur la MÊME assiette', () => {
  // C'est le piège du régime. Si T2 était traitée comme une tranche marginale
  // de 1 à 5 plafonds, la cotisation minimale publiée par la CIPAV ne
  // tomberait plus : 573 € = 5 409 × (8,73 % + 1,87 %), les deux taux sur la
  // même base. Un moteur qui rend autre chose ici sous-estime tous les hauts
  // revenus.
  const minimum = CIPAV.cotisationsAnnuelles(1).lignes.retraiteBase;
  assert.equal(Math.round(minimum), 573, `plancher = ${minimum.toFixed(2)} €`);
});

test('CIPAV : l’écart avec l’artisan CHANGE DE SIGNE, il ne s’ignore pas', () => {
  // Le résultat qui justifie un quatrième régime à lui seul. En bas, le libéral
  // paie MOINS parce que sa retraite de base est deux fois moins chère ; en
  // haut il paie BEAUCOUP plus, parce que sa complémentaire est deux fois plus
  // chère. Servir un régime « moyen » aux deux serait faux des deux côtés.
  const ecart = (rbs) =>
    CIPAV.cotisationsAnnuelles(rbs).total - TNS.cotisationsAnnuelles(rbs).total;
  assert.ok(ecart(25000) < 0, `à 25 000 € : ${Math.round(ecart(25000))} €`);
  assert.ok(ecart(50000) < 0, `à 50 000 € : ${Math.round(ecart(50000))} €`);
  assert.ok(ecart(150000) > 0, `à 150 000 € : ${Math.round(ecart(150000))} €`);
  assert.ok(ecart(250000) > 0, `à 250 000 € : ${Math.round(ecart(250000))} €`);
});

test('CIPAV : aucune part employeur, comme l’artisan', () => {
  const s = M.simuler({ netMensuel: 3000, statut: 'independant', activite: 'cipav' });
  assert.equal(s.entree.regime, 'cipav');
  assert.equal(s.plateauGauche.lignes.patronales, 0);
  assert.ok(s.plateauGauche.lignes.salariales > 0);
});

test('CIPAV : la pension est un régime par POINTS dans les DEUX étages', () => {
  // Différence de structure avec l'artisan, pas de taux : la base d'un artisan
  // est celle du régime général, la moitié du revenu moyen de ses 25 meilleures
  // années, donc plafonnée à la moitié d'un plafond mensuel. Celle d'un libéral
  // n'a pas ce plafond, elle compte des points sur TOUTE la carrière.
  const s = M.simuler({ netMensuel: 6000, statut: 'independant', activite: 'cipav' });
  const d = s.plateauDroit.detailPension;
  assert.equal(d.brut, false);
  assert.ok(d.pointsBase > 0, 'des points de base sont acquis');
  assert.equal(s.plateauDroit.pensionMensuelle, d.totale);

  // Une année ne peut jamais rapporter plus que le maximum publié de 582 points,
  // quel que soit le revenu. C'est un plafond de DROITS, pas de cotisation :
  // au-dessus, on cotise sans acquérir un point de plus.
  const maxAnnuel = CIPAV.pointsDeBase(10_000_000);
  assert.ok(maxAnnuel <= 582.001, `plafond annuel de points : ${maxAnnuel.toFixed(1)}`);

  // Ce plafond BORNE la pension de base de toute la carrière, et c'est la
  // différence de structure avec l'artisan : chez lui la base se calcule sur les
  // 25 meilleures années, ici toutes les années comptent mais chacune est
  // plafonnée. Une carrière entière au maximum ne peut pas dépasser cette borne.
  const borneBase = (582 * d.anneesRetenues * 0.6599) / 12;
  assert.ok(d.base <= borneBase + 0.01, `base ${d.base.toFixed(0)} > borne ${borneBase.toFixed(0)}`);
  assert.ok(d.base > 0.5 * borneBase, `base ${d.base.toFixed(0)} anormalement basse`);

  // Toutes les années comptent, pas seulement 25 : le moteur en déroule 43.
  assert.ok(d.anneesRetenues > 25, `années retenues : ${d.anneesRetenues}`);
});

test('CIPAV : sans précision d’activité, on reste au régime des indépendants', () => {
  // Le libéral réglementé est une MINORITÉ des indépendants : depuis 2019 les
  // libéraux non réglementés relèvent eux aussi de la sécurité sociale des
  // indépendants. Le défaut doit donc rester `tns`, et jamais l'inverse.
  assert.equal(M.regimeDuStatut('independant'), 'tns');
  assert.equal(M.regimeDuStatut('independant', undefined, 'ssi'), 'tns');
  assert.equal(M.regimeDuStatut('independant', undefined, 'cipav'), 'cipav');
  // L'activité n'a aucun effet sur les autres statuts.
  assert.equal(M.regimeDuStatut('salarie', undefined, 'cipav'), 'salarie');
  assert.equal(M.regimeDuStatut('fonctionnaire', undefined, 'cipav'), 'fonctionnaire');
});

test('CIPAV : inversion du disponible vers le revenu brut social', () => {
  for (const rbs of [2000, 4000, 8000, 20000]) {
    const { netAvantImpot } = CIPAV.netsDepuisBrut(rbs);
    assert.ok(
      Math.abs(CIPAV.brutDepuisNet(netAvantImpot) - rbs) < 0.5,
      `revenu ${rbs} retrouvé à ${CIPAV.brutDepuisNet(netAvantImpot).toFixed(2)}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
test('l’impôt sur le revenu est chiffré dans TOUS les régimes', () => {
  // ⚠ Ce test verrouille un bug qui a vécu dans le moteur sans qu'aucun des
  // 66 tests précédents ne le voie : la projection de carrière reconstituait le
  // net imposable en additionnant `csgNonDeductible` et `crds`. Un indépendant
  // n'a PAS de ligne `crds` — sa CSG-CRDS est une seule contribution de 9,70 %.
  // La clé absente valait `undefined`, la somme valait NaN, et l'impôt rendait
  // ZÉRO. Un indépendant affichait donc 0 € d'impôt sur quarante-trois ans,
  // chiffre parfaitement crédible et parfaitement faux.
  //
  // À net après impôt égal, l'impôt doit être du même ordre dans les quatre
  // régimes : c'est le MÊME barème appliqué à des revenus nets identiques.
  const cas = [
    ['salarie', {}],
    ['independant', {}],
    ['independant', { activite: 'cipav' }],
    ['fonctionnaire', {}],
  ];
  const impots = cas.map(([statut, extra]) => {
    const s = M.simuler({ netMensuel: 2500, statut, ...extra });
    const ir = s.carriere.totaux.impotRevenu;
    assert.ok(Number.isFinite(ir), `${statut} : impôt non chiffrable (${ir})`);
    /*
     * ⚠ Plancher passé de 100 000 à 80 000 le 09/09/2026, et ce n'est PAS pour
     * faire verdir un test. Il vise le bug qu'il a été écrit pour attraper : un
     * impôt qui vaut ZÉRO sur quarante-trois ans. Le jour où la territoriale a
     * reçu sa propre courbe de carrière, plus plate que celle du privé qu'on lui
     * servait, le fonctionnaire est tombé à 99 502 € : une conséquence voulue et
     * sourcée, à un demi-pour-cent d'un seuil rond. Un seuil rond n'est pas une
     * mesure, et le garder aurait fait passer une correction juste pour une
     * régression.
     */
    assert.ok(ir > 80_000, `${statut} : impôt de ${Math.round(ir)} €, anormalement bas`);
    return ir;
  });
  // ⚠ Ils ne sont PAS égaux, et il ne faut pas l'exiger : l'abattement de 10 %
  // pour frais professionnels ne vaut que pour les traitements et salaires
  // (CGI art. 83, 3°). Un bénéfice BIC ou BNC n'y a pas droit, donc à net avant
  // impôt égal un indépendant est imposé sur une assiette plus large qu'un
  // salarié. C'est le droit, pas une anomalie.
  const [salarie, independant] = impots;
  assert.ok(
    independant > salarie * 1.15,
    `l’indépendant paie ${Math.round(independant)} € contre ${Math.round(salarie)} € au salarié : `
    + 'l’abattement de 10 % lui est-il appliqué à tort ?',
  );
});

test('un net imposable non chiffrable LÈVE, il ne vaut pas zéro d’impôt', () => {
  // Le garde-fou qui aurait attrapé le bug ci-dessus. Une donnée manquante doit
  // casser bruyamment : rendre 0 € d'impôt sur une entrée absurde fabrique un
  // chiffre faux et crédible, exactement ce que ce dossier reproche à la
  // partie adverse.
  assert.throws(() => impotSurLeRevenu(NaN), /non chiffrable/);
  assert.throws(() => impotSurLeRevenu(undefined), /non chiffrable/);
  assert.throws(() => impotSurLeRevenu(Infinity), /non chiffrable/);
  // Un revenu réellement nul, lui, reste un revenu : zéro d'impôt, sans lever.
  assert.equal(impotSurLeRevenu(0), 0);
});

test('cocher l’impôt AJOUTE vraiment quelque chose, dans tous les régimes', () => {
  // Le symptôme visible du bug : la case « impôt sur le revenu » affichait 0
  // pour un indépendant, donc la cocher ne changeait pas le verdict.
  const sans = { salariales: true, patronales: true, impotRevenu: false, consommation: false };
  const avec = { ...sans, impotRevenu: true };
  for (const [statut, extra] of [
    ['salarie', {}], ['independant', {}], ['independant', { activite: 'cipav' }], ['fonctionnaire', {}],
  ]) {
    const a = M.simuler({ netMensuel: 2500, statut, ...extra, perimetre: sans }).plateauGauche.total;
    const b = M.simuler({ netMensuel: 2500, statut, ...extra, perimetre: avec }).plateauGauche.total;
    // Même plancher, même raison que ci-dessus : on cherche un zéro, pas 100 000.
    assert.ok(b - a > 80_000, `${statut} : cocher l’impôt n’ajoute que ${Math.round(b - a)} €`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
test('l’entrée est le net AVANT impôt, et l’impôt s’ajoute par-dessus', () => {
  // ⚠ Le changement de convention le plus lourd du moteur, et il n'est pas
  // cosmétique. On inversait depuis le net APRÈS impôt : l'impôt était une
  // somme déjà retranchée, que le moteur retrouvait à rebours. Il devient un
  // prélèvement qu'on ajoute et qu'on voit arriver.
  //
  // Conséquence vérifiable : à l'âge où le salaire est constaté, le net AVANT
  // impôt de la carrière doit valoir EXACTEMENT ce qui a été saisi.
  for (const [statut, extra] of [
    ['salarie', {}], ['independant', {}], ['independant', { activite: 'cipav' }], ['fonctionnaire', {}],
  ]) {
    const s = M.simuler({ netMensuel: 2500, ageActuel: 36, statut, ...extra });
    const annee = s.carriere.annees.find((a) => a.age === 36);
    assert.ok(
      Math.abs(annee.netAvantImpot - 2500) < 0.5,
      `${statut} : net avant impôt à ${annee.netAvantImpot.toFixed(2)} au lieu de 2500`,
    );
    assert.equal(s.saisieEstLeBrut, false);
    // Et ce qui arrive sur le compte est STRICTEMENT plus bas, de l'impôt.
    assert.ok(annee.netApresImpot < annee.netAvantImpot, `${statut} : l’impôt n’emporte rien`);
    assert.ok(
      Math.abs((annee.netAvantImpot - annee.netApresImpot) * 12 - annee.impotRevenu) < 1,
      `${statut} : l’écart annuel ne vaut pas l’impôt de l’année`,
    );
    assert.ok(
      Math.abs(s.netApresImpotActuel - annee.netApresImpot) < 0.01,
      `${statut} : netApresImpotActuel ne pointe pas sur l’année courante`,
    );
  }
});

test('le point de bascule et la médiane INSEE se comparent enfin', () => {
  // Le pivot était exprimé en net APRÈS impôt et la page le comparait aux
  // 2 190 € de l'INSEE, qui sont un net AVANT impôt. C'était une erreur de
  // dénominateur, celle-là même que ce dossier reproche à la partie adverse.
  // Les deux sont désormais sur la même base. Et depuis que seule la pension
  // est comptée en face, le pivot tombe SOUS le médian : la majorité des
  // salariés du privé versent plus qu'ils ne reçoivent. Il valait 2 337 €
  // quand santé, école et chômage pesaient encore 390 000 €.
  const pivot = salairePivot();
  assert.ok(pivot < 2190, `pivot ${pivot} €, attendu sous le médian INSEE`);
  assert.ok(pivot > 1200, `pivot ${pivot} €, anormalement bas`);
});

test('le micro-entrepreneur a son régime, et ne retombe JAMAIS sur le réel', () => {
  assert.equal(M.regimeDuStatut('independant', undefined, 'micro'), 'micro');
  assert.notEqual(M.regimeDuStatut('independant', undefined, 'micro'), 'tns');
  const micro = M.simuler({ netMensuel: 2500, statut: 'independant', activite: 'micro' });
  const reel = M.simuler({ netMensuel: 2500, statut: 'independant' });
  assert.equal(micro.entree.regime, 'micro');
  assert.notEqual(
    Math.round(micro.plateauGauche.total),
    Math.round(reel.plateauGauche.total),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Le micro-entrepreneur
import * as MICRO from './micro.js';
import { CATEGORIES } from './baremes-micro.js';

test('micro : le taux du barème opposable, catégorie par catégorie', () => {
  // CSS art. D613-4, version en vigueur depuis le 01/01/2026 (décret 2025-943).
  // ⚠ Le décret 2024-484 programmait 26,1 % en BNC pour 2026 et le web le
  // répète encore : c'est le texte en vigueur qui fait foi, à 25,6 %.
  assert.equal(CATEGORIES.vente.taux, 0.123);
  assert.equal(CATEGORIES.services.taux, 0.212);
  assert.equal(CATEGORIES.liberal.taux, 0.256);

  // La contribution formation S'AJOUTE au taux global, elle n'y est pas incluse.
  assert.ok(Math.abs(MICRO.tauxTotal('liberal') - (0.256 + 0.002)) < 1e-9);
  assert.ok(Math.abs(MICRO.tauxTotal('vente') - (0.123 + 0.001 + 0.00015)) < 1e-9);
});

test('micro : l’assiette est le CHIFFRE D’AFFAIRES, pas un revenu', () => {
  // C'est toute la différence avec le réel : il paie sur ce qu'il encaisse,
  // y compris sur ce qu'il a dépensé pour travailler.
  const c = MICRO.cotisationsAnnuelles(40000, { categorieMicro: 'liberal' });
  assert.equal(Math.round(c.assiette), 40000);
  assert.equal(Math.round(c.total), Math.round(40000 * 0.258));
  // Aucun plancher, aucun plafond, aucun palier : le taux est constant.
  const petit = MICRO.cotisationsAnnuelles(5000, { categorieMicro: 'liberal' });
  assert.ok(Math.abs(petit.taux - c.taux) < 1e-9);
});

test('micro : l’inversion est exacte, pas approchée', () => {
  // Seul régime du moteur où elle peut l'être : tous les taux portent sur le
  // même CA, sans palier. Une dichotomie ici serait un aveu d'ignorance.
  for (const cat of ['vente', 'services', 'liberal']) {
    for (const net of [1000, 2500, 5000]) {
      const ca = MICRO.brutDepuisNet(net, { categorieMicro: cat });
      const { netAvantImpot } = MICRO.netsDepuisBrut(ca, { categorieMicro: cat });
      assert.ok(
        Math.abs(netAvantImpot - net) < 1e-9,
        `${cat} à ${net} € : retrouvé à ${netAvantImpot}`,
      );
    }
  }
});

test('micro : il est imposé sur un revenu qu’il ne touche pas', () => {
  // Le fait le plus contre-intuitif du régime. L'abattement forfaitaire ne
  // mesure pas ses charges : il n'a aucune raison de coïncider avec ce qui lui
  // reste vraiment, et le rapport entre les deux change avec la catégorie.
  const ca = 40000 / 12;
  const liberal = MICRO.netsDepuisBrut(ca, { categorieMicro: 'liberal' });
  const services = MICRO.netsDepuisBrut(ca, { categorieMicro: 'services' });
  assert.ok(liberal.netImposable < liberal.netAvantImpot, 'le libéral est imposé sur moins');
  assert.ok(services.netImposable < services.netAvantImpot);
  assert.notEqual(
    Math.round((liberal.netImposable / liberal.netAvantImpot) * 1000),
    Math.round((services.netImposable / services.netAvantImpot) * 1000),
  );
});

test('micro : les droits à retraite suivent la circulaire Cnav, pas le raccourci', () => {
  // ⚠ Le raccourci qu'on lit partout est « CA après abattement / 150 SMIC ».
  // La chaîne officielle passe par le forfait global, sa clé de répartition, et
  // un revenu RECONSTITUÉ au taux d'un indépendant au réel.
  const d = MICRO.droitsRetraiteAnnuels(40000, { categorieMicro: 'liberal' });
  const attenduPartBase = 40000 * 0.256 * 0.464;
  assert.ok(Math.abs(d.partBase - attenduPartBase) < 0.01);
  assert.ok(Math.abs(d.revenuCotise - attenduPartBase / 0.1787) < 0.01);
  assert.ok(d.trimestres >= 1 && d.trimestres <= 4);

  // Jamais plus de quatre trimestres dans une année, quel que soit le CA.
  assert.equal(MICRO.droitsRetraiteAnnuels(10_000_000, { categorieMicro: 'liberal' }).trimestres, 4);

  // ⚠ Le revenu porté au compte est TRÈS inférieur au chiffre d'affaires :
  // servir le CA au calcul de pension la gonflerait d'un facteur trois.
  assert.ok(d.revenuCotise < 40000 * 0.75, `revenu cotisé ${Math.round(d.revenuCotise)} €`);
});

test('micro : le versement libératoire remplace le barème', () => {
  const sans = M.simuler({ netMensuel: 2500, statut: 'independant', activite: 'micro' });
  const avec = M.simuler({
    netMensuel: 2500, statut: 'independant', activite: 'micro', versementLiberatoire: true,
  });
  const anneeSans = sans.carriere.annees.find((a) => a.age === 36);
  const anneeAvec = avec.carriere.annees.find((a) => a.age === 36);
  // Même chiffre d'affaires, impôt différent : il ne passe plus par le barème.
  assert.ok(Math.abs(anneeSans.brut - anneeAvec.brut) < 0.01, 'le CA ne doit pas bouger');
  assert.notEqual(
    Math.round(sans.carriere.totaux.impotRevenu),
    Math.round(avec.carriere.totaux.impotRevenu),
  );
  // Et il vaut exactement le taux publié appliqué au chiffre d'affaires.
  assert.ok(Math.abs(anneeAvec.impotRevenu - anneeAvec.brut * 12 * 0.022) < 0.01);
});

test('micro : la catégorie change tout, du simple au double', () => {
  // À chiffre d'affaires ÉGAL (c'est lui qu'on saisit), les cotisations
  // vont du simple au double entre la vente (12,3 %) et le libéral (25,6 %).
  const cotisations = (cat) =>
    M.simuler({
      netMensuel: 2500, statut: 'independant', activite: 'micro', categorieMicro: cat,
    }).carriere.totaux.salariales;
  assert.ok(cotisations('liberal') > cotisations('vente') * 2, 'l’écart entre catégories doit être massif');
  assert.ok(cotisations('services') > cotisations('vente'));
  // Une catégorie inconnue LÈVE, elle ne retombe pas sur un défaut.
  assert.throws(() => MICRO.categorie('bricolage'), /inconnue/);
});


test('micro : ce qu’on saisit est le CHIFFRE D’AFFAIRES, et l’URSSAF part sous les yeux', () => {
  // Un micro ne connaît pas « ce qu'il lui reste après cotisations », il
  // connaît ce qu'il déclare. Lui faire saisir un net faisait disparaître de
  // l'écran les 26 % que l'URSSAF prend : ils étaient déjà retirés du chiffre.
  const s = M.simuler({ netMensuel: 2803, ageActuel: 36, statut: 'independant', activite: 'micro' });
  const annee = s.carriere.annees.find((a) => a.age === 36);
  assert.equal(s.saisieEstLeBrut, true);
  assert.ok(Math.abs(annee.brut - 2803) < 0.01, `CA de l'année : ${annee.brut}`);
  assert.ok(Math.abs(s.brutActuel - 2803) < 0.01);
  // Et les cotisations du mois valent bien 25,8 % du CA, à l'écran comme au barème.
  assert.ok(Math.abs(s.cotisationsActuelles - 2803 * 0.258) < 0.05, `cotisations ${s.cotisationsActuelles}`);
  assert.ok(Math.abs(s.netAvantImpotActuel - 2803 * 0.742) < 0.05);
});

// ─────────────────────────────────────────────────────────────────────────────
// Le second plateau par paliers : prix unitaires sourcés, palier choisi par la
// personne. Sans paliers, les trois lignes restent nommées sans montant.
test('paliers : école, du bac à la licence, aux prix DEPP 2024', () => {
  assert.equal(M.montantEcole('rien'), 0);
  assert.equal(M.montantEcole('bac'), 3 * 8990 + 5 * 9130 + 4 * 10450 + 3 * 13020);
  assert.equal(M.montantEcole('bac'), 153_480);
  assert.equal(M.montantEcole('etudes'), 153_480 + 3 * 12460);
  assert.equal(M.montantEcole('etudes'), 190_860);
});

test('paliers : santé, cumul DREES par âge de 0 à 84 ans inclus', () => {
  assert.equal(M.santeParAn(0), 925);
  assert.equal(M.santeParAn(10), 925);
  assert.equal(M.santeParAn(11), 887);
  assert.equal(M.santeParAn(35), 1477);
  assert.equal(M.santeParAn(84), 7858);
  assert.equal(M.santeSurUneVie(), 213_377);
  assert.equal(M.montantSante('normal'), 213_377);
  assert.equal(M.montantSante('fer'), Math.round(213_377 * 0.25));
  assert.equal(M.montantSante('fragile'), Math.round(213_377 * 2.5));
});

test('paliers : chômage, allocation nette moyenne Unédic fois les mois', () => {
  assert.equal(M.montantChomage('jamais'), 0);
  assert.equal(M.montantChomage('trou'), 6 * 1040);
  assert.equal(M.montantChomage('deuxAns'), 24 * 1040);
});

test('paliers : un palier inconnu lève, il ne retombe pas sur zéro', () => {
  assert.throws(() => M.montantEcole('doctorat'), /Palier inconnu/);
});

test('sans paliers, école, santé et chômage restent nommés sans montant', () => {
  const s = simuler({ netMensuel: 2190 });
  assert.equal(s.plateauDroit.lignes.education.montant, null);
  assert.equal(s.plateauDroit.lignes.sante.montant, null);
  assert.equal(s.plateauDroit.lignes.chomage.montant, null);
  assert.equal(s.plateauDroit.total, s.plateauDroit.lignes.retraite.montant);
});

test('avec paliers, le second plateau les compte et le verdict bouge', () => {
  const sans = simuler({ netMensuel: 2190 });
  const avec = simuler({
    netMensuel: 2190,
    paliers: { ecole: 'etudes', sante: 'normal', chomage: 'jamais' },
  });
  assert.equal(avec.plateauDroit.lignes.education.montant, 190_860);
  assert.equal(avec.plateauDroit.lignes.sante.montant, 213_377);
  assert.equal(avec.plateauDroit.lignes.chomage.montant, 0);
  assert.equal(
    avec.plateauDroit.total,
    sans.plateauDroit.total + 190_860 + 213_377,
  );
  const signe = (s) => (s.verdict.braquage ? 1 : -1) * s.verdict.ecart;
  assert.equal(signe(avec), signe(sans) - 190_860 - 213_377);
  // Au salaire médian, deux paliers ordinaires suffisent à retourner le verdict.
  assert.equal(sans.verdict.braquage, true);
  assert.equal(avec.verdict.braquage, false);
  assert.equal(avec.plateauGauche.total, sans.plateauGauche.total);
});

test('un fonctionnaire garde sa ligne chômage absente, même avec paliers', () => {
  const s = simuler({
    netMensuel: 2190, statut: 'fonctionnaire', versant: 'fpt',
    paliers: { ecole: 'bac', sante: 'normal', chomage: 'deuxAns' },
  });
  assert.equal(s.plateauDroit.lignes.chomage, undefined);
  assert.equal(s.plateauDroit.lignes.education.montant, 153_480);
});

test('le pivot monte quand la personne déclare avoir plus reçu', () => {
  const perimetre = { salariales: true, patronales: true, impotRevenu: true, consommation: true };
  const nu = salairePivot({ perimetre });
  const peu = salairePivot({ perimetre, paliers: { ecole: 'rien', sante: 'fer', chomage: 'jamais' } });
  const beaucoup = salairePivot({ perimetre, paliers: { ecole: 'etudes', sante: 'fragile', chomage: 'deuxAns' } });
  assert.ok(nu !== null && peu !== null && beaucoup !== null);
  assert.ok(peu > nu, `${peu} > ${nu}`);
  assert.ok(beaucoup > peu, `${beaucoup} > ${peu}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Le coût d'opportunité : avec un placement, le verdict compare ce que le
// prélèvement serait devenu, placé, à ce qui a été rendu.
test('sans placement, le verdict compare pris et rendu, et opportunite est null', () => {
  const s = simuler({ netMensuel: 2190 });
  assert.equal(s.opportunite, null);
  assert.equal(s.verdict.ecart, Math.abs(s.plateauGauche.total - s.plateauDroit.total));
});

test('avec placement, le capital placé remplace le prélèvement dans la balance', () => {
  const pe = { salariales: true, patronales: true, impotRevenu: true, consommation: true };
  const paliers = { ecole: 'bac', sante: 'normal', chomage: 'trou' };
  const nu = simuler({ netMensuel: 2190, perimetre: pe, paliers });
  const zero = simuler({ netMensuel: 2190, perimetre: pe, paliers, placement: { rendementReel: 0 } });
  // À 0 % réel et sans frais, le capital vaut exactement la somme prélevée.
  assert.ok(Math.abs(zero.opportunite.capital - nu.plateauGauche.total) < 1e-6);
  assert.equal(zero.verdict.braquage, nu.verdict.braquage);
  const sp = simuler({ netMensuel: 2190, perimetre: pe, paliers, placement: { rendementReel: 0.0677 } });
  assert.ok(sp.opportunite.capital > 3 * nu.plateauGauche.total, `${sp.opportunite.capital}`);
  assert.equal(sp.verdict.braquage, true);
  assert.equal(sp.verdict.ecart, sp.opportunite.capital - sp.plateauDroit.total);
  // Un rendement réel négatif (le Livret A) peut retourner le verdict.
  const livret = simuler({ netMensuel: 2190, perimetre: pe, paliers, placement: { rendementReel: -0.0024 } });
  assert.ok(livret.opportunite.capital < nu.plateauGauche.total);
});

test('les frais mordent sur le capital placé, et sansFrais les ignore', () => {
  const s = simuler({ netMensuel: 2190, placement: { rendementReel: 0.05, fraisAnnuels: 0.02, fraisVersement: 0.015 } });
  assert.ok(s.opportunite.capital < s.opportunite.sansFrais);
});

test('le pivot existe aussi sur le coût d’opportunité, et monte avec le rendement', () => {
  const perimetre = { salariales: true, patronales: true, impotRevenu: true, consommation: true };
  const paliers = { ecole: 'bac', sante: 'normal', chomage: 'trou' };
  const lent = salairePivot({ perimetre, paliers, placement: { rendementReel: 0.0075 } });
  const rapide = salairePivot({ perimetre, paliers, placement: { rendementReel: 0.0677 } });
  assert.ok(lent === null || rapide === null || rapide < lent, `${rapide} < ${lent}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Les accises déclarées : tabac, carburant, alcool, en plus de la TVA.
test('sans habitudes, rien ne s’ajoute à la TVA', () => {
  const s = simuler({ netMensuel: 2190 });
  const t = simuler({ netMensuel: 2190, habitudes: { tabac: 'non', carburant: 'non', alcool: 'non' } });
  assert.equal(s.carriere.totaux.taxesConsommation, t.carriere.totaux.taxesConsommation);
});

test('un paquet par jour ajoute 365 fois les taxes du paquet, chaque année', () => {
  const sans = simuler({ netMensuel: 2190, habitudes: { tabac: 'non', carburant: 'non', alcool: 'non' } });
  const avec = simuler({ netMensuel: 2190, habitudes: { tabac: 'jour', carburant: 'non', alcool: 'non' } });
  const parAn = 365 * 13 * 0.825;
  assert.ok(Math.abs((avec.carriere.totaux.taxesConsommation - sans.carriere.totaux.taxesConsommation) - parAn * avec.carriere.annees.length) < 1e-6);
  assert.ok(Math.abs(M.accisesAnnuelles({ tabac: 'jour', carburant: 'non', alcool: 'non' }) - parAn) < 1e-9);
});

test('un plein par mois : TICPE sur 50 litres plus la TVA du plein', () => {
  const parPlein = 50 * 0.6702 + (98.5 - 98.5 / 1.2);
  assert.ok(Math.abs(M.accisesAnnuelles({ tabac: 'non', carburant: 'mois', alcool: 'non' }) - 12 * parPlein) < 1e-9);
  assert.throws(() => M.accisesAnnuelles({ tabac: 'non', carburant: 'vélo', alcool: 'non' }), /Habitude inconnue/);
});

test('paliers : bac+5 dans le privé compte comme le bac, bac+5 public compte cinq ans de fac', () => {
  assert.equal(M.montantEcole('prive'), M.montantEcole('bac'));
  assert.equal(M.montantEcole('master'), 153_480 + 5 * 12460);
  assert.equal(M.montantSante('tuile'), Math.round(213_377 * 1.5));
  assert.equal(M.montantChomage('longue'), 48 * 1040);
});

// ─────────────────────────────────────────────────────────────────────────────
// L'échelle du butin : les seuils décroissent, et chaque palier est atteignable.
test('l’échelle du butin est strictement décroissante et sourcée', async () => {
  const { ECHELLE, objetPour } = await import('../src/lib/objets.ts');
  assert.ok(ECHELLE.length >= 20, `${ECHELLE.length} paliers`);
  for (let i = 1; i < ECHELLE.length; i += 1) {
    assert.ok(ECHELLE[i].seuil < ECHELLE[i - 1].seuil,
      `${ECHELLE[i - 1].id} (${ECHELLE[i - 1].seuil}) puis ${ECHELLE[i].id} (${ECHELLE[i].seuil})`);
  }
  for (const p of ECHELLE) {
    assert.ok(p.source && p.source.length > 10, `source manquante : ${p.id}`);
    assert.ok(p.pointe && p.pointe.length > 5, `pointe manquante : ${p.id}`);
    // Chaque palier est SERVI par son propre seuil : sinon il est inatteignable.
    assert.equal(objetPour(p.seuil).id, p.id);
  }
});

// ─── Les courbes de carrière, une par régime ─────────────────────────────────
test('carrière : chaque versant public a SA courbe, jamais celle du privé', () => {
  /*
   * Le défaut d'origine : `indiceAge` lisait la courbe du privé en dur, donc la
   * projection servait la carrière d'un salarié du privé à un fonctionnaire.
   * C'était le seul endroit du moteur où un régime empruntait un chiffre à un
   * autre, alors que `regimeDe` lève plutôt que de le faire ailleurs.
   */
  const { prive, fpe, fpt, fph } = COURBES_AGE;
  for (const [nom, c] of Object.entries({ fpe, fpt, fph })) {
    assert.notDeepEqual(c, prive, `${nom} ne doit pas être la courbe du privé`);
  }
  // Et les trois versants diffèrent entre eux : une courbe publique unique
  // aurait remplacé une erreur par une autre.
  assert.notDeepEqual(fpe, fpt);
  assert.notDeepEqual(fpt, fph);
  assert.notDeepEqual(fpe, fph);
});

test('carrière : la territoriale est PLATE, l’État est plus pentu que le privé', () => {
  /*
   * Le contresens qu'on s'est raconté avant de regarder les chiffres : « une
   * carrière publique avance à l'ancienneté, son profil est plus plat ». Sur
   * champ symétrique (Insee Première n° 2043), le public agrégé vaut 1,86 contre
   * 1,88 pour le privé. C'est la TERRITORIALE qui est plate, et l'État qui monte
   * plus vite que le privé. Ce test existe pour que la fausse intuition ne
   * revienne pas réécrire les courbes.
   */
  /*
   * ⚠ La comparaison se fait sur le SEGMENT 28 -> 55,5 ans, pas sur 22 -> 64.
   * Les deux bouts ne sont pas comparables : le début de la courbe privée
   * (indice 62 à 22 ans) vient d'un champ qui inclut apprentis et stagiaires,
   * que le champ public exclut, et les deux fins sont plafonnées par une
   * convention à nous. Le milieu de carrière est la seule partie où les deux
   * séries mesurent la même chose, et c'est celle que la source compare.
   */
  const pente = (c) => indiceAge(55.5, c) / indiceAge(28, c);
  const { prive, fpe, fpt, fph } = COURBES_AGE;
  assert.ok(pente(fpt) < pente(prive), `la territoriale doit être plus plate que le privé`);
  assert.ok(pente(fpe) > pente(prive), `l'État doit être plus pentu que le privé`);
  assert.ok(pente(fph) > pente(fpt), `l'hospitalière doit être plus pentue que la territoriale`);
});

test('carrière : la fin des courbes publiques est PLAFONNÉE comme celle du privé', () => {
  /*
   * La tranche « 60 et plus » de l'INSEE porte les effets de composition les
   * plus violents (dans l'hospitalière, les praticiens tirent la moyenne à
   * +35 %). La courbe du privé plafonne déjà ce phénomène après 55 ans ; les
   * publiques reçoivent le même traitement, sinon les quatre ne se lisent plus
   * de la même façon. Décision du 09/09/2026, écrite sur la page méthode.
   */
  const penteTardivePrive = indiceAge(64, COURBES_AGE.prive) / indiceAge(55, COURBES_AGE.prive);
  for (const nom of ["fpe", "fpt", "fph"]) {
    const c = COURBES_AGE[nom];
    const tardive = indiceAge(64, c) / indiceAge(55.5, c);
    assert.ok(
      tardive <= penteTardivePrive + 5e-4, // les indices sont arrondis au dixième
      `${nom} : la pente après 55 ans (${tardive}) doit rester sous celle du privé (${penteTardivePrive})`,
    );
  }
});

test('carrière : la projection d’un fonctionnaire dépend du versant', () => {
  /*
   * ⚠ On compare la PENTE, pas le total. Le total diffère déjà entre versants
   * par les taux de contribution (82,28 % à l'État contre 31,65 % ailleurs) :
   * un test sur le total passait encore avec la courbe du privé partout, donc
   * il ne prouvait rien sur la courbe. Le rapport du dernier brut au premier
   * ne dépend, lui, que de la courbe et de la croissance générale, qui est la
   * même pour tous.
   */
  const commun = { netMensuel: 2600, statut: 'fonctionnaire', perimetre: M.PERIMETRE_COMPLET };
  const pente = (versant) => {
    const a = simuler({ ...commun, versant }).carriere.annees;
    return a[a.length - 1].brut / a[0].brut;
  };
  const [etat, terr, hosp] = ['fpe', 'fpt', 'fph'].map(pente);
  assert.ok(etat > terr, `l'État (${etat.toFixed(3)}) doit monter plus que la territoriale (${terr.toFixed(3)})`);
  assert.ok(hosp > terr, `l'hospitalière (${hosp.toFixed(3)}) doit monter plus que la territoriale`);
  // Et la pension publique, calculée sur le traitement de FIN de carrière,
  // suit : c'est là que la forme de la courbe se voit le plus.
  const pension = (versant) => simuler({ ...commun, versant }).plateauDroit.pensionMensuelle;
  assert.ok(pension('fpe') > pension('fpt'));
});

test('carrière : indiceAge retombe sur le privé quand aucune courbe n’est donnée', () => {
  // Le défaut est un CHOIX déclaré, pas un hasard : les régimes non instruits
  // sur ce point (TNS, CIPAV, micro) gardent le comportement d'avant.
  assert.equal(indiceAge(45), indiceAge(45, COURBES_AGE.prive));
});

// ─── Le mandataire social ne cotise pas au chômage ───────────────────────────
test('président de SAS : ni chômage ni AGS du côté patronal', () => {
  /*
   * Un président de SAS ou de SASU est assimilé salarié pour la sécurité
   * sociale, mais il est mandataire social : sans contrat de travail, il est
   * hors du champ de l'assurance chômage, et hors du champ de l'AGS, qui
   * garantit des créances SALARIALES qu'il n'a pas.
   *
   * Le moteur les lui facturait quand même, alors que le bouton du parcours
   * annonce depuis toujours « vous cotisez comme un salarié, SANS l'assurance
   * chômage ». Le site se contredisait, et dans le sens qui gonfle le braquage.
   */
  const brut = 3900;
  const avec = cotisationsPatronales(brut);
  const sans = cotisationsPatronales(brut, { sansChomage: true });
  assert.ok(avec.lignes.chomage > 0, 'un salarié ordinaire cotise bien au chômage');
  assert.ok(avec.lignes.ags > 0, 'et à l’AGS');
  assert.equal(sans.lignes.chomage, 0);
  assert.equal(sans.lignes.ags, 0);
  // Rien d'AUTRE ne bouge : c'est le retrait de deux lignes, pas un régime.
  for (const cle of Object.keys(avec.lignes)) {
    if (cle === 'chomage' || cle === 'ags') continue;
    assert.equal(sans.lignes[cle], avec.lignes[cle], `la ligne ${cle} ne doit pas bouger`);
  }
});

test('président de SAS : le drapeau descend depuis la forme juridique', () => {
  /*
   * La garde qui compte vraiment. Si le fil se coupe entre `formeTpe` et
   * `cotisationsPatronales`, le test ci-dessus reste vert et le site continue
   * de facturer le chômage à un mandataire social.
   */
  const p = M.PERIMETRE_COMPLET;
  const sas = M.simuler({ netMensuel: 3000, statut: 'tpe', formeTpe: 'sas', perimetre: p });
  const sal = M.simuler({ netMensuel: 3000, statut: 'salarie', perimetre: p });
  assert.ok(
    sas.plateauGauche.total < sal.plateauGauche.total,
    'un président de SAS doit être moins prélevé qu’un salarié au même net',
  );
  // Un gérant majoritaire de SARL part sur le régime des indépendants : il ne
  // doit pas hériter du drapeau au passage.
  const sarl = M.simuler({ netMensuel: 3000, statut: 'tpe', formeTpe: 'sarl-majoritaire', perimetre: p });
  assert.notEqual(Math.round(sarl.plateauGauche.total), Math.round(sas.plateauGauche.total));
});

// ─────────────────────────────────────────────────────────────────────────────
/*
 * La liste « CE QUI RESTE OUVERT » de /methode contre l'état RÉEL du moteur.
 *
 * Ces trois tests ne mesurent aucun euro : ils empêchent une limite CORRIGÉE de
 * survivre à sa correction sur la page qui répond au lecteur hostile. Le
 * 09/09/2026 la page a affirmé pendant une journée que le fonctionnaire était
 * projeté sur la courbe du privé et que le président de SAS payait le chômage,
 * alors que le moteur faisait déjà l'inverse dans les deux cas, et un paragraphe
 * plus haut sur la MÊME page disait le contraire. Rien ne pouvait le voir : ni
 * le typecheck, ni le build, ni les 108 tests de valeurs.
 */
const PAGE_METHODE = readFileSync(
  new URL('../src/app/methode/page.tsx', import.meta.url),
  'utf8',
);

test('méthode : une limite corrigée dans le moteur disparaît de la page', () => {
  // Le fonctionnaire a ses trois courbes depuis le 09/09/2026.
  assert.equal(
    typeof regimeDe('fonctionnaire').courbeAge, 'function',
    'préalable : le régime public porte bien sa propre courbe',
  );
  assert.ok(
    !/courbe de carrière du secteur public/i.test(PAGE_METHODE),
    'le fonctionnaire a sa courbe : cette limite ne doit plus être listée',
  );

  // Le président de SAS ne cotise plus au chômage depuis le 09/09/2026.
  const p = M.PERIMETRE_COMPLET;
  const sas = M.simuler({ netMensuel: 3000, statut: 'tpe', formeTpe: 'sas', perimetre: p });
  const sal = M.simuler({ netMensuel: 3000, statut: 'salarie', perimetre: p });
  assert.ok(sas.plateauGauche.total < sal.plateauGauche.total, 'préalable : le correctif est en place');
  assert.ok(
    !/le moteur lui applique aujourd’hui le calcul complet du salarié/i.test(PAGE_METHODE),
    'le chômage du président de SAS est retiré : cette limite ne doit plus être listée',
  );
});

test('méthode : une limite RÉELLE du moteur est listée sur la page', () => {
  /*
   * Ce test a fait son travail le 09/09/2026. Il exigeait que la page déclare
   * l'emprunt de la courbe du privé par les non-salariés TANT QUE `courbeAge`
   * leur manquait ; la source INSEE trouvée, il est passé au rouge dans la
   * minute et a forcé à retirer la limite au lieu de la laisser traîner.
   *
   * Il garde la même forme, sur la limite qui SUBSISTE : aucune source ne croise
   * l'âge et la catégorie, donc le TNS et la CIPAV partagent une courbe.
   */
  assert.equal(
    regimeDe('tns').courbeAge(), regimeDe('cipav').courbeAge(),
    'préalable : les deux régimes lisent bien la MÊME courbe',
  );
  assert.ok(
    /partagent une courbe/i.test(PAGE_METHODE),
    'le TNS et la CIPAV partagent une courbe : la page doit le dire',
  );
  assert.ok(
    !/courbe de carrière des indépendants/i.test(PAGE_METHODE),
    'les non-salariés ont leur courbe : cette limite ne doit plus être listée',
  );
});

test('méthode : les trois contreparties non chiffrées sont annoncées comme telles', () => {
  // Sans paliers, santé / école / chômage restent nommées sans montant.
  const sansPaliers = M.simuler({
    netMensuel: 2190, statut: 'salarie', perimetre: M.PERIMETRE_COMPLET,
  });
  const nonChiffrees = Object.entries(sansPaliers.plateauDroit.lignes)
    .filter(([, l]) => l && l.calcule === false)
    .map(([cle]) => cle);
  assert.deepEqual(
    nonChiffrees.sort(), ['chomage', 'education', 'sante'],
    'préalable : trois lignes restent sans montant tant que rien n’est chiffré',
  );
  assert.ok(
    /ne comptent (donc )?que si vous les chiffrez vous-même/i.test(PAGE_METHODE),
    'la page doit dire que ces trois postes ne comptent qu’une fois chiffrés',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
/*
 * Les courbes des non-salariés, branchées le 09/09/2026 (INSEE, base
 * Non-salariés 2021, tableau NA_TABNAT_2).
 *
 * ⚠ LE TEST COMPARE DES PENTES, JAMAIS DES TOTAUX. La leçon vient du
 * branchement des courbes publiques : un test sur le total passait encore avec
 * la courbe du privé partout, parce que les taux de cotisation diffèrent déjà
 * d'un régime à l'autre. Le rapport du dernier revenu au premier, lui, ne dépend
 * que de la courbe et de la croissance générale, qui est commune.
 */
/*
 * ⚠ La sonde est le NET, jamais le brut. Le brut est reconstitué en inversant
 * le barème de chaque régime, qui n'est pas linéaire : TNS et CIPAV, qui lisent
 * pourtant la MÊME courbe, rendent 2,2596 et 2,2550 de pente en brut. Sonder le
 * brut ferait donc échouer une assertion d'identité parfaitement vraie, et on
 * conclurait à un défaut de branchement inexistant.
 */
const pente = (regime, opts = {}) => {
  const { annees } = deroulerCarriere(2600, { regime, ...opts });
  return annees[annees.length - 1].netAvantImpot / annees[0].netAvantImpot;
};

test('non-salariés : chaque régime lit SA courbe, pas celle du privé', () => {
  const salarie = pente('salarie');
  const tnsPente = pente('tns');
  const microPente = pente('micro');

  assert.notEqual(
    Math.round(tnsPente * 1000), Math.round(salarie * 1000),
    'le TNS ne doit plus dérouler la carrière du privé',
  );
  // Le micro n'est pas seulement différent, il est BEAUCOUP plus plat : sa
  // courbe décline après 35-39 ans quand celle du privé monte jusqu'à 60.
  assert.ok(
    microPente < salarie * 0.7,
    `la pente du micro (${microPente.toFixed(2)}) doit être très en dessous de celle du privé (${salarie.toFixed(2)})`,
  );
  // Le TNS et la CIPAV partagent la même courbe : à net égal, la pente est
  // rigoureusement identique, même si leurs cotisations ne le sont pas du tout.
  assert.equal(
    Math.round(tnsPente * 100000), Math.round(pente('cipav') * 100000),
    'TNS et CIPAV lisent la même courbe, donc la même pente en net',
  );
});

test('micro-entrepreneur : sa carrière DESCEND là où le privé monte', () => {
  /*
   * Le fait qui rendait l'ancien emprunt indéfendable, et la seule assertion de
   * ce lot qui porte sur la FORME plutôt que sur le branchement. La courbe du
   * micro culmine à 35-39 ans puis décline ; celle du privé monte jusqu'à 60.
   * Un emprunt inversait donc la tendance sur toute la seconde moitié.
   */
  const indice = (age) => indiceAge(age, COURBES_AGE.micro);
  assert.ok(indice(37) > indice(30), 'elle monte jusqu’au sommet');
  assert.ok(indice(37) > indice(50), 'puis elle redescend');
  assert.ok(indice(62) < indice(37) * 0.85, 'et la fin est nettement sous le sommet');
  // Le privé fait exactement l'inverse sur le même segment.
  const prive = (age) => indiceAge(age, COURBES_AGE.prive);
  assert.ok(prive(62) > prive(37), 'la courbe du privé, elle, monte jusqu’au bout');
});

test('non-salariés classiques : la fin de carrière est plafonnée, comme partout', () => {
  /*
   * La tranche 60-64 publiée vaut 121,7, le point le PLUS HAUT de la courbe,
   * dans la tranche où 12,6 % des non-salariés déclarent un revenu nul. Même
   * sélection de survivants que le privé et le public plafonnent déjà, donc même
   * traitement : la pente de fin de carrière du privé, +1,12 % de 57 à 64 ans.
   * Sans ce test, un futur millésime réintroduirait la valeur publiée sans que
   * rien ne le signale.
   */
  const c = COURBES_AGE.nonSalarie;
  const i57 = c.find(([a]) => a === 57)[1];
  const dernier = c[c.length - 1];
  assert.equal(dernier[0], 64, 'le dernier point est posé à 64 ans');
  const penteFinPrive = 117.5 / 116.2;
  assert.equal(
    Math.round(dernier[1] * 10), Math.round(i57 * penteFinPrive * 10),
    'la fin suit la pente du privé, pas la valeur publiée de 121,7',
  );
  assert.ok(dernier[1] < 121.7, 'et elle est donc SOUS la valeur publiée');
});

test('non-salariés : les deux courbes sont normalisées sur le même âge que les autres', () => {
  // Base 100 à 36 ans, comme le privé et les trois versants publics. Si une
  // courbe est normalisée ailleurs, les niveaux ne se comparent plus entre
  // régimes et personne ne s'en aperçoit.
  for (const nom of ['prive', 'fpe', 'fpt', 'fph', 'nonSalarie', 'micro']) {
    const i = indiceAge(36, COURBES_AGE[nom]);
    assert.ok(
      Math.abs(i - 100) < 0.6,
      `la courbe ${nom} doit valoir ~100 à 36 ans, elle vaut ${i.toFixed(1)}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
test('moteur : aucun chiffre non sourçable, aucun tutoiement', () => {
  /*
   * Deux gardes sur les mêmes chaînes, celles des contreparties non chiffrées.
   *
   * Le « 91 % des carrières connaissent un épisode indemnisé » a vécu dans ce
   * moteur jusqu'au 09/09/2026 sans exister nulle part : ni l'Unédic, ni la
   * Dares, ni le COR ne l'impriment, et une étude de la Dares en donne même un
   * de sens inverse. Il n'était affiché sur aucun écran, mais le dépôt est
   * PUBLIC et la page méthode invite à le lire : un chiffre inventé y est aussi
   * coûteux qu'à l'écran.
   *
   * Le tutoiement, lui, est la troisième fuite du même genre après la
   * description OpenGraph et les aides des indépendants (09/09/2026). Le produit
   * vouvoie partout depuis `f455ef9`.
   */
  const sansPaliers = M.simuler({
    netMensuel: 2190, statut: 'salarie', perimetre: M.PERIMETRE_COMPLET,
  });
  const textes = Object.values(sansPaliers.plateauDroit.lignes)
    .flatMap((l) => [l?.libelle, l?.note, l?.pourquoi])
    .filter(Boolean);

  assert.ok(textes.length >= 8, 'préalable : on lit bien les libellés des quatre lignes');
  for (const t of textes) {
    /*
     * PAS de \b : en JavaScript il est ASCII, \w valant [A-Za-z0-9_]. Le mot
     * « êtes » se lit donc comme une frontière suivie de « tes », et
     * /\btes\b/ y trouve un tutoiement inexistant. C'est exactement ce que ce
     * test a fait au premier essai, sur une phrase impeccablement vouvoyée.
     * Le repli qui marche : deux regards négatifs sur \p{L}, avec le drapeau u.
     */
    assert.ok(
      !/(?<!\p{L})(tu|ton|ta|tes|toi|tienne)(?!\p{L})/iu.test(t),
      `« ${t} » tutoie, alors que le produit vouvoie partout`,
    );
    assert.ok(
      !/91 ?%/.test(t),
      `« ${t} » porte le 91 % qui n’a aucune source publique`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
/*
 * Les huit défauts de bord relevés à l’audit du 10/09/2026.
 *
 * Aucun ne bloquait le parcours normal : le moteur passe 1001 combinaisons de
 * régime, de montant, de périmètre, de paliers, d’habitudes, de placement, de
 * famille et d’âge sans une exception ni un NaN. Ils vivaient tous sur les
 * chemins d’ENTRÉE et de PARTAGE, que rien ne testait.
 */
const SRC = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('saisie et relecture s’accordent sur le montant maximum', () => {
  /*
   * Le champ tronquait à sept chiffres (9 999 999), la relecture rejette
   * au-dessus d’un million : un dossier saisi entre les deux se calculait, puis
   * une actualisation le jetait, et son aperçu partagé montrait le cas par
   * défaut, c’est-à-dire les chiffres de quelqu’un d’autre.
   */
  const lien = SRC('src/lib/lien.ts');
  const depo = SRC('src/components/cartes/Deposition.tsx');
  assert.match(lien, /export const NET_MAXIMUM = 1_000_000;/, 'la borne est exportée');
  assert.match(lien, /net > NET_MAXIMUM/, 'la relecture cite la borne');
  assert.match(depo, /Math\.min\(NET_MAXIMUM, Number\(chiffres\)\)/, 'la saisie cite la MÊME borne');
});

test('l’ancre se valide contre les écrans du régime, pas contre la liste complète', () => {
  // `#chomage` avec un fonctionnaire affichait un écran hors parcours, un
  // compteur à « 0 / 13 » et deux boutons qui repartaient à la déposition.
  const p = SRC('src/components/Parcours.tsx');
  assert.match(p, /ecransDuRegime/, 'la liste filtrée existe');
  assert.ok(
    !/\(ECRANS as readonly string\[\]\)\.includes\(ancre\)/.test(p),
    'l’ancre ne doit plus être validée contre ECRANS',
  );
});

test('le blocage de la déposition dit toujours CE QUI MANQUE', () => {
  /*
   * Deux manques, deux libellés. « Patron de TPE » sans forme juridique laissait
   * « Signer la déposition » en gris sans un mot, et le message censé l’expliquer
   * était du code mort : sa condition `regime && !calculable` ne peut jamais être
   * vraie, `calculable` n’étant faux que quand `regime` vaut null.
   */
  const depo = SRC('src/components/cartes/Deposition.tsx');
  assert.match(depo, /Votre société, d’abord/, 'le bouton nomme le second manque');
  assert.match(depo, /Il manque la forme de votre société/, 'et le message l’explique');
  assert.ok(!/\{regime && !calculable \?/.test(depo), 'la condition morte est partie');
  // Et l’aide de lecture ne sert plus la fiche de paie d’un salarié à quelqu’un
  // dont on ne connaît pas encore le régime.
  assert.match(depo, /\{regime \? `\$\{ouLire\.aide\} ` : ""\}/, 'l’aide se tait sans régime');
});

test('un seul widget par page', () => {
  // L’écran final montait le lanceur flottant ET le cadre embarqué du volet :
  // deux widgets du même agent, donc deux conversations et une bulle en double.
  const parcours = SRC('src/components/Parcours.tsx');
  const audition = SRC('src/components/Audition.tsx');
  const commissariat = SRC('src/components/Commissariat.tsx');
  assert.match(parcours, /ecran === "avis" \? null : <Commissariat \/>/, 'pas de lanceur sur l’avis');
  assert.match(audition, /data-dalevoz-audition/, 'l’embed porte sa marque');
  assert.match(commissariat, /data-dalevoz-audition/, 'et la garde d’en face la voit');
});

test('les frais ne sont plus cachés derrière un clic', () => {
  // Ils entrent dans le calcul du capital, donc dans le verdict, et ils vivaient
  // dans un volet replié dont le titre n’annonçait pas un réglage.
  const bourse = SRC('src/components/cartes/Bourse.tsx');
  assert.match(bourse, /l’avocate des braqueurs demande la parole" ouvertParDefaut/);
});

test('le bouton de l’écran final ne promet plus d’effacer', () => {
  const avis = SRC('src/components/cartes/Avis.tsx');
  assert.match(avis, /Modifier ma déposition/, 'il dit ce qu’il fait');
  // La chaîne survit dans le commentaire qui raconte le défaut : on vise le
  // LIBELLÉ, pas le mot.
  assert.ok(!/libelle: "Refaire la déposition"/.test(avis), 'et plus ce qu’il ne fait pas');
});

test('la une dit quand le périmètre est réduit', () => {
  /*
   * Décocher les quatre lignes est autorisé, c’est même l’intérêt du site. Mais
   * l’image partagée annonçait « BRAQUÉ DE 0 € » et « en votre faveur » avec le
   * tampon RELAXE, sans qu’un lecteur puisse deviner qu’il manquait trois postes
   * sur quatre.
   */
  const une = SRC('src/lib/une.ts');
  assert.match(une, /POSTE\$\{comptes > 1 \? "S" : ""\} SUR/, 'la mention existe');
  assert.match(une, /\$\{tauxReel\(cran\.reel\)\}\$\{mention\}/, 'et elle voyage avec la une');
});

test('le foyer accepte exactement ce que l’écran propose', () => {
  // `?e=5` posait cinq enfants, donc 4 parts, sans qu’aucun bouton du bloc foyer
  // n’apparaisse actif : un état qui change l’impôt et qu’on ne peut pas refaire.
  const lien = SRC('src/lib/lien.ts');
  const depo = SRC('src/components/cartes/Deposition.tsx');
  assert.match(lien, /Math\.min\(3, Math\.max\(0, Number\(q\.get\("e"\)\) \|\| 0\)\)/);
  assert.match(depo, /\[0, 1, 2, 3\]\.map/, 'et l’écran propose bien ces quatre valeurs');
});

// ─────────────────────────────────────────────────────────────────────────────
test('méthode : le coût d’opportunité est nommé, et son objection avec', () => {
  /*
   * Le verdict se juge sur le coût d'opportunité depuis le 08/09/2026, et la
   * page qui répond au lecteur hostile n'en disait RIEN jusqu'au 10/09. C'est
   * exactement le raisonnement qu'un fact-check de franceinfo a démonté chez un
   * essai paru la même semaine, en citant Antoine Bozio (IPP) : une cotisation
   * n'est pas un préjudice au motif qu'on aurait pu la placer, sauf à traiter
   * une prime d'assurance en dommage.
   *
   * La règle du dossier est de concéder ce qui est juste chez la partie
   * adverse. Ce test empêche que la concession disparaisse à la première
   * réécriture de la page.
   */
  const page = SRC('src/app/methode/page.tsx');
  assert.match(page, /coût d’opportunité/, 'le raisonnement est nommé');
  assert.match(page, /Antoine Bozio/, 'l’objection est attribuée');
  assert.match(page, /prime d’assurance/, 'et elle est exposée dans ses termes');
  assert.match(page, /Institut des politiques\s*\n?\s*publiques/, 'avec son institution');

  // Le seuil SANS placement doit rester affiché : c'est la sortie offerte à
  // qui refuse le raisonnement, et la réponse cesse d'être honnête sans lui.
  assert.match(page, /pension seule en face et argent non placé/, 'l’ancien seuil reste publié');
});
