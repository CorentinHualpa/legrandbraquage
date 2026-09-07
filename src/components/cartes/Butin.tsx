"use client";

import { Carte, Commissaire, Lien, Volet } from "./Carte";
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
      {/*
        L'annonce AVANT le dessin. Le dessin seul se lisait comme une
        illustration de fond de page : on ne comprenait pas qu'il montrait
        l'achat (Coq, 08/09/2026 : « il faudrait vraiment qu'on fasse
        comprendre VOILÀ CE QU'ILS SE SONT ACHETÉ »).
      */}
      <div className="-mx-5 -mt-16 flex flex-col gap-1 bg-rouge px-5 pt-16 pb-3 sm:-mx-6 sm:px-6">
        <span className="font-mono text-[10.5px] tracking-[0.16em] text-papier/80 uppercase">
          Scellé n° 1 · le butin
        </span>
        <p className="text-[20px] leading-tight font-bold text-papier">
          Voilà ce qu’ils se sont acheté avec vos{" "}
          <span className="chiffres font-mono tracking-[-0.02em] whitespace-nowrap">{eurosSigne(montant)}</span>.
        </p>
      </div>

      <div className="relative -mx-5 h-[300px] overflow-hidden bg-papier sm:-mx-6">
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
          style={{ background: "linear-gradient(180deg, rgba(15,21,28,0) 0%, rgba(15,21,28,0) 45%, #0f151c 100%)" }}
        />
        <p className="absolute inset-x-5 bottom-3 text-[30px] leading-[1.05] font-bold tracking-[-0.02em] text-papier sm:inset-x-6">
          {objet.nom}.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Commissaire>
          {objet.seuil > 0 && reste > 1000 ? (
            <>« Cash. Et il leur reste {eurosSigne(reste)} de monnaie. Ou {euros(comptage.nombre)} {comptage.unite.pluriel}, si vous préférez compter. »</>
          ) : (
            <>« {objet.pointe} Ou {euros(comptage.nombre)} {comptage.unite.pluriel}, si vous préférez compter. »</>
          )}
        </Commissaire>
        {/* La pointe du palier, sauf quand le commissaire vient de la dire. */}
        {objet.seuil > 0 && reste > 1000 ? (
          <p className="text-[15px] leading-relaxed text-papier-2 italic">{objet.pointe}</p>
        ) : null}
        <p className="text-[14.5px] leading-relaxed text-ligne">
          <span className="chiffres font-mono font-medium text-papier">{deputes.toFixed(1).replace(".", ",")}</span> années de salaire net d’un député.
          {montant >= SEUIL_ANNEES ? (
            <>
              {" "}<span className="chiffres font-mono font-medium text-papier">{annees.toFixed(1).replace(".", ",")}</span> années de votre vie sans travailler, à votre niveau de vie.
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
