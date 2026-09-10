"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ContexteDossier } from "./cartes/Carte";
import { Commissariat } from "./Commissariat";
import { Couverture } from "./cartes/Couverture";
import { Deposition, type EtatSaisie } from "./cartes/Deposition";
import { Cafe } from "./cartes/Cafe";
import { Pris } from "./cartes/Pris";
import { Butin } from "./cartes/Butin";
import { Bourse } from "./cartes/Bourse";
import { Aparte } from "./cartes/Aparte";
import { PalierEcran } from "./cartes/PalierEcran";
import { Rendu } from "./cartes/Rendu";
import { Verdict } from "./cartes/Verdict";
import { Avis } from "./cartes/Avis";
import type { Pieces } from "@/lib/images";
import type { Cadeau } from "@/lib/lien";
import { contexte, evenement } from "@/lib/dalevoz";
import { reactionSalaire } from "@/lib/repliques";
import { etatDuSon, jouer, parler, poserDecor, reagir, reglerSons, taire, type Acte, type Son } from "@/lib/sons";
import { FRAIS_DEFAUT_ID, PLACEMENT_DEFAUT_ID, casDepuisRequete, requeteDuCas } from "@/lib/lien";
import {
  CRANS_FRAIS,
  CRANS_RENDEMENT,
  HABITUDES_DEFAUT,
  PALIERS_DEFAUT,
  PERIMETRE_DEFAUT,
  salairePivot,
  simuler,
  type Habitudes,
  type Paliers,
  type Perimetre,
  type PosteDuPlateau,
  type PosteHabitude,
  type Simulation,
} from "@/lib/moteur";
import { partsFiscales, regimeCalculable, regimeDe } from "@/lib/statuts";

/**
 * Les écrans, dans l'ordre. La couverture n'est pas comptée dans le bandeau :
 * on n'est pas encore dans le dossier. Un fonctionnaire ne cotise pas au
 * chômage : la question ne lui est pas posée.
 */
const ECRANS = [
  "couverture", "deposition", "tabac", "carburant", "alcool", "pris", "butin", "aparte",
  "ecole", "sante", "chomage", "rendu", "bourse", "verdict", "avis",
] as const;
type Ecran = (typeof ECRANS)[number];

/**
 * Où se passe chaque écran. Le son suit le LIEU, pas le numéro de carte : on
 * reste dans le bureau du commissaire pendant toute la déposition, on descend
 * aux scellés quand on regarde le butin, et le verdict se rend au tribunal.
 *
 * Plus personne n'est dehors depuis le retrait de la carte de l'horaire
 * (09/09/2026) : l'ambiance de rue reste dans le dossier, elle ne se joue nulle
 * part.
 *
 * Ce qui n'est pas listé retombe sur le commissariat.
 */
const ACTE: Partial<Record<Ecran, Acte>> = {
  pris: "scelles",
  butin: "scelles",
  rendu: "tribunal",
  bourse: "tribunal",
  verdict: "tribunal",
};

/**
 * Le parcours, de bout en bout : la nuit du commissariat, un écran, un
 * chiffre, le détail au clic. Tout l'état vit ici et le calcul tourne dans le
 * navigateur : on recalcule à chaque changement, y compris quand on revient
 * décocher une ligne ou changer une réponse.
 *
 * Refonte du 08/09/2026 (Coq : « repenser tout le parcours comme si on était
 * des ados », puis « plus tourner ça comme une investigation, un
 * interrogatoire, avec des images immersives »).
 */
