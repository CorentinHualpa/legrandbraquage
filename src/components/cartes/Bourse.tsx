"use client";

import { useState } from "react";

import { Carte, Chiffre, Commissaire, Kicker, Ligne, Reponse, Volet } from "./Carte";
import type { Pieces } from "@/lib/images";
import { euros, eurosSigne, pourcent } from "@/lib/format";
import {
  CRANS_FRAIS,
  CRANS_RENDEMENT,
  PALIERS_ALIBI,
  placerSaRetraiteAuTaux,
  type Simulation,
} from "@/lib/moteur";

/**
 * Où sont les six enveloppes sur la photo n° 25, en pour cent de l'image.
 * Deux rangées de trois, dans l'ordre des crans du moteur. La liasse part
 * du bas de la table, là où la photo ne montre que du bois.
 */
const ENVELOPPES = [
  { x: 20, y: 26.2 }, { x: 49.8, y: 26.2 }, { x: 79.6, y: 26.2 },
  { x: 20, y: 40.8 }, { x: 49.8, y: 40.8 }, { x: 79.6, y: 40.8 },
];
const LIASSE_AU_DEPART = { x: 50, y: 75 };

/** Ce qu'on écrit sur l'enveloppe : court, ça tient sur du kraft. */
const ETIQUETTES: Record<string, string> = {
  "livret-a": "Livret A",
  immobilier: "Immobilier",
  "fonds-euros": "Fonds euros",
  "msci-world": "MSCI World",
  sp500: "S&P 500",
  cac40: "CAC 40",
};

/**
 * Écran 5 : le coup de la bourse. Le commissaire nous regarde.
 *
 * « Si vous aviez eu le choix, vous l'auriez mis où, le pognon ? » La table
 * aux six enveloppes, vue du dessus. On tape une enveloppe, la liasse glisse
 * dessus, et le capital à 64 ans se recalcule. C'est la carte qui bouge sous
 * le doigt, celle qui donne au parcours sa variabilité (Coq, 08/09/2026).
 *
 * ⚠ Ce sont les cotisations VIEILLESSE qui sont placées, pas le total
 * braqué : c'est la seule somme comparable à la pension en face. Le
 * commissaire le dit. La contre-expertise (les hypothèses qu'on retire, les
 * frais) est au clic : c'est l'ancien « alibi du million », replié.
 */
