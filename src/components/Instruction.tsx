"use client";

import { useMemo, useState } from "react";

import { Plainte } from "./Plainte";
import { ProcesVerbal } from "./ProcesVerbal";
import { Alibi } from "./Alibi";
import { Jugement } from "./Jugement";
import { Audition } from "./Audition";
import { AvisDeRecherche } from "./AvisDeRecherche";
import type { NumeroPiece } from "@/lib/images";
import {
  PERIMETRE_DEFAUT,
  salairePivot,
  simuler,
  type Perimetre,
  type Simulation,
  type Statut,
} from "@/lib/moteur";
import { regimeCalculable, regimeDe, type FormeTpe, type Versant } from "@/lib/statuts";

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
  const [perimetre, setPerimetre] = useState<Perimetre>(PERIMETRE_DEFAUT);

  const regime = regimeDe(statut, formeTpe);
  const calculable = regimeCalculable(regime);

  const simulation: Simulation | null = useMemo(() => {
    if (!ouverte || !calculable || !(netMensuel > 0)) return null;
    return simuler({
      netMensuel,
      statut,
      formeTpe,
      versant,
      perimetre,
      // ⚠ Un président de SAS ne cotise pas à l'assurance chômage, et le moteur
      // ne porte pas encore ce retrait : il rend le calcul du salarié, à
      // quelques dixièmes de point près. La page le dit plutôt que de le taire.
    });
  }, [ouverte, calculable, netMensuel, statut, formeTpe, versant, perimetre]);

  /**
   * Le seuil où la balance bascule, POUR CE RÉGIME.
   *
   * Il coûte quarante simulations, donc il ne se recalcule pas au mouvement du
   * curseur de salaire : il ne dépend que du régime, du versant et du périmètre
   * coché. Il peut valoir null, et c'est un résultat, pas une panne.
   */
  const pivot = useMemo(() => {
    if (!ouverte || !calculable) return null;
    return salairePivot({ statut, formeTpe, versant, perimetre });
  }, [ouverte, calculable, statut, formeTpe, versant, perimetre]);

  return (
    <main className="min-h-dvh bg-papier pb-16">
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
            perimetre={perimetre}
          />
        </>
      ) : null}
    </main>
  );
}
