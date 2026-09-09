"use client";

import { Carte, Chiffre, Commissaire, Kicker, Ligne, Reponse, Volet } from "./Carte";
import type { Pieces } from "@/lib/images";
import { reagir } from "@/lib/sons";
import { texte } from "@/lib/repliques";
import { ETIQUETTES_PLACEMENT as ETIQUETTES } from "@/lib/placements";
import { euros, eurosSigne } from "@/lib/format";
import { CRANS_FRAIS, CRANS_RENDEMENT, PALIERS_ALIBI, type Simulation } from "@/lib/moteur";

/**
 * Où sont les six enveloppes, en pour cent du CADRE affiché.
 *
 * ⚠ La photo n° 25 est un 2:3 debout, mais les enveloppes tiennent dans sa
 * moitié haute : affichée en entier, elle laissait une demi-page de bois vide
 * (Coq, 08/09/2026 : « il y a beaucoup d'espace perdu, tronque-la »). Le
 * cadre est donc un 3:2 couché et la photo est recalée en `object-position`
 * pour ne montrer que la bande utile, de 12 % à 56,4 % de sa hauteur. Ces
 * coordonnées-ci sont exprimées dans le cadre, PAS dans la photo : si le
 * recadrage bouge, elles bougent avec (y_cadre = (y_photo − 12) / 44,44).
 */
const ENVELOPPES = [
  { x: 20, y: 32 }, { x: 49.8, y: 32 }, { x: 79.6, y: 32 },
  { x: 20, y: 64.8 }, { x: 49.8, y: 64.8 }, { x: 79.6, y: 64.8 },
];
/** Hauteur de la zone tapable, en pour cent du cadre (12 % de la photo). */
const HAUTEUR_ENVELOPPE = 27;
const LIASSE_AU_DEPART = { x: 50, y: 92 };

/** 0,0677 → « 6,8 % », −0,0024 → « −0,2 % ». Le taux RÉEL, inflation retirée. */
export function taux(reel: number): string {
  const v = (reel * 100).toFixed(1).replace(".", ",").replace("-", "−");
  return `${v} %`;
}

/**
 * Écran 11 : la bourse, la dernière question avant le verdict.
 *
 * « Si vous aviez eu le choix, vous l'auriez mis où, le pognon ? » La table
 * aux six enveloppes, chacune marquée de son placement ET de son taux. On en
 * tape une, la liasse glisse dessus, et le capital à 64 ans tombe en face de
 * ce qu'ils ont rendu. C'est SUR CE COÛT D'OPPORTUNITÉ que le verdict se
 * juge (Coq, 08/09/2026 au soir), d'où le choix qui vit dans le parcours et
 * pas dans cette carte.
 *
 * ⚠ Les taux sont RÉELS, inflation retirée, parce que tout le dossier est en
 * euros d'aujourd'hui. Le Livret A est négatif : c'est un fait, pas une
 * provocation, et c'est ce qui rend le choix intéressant.
 */
/**
 * Ce qu'il dit selon l'enveloppe choisie. Il commente le TEMPÉRAMENT, pas le
 * produit : le livret A et le fonds en euros disent la même chose de quelqu'un.
 * Les trois enveloppes actions, en revanche, ont chacune la leur : partager une
 * réplique entre le MSCI et le S&P faisait entendre la même phrase sur deux
 * cases différentes, ce qui trahit la machine en une seconde.
 */
const REACTION_PLACEMENT: Record<string, string> = {
  "livret-a": "placement-prudent",
  "fonds-euros": "placement-prudent",
  immobilier: "placement-pierre",
  "msci-world": "placement-monde",
  sp500: "placement-amerique",
  cac40: "placement-cac",
};

