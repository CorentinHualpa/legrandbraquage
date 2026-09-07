"use client";

import { EnTete, Feuille, PiecesVersees, Renvoi, Scelle, Tampon } from "./papier";
import type { Pieces } from "./Instruction";
import { euros } from "@/lib/format";
import type { Statut } from "@/lib/moteur";
import {
  FORMES_TPE,
  NOMS_REGIME,
  STATUTS,
  VERSANTS,
  type FormeTpe,
  type Regime,
  type Versant,
} from "@/lib/statuts";

export function Plainte({
  pieces,
  netMensuel,
  setNetMensuel,
  statut,
  setStatut,
  formeTpe,
  setFormeTpe,
  versant,
  setVersant,
  regime,
  calculable,
  ouverte,
  ouvrir,
}: {
  pieces: Pieces;
  netMensuel: number;
  setNetMensuel: (n: number) => void;
  statut: Statut;
  setStatut: (s: Statut) => void;
  formeTpe: FormeTpe | undefined;
  setFormeTpe: (f: FormeTpe) => void;
  versant: Versant;
  setVersant: (v: Versant) => void;
  regime: Regime | null;
  calculable: boolean;
  ouverte: boolean;
  ouvrir: () => void;
}) {
  return (
    <Feuille>
      <EnTete
        nature="DÉPÔT DE PLAINTE"
        titre="Le Grand Braquage"
        tampon={
          <Tampon couleur="bleu" sens="droite">
            {ouverte ? "INSTRUITE" : "EN COURS"}
          </Tampon>
        }
      />

      <Scelle
        numero={1}
        nom="La scène de crime"
        fichier="01-scene-de-crime.jpg"
        ratio="16:9"
        legende="CLICHÉ 01 · SALON, 06 H 12"
        present={Boolean(pieces[1])}
      />

      <div className="flex flex-col gap-3">
        <h1 className="text-[32px] leading-[1.08] font-bold tracking-[-0.02em] sm:text-[40px]">
          On t’a braqué.
          <br />
          Reste à savoir
          <br />
          de combien.
        </h1>
        <p className="text-[15px] leading-relaxed text-encre-2 sm:text-[16px]">
          Chaque mois, quelqu’un passe chez toi avant toi. Il a une clé, il a le
          droit, et il laisse un reçu que personne ne lit. Donne ton salaire : on
          chiffre ce qu’il emporte, ce qu’il repose, et lequel des deux pèse le
          plus lourd.
        </p>
      </div>

      <div className="flex flex-col gap-5 border-2 border-encre bg-papier-2 p-4 sm:p-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="net"
            className="font-mono text-[10px] tracking-[0.13em] text-encre-3"
          >
            CE QUI ARRIVE SUR TON COMPTE, CHAQUE MOIS
          </label>
          <div className="flex items-baseline gap-2 border-b-2 border-encre pb-1.5">
            <input
              id="net"
              type="text"
              inputMode="numeric"
              value={euros(netMensuel)}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/[^\d]/g, ""));
                setNetMensuel(Number.isFinite(n) ? n : 0);
              }}
              className="chiffres w-full min-w-0 bg-transparent font-mono text-[38px] font-semibold tracking-[-0.03em] outline-none focus:text-rouge-texte sm:text-[44px]"
              aria-describedby="net-aide"
            />
            <span className="shrink-0 text-[22px] text-encre-3">€</span>
            <span className="shrink-0 font-mono text-[10px] whitespace-nowrap text-encre-3">
              NET, APRÈS IMPÔT
            </span>
          </div>
          <p id="net-aide" className="text-[13px] text-encre-3 italic">
            À l’euro près, ou à la louche. Le braqueur n’est pas regardant.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] tracking-[0.13em] text-encre-3">
            QUALITÉ DE LA VICTIME
          </legend>
          <div className="flex flex-wrap gap-2">
            {STATUTS.map((s) => {
              const actif = statut === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatut(s.id)}
                  aria-pressed={actif}
                  className={`px-3 py-2 text-[14px] transition-colors ${
                    actif
                      ? "bg-encre font-medium text-papier"
                      : "border border-cadre-bord text-encre hover:border-encre"
                  }`}
                >
                  {s.libelle}
                </button>
              );
            })}
          </div>
        </fieldset>

        {statut === "tpe" ? (
          <fieldset className="flex flex-col gap-2 border-l-[3px] border-bleu bg-papier-3 py-3 pr-3 pl-3">
            <legend className="sr-only">Forme juridique</legend>
            <p className="text-[13.5px] leading-snug text-encre-2">
              « Patron de TPE » n’est pas un régime social. Le vôtre dépend de la
              forme de votre société, et l’écart entre les deux est considérable.
            </p>
            <div className="mt-1 flex flex-col gap-2">
              {FORMES_TPE.map((f) => {
                const actif = formeTpe === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormeTpe(f.id)}
                    aria-pressed={actif}
                    className={`flex flex-col items-start px-3 py-2 text-left transition-colors ${
                      actif
                        ? "bg-encre text-papier"
                        : "border border-cadre-bord hover:border-encre"
                    }`}
                  >
                    <span className="text-[14px] font-medium">{f.libelle}</span>
                    <span
                      className={`text-[12.5px] ${actif ? "text-papier/90" : "text-encre-3"}`}
                    >
                      {f.precision}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {statut === "fonctionnaire" ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-mono text-[10px] tracking-[0.13em] text-encre-3">
              VERSANT
            </legend>
            <div className="flex flex-wrap gap-2">
              {VERSANTS.map((v) => {
                const actif = versant === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVersant(v.id)}
                    aria-pressed={actif}
                    title={v.precision}
                    className={`px-3 py-2 text-[14px] transition-colors ${
                      actif
                        ? "bg-encre font-medium text-papier"
                        : "border border-cadre-bord text-encre hover:border-encre"
                    }`}
                  >
                    {v.libelle}
                  </button>
                );
              })}
            </div>
            <p className="text-[12.5px] leading-snug text-encre-3">
              Le versant change tout du côté de l’employeur : sa contribution au
              régime de pension va de 37,65 % du traitement à la CNRACL à
              82,28 % pour l’État. Ces deux taux ne se comparent PAS à celui
              d’un employeur privé, et la page méthode dit pourquoi.
            </p>
          </fieldset>
        ) : null}

        {regime && !calculable ? (
          <p className="border-l-[3px] border-rouge bg-papier-3 py-3 pr-3 pl-3 text-[13.5px] leading-relaxed">
            <span className="font-semibold">
              Le régime {NOMS_REGIME[regime]} n’est pas encore instruit.
            </span>{" "}
            Il a ses propres barèmes, et lui servir le calcul du salarié
            donnerait un chiffre faux. On préfère le dire : c’est exactement ce
            que ce dossier reproche à la partie adverse. Reviens, ou prends le
            statut salarié pour voir la mécanique.
          </p>
        ) : null}

        <button
          type="button"
          onClick={ouvrir}
          disabled={!calculable || !(netMensuel > 0)}
          className="bg-rouge px-4 py-3.5 text-center text-[16px] font-semibold text-papier transition-colors hover:bg-rouge-sombre disabled:cursor-not-allowed disabled:bg-cadre-bord disabled:text-encre-3"
        >
          {ouverte ? "Descendre au procès-verbal" : "Ouvrir l’instruction"}
        </button>
      </div>

      <Renvoi>
        Rien ne sort de ton téléphone. Le calcul tourne chez toi, et chaque euro
        affiché renvoie à un barème officiel :{" "}
        <a href="/methode" className="font-semibold text-rouge-texte underline">
          la méthode est publique, le moteur aussi
        </a>
        . Contrairement au braquage, l’enquête n’a rien à cacher.
      </Renvoi>

      <PiecesVersees>
        URSSAF · DGFiP · INSEE · COR · DREES · BANQUE DE FRANCE · 2026
        <br />
        UNE ENQUÊTE REVOLUTION AGENCY
      </PiecesVersees>
    </Feuille>
  );
}
