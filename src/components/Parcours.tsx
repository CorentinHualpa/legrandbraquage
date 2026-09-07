"use client";

import { useEffect, useMemo, useState } from "react";

import { Couverture } from "./cartes/Couverture";
import { Deposition, type EtatSaisie } from "./cartes/Deposition";
import { Pris } from "./cartes/Pris";
import { Butin } from "./cartes/Butin";
import { Bourse } from "./cartes/Bourse";
import { Liberation } from "./cartes/Liberation";
import { Aparte } from "./cartes/Aparte";
import { PalierEcran } from "./cartes/PalierEcran";
import { Rendu } from "./cartes/Rendu";
import { Verdict } from "./cartes/Verdict";
import { Avis } from "./cartes/Avis";
import type { Pieces } from "@/lib/images";
import { FRAIS_DEFAUT_ID, PLACEMENT_DEFAUT_ID, casDepuisRequete } from "@/lib/lien";
import {
  CRANS_FRAIS,
  CRANS_RENDEMENT,
  PALIERS_DEFAUT,
  PERIMETRE_DEFAUT,
  salairePivot,
  simuler,
  type Paliers,
  type Perimetre,
  type PosteDuPlateau,
  type Simulation,
} from "@/lib/moteur";
import { partsFiscales, regimeCalculable, regimeDe } from "@/lib/statuts";

/**
 * Les écrans, dans l'ordre. La couverture n'est pas comptée dans le bandeau :
 * on n'est pas encore dans le dossier. Un fonctionnaire ne cotise pas au
 * chômage : la question ne lui est pas posée.
 */
const ECRANS = [
  "couverture", "deposition", "pris", "butin", "liberation", "aparte",
  "ecole", "sante", "chomage", "rendu", "bourse", "verdict", "avis",
] as const;
type Ecran = (typeof ECRANS)[number];

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
  const [etat, setEtat] = useState<EtatSaisie>({
    netMensuel: 2190,
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

  const placement = useMemo(() => {
    const cran = CRANS_RENDEMENT.find((c) => c.id === placementId) ?? CRANS_RENDEMENT[0];
    const frais = CRANS_FRAIS.find((f) => f.id === fraisId) ?? CRANS_FRAIS[0];
    return { rendementReel: cran.reel, fraisAnnuels: frais.annuels, fraisVersement: frais.versement };
  }, [placementId, fraisId]);

  const simulation: Simulation | null = useMemo(() => {
    if (!calculable || !(etat.netMensuel > 0)) return null;
    return simuler({ ...etat, parts, perimetre, paliers, placement });
  }, [calculable, etat, parts, perimetre, paliers, placement]);

  /** Le seuil, pour CE régime, CE périmètre et CES réponses. Quarante simulations, donc seulement au verdict. */
  const pivot = useMemo(() => {
    if (!simulation || ecran !== "verdict") return null;
    const { netMensuel: _net, ...reste } = etat;
    void _net;
    return salairePivot({ ...reste, parts, perimetre, paliers, placement });
  }, [simulation, ecran, etat, parts, perimetre, paliers, placement]);

  const aller = (e: Ecran) => setEcran(e);
  const suivant = () => aller(ecrans[Math.min(ecrans.length - 1, indexEcran + 1)]);
  const retour = () => aller(ecrans[Math.max(0, indexEcran - 1)]);
  const choisirPalier = (poste: PosteDuPlateau, id: string) =>
    setPaliers((p) => ({ ...p, [poste]: id }));

  if (ecran === "couverture") {
    return (
      <main className="min-h-dvh bg-nuit">
        <Couverture pieces={pieces} porterPlainte={() => aller("deposition")} />
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
          signer={() => aller("pris")}
          retour={() => aller("couverture")}
          numero={1}
          total={total}
        />
      </main>
    );
  }

  const commun = { pieces, numero, total, suivant, retour };
  const cas = { ...etat, perimetre, paliers, placementId, fraisId };
  const rangs: Record<"ecole" | "sante" | "chomage", string> = { ecole: "1 sur 3", sante: "2 sur 3", chomage: "3 sur 3" };
  if (regime === "fonctionnaire") {
    rangs.ecole = "1 sur 2";
    rangs.sante = "2 sur 2";
  }

  return (
    <main className="min-h-dvh bg-nuit">
      {ecran === "pris" ? (
        <Pris {...commun} simulation={simulation} perimetre={perimetre} setPerimetre={setPerimetre} />
      ) : ecran === "butin" ? (
        <Butin {...commun} simulation={simulation} />
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
        <Verdict {...commun} simulation={simulation} pivot={pivot} perimetre={perimetre} placementId={placementId} />
      ) : (
        <Avis {...commun} simulation={simulation} cas={cas} recommencer={() => aller("deposition")} />
      )}
    </main>
  );
}