export function Bourse({
  pieces,
  simulation,
  placementId,
  fraisId,
  choisirPlacement,
  choisirFrais,
  numero,
  total,
  suivant,
  retour,
}: {
  pieces: Pieces;
  simulation: Simulation;
  placementId: string;
  fraisId: string;
  choisirPlacement: (id: string) => void;
  choisirFrais: (id: string) => void;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
}) {
  const cran = CRANS_RENDEMENT.find((c) => c.id === placementId) ?? CRANS_RENDEMENT[0];
  const indexCran = CRANS_RENDEMENT.indexOf(cran);
  const liasse = ENVELOPPES[indexCran] ?? LIASSE_AU_DEPART;
  const opportunite = simulation.opportunite;
  const rendu = simulation.plateauDroit.total;
  const table = pieces[25];

  return (
    <Carte
      numero={numero}
      total={total}
      nature="La bourse"
      retour={retour}
      photo={{ numero: 20, pieces, hauteur: 320, legende: "CLICHÉ 20 · IL VOUS REGARDE", position: "50% 18%" }}
      action={{ libelle: "Le verdict", onClick: suivant }}
    >
      <Commissaire>
        « {texte("bourse")} Enfin, {eurosSigne(simulation.plateauGauche.total)} sur 43 ans. »
      </Commissaire>

      {/* La table. Les enveloppes sont des boutons posés sur la photo. */}
      <div className="relative -mx-5 aspect-[3/2] overflow-hidden bg-nuit-2 sm:-mx-6" role="radiogroup" aria-label="Où placer la liasse">
        {table ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/images/${table}`} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_21.6%]" decoding="async" />
        ) : null}
        {CRANS_RENDEMENT.map((c, i) => {
          const pos = ENVELOPPES[i];
          const actif = c.id === placementId;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={actif}
              aria-label={`${c.nom}, ${taux(c.reel)} par an`}
              onClick={() => { choisirPlacement(c.id); reagir(REACTION_PLACEMENT[c.id] ?? ""); }}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: "27%", height: `${HAUTEUR_ENVELOPPE}%` }}
            >
              <span className={`px-1.5 py-0.5 font-mono text-[10px] leading-tight tracking-[0.08em] uppercase ${actif ? "bg-encre text-papier" : "bg-[#2b2620] text-[#e9d9b8]"}`}>
                {ETIQUETTES[c.id] ?? c.nom}
              </span>
              <span className={`chiffres px-1.5 py-0.5 font-mono text-[13px] leading-tight font-semibold ${actif ? "bg-encre text-papier" : "bg-[#2b2620] text-[#e9d9b8]"}`}>
                {taux(c.reel)}
              </span>
            </button>
          );
        })}
        {/* La liasse, qui glisse. */}
        <div
          aria-hidden
          className="pointer-events-none absolute transition-[left,top] duration-500 ease-out"
          style={{ left: `${liasse.x}%`, top: `${liasse.y}%`, width: "30%", transform: "translate(-50%,-50%) rotate(-6deg)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/liasse.webp" alt="" className="w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.6)]" decoding="async" />
        </div>
        <span className="absolute inset-x-0 bottom-3 text-center font-mono text-[9.5px] tracking-[0.14em] text-ligne uppercase">
          Taux réels par an, inflation retirée
        </span>
      </div>

      {opportunite ? (
        <div className="flex flex-col gap-1.5">
          <Kicker>À 64 ans, en {ETIQUETTES[cran.id] ?? cran.nom} à {taux(cran.reel)}, ça vous aurait fait</Kicker>
          <Chiffre taille={44}>{eurosSigne(opportunite.capital)}</Chiffre>
          <p className="text-[14.5px] leading-relaxed text-ligne">
            contre {eurosSigne(rendu)} qu’ils vous auront rendu.{" "}
            <span className="text-papier">
              {opportunite.capital > rendu
                ? `${eurosSigne(opportunite.capital - rendu)} de plus pour vous.`
                : `${eurosSigne(rendu - opportunite.capital)} de moins pour vous.`}
            </span>{" "}
            {cran.source}.
          </p>
        </div>
      ) : null}

      <div className="grow" />

      <Volet titre="Sauf que… l’avocate des braqueurs demande la parole">
        {pieces[28] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/images/${pieces[28]}`} alt="L’avocate des braqueurs, dans le couloir" className="-mx-5 aspect-[16/9] w-[calc(100%+2.5rem)] max-w-none object-cover object-[50%_30%] saturate-[0.8] sm:-mx-6 sm:w-[calc(100%+3rem)]" decoding="async" />
        ) : null}
        <Commissaire qui="L’avocate des braqueurs" couleur="bleu">
          « Objection. Mon client vous a pris cet argent, soit. Mais qui place quarante-trois ans sans
          jamais y toucher ? Qui n’a pas de frais ? Qui n’a pas paniqué en 2008 ? Le million de
          l’accusation tient à trois hypothèses. Regardez ce qu’il en reste quand on les retire. »
        </Commissaire>
        <ul className="flex flex-col">
          {PALIERS_ALIBI.map((palier) => (
            <li key={palier.id}>
              <Ligne libelle={palier.titre} sous={palier.detail} montant={eurosSigne(palier.montant)} />
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <Commissaire qui="L’avocate des braqueurs" couleur="bleu">
            « Et les frais, monsieur le commissaire. Personne ne parle jamais des frais. »
          </Commissaire>
          <Kicker>Les frais, qui comptent dans le verdict</Kicker>
          {CRANS_FRAIS.map((f) => (
            <Reponse
              key={f.id}
              actif={f.id === fraisId}
              onClick={() => choisirFrais(f.id)}
              repere={`${(f.annuels * 100).toFixed(1).replace(".", ",")} % par an`}
            >
              <span className="text-[14.5px]">{f.nom}</span>
            </Reponse>
          ))}
          {opportunite ? (
            <p className="text-[13px] leading-relaxed text-ligne">
              Avec ces frais, le capital vaut{" "}
              <span className="chiffres font-mono font-medium text-papier">{euros(opportunite.capital)} €</span> ; sans
              eux, il vaudrait{" "}
              <span className="chiffres font-mono font-medium text-papier">{euros(opportunite.sansFrais)} €</span>.
            </p>
          ) : null}
        </div>
        <p className="text-[13px] leading-relaxed text-ligne">
          Les taux nominaux, avant inflation :{" "}
          {CRANS_RENDEMENT.filter((c) => c.nominal !== null).map((c) => `${ETIQUETTES[c.id] ?? c.nom} ${taux(c.nominal as number)}`).join(", ")}.
          L’immobilier est mesuré directement en réel.
        </p>
      </Volet>
    </Carte>
  );
}
