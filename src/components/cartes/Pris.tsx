"use client";

import { Carte, Chiffre, Ligne, Volet } from "./Carte";
import { Scelle } from "../papier";
import type { Pieces } from "@/lib/images";
import { eurosSigne } from "@/lib/format";
import type { Perimetre, Simulation } from "@/lib/moteur";
import { LIGNES_PERIMETRE, type Regime } from "@/lib/statuts";

/**
 * Écran 2 : d'ici la fin de ta carrière, ils t'auront pris.
 *
 * Un seul chiffre. Le volet « Comment ? » donne les quatre lignes, et c'est
 * là que l'on décoche : une ligne décochée sort du total, sous les yeux. Les
 * libellés viennent du RÉGIME, un freelance n'a pas de paie.
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
      retour={retour}
      action={{ libelle: "Suivant", onClick: suivant }}
    >
      <Scelle numero={2} nom="La pièce à conviction" ratio="16:9" fichier={pieces[2]} legende="CLICHÉ 02 · SOUS SCELLÉ" />

      <div className="flex flex-col gap-3">
        <p className="text-[24px] leading-tight font-medium">D’ici la fin de ta carrière, ils t’auront pris</p>
        <Chiffre>{eurosSigne(plateauGauche.total)}</Chiffre>
        <p className="text-[16px] leading-relaxed text-encre-2 italic">
          {micro
            ? "Sur tout ce que tu auras encaissé. Une partie avant même que tu te paies."
            : "Pour l’essentiel sans te le dire."}
        </p>
      </div>

      <Volet titre="Comment ?">
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
                        className={`flex h-4 w-4 shrink-0 items-center justify-center border-[1.6px] border-encre ${actif ? "bg-encre" : "bg-transparent"}`}
                        aria-hidden
                      >
                        {actif ? <span className="font-mono text-[10px] leading-none font-semibold text-papier">×</span> : null}
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
        <p className="text-[13px] leading-relaxed text-encre-2">
          Tape une ligne pour la sortir du total. Tout est en euros d’aujourd’hui,
          inflation corrigée, aux barèmes 2026 :{" "}
          <a href="/methode" className="text-bleu underline underline-offset-2">la méthode, ligne par ligne</a>.
        </p>
      </Volet>
    </Carte>
  );
}
