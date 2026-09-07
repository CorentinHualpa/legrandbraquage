"use client";

import { useState } from "react";

import { EnTete, Feuille, PiecesVersees, Renvoi, Scelle, Tampon } from "./papier";
import type { Pieces } from "./Instruction";
import { euros, eurosSigne, pourcent } from "@/lib/format";
import {
  ALIBI_INDICE_NU,
  CRANS_FRAIS,
  CRANS_RENDEMENT,
  PALIERS_ALIBI,
  placerSaRetraiteAuTaux,
  type Simulation,
} from "@/lib/moteur";

const LEGENDES = [
  "le chiffre tel que la défense le pose",
  "première hypothèse retirée",
  "deuxième hypothèse retirée",
  "il manque 73 % à son million",
];

export function Alibi({
  pieces,
  simulation,
}: {
  pieces: Pieces;
  simulation: Simulation;
}) {
  const [retires, setRetires] = useState(0);

  /*
   * Le rendement est un nombre que l'on règle, pas un produit que l'on choisit.
   * Le curseur part du fonds en euros, ce que la moitié des Français détient,
   * et les crans à côté disent où se situent les autres placements réels. Les
   * frais ont leur propre curseur, parce qu'ils pèsent autant que le taux.
   */
  const cranDefaut = CRANS_RENDEMENT.find((c) => c.id === "fonds-euros") ?? CRANS_RENDEMENT[0];
  const [rendementReel, setRendementReel] = useState(Math.round(cranDefaut.reel * 1000) / 1000);
  const [fraisId, setFraisId] = useState("per-actions");
  const frais = CRANS_FRAIS.find((f) => f.id === fraisId) ?? CRANS_FRAIS[0];

  const montant = PALIERS_ALIBI[retires].montant;
  const part = montant / PALIERS_ALIBI[0].montant;

  const place = placerSaRetraiteAuTaux(simulation, {
    rendementReel,
    fraisAnnuels: frais.annuels,
    fraisVersement: frais.versement,
  });
  const fourchette = simulation.plateauDroit.fourchetteRetraite;
  const cranProche = CRANS_RENDEMENT.reduce((meilleur, c) =>
    Math.abs(c.reel - rendementReel) < Math.abs(meilleur.reel - rendementReel) ? c : meilleur,
  );

  return (
    <Feuille id="alibi" className="mt-10 border-t-2 border-dashed border-ligne pt-2">
      <EnTete
        nature="RAPPORT D’EXPERTISE"
        titre="L’alibi du million"
        tampon={<Tampon>CONTRADICTOIRE</Tampon>}
      />

      <Scelle
        numero={2}
        nom="La pièce à conviction"
        ratio="4:3"
        legende="CLICHÉ 02 · LA FICHE DE PAIE SOUS SCELLÉ"
        fichier={pieces[2]}
      />

      <div className="flex flex-col gap-2.5">
        <p className="text-[15.5px] leading-snug">
          <span className="font-semibold">La défense soutient</span> que sans ce
          braquage, tu serais millionnaire.
        </p>
        <p className="border-l-[3px] border-bleu pl-3 text-[14.5px] leading-relaxed text-encre-2 italic">
          On a refait son calcul. Il est juste. Sur la vraie série du CAC 40, on
          trouve même un peu plus qu’elle : 1 594 561 €. Il n’y a pas de fraude à
          l’expertise.
        </p>
        <p className="text-[14.5px] leading-relaxed">
          Simplement, ce chiffre tient sur{" "}
          <span className="font-semibold">trois hypothèses</span>. Retire-les
          dans l’ordre, et regarde ce qu’il reste du million.
        </p>
      </div>

      {/* Le compteur */}
      <div className="flex flex-col items-center gap-1 border-2 border-encre bg-papier-2 px-4 py-4">
        <span className="font-mono text-[9.5px] tracking-[0.15em] text-encre-3">
          CAPITAL RESTANT À 64 ANS
        </span>
        <p
          className={`chiffres montant-anime font-mono text-[36px] font-semibold tracking-[-0.035em] sm:text-[44px] ${
            retires >= 2 ? "text-rouge-texte" : "text-encre"
          }`}
        >
          {euros(montant)} €
        </p>
        <span className="text-[13px] text-encre-2 italic">
          {LEGENDES[retires]}
        </span>
        <div className="mt-2 h-1.5 w-full bg-ligne">
          <span
            className="block h-full bg-rouge transition-[width] duration-500"
            style={{ width: `${Math.max(4, Math.round(part * 100))}%` }}
          />
        </div>
      </div>

      {/* Les trois crans */}
      <ul className="flex flex-col gap-2">
        {PALIERS_ALIBI.slice(1).map((palier, i) => {
          const enleve = i < retires;
          const perte = PALIERS_ALIBI[i].montant - PALIERS_ALIBI[i + 1].montant;
          return (
            <li key={palier.id}>
              <button
                type="button"
                onClick={() => setRetires(i < retires ? i : i + 1)}
                aria-pressed={enleve}
                className={`flex w-full items-start gap-3 border px-3 py-3 text-left transition-colors ${
                  enleve
                    ? "border-rouge bg-papier-2"
                    : "border-ligne hover:border-encre"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border-[1.6px] border-encre ${
                    enleve ? "bg-transparent" : "bg-encre"
                  }`}
                  aria-hidden
                >
                  {enleve ? null : (
                    <span className="font-mono text-[10px] leading-none font-semibold text-papier">
                      ×
                    </span>
                  )}
                </span>
                <span className="flex grow flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-semibold">
                      {palier.titre}
                    </span>
                    <span
                      className={`chiffres shrink-0 font-mono text-[11.5px] font-semibold ${
                        enleve ? "text-rouge-texte" : "text-encre-3"
                      }`}
                    >
                      {enleve ? `− ${eurosSigne(perte)}` : "RETENUE"}
                    </span>
                  </span>
                  <span className="text-[13px] leading-snug text-encre-2">
                    {palier.detail}
                  </span>
                  {palier.source ? (
                    <span className="font-mono text-[9.5px] tracking-[0.06em] text-encre-3">
                      {palier.source.toUpperCase()}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-1 border-l-[3px] border-bleu bg-papier-3 px-3 py-3">
        <span className="font-mono text-[9.5px] tracking-[0.12em] text-bleu">
          QUESTION RESTÉE SANS RÉPONSE
        </span>
        <p className="text-[14px] leading-snug">
          Elle écrit « le taux du CAC 40 » sans préciser lequel. L’indice nu rend
          5,55 %/an, dividendes réinvestis 8,85 %. Avec l’indice nu, son million
          devient{" "}
          <span className="chiffres font-mono font-semibold">
            {euros(ALIBI_INDICE_NU)} €
          </span>{" "}
          avant même de retirer quoi que ce soit.
        </p>
      </div>

      {/* ─── Le curseur de placement : le gros chiffre, mais c'est toi qui le demandes ── */}
      <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
        <h3 className="font-mono text-[10px] tracking-[0.13em] text-rouge-texte">
          ET SI TU AVAIS PLACÉ CET ARGENT TOI-MÊME ?
        </h3>
        <p className="text-[14.5px] leading-relaxed">
          On reprend TA cotisation vieillesse, année par année, telle que ta
          carrière la produit, et on la place. Règle le rendement et les frais,
          le capital suit. Les crans disent où se situent les placements réels.
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="curseur-placement"
              className="font-mono text-[10px] tracking-[0.13em] text-encre-3"
            >
              RENDEMENT RÉEL, NET D’INFLATION
            </label>
            <span className="chiffres font-mono text-[20px] font-semibold">
              {pourcent(rendementReel, 1)} <span className="text-[12px] font-normal text-encre-3">par an</span>
            </span>
          </div>
          <input
            id="curseur-placement"
            type="range"
            min={-1}
            max={10}
            step={0.1}
            value={Math.round(rendementReel * 1000) / 10}
            onChange={(e) => setRendementReel(Number(e.target.value) / 100)}
            className="h-1.5 w-full cursor-pointer appearance-none bg-ligne accent-rouge"
            aria-label="Rendement réel annuel"
          />
          <div className="flex flex-wrap gap-1.5">
            {CRANS_RENDEMENT.map((c) => {
              const actif = c.id === cranProche.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setRendementReel(Math.round(c.reel * 1000) / 1000)}
                  title={c.source}
                  className={`px-2 py-1 font-mono text-[10px] tracking-[0.04em] transition-colors ${
                    actif
                      ? "bg-encre text-papier"
                      : "border border-cadre-bord text-encre hover:border-encre"
                  }`}
                >
                  {c.nom} · {pourcent(c.reel, 1)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-encre-3">
            FRAIS DE L’INTERMÉDIAIRE
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CRANS_FRAIS.map((f) => {
              const actif = f.id === fraisId;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFraisId(f.id)}
                  aria-pressed={actif}
                  title={f.source}
                  className={`px-2 py-1 font-mono text-[10px] tracking-[0.04em] transition-colors ${
                    actif
                      ? "bg-encre text-papier"
                      : "border border-cadre-bord text-encre hover:border-encre"
                  }`}
                >
                  {f.nom} · {pourcent(f.annuels, 2)}
                  {f.versement > 0 ? ` + ${pourcent(f.versement, 2)} par versement` : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-2 border-encre bg-papier-2 p-4">
          <p className="text-[16px] font-semibold">
            {pourcent(rendementReel, 1)} par an, {frais.nom.toLowerCase()}
          </p>
          <p className="text-[13px] text-encre-2">
            Le cran le plus proche est {cranProche.nom} ({cranProche.source}).
          </p>

          <dl className="mt-1 flex flex-col divide-y divide-ligne border-y border-ligne">
            <div className="flex items-baseline justify-between gap-3 py-2">
              <dt className="text-[13.5px]">Versé sur toute la carrière</dt>
              <dd className="chiffres font-mono text-[13px]">
                {eurosSigne(place.verse)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-2">
              <dt className="text-[13.5px] font-semibold">Capital à l’arrivée</dt>
              <dd className="chiffres font-mono text-[17px] font-semibold">
                {eurosSigne(place.capital)}
              </dd>
            </div>
            {place.fraisPayes > 0 ? (
              <div className="flex items-baseline justify-between gap-3 py-2">
                <dt className="text-[13.5px] text-rouge-texte">
                  Pris par l’intermédiaire, gains manqués compris
                </dt>
                <dd className="chiffres font-mono text-[13px] font-semibold text-rouge-texte">
                  {eurosSigne(place.fraisPayes)}
                </dd>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-3 py-2">
              <dt className="text-[13.5px]">
                Capital équivalent à la pension servie
              </dt>
              <dd className="chiffres font-mono text-[13px]">
                {eurosSigne(place.equivalentPension)}
              </dd>
            </div>
          </dl>

          <p
            className={`text-[14.5px] leading-relaxed ${place.gagnant ? "" : "text-encre"}`}
          >
            {place.gagnant ? (
              <>
                <span className="font-semibold text-rouge-texte">
                  Te débrouiller seul aurait rapporté {eurosSigne(place.ecart)}{" "}
                  de plus.
                </span>{" "}
                À condition de tenir quarante-trois ans sans jamais paniquer, de
                ne pas mourir avant, et d’avoir eu raison sur les marchés. La
                pension, elle, tombe quoi qu’il arrive.
              </>
            ) : (
              <>
                <span className="font-semibold text-bleu">
                  La pension gagne, de {eurosSigne(Math.abs(place.ecart))}.
                </span>{" "}
                À ce rendement et à ces frais, se débrouiller seul rapporte
                moins que le système qu’on accuse. Monte le curseur, et regarde
                à partir d’où ça bascule.
              </>
            )}
          </p>

          <p className="border-t border-ligne pt-2 font-mono text-[9.5px] leading-relaxed tracking-[0.05em] text-encre-3">
            RENDEMENT RÉEL {pourcent(rendementReel, 1).toUpperCase()} PAR AN · FRAIS{" "}
            {pourcent(frais.annuels, 2).toUpperCase()} PAR AN
            {frais.versement > 0 ? ` ET ${pourcent(frais.versement, 2).toUpperCase()} PAR VERSEMENT` : ""}
            {" "}· {frais.source.toUpperCase()}
          </p>
        </div>
      </section>

      {/* La contre-expertise */}
      <section className="flex flex-col gap-2.5 border-t-2 border-encre pt-5">
        <h3 className="font-mono text-[10px] tracking-[0.13em] text-bleu">
          CONTRE-EXPERTISE
        </h3>
        <p className="text-[14.5px] leading-relaxed">
          L’accusation compare un tas de billets à une mensualité. Alors chiffrons
          le tas qu’il faudrait pour servir cette mensualité :{" "}
          <span className="font-semibold">
            {euros(simulation.plateauDroit.pensionMensuelle)} € par mois, à vie,
            indexés, avec réversion.
          </span>
        </p>
        <p className="flex items-baseline gap-2.5 border-l-[3px] border-bleu bg-papier-2 px-3 py-3">
          <span className="chiffres font-mono text-[24px] font-semibold tracking-[-0.03em] sm:text-[28px]">
            {Math.round(fourchette.bas / 1000)} à{" "}
            {Math.round(fourchette.haut / 1000)} k€
          </span>
          <span className="text-[13px] text-encre-3">de capital</span>
        </p>
        <p className="text-[14.5px] leading-relaxed">
          Le même ordre de grandeur que la colonne d’en face.{" "}
          <span className="font-semibold">
            Le « million contre mille cinq cents euros » compare un stock à un
            flux
          </span>
          , et c’est ce tour de passe-passe, pas le rendement, qui fabrique
          l’écart de mille pour un.
        </p>
      </section>

      <Renvoi>
        Aucun de ces crans n’est une opinion. Chacun a sa source, chacun est
        rejouable, et{" "}
        <a href="/methode" className="font-semibold text-rouge-texte underline">
          le moteur est ouvert
        </a>
        . On ne dit pas qu’elle ment. On montre ce que son chiffre suppose.
      </Renvoi>

      <PiecesVersees />
    </Feuille>
  );
}
