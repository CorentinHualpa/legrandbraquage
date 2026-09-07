"use client";

import { Carte, Commissaire, Kicker, Lien, Volet } from "./Carte";
import type { Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
import type { Simulation } from "@/lib/moteur";
import {
  SEUIL_ANNEES,
  UNITES,
  anneesSansTravailler,
  comptageAbsurde,
  enAnneesDeDepute,
  objetPour,
} from "@/lib/objets";

/**
 * Écran 4 : le butin. Avec ça, ils se sont payé…
 *
 * Le dessin du butin en plein cadre, l'objet en gros, et le commissaire qui
 * compte la monnaie. Les sources des prix sont au clic.
 */
export function Butin({
  pieces,
  simulation,
  numero,
  total,
  suivant,
  retour,
}: {
  pieces: Pieces;
  simulation: Simulation;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
}) {
  const montant = simulation.plateauGauche.total;
  const objet = objetPour(montant);
  const comptage = comptageAbsurde(montant);
  const reste = montant - objet.seuil;
  const annees = anneesSansTravailler(montant, simulation.netApresImpotActuel);
  const deputes = enAnneesDeDepute(montant);
  void pieces;

  return (
    <Carte
      numero={numero}
      total={total}
      nature="Le butin"
      retour={retour}
      action={{ libelle: "Suivant", onClick: suivant }}
    >
      <div className="relative -mx-5 -mt-16 h-[340px] overflow-hidden bg-papier sm:-mx-6">
        {objet.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/images/butin/${objet.image}.webp`} alt={objet.nom} className="h-full w-full object-cover" decoding="async" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[10px] tracking-[0.12em] text-encre-3">LE BUTIN, EN DESSIN</span>
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(15,21,28,0.55) 0%, rgba(15,21,28,0) 30%, rgba(15,21,28,0) 60%, #0f151c 100%)" }}
        />
      </div>

      <div className="-mt-10 flex flex-col gap-3">
        <Kicker>Avec ça, ils se sont payé</Kicker>
        <p className="text-[32px] leading-[1.1] font-bold tracking-[-0.02em]">{objet.nom}.</p>
        <Commissaire>
          {objet.seuil > 0 && reste > 1000 ? (
            <>« Cash. Et il leur reste {eurosSigne(reste)} de monnaie. Ou {euros(comptage.nombre)} {comptage.unite.pluriel}, si vous préférez compter. »</>
          ) : (
            <>« {objet.pointe} Ou {euros(comptage.nombre)} {comptage.unite.pluriel}, si vous préférez compter. »</>
          )}
        </Commissaire>
        <p className="text-[14.5px] leading-relaxed text-ligne">
          <span className="chiffres font-mono font-medium text-papier">{deputes.toFixed(1).replace(".", ",")}</span> années de salaire net d’un député.
          {montant >= SEUIL_ANNEES ? (
            <>
              {" "}<span className="chiffres font-mono font-medium text-papier">{annees.toFixed(1).replace(".", ",")}</span> années de ta vie sans travailler, à ton niveau de vie.
            </>
          ) : null}
        </p>
      </div>

      <div className="grow" />

      <Volet titre="D’où viennent ces prix ?">
        <p className="text-[14px] leading-relaxed text-ligne">
          <span className="font-medium text-papier">{objet.nom}</span> : {objet.source}.
        </p>
        <ul className="flex flex-col gap-1 text-[13.5px] leading-relaxed text-ligne">
          {UNITES.map((u) => (
            <li key={u.id}>
              <span className="font-medium text-papier">{u.pluriel}</span>, {eurosSigne(u.prix)} l’unité : {u.source}
            </li>
          ))}
        </ul>
        <p className="text-[13.5px] leading-relaxed text-ligne">
          Le député : 71 440,08 € nets par an, tels que l’Assemblée nationale les publie. Sans l’avance
          de frais de mandat, qui n’existe plus depuis le 1er janvier 2026.
        </p>
        <Lien href="/methode">Toutes les sources</Lien>
      </Volet>
    </Carte>
  );
}
