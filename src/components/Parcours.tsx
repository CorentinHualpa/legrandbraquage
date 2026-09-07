"use client";

import { useEffect, useMemo, useState } from "react";

import { Saisie, type EtatSaisie } from "./cartes/Saisie";
import { Pris } from "./cartes/Pris";
import { Butin } from "./cartes/Butin";
import { Liberation } from "./cartes/Liberation";
import { Intermede } from "./cartes/Intermede";
import { PalierEcran } from "./cartes/PalierEcran";
import { Rendu } from "./cartes/Rendu";
import { Verdict } from "./cartes/Verdict";
import { Avis } from "./cartes/Avis";
import type { Pieces } from "@/lib/images";
import { casDepuisRequete } from "@/lib/lien";
import {
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
 * Les écrans, dans l'ordre. Un fonctionnaire ne cotise pas au chômage : la
 * question ne lui est pas posée, et le compteur du bandeau le sait.
 */
const ECRANS = [
  "saisie", "pris", "butin", "liberation", "intermede",
  "ecole", "sante", "chomage", "rendu", "verdict", "avis",
] as const;
type Ecran = (typeof ECRANS)[number];

/**
 * Le parcours, de bout en bout : un écran, un chiffre, le détail au clic.
 *
 * Tout l'état vit ici et le calcul tourne dans le navigateur. Une simulation
 * complète coûte 1,2 ms : on recalcule à chaque changement, y compris quand
 * on revient décocher une ligne ou changer un palier, et chaque écran suivant
 * se remet d'équerre tout seul.
 *
 * Refonte du 08/09/2026 : le dossier de dix mille pixels de prose est devenu
 * onze cartes. Retour de Coq : « repenser tout le parcours comme si on était
 * des ados, vraiment basique ; si la personne clique sur un élément, là il y a
 * plus de détails ».
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
  const [ecran, setEcran] = useState<Ecran>("saisie");

  const changer = (patch: Partial<EtatSaisie>) => setEtat((e) => ({ ...e, ...patch }));

  const regime = regimeDe(etat.statut, etat.formeTpe, etat.activite);
  const calculable = regimeCalculable(regime);
  const parts = partsFiscales(etat.couple, etat.enfants);

  const ecrans = useMemo<Ecran[]>(
    () => (regime === "fonctionnaire" ? ECRANS.filter((e) => e !== "chomage") : [...ECRANS]),
    [regime],
  );
  const indexEcran = Math.max(0, ecrans.indexOf(ecran));
  const total = ecrans.length;

  /**
   * Un lien partagé rouvre CE dossier, paliers compris, et pose le visiteur
   * sur l'écran de l'ancre s'il y en a une. Lu APRÈS le montage, parce que la
   * page est prérendue en statique et que l'état initial doit être le même
   * des deux côtés.
   */
  useEffect(() => {
    const cas = casDepuisRequete(window.location.search);
    if (!cas) return;
    // La page est prérendue en statique : lire l'adresse dans l'état initial
    // ferait diverger le rendu du serveur de celui du navigateur. On pose donc
    // l'état APRÈS le montage, et c'est le seul endroit où on le fait.
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
    const ouvrable = regimeCalculable(regimeDe(cas.statut, cas.formeTpe, cas.activite));
    const ancre = window.location.hash.slice(1) as Ecran;
    if (ouvrable && (ECRANS as readonly string[]).includes(ancre) && ancre !== "saisie") {
      setEcran(ancre);
    }
  }, []);

  /* Chaque carte s'ouvre en haut : on vient de changer d'écran, pas de page. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [ecran]);

  const simulation: Simulation | null = useMemo(() => {
    if (!calculable || !(etat.netMensuel > 0)) return null;
    return simuler({ ...etat, parts, perimetre, paliers });
  }, [calculable, etat, parts, perimetre, paliers]);

  /**
   * Le seuil, POUR CE RÉGIME, CE PÉRIMÈTRE ET CES PALIERS. Quarante
   * simulations, donc seulement quand on affiche le verdict.
   */
  const pivot = useMemo(() => {
    if (!simulation || ecran !== "verdict") return null;
    const { netMensuel: _net, ...reste } = etat;
    void _net;
    return salairePivot({ ...reste, parts, perimetre, paliers });
  }, [simulation, ecran, etat, parts, perimetre, paliers]);

  const aller = (e: Ecran) => setEcran(e);
  const suivant = () => aller(ecrans[Math.min(total - 1, indexEcran + 1)]);
  const retour = () => aller(ecrans[Math.max(0, indexEcran - 1)]);
  const choisirPalier = (poste: PosteDuPlateau, id: string) =>
    setPaliers((p) => ({ ...p, [poste]: id }));

  const commun = { pieces, numero: indexEcran + 1, total, suivant, retour };

  // Sans simulation, il n'y a que la saisie. Un écran demandé sans dossier
  // ouvrable retombe dessus, sans rien casser.
  if (ecran === "saisie" || !simulation) {
    return (
      <main className="min-h-dvh bg-cadre">
        <Saisie
          etat={etat}
          changer={changer}
          regime={regime}
          calculable={calculable}
          lancer={() => aller("pris")}
          numero={1}
          total={total}
        />
      </main>
    );
  }

  const cas = { ...etat, perimetre, paliers };

  return (
    <main className="min-h-dvh bg-cadre">
      {ecran === "pris" ? (
        <Pris {...commun} simulation={simulation} perimetre={perimetre} setPerimetre={setPerimetre} />
      ) : ecran === "butin" ? (
        <Butin {...commun} simulation={simulation} />
      ) : ecran === "liberation" ? (
        <Liberation {...commun} simulation={simulation} />
      ) : ecran === "intermede" ? (
        <Intermede {...commun} />
      ) : ecran === "ecole" || ecran === "sante" || ecran === "chomage" ? (
        <PalierEcran
          {...commun}
          poste={ecran}
          paliers={paliers}
          choisir={(id) => choisirPalier(ecran, id)}
          libelleSuivant={
            ecran === "sante" && regime === "fonctionnaire" ? "Voir ce qu’ils m’auront rendu" : undefined
          }
        />
      ) : ecran === "rendu" ? (
        <Rendu {...commun} simulation={simulation} paliers={paliers} allerAuPalier={(poste) => aller(poste)} />
      ) : ecran === "verdict" ? (
        <Verdict {...commun} simulation={simulation} pivot={pivot} perimetre={perimetre} />
      ) : (
        <Avis
          {...commun}
          simulation={simulation}
          cas={cas}
          recommencer={() => aller("saisie")}
        />
      )}
    </main>
  );
}
