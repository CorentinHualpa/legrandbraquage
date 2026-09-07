"use client";

import { Carte, Chiffre, Commissaire, Kicker, Ligne, Volet } from "./Carte";
import type { Pieces } from "@/lib/images";
import { eurosSigne } from "@/lib/format";
import type { Perimetre, Simulation } from "@/lib/moteur";
import { LIGNES_PERIMETRE, type Regime } from "@/lib/statuts";

/**
 * Écran 3 : la pièce à conviction. D'ici la fin de ta carrière, ils t'auront pris.
 *
 * Un seul chiffre. Le volet donne les quatre lignes, et c'est là qu'on
 * décoche : une ligne décochée sort du total, sous les yeux. Les libellés
 * viennent du RÉGIME, un freelance n'a pas de paie.
 */
export function Pris({
  pieces,
  simulation,
  perimetre,
  setPerimetre,
  numero,
  total,
  suivant,
  retour,
}: {
  pieces: Pieces;
  simulation: Simulation;
  perimetre: Perimetre;
  setPerimetre: (p: Perimetre) => void;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
}) {
  const { plateauGauche } = simulation;
  const lignes = LIGNES_PERIMETRE[simulation.entree.regime as Regime];
  const micro = simulation.entree.regime === "micro";

  return (
    <Carte
      numero={numero}
      total={total}
      nature="Pièce à conviction"
      retour={retour}
      photo={{ numero: 19, pieces, hauteur: 330, legende: "CLICHÉ 19 · LA PIÈCE À CONVICTION", position: "50% 35%" }}
      action={{ libelle: "Suivant", onClick: suivant }}
    >
      <Kicker couleur="rouge">D’ici la fin de ta carrière, ils t’auront pris</Kicker>
      <Chiffre>{eurosSigne(plateauGauche.total)}</Chiffre>
      <Commissaire>
        {micro
          ? "« Sur tout ce que vous aurez encaissé. Une partie avant même que vous vous payiez. »"
          : "« Ça fait beaucoup pour un seul plaignant. Pour l’essentiel sans que vous le voyiez, évidemment. »"}
      </Commissaire>

      <div className="grow" />

      <Volet titre="Comment ? Les quatre lignes">
        <ul className="flex flex-col">
          {lignes.map((ligne) => {
            const montant = plateauGauche.lignes[ligne.cle];
            if (ligne.sansObjet) {
              return (
                <li key={ligne.cle}>
                  <Ligne libelle={ligne.geste} sous={ligne.nom} montant="—" eteinte />
                </li>
              );
            }
            const actif = perimetre[ligne.cle];
            return (
              <li key={ligne.cle}>
                <Ligne
                  libelle={
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center border-[1.6px] border-papier ${actif ? "bg-papier" : "bg-transparent"}`}
                        aria-hidden
                      >
                        {actif ? <span className="font-mono text-[10px] leading-none font-semibold text-encre">×</span> : null}
                      </span>
                      <span>{ligne.geste}</span>
                    </span>
                  }
                  sous={<span className="pl-[26px]">{ligne.nom}</span>}
                  montant={eurosSigne(montant)}
                  eteinte={!actif}
                  onClick={() => setPerimetre({ ...perimetre, [ligne.cle]: !actif })}
                />
              </li>
            );
          })}
        </ul>
        <p className="text-[13px] leading-relaxed text-ligne">
          Tape une ligne pour la sortir du total. Tout est en euros d’aujourd’hui, aux barèmes 2026 :{" "}
          <a href="/methode" className="underline underline-offset-2">la méthode, ligne par ligne</a>.
        </p>
      </Volet>
    </Carte>
  );
}
