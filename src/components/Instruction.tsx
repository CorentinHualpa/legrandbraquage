"use client";

import { useEffect, useMemo, useState } from "react";

import { Plainte } from "./Plainte";
import { ProcesVerbal } from "./ProcesVerbal";
import { Alibi } from "./Alibi";
import { Jugement } from "./Jugement";
import { Audition } from "./Audition";
import { AvisDeRecherche } from "./AvisDeRecherche";
import type { NumeroPiece } from "@/lib/images";
import { casDepuisRequete } from "@/lib/lien";
import {
  PERIMETRE_DEFAUT,
  salairePivot,
  simuler,
  type Perimetre,
  type Simulation,
  type Statut,
} from "@/lib/moteur";
import {
  regimeCalculable,
  regimeDe,
  type Activite,
  type FormeTpe,
  type Versant,
} from "@/lib/statuts";

export type Pieces = Record<NumeroPiece, string | null>;

/**
 * L'instruction, de bout en bout.
 *
 * Tout l'état vit ici et le calcul tourne dans le navigateur : une simulation
 * complète coûte 1,2 ms, donc le curseur peut tout recalculer à chaque
 * mouvement sans temporisation. C'est ce qui permet à l'objet de se transformer
 * en direct pendant qu'on fait glisser le salaire.
 */
export function Instruction({ pieces }: { pieces: Pieces }) {
  const [ouverte, setOuverte] = useState(false);
  const [netMensuel, setNetMensuel] = useState(2500);
  const [statut, setStatut] = useState<Statut>("salarie");
  const [formeTpe, setFormeTpe] = useState<FormeTpe | undefined>(undefined);
  const [versant, setVersant] = useState<Versant>("fpt");
  const [activite, setActivite] = useState<Activite>("ssi");
  const [perimetre, setPerimetre] = useState<Perimetre>(PERIMETRE_DEFAUT);

  const regime = regimeDe(statut, formeTpe, activite);
  const calculable = regimeCalculable(regime);

  /**
   * Un dossier arrivé par un lien partagé se rouvre tel qu'il a été partagé.
   *
   * La lecture se fait APRÈS le montage et pas dans l'état initial : la page
   * est prérendue en statique, donc initialiser l'état depuis l'URL ferait
   * diverger le rendu du serveur de celui du navigateur, et React remonterait
   * l'arbre en jetant l'hydratation. Le prix est une frame de page d'accueil
   * avant que le dossier s'ouvre, ce qui est exactement ce que voit un
   * visiteur ordinaire.
   */
  useEffect(() => {
    const cas = casDepuisRequete(window.location.search);
    if (!cas) return;
    setNetMensuel(cas.netMensuel);
    setStatut(cas.statut);
    setFormeTpe(cas.formeTpe);
    setVersant(cas.versant);
    setActivite(cas.activite);
    setPerimetre(cas.perimetre);
    // Un lien de patron de TPE sans forme juridique n'a pas de régime résolu :
    // on laisse le dossier fermé, la question est posée à l'écran.
    if (regimeCalculable(regimeDe(cas.statut, cas.formeTpe, cas.activite))) setOuverte(true);
  }, []);

  const simulation: Simulation | null = useMemo(() => {
    if (!ouverte || !calculable || !(netMensuel > 0)) return null;
    return simuler({
      netMensuel,
      statut,
      formeTpe,
      versant,
      activite,
      perimetre,
      // ⚠ Un président de SAS ne cotise pas à l'assurance chômage, et le moteur
      // ne porte pas encore ce retrait : il rend le calcul du salarié, à
      // quelques dixièmes de point près. La page le dit plutôt que de le taire.
    });
  }, [ouverte, calculable, netMensuel, statut, formeTpe, versant, activite, perimetre]);

  /**
   * Le seuil où la balance bascule, POUR CE RÉGIME.
   *
   * Il coûte quarante simulations, donc il ne se recalcule pas au mouvement du
   * curseur de salaire : il ne dépend que du régime, du versant et du périmètre
   * coché. Il peut valoir null, et c'est un résultat, pas une panne.
   */
  const pivot = useMemo(() => {
    if (!ouverte || !calculable) return null;
    return salairePivot({ statut, formeTpe, versant, activite, perimetre });
  }, [ouverte, calculable, statut, formeTpe, versant, activite, perimetre]);

  return (
    <main className="relative min-h-dvh bg-papier pb-16">
      {/*
        La pièce n° 12 sert de fond de dossier, et rien d'autre. Très faible
        opacité et fondu multiplicatif : elle donne du grain au papier sans
        jamais passer devant un chiffre. Si elle se voit, elle est trop forte.
      */}
      {pieces[12] ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-[0.05] mix-blend-multiply"
          style={{ backgroundImage: `url(/images/${pieces[12]})` }}
        />
      ) : null}
      <div className="relative z-10">
      <Plainte
        pieces={pieces}
        netMensuel={netMensuel}
        setNetMensuel={setNetMensuel}
        statut={statut}
        setStatut={(s) => {
          setStatut(s);
          if (s !== "tpe") setFormeTpe(undefined);
        }}
        formeTpe={formeTpe}
        setFormeTpe={setFormeTpe}
        versant={versant}
        setVersant={setVersant}
        activite={activite}
        setActivite={setActivite}
        regime={regime}
        calculable={calculable}
        ouverte={ouverte}
        ouvrir={() => setOuverte(true)}
      />

      {simulation ? (
        <>
          <ProcesVerbal
            pieces={pieces}
            simulation={simulation}
            netMensuel={netMensuel}
            setNetMensuel={setNetMensuel}
            perimetre={perimetre}
            setPerimetre={setPerimetre}
            statut={statut}
          />
          {/*
            L'ordre du dossier : le constat, puis l'expertise contradictoire,
            puis seulement le jugement. Rendre le jugement avant d'avoir entendu
            la défense serait exactement le reproche qu'on fait à la partie
            adverse.
          */}
          <Alibi pieces={pieces} simulation={simulation} />
          <Jugement
            pieces={pieces}
            simulation={simulation}
            pivot={pivot}
            perimetre={perimetre}
          />
          <Audition pieces={pieces} simulation={simulation} />
          <AvisDeRecherche
            pieces={pieces}
            simulation={simulation}
            netMensuel={netMensuel}
            cas={{ netMensuel, statut, formeTpe, versant, activite, perimetre }}
          />
        </>
      ) : null}
      </div>
    </main>
  );
}