export function Parcours({ pieces }: { pieces: Pieces }) {
  /*
   * ⚠ Le montant part à ZÉRO, donc vide à l'écran, et le bouton reste bloqué
   * tant qu'il n'est pas saisi (Coq, 08/09/2026 : « par défaut il doit être
   * vide, je dois le remplir avant de porter plainte »). Un montant
   * pré-rempli faisait signer une déposition qui n'était pas la sienne, et
   * le chiffre du procès-verbal était alors celui d'un inconnu.
   */
  const [etat, setEtat] = useState<EtatSaisie>({
    netMensuel: 0,
    statut: "salarie",
    formeTpe: undefined,
    versant: "fpt",
    activite: "ssi",
    categorieMicro: "liberal",
    versementLiberatoire: false,
    couple: false,
    enfants: 0,
  });
  const [perimetre, setPerimetre] = useState<Perimetre>(PERIMETRE_DEFAUT);
  const [paliers, setPaliers] = useState<Paliers>(PALIERS_DEFAUT);
  /* Où l'argent aurait été placé : c'est ce qui décide du verdict, donc ça vit ici. */
  const [placementId, setPlacementId] = useState(PLACEMENT_DEFAUT_ID);
  const [fraisId, setFraisId] = useState(FRAIS_DEFAUT_ID);
  const [habitudes, setHabitudes] = useState<Habitudes>(HABITUDES_DEFAUT);
  /* « Content de votre cadeau ? » : aucun effet sur les chiffres, ressorti au verdict. */
  const [cadeau, setCadeau] = useState<Cadeau>(null);
  const [ecran, setEcran] = useState<Ecran>("couverture");

  const changer = (patch: Partial<EtatSaisie>) => setEtat((e) => ({ ...e, ...patch }));

  const regime = regimeDe(etat.statut, etat.formeTpe, etat.activite);
  const calculable = regimeCalculable(regime);
  const parts = partsFiscales(etat.couple, etat.enfants);

  const ecrans = useMemo<Ecran[]>(
    () => (regime === "fonctionnaire" ? ECRANS.filter((e) => e !== "chomage") : [...ECRANS]),
    [regime],
  );
  const indexEcran = Math.max(0, ecrans.indexOf(ecran));
  /* Le bandeau compte à partir de la déposition : la couverture est hors dossier. */
  const total = ecrans.length - 1;
  const numero = indexEcran;

  /**
   * Un lien partagé rouvre CE dossier, réponses comprises, et pose le
   * visiteur sur l'écran de l'ancre s'il y en a une. Lu APRÈS le montage :
   * la page est prérendue en statique et l'état initial doit être le même
   * des deux côtés.
   */
  useEffect(() => {
    const cas = casDepuisRequete(window.location.search);
    if (!cas) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEtat({
      netMensuel: cas.netMensuel,
      statut: cas.statut,
      formeTpe: cas.formeTpe,
      versant: cas.versant,
      activite: cas.activite,
      categorieMicro: cas.categorieMicro,
      versementLiberatoire: cas.versementLiberatoire,
      couple: cas.couple,
      enfants: cas.enfants,
    });
    setPerimetre(cas.perimetre);
    setPaliers(cas.paliers);
    setPlacementId(cas.placementId);
    setFraisId(cas.fraisId);
    setHabitudes(cas.habitudes);
    setCadeau(cas.cadeau);
    const regimeOuvert = regimeDe(cas.statut, cas.formeTpe, cas.activite);
    const ouvrable = regimeCalculable(regimeOuvert);
    const ancre = window.location.hash.slice(1) as Ecran;
    /*
     * ⚠ L’ancre se valide contre les écrans DE CE RÉGIME, pas contre la liste
     * complète. Elle testait `ECRANS`, qui porte les quinze entrées, alors que
     * la navigation utilise `ecrans`, filtrée à quatorze pour un fonctionnaire.
     * Conséquence, avec `#chomage&s=fonctionnaire` : l’écran s’affichait quand
     * même, `indexOf` rendait -1 donc le bandeau annonçait « 0 / 13 » avec une
     * jauge vide, le titre disait « 3 sur 3 » là où il n’y a que deux questions,
     * et les deux boutons mentaient sur leur destination (« Voir ce qu’ils
     * m’auront rendu » repartait à la déposition). L’URL était réécrite avec
     * l’ancre, donc actualiser reproduisait l’état. Vérifié en production le
     * 10/09/2026 avant correction.
     */
    const ecransDuRegime =
      regimeOuvert === "fonctionnaire" ? ECRANS.filter((e) => e !== "chomage") : ECRANS;
    if (ouvrable && (ecransDuRegime as readonly string[]).includes(ancre) && ancre !== "couverture") {
      setEcran(ancre);
    } else {
      setEcran("deposition");
    }
  }, []);

  /*
   * Une trappe de diagnostic, en DÉVELOPPEMENT seulement : trois pannes de son
   * de suite se ressemblaient vues de la salle et ne se distinguaient que par
   * l'état interne du module.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __son?: unknown }).__son = etatDuSon;
  }, []);

  /* Chaque carte s'ouvre en haut : on vient de changer d'écran, pas de page. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [ecran]);

  /**
   * Le décor sonore suit le LIEU, pas l'écran. Le fondu se fait tout seul dans
   * `poserDecor`, qui ne fait rien tant que l'acte ne change pas : on peut donc
   * l'appeler à chaque rendu sans y penser.
   */
  useEffect(() => {
    poserDecor(ACTE[ecran] ?? "commissariat");
    // Le commissaire commente la carte à l'arrivée. `parler` coupe d'abord ce
    // qu'il était en train de dire : on avance souvent plus vite qu'il ne
    // parle, et deux répliques qui se chevauchent n'en laissent entendre
    // aucune. Un écran sans réplique le fait donc taire, ce qui est le bon
    // comportement.
    parler(ecran);
  }, [ecran]);

  /**
   * L'ADRESSE SUIT LA PROGRESSION, à chaque écran et à chaque réponse.
   *
   * ⚠ Sans ça, tout ce qui quitte la page perd le dossier : une actualisation,
   * un lien vers la méthode, un retour arrière, le navigateur d'un téléphone
   * qui décharge l'onglet resté au fond. On repartait de la déposition, montant
   * vide, quinze cartes à refaire (Coq, 09/09/2026 : « si j'actualise je dois
   * retrouver ma progression »).
   *
   * On réutilise le lien de PARTAGE, qui sait déjà tout écrire et tout relire :
   * un second format de sauvegarde finirait par diverger de celui-là, et c'est
   * le jour où on ajoute une question qu'on s'en apercevrait.
   *
   * `replaceState` et pas `pushState` : chaque carte n'a pas à devenir une
   * entrée d'historique, sinon le bouton Retour du téléphone remonte le
   * parcours carte par carte au lieu de sortir du site.
   */
  const requete = useMemo(
    () => requeteDuCas({ ...etat, perimetre, paliers, placementId, fraisId, habitudes, cadeau }),
    [etat, perimetre, paliers, placementId, fraisId, habitudes, cadeau],
  );
  useEffect(() => {
    // Rien tant que le dossier n'existe pas : une adresse écrite sur la
    // couverture rouvrirait une déposition vide en prétendant reprendre.
    if (ecran === "couverture" || !(etat.netMensuel > 0)) return;
    window.history.replaceState(null, "", `${requete}#${ecran}`);
  }, [requete, ecran, etat.netMensuel]);

  const placement = useMemo(() => {
    const cran = CRANS_RENDEMENT.find((c) => c.id === placementId) ?? CRANS_RENDEMENT[0];
    const frais = CRANS_FRAIS.find((f) => f.id === fraisId) ?? CRANS_FRAIS[0];
    return { rendementReel: cran.reel, fraisAnnuels: frais.annuels, fraisVersement: frais.versement };
  }, [placementId, fraisId]);

  const simulation: Simulation | null = useMemo(() => {
    if (!calculable || !(etat.netMensuel > 0)) return null;
    return simuler({ ...etat, parts, perimetre, paliers, placement, habitudes });
  }, [calculable, etat, parts, perimetre, paliers, placement, habitudes]);

  /** Le seuil, pour CE régime, CE périmètre et CES réponses. Quarante simulations, donc seulement au verdict. */
  const pivot = useMemo(() => {
    if (!simulation || ecran !== "verdict") return null;
    const { netMensuel: _net, ...reste } = etat;
    void _net;
    return salairePivot({ ...reste, parts, perimetre, paliers, placement, habitudes });
  }, [simulation, ecran, etat, parts, perimetre, paliers, placement, habitudes]);

  /**
   * CE QUE LA PAGE DIT AU COMMISSAIRE, à chaque changement d'état.
   *
   * `contexte()` fusionne et s'écrase : l'appeler à chaque rendu est sans
   * conséquence, et `null` efface une valeur devenue fausse. Le commissaire lit
   * ce bloc à chaque tour, donc il arrête de demander le salaire : il l'a.
   *
   * ⚠ Ce qui n'est PAS ici est volontaire. Le verdict et le manque à gagner
   * sont la chute du parcours : les envoyer en continu depuis la déposition
   * permettrait au commissaire de les lâcher avant que le visiteur ne les
   * découvre. Ils partent avec l'événement `verdict_rendu`, au moment exact où
   * l'écran les montre, et pas une seconde avant.
   */
  useEffect(() => {
    contexte({
      ecran,
      net_mensuel: etat.netMensuel > 0 ? etat.netMensuel : null,
      statut: etat.statut,
      placement: placementId,
      cadeau: cadeau ?? null,
      montant_pris: simulation ? Math.round(simulation.plateauGauche.total) : null,
    });
  }, [ecran, etat.netMensuel, etat.statut, placementId, cadeau, simulation]);

  /**
   * Le verdict vient de tomber : le commissaire le commente, une seule fois.
   *
   * ⚠ Le garde-fou d'un événement PARLANT vit côté serveur (un délai entre deux
   * prises de parole, un plafond par conversation), pas ici : une page ne doit
   * pas pouvoir le contourner. Ce `ref` ne protège que du double montage du
   * mode strict de React, qui ferait partir l'événement deux fois en
   * développement.
   */
  const verdictAnnonce = useRef(false);
  useEffect(() => {
    if (ecran !== "verdict" || !simulation || verdictAnnonce.current) return;
    verdictAnnonce.current = true;
    evenement("verdict_rendu", {
      verdict: simulation.verdict.braquage ? "braquage" : "relaxe",
      manque_a_gagner: Math.round(simulation.verdict.ecart),
    });
  }, [ecran, simulation]);

  /* L'enveloppe choisie. Silencieux : il n'a rien à dire là-dessus, il a juste
     besoin de savoir sur quoi la balance a été pesée quand on l'interrogera. */
  const bourseVue = useRef<string | null>(null);
  useEffect(() => {
    if (ecran !== "bourse" || bourseVue.current === placementId) return;
    bourseVue.current = placementId;
    evenement("bourse_choisie", { placement: placementId });
  }, [ecran, placementId]);

  /**
   * Ce qu'on entend en ARRIVANT sur un écran. Le reste tourne la page.
   * La couverture est absente : c'est elle qui joue la porte, dans le geste
   * qui allume le son.
   */
  /*
   * ⚠ La porte de l'aparté n'est pas un ornement : c'est elle qui annonce
   * qu'un TROISIÈME personnage entre dans la pièce. Sans elle, l'avocate
   * apparaît de nulle part au milieu d'un interrogatoire.
   */
  const BRUIT: Partial<Record<Ecran, "ruban" | "tampon" | "porte">> = {
    butin: "ruban",
    verdict: "tampon",
    aparte: "porte",
  };

  /** `bruit: null` quand l'appelant a déjà joué le sien : la porte du
   *  commissariat ne doit pas être suivie d'une page qui tourne. */
/**
   * RECOMMENCER : on efface le dossier et on revient à la couverture.
   *
   * ⚠ L'adresse doit être nettoyée AVANT de changer d'écran, sinon l'effet
   * qui la tient à jour la réécrit avec l'ancien montant, et une
   * actualisation rouvrirait le dossier qu'on vient de jeter.
   *
   * Le son n'est pas coupé : la personne l'a allumé, elle ne redemande pas à
   * l'allumer parce qu'elle refait une simulation.
   */
  const recommencer = () => {
    window.history.replaceState(null, "", window.location.pathname);
    setEtat({
      netMensuel: 0,
      statut: "salarie",
      formeTpe: undefined,
      versant: "fpt",
      activite: "ssi",
      categorieMicro: "liberal",
      versementLiberatoire: false,
      couple: false,
      enfants: 0,
    });
    setPerimetre(PERIMETRE_DEFAUT);
    setPaliers(PALIERS_DEFAUT);
    setPlacementId(PLACEMENT_DEFAUT_ID);
    setFraisId(FRAIS_DEFAUT_ID);
    setHabitudes(HABITUDES_DEFAUT);
    setCadeau(null);
    verdictAnnonce.current = false;
    bourseVue.current = null;
    taire();
    setEcran("couverture");
  };

  const aller = (e: Ecran, bruit: Son | null = BRUIT[e] ?? "page") => {
    if (bruit) jouer(bruit);
    if (e === "verdict") {
      // Le flash suit le tampon, comme sur l'écran : le photographe attend
      // que le juge ait frappé.
      window.setTimeout(() => jouer("flash"), 420);
    }
    type Transition = { finished?: Promise<unknown>; ready?: Promise<unknown>; updateCallbackDone?: Promise<unknown> };
    type AvecTransition = Document & { startViewTransition?: (f: () => void) => Transition };
    const doc = document as AvecTransition;
    if (typeof doc.startViewTransition === "function"
        && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Une transition interrompue (deux clics rapides, un retour arrière)
      // REJETTE ses promesses. Non capturées, elles remontent en erreur dans
      // la console alors que l'écran, lui, a parfaitement changé.
      const transition = doc.startViewTransition(() => setEcran(e));
      const tais = () => {};
      transition?.finished?.catch(tais);
      transition?.ready?.catch(tais);
      transition?.updateCallbackDone?.catch(tais);
      return;
    }
    setEcran(e);
  };
  const suivant = () => aller(ecrans[Math.min(ecrans.length - 1, indexEcran + 1)]);
  /**
   * LA FLÈCHE DE RETOUR COUPE TOUT et rejoue la carte d'avant comme si on
   * venait d'y arriver.
   *
   * ⚠ `taire()` d'abord, et ce n'est pas une précaution : quand une réaction au
   * salaire est en cours, elle est PROTÉGÉE, donc la réplique de la carte
   * suivante attend son tour au lieu de la couper. Sans ce `taire()`, revenir
   * en arrière laissait le commissaire finir sa phrase sur la carte qu'on vient
   * de quitter, puis parler de la précédente plusieurs secondes trop tard. Or on
   * revient en arrière justement quand quelque chose s'est mal passé : c'est le
   * moment où il faut repartir propre.
   */
  const retour = () => {
    taire();
    aller(ecrans[Math.max(0, indexEcran - 1)]);
  };
  const choisirPalier = (poste: PosteDuPlateau, id: string) =>
    setPaliers((p) => ({ ...p, [poste]: id }));
  const choisirHabitude = (poste: PosteHabitude, id: string) =>
    setHabitudes((h) => ({ ...h, [poste]: id }));

  if (ecran === "couverture") {
    return (
      <main className="min-h-dvh bg-nuit">
        <Couverture
          pieces={pieces}
          porterPlainte={(avecSon) => {
            // L'ordre compte : on allume AVANT de changer d'écran, pour que la
            // porte du commissariat se referme sur la transition, et parce que
            // le navigateur n'autorise le son que dans le geste lui-même.
            reglerSons(avecSon);
            jouer("porte");
            aller("deposition", null);
          }}
        />
      </main>
    );
  }

  // Sans simulation, il n'y a que la déposition. Un écran demandé sans
  // dossier ouvrable retombe dessus, sans rien casser.
  if (ecran === "deposition" || !simulation) {
    return (
      <main className="min-h-dvh bg-nuit">
        <Deposition
          pieces={pieces}
          etat={etat}
          changer={changer}
          regime={regime}
          calculable={calculable}
          signer={() => aller("tabac")}
          /*
           * ⚠ La réaction au montant part quand la FRAPPE s'arrête, plus au
           * clic sur « Signer ». Une remarque qui arrive au moment où on quitte
           * la carte se cogne à la réplique de la suivante, et surtout elle
           * n'est plus une réaction : la personne a déjà tourné la page.
           *
           * Elle ne se répète pas tant qu'on reste dans la même tranche :
           * saisir 2 190 puis corriger en 2 200 ne rejoue pas la même phrase,
           * alors que passer à 6 000 en déclenche une autre.
           */
          reagirAuMontant={() => reagir(reactionSalaire(simulation?.netAvantImpotActuel ?? etat.netMensuel))}
          retour={() => aller("couverture")}
          numero={1}
          total={total}
        />
      </main>
    );
  }

  const commun = { pieces, numero, total, suivant, retour };
  const cas = { ...etat, perimetre, paliers, placementId, fraisId, habitudes, cadeau };
  const rangs: Record<"ecole" | "sante" | "chomage", string> = { ecole: "1 sur 3", sante: "2 sur 3", chomage: "3 sur 3" };
  if (regime === "fonctionnaire") {
    rangs.ecole = "1 sur 2";
    rangs.sante = "2 sur 2";
  }

  return (
    <ContexteDossier.Provider value={{ recommencer }}>
    {/*
      * ⚠ PAS SUR L’ÉCRAN FINAL. L’avis porte déjà son propre widget, embarqué
      * dans le volet « Parler au commissaire » : monter le lanceur flottant
      * par-dessus faisait DEUX widgets du même agent sur la même page, donc
      * deux conversations et une bulle en double. Constaté le 10/09/2026.
      * L’entrée en conversation ne disparaît pas pour autant, elle change de
      * forme : sur cet écran c’est le volet, et il est plus visible qu’une
      * pastille dans un coin.
      */}
    {ecran === "avis" ? null : <Commissariat />}
    <main className="min-h-dvh bg-nuit">
      {ecran === "tabac" || ecran === "carburant" || ecran === "alcool" ? (
        <Cafe {...commun} poste={ecran} simulation={simulation} habitudes={habitudes} choisir={choisirHabitude} />
      ) : ecran === "pris" ? (
        <Pris {...commun} simulation={simulation} perimetre={perimetre} setPerimetre={setPerimetre} />
      ) : ecran === "butin" ? (
        <Butin {...commun} simulation={simulation} cadeau={cadeau} repondreCadeau={setCadeau} />
      ) : ecran === "bourse" ? (
        <Bourse
          {...commun}
          simulation={simulation}
          placementId={placementId}
          fraisId={fraisId}
          choisirPlacement={setPlacementId}
          choisirFrais={setFraisId}
        />
      ) : ecran === "aparte" ? (
        <Aparte {...commun} />
      ) : ecran === "ecole" || ecran === "sante" || ecran === "chomage" ? (
        <PalierEcran
          {...commun}
          poste={ecran}
          rang={rangs[ecran]}
          paliers={paliers}
          choisir={(id) => choisirPalier(ecran, id)}
          libelleSuivant={
            ecran === "chomage" || (ecran === "sante" && regime === "fonctionnaire")
              ? "Voir ce qu’ils m’auront rendu"
              : "Question suivante"
          }
        />
      ) : ecran === "rendu" ? (
        <Rendu {...commun} simulation={simulation} paliers={paliers} allerAuPalier={(poste) => aller(poste)} />
      ) : ecran === "verdict" ? (
        <Verdict {...commun} simulation={simulation} pivot={pivot} perimetre={perimetre} placementId={placementId} cadeau={cadeau} />
      ) : (
        <Avis {...commun} simulation={simulation} cas={cas} recommencer={() => aller("deposition")} />
      )}
    </main>
    </ContexteDossier.Provider>
  );
}
