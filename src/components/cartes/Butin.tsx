"use client";

import { Carte, Kicker, Lien, Volet } from "./Carte";
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
 * Écran 3 : ce que ça fait, en vrai.
 *
 * L'objet est la tête d'affiche, et son image aussi. Le comptage absurde et
 * le député viennent après, en une phrase. Les sources des prix sont au clic.
 */
export function Butin({
  simulation,
  numero,
  total,
  suivant,
  retour,
}: {
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

  return (
    <Carte numero={numero} total={total} retour={retour} action={{ libelle: "Suivant", onClick: suivant }}>
      <p className="text-[24px] leading-tight font-medium">
        {eurosSigne(montant)}, c’est quoi, en vrai ?
      </p>

      {objet.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/butin/${objet.image}.webp`}
          alt={objet.nom}
          className="aspect-[3/2] w-full border border-cadre-bord object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="cadre-scelle flex aspect-[3/2] items-center justify-center">
          <span className="font-mono text-[10px] tracking-[0.1em] text-encre-3">LE BUTIN, EN DESSIN</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <p className="text-[26px] leading-[1.15] font-bold tracking-[-0.015em]">{objet.nom}.</p>
        <p className="text-[16px] leading-relaxed text-encre-2 italic">
          {objet.seuil > 0 && reste > 1000
            ? `Payée cash. Il te reste ${eurosSigne(reste)} de monnaie.`
            : objet.pointe}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-ligne pt-3">
        <Kicker>Ou, si tu préfères</Kicker>
        <p className="text-[16px] leading-relaxed">
          <span className="chiffres font-mono font-medium">{euros(comptage.nombre)}</span> {comptage.unite.pluriel}.{" "}
          <span className="chiffres font-mono font-medium">{deputes.toFixed(1).replace(".", ",")}</span> années
          de salaire net d’un député.
          {montant >= SEUIL_ANNEES ? (
            <>
              {" "}Ou <span className="chiffres font-mono font-medium">{annees.toFixed(1).replace(".", ",")}</span> années
              de ta vie sans travailler, à ton niveau de vie.
            </>
          ) : null}
        </p>
      </div>

      <Volet titre="D’où viennent ces prix ?">
        <p className="text-[14px] leading-relaxed text-encre-2">
          <span className="font-medium text-encre">{objet.nom}</span> : {objet.source}.
        </p>
        <ul className="flex flex-col gap-1 text-[13.5px] leading-relaxed text-encre-2">
          {UNITES.map((u) => (
            <li key={u.id}>
              <span className="font-medium text-encre">{u.pluriel}</span>, {eurosSigne(u.prix).replace(" €", " €")} l’unité : {u.source}
            </li>
          ))}
        </ul>
        <p className="text-[13.5px] leading-relaxed text-encre-2">
          Le député : 71 440,08 € nets par an, tels que l’Assemblée nationale les publie. Sans
          l’avance de frais de mandat, qui n’existe plus depuis le 1er janvier 2026.
        </p>
        <Lien href="/methode">Toutes les sources</Lien>
      </Volet>
    </Carte>
  );
}