export function Bourse({
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
  const [cranId, setCranId] = useState<string | null>(null);
  const [fraisId, setFraisId] = useState("aucun");
  const cran = CRANS_RENDEMENT.find((c) => c.id === cranId) ?? null;
  const frais = CRANS_FRAIS.find((f) => f.id === fraisId) ?? CRANS_FRAIS[0];
  const place = cran
    ? placerSaRetraiteAuTaux(simulation, {
        rendementReel: cran.reel,
        fraisAnnuels: frais.annuels,
        fraisVersement: frais.versement,
      })
    : null;
  const verse = simulation.carriere.annees.reduce((t, a) => t + a.cotisationVieillesse, 0);
  const indexCran = cran ? CRANS_RENDEMENT.indexOf(cran) : -1;
  const liasse = indexCran >= 0 ? ENVELOPPES[indexCran] : LIASSE_AU_DEPART;
  const table = pieces[25];

  return (
    <Carte
      numero={numero}
      total={total}
      nature="La bourse"
      retour={retour}
      photo={{ numero: 20, pieces, hauteur: 320, legende: "CLICHÉ 20 · IL VOUS REGARDE", position: "50% 18%" }}
      action={{ libelle: place ? "Suivant" : "Je ne joue pas, suivant", onClick: suivant, couleur: place ? "rouge" : "papier" }}
    >
      <Commissaire>
        « Alors, entre nous. Rien que vos cotisations retraite, {eurosSigne(verse)} sur 43 ans. Si vous aviez
        eu le choix, vous l’auriez mis où, le pognon ? »
      </Commissaire>

      {/* La table. Les enveloppes sont des boutons posés sur la photo. */}
      <div className="relative -mx-5 aspect-[2/3] overflow-hidden bg-nuit-2 sm:-mx-6" role="radiogroup" aria-label="Où placer la liasse">
        {table ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/images/${table}`} alt="" className="absolute inset-0 h-full w-full object-cover" decoding="async" />
        ) : (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-[1fr_1fr_2fr] gap-3 p-6">
            {ENVELOPPES.map((e) => (
              <div key={`${e.x}-${e.y}`} className="border border-dashed border-papier/30" />
            ))}
          </div>
        )}
        {CRANS_RENDEMENT.map((c, i) => {
          const pos = ENVELOPPES[i];
          const actif = c.id === cranId;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => setCranId(c.id)}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: "27%", height: "12%" }}
            >
              <span
                className={`px-1.5 py-0.5 font-mono text-[10px] tracking-[0.1em] uppercase transition-colors ${
                  actif ? "bg-encre text-papier" : "bg-[#c9a56a]/90 text-[#2b2620]"
                }`}
              >
                {ETIQUETTES[c.id] ?? c.nom}
              </span>
            </button>
          );
        })}
        {/* La liasse, qui glisse. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-500 ease-out"
          style={{ left: `${liasse.x}%`, top: `${liasse.y}%`, width: "34%", transform: `translate(-50%,-50%) rotate(${indexCran >= 0 ? -6 : 3}deg)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/liasse.webp" alt="" className="w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.6)]" decoding="async" />
        </div>
        {!place ? (
          <span className="absolute inset-x-0 bottom-4 text-center font-mono text-[10px] tracking-[0.14em] text-ligne uppercase">
            Tape une enveloppe
          </span>
        ) : null}
      </div>

      {place && cran ? (
        <div className="flex flex-col gap-1.5">
          <Kicker>À 64 ans, {ETIQUETTES[cran.id] ?? cran.nom}, ça vous aurait fait</Kicker>
          <Chiffre taille={44}>{eurosSigne(place.capital)}</Chiffre>
          <p className="text-[14.5px] leading-relaxed text-ligne">
            contre {eurosSigne(place.equivalentPension)} de pension à recevoir.{" "}
            <span className="text-papier">
              {place.gagnant ? `${eurosSigne(place.ecart)} de plus` : `${eurosSigne(-place.ecart)} de moins`}
            </span>
            . {cran.source}, {pourcent(cran.reel, 1)} par an, inflation retirée.
          </p>
        </div>
      ) : null}

      <div className="grow" />

      <Volet titre="Sauf que… la contre-expertise">
        <p className="text-[14px] leading-relaxed text-ligne">
          Le million de la défense tient à trois hypothèses. Ce qu’il reste quand on les retire :
        </p>
        <ul className="flex flex-col">
          {PALIERS_ALIBI.map((palier) => (
            <li key={palier.id}>
              <Ligne libelle={palier.titre} sous={palier.detail} montant={eurosSigne(palier.montant)} />
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <Kicker>Et les frais</Kicker>
          {CRANS_FRAIS.map((f) => (
            <Reponse
              key={f.id}
              actif={f.id === fraisId}
              onClick={() => setFraisId(f.id)}
              repere={`${(f.annuels * 100).toFixed(1).replace(".", ",")} % par an`}
            >
              <span className="text-[14.5px]">{f.nom}</span>
            </Reponse>
          ))}
          {place ? (
            <p className="text-[13px] leading-relaxed text-ligne">
              Avec ces frais, le capital vaut{" "}
              <span className="chiffres font-mono font-medium text-papier">{euros(place.capital)} €</span>, et les
              frais auront pris <span className="chiffres font-mono font-medium text-papier">{euros(place.fraisPayes)} €</span>{" "}
              au passage. Sans compter que personne ne place quarante-trois ans sans jamais toucher au compte.
            </p>
          ) : null}
        </div>
      </Volet>
    </Carte>
  );
}
