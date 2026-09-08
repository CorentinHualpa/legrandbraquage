"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Couverture } from "./cartes/Couverture";
import { Deposition, type EtatSaisie } from "./cartes/Deposition";
import { Cafe } from "./cartes/Cafe";
import { Pris } from "./cartes/Pris";
import { Temoin } from "./cartes/Temoin";
import { Butin } from "./cartes/Butin";
import { Bourse } from "./cartes/Bourse";
import { Liberation } from "./cartes/Liberation";
import { Aparte } from "./cartes/Aparte";
import { PalierEcran } from "./cartes/PalierEcran";
import { Rendu } from "./cartes/Rendu";
import { Verdict } from "./cartes/Verdict";
import { Avis } from "./cartes/Avis";
import type { Pieces } from "@/lib/images";
import type { Cadeau } from "@/lib/lien";
import { contexte, evenement } from "@/lib/dalevoz";
import { jouer, poserDecor, reglerSons, type Acte, type Son } from "@/lib/sons";
import { FRAIS_DEFAUT_ID, PLACEMENT_DEFAUT_ID, casDepuisRequete } from "@/lib/lien";
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
  "couverture", "deposition", "tabac", "carburant", "alcool", "pris", "butin", "temoin", "liberation", "aparte",
  "ecole", "sante", "chomage", "rendu", "bourse", "verdict", "avis",
] as const;
type Ecran = (typeof ECRANS)[number];

/**
 * Où se passe chaque écran. Le son suit le LIEU, pas le numéro de carte : on
 * reste dans le bureau du commissaire pendant toute la déposition, on descend
 * aux scellés quand on regarde le butin, et le verdict se rend au tribunal.
 *
 * `liberation` est dehors, et c'est un choix de mise en scène plutôt qu'une
 * évidence : l'écran calcule l'heure de la journée à partir de laquelle on
 * travaille pour soi, donc l'heure où on sort. Il donne au passage une
 * respiration au milieu du parcours, entre deux salles fermées. À déplacer
 * si ça ne va pas.
 *
 * Ce qui n'est pas listé retombe sur le commissariat.
 */
const ACTE: Partial<Record<Ecran, Acte>> = {
  pris: "scelles",
  butin: "scelles",
  rendu: "tribunal",
  bourse: "tribunal",
  verdict: "tribunal",
  liberation: "rue",
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
    const ouvrable = regimeCalculable(regimeDe(cas.statut, cas.formeTpe, cas.activite));
    const ancre = window.location.hash.slice(1) as Ecran;
    if (ouvrable && (ECRANS as readonly string[]).includes(ancre) && ancre !== "couverture") {
      setEcran(ancre);
    } else {
      setEcran("deposition");
    }
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
  }, [ecran]);

  const placement = useMemo(() => {
    const cran = CRANS_RENDEMENT.find((c) => c.id === placementId) ?? CRANS_RENDEMENT[0];
    const frais = CRANS_FRAIS.find((f) => f.id === fraisId) ?? CRANS_FRAIS[0];
    return { rendementReel: cran.reel, fraisAnnuels: frais.annuels, fraisVersement: frais.versement };
  }, [placementId, fraisId]);

  const simulation: Simulation | null = useMemo(() => {
    if (!calculable || !(etat.netMensuel > 0)) return null;
    return simuler({ ...etat, parts, perimetre, paliers, placement, habitudes });
  }, [calculable, etat, parts, perimetre, paliers, placement, habitudes]);

  /**
   * Le témoin : la même personne, même net avant impôt, dans l'autre statut.
   * Un salarié voit un indépendant au réel, tout le monde d'autre voit un
   * salarié. Calculé seulement sur son écran.
   */
  const temoin = useMemo<Simulation | null>(() => {
    if (!simulation || ecran !== "temoin") return null;
    const salarie = simulation.entree.regime === "salarie";
    try {
      return simuler({
        netMensuel: simulation.netAvantImpotActuel,
        statut: salarie ? "independant" : "salarie",
        activite: salarie ? "ssi" : undefined,
        parts, couple: etat.couple, perimetre, paliers, placement, habitudes,
      });
    } catch {
      return null;
    }
  }, [simulation, ecran, etat.couple, parts, perimetre, paliers, placement, habitudes]);

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
  const BRUIT: Partial<Record<Ecran, "ruban" | "tampon">> = { butin: "ruban", verdict: "tampon" };

  /** `bruit: null` quand l'appelant a déjà joué le sien : la porte du
   *  commissariat ne doit pas être suivie d'une page qui tourne. */
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
  const retour = () => aller(ecrans[Math.max(0, indexEcran - 1)]);
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
    <main className="min-h-dvh bg-nuit">
      {ecran === "tabac" || ecran === "carburant" || ecran === "alcool" ? (
        <Cafe {...commun} poste={ecran} simulation={simulation} habitudes={habitudes} choisir={choisirHabitude} />
      ) : ecran === "pris" ? (
        <Pris {...commun} simulation={simulation} perimetre={perimetre} setPerimetre={setPerimetre} />
      ) : ecran === "butin" ? (
        <Butin {...commun} simulation={simulation} cadeau={cadeau} repondreCadeau={setCadeau} />
      ) : ecran === "temoin" ? (
        <Temoin {...commun} simulation={simulation} temoin={temoin} />
      ) : ecran === "bourse" ? (
        <Bourse
          {...commun}
          simulation={simulation}
          placementId={placementId}
          fraisId={fraisId}
          choisirPlacement={setPlacementId}
          choisirFrais={setFraisId}
        />
      ) : ecran === "liberation" ? (
        <Liberation {...commun} simulation={simulation} />
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
  );
}
