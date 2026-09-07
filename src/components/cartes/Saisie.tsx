"use client";

import { useState } from "react";

import { Carte, Kicker, Pastille, Question } from "./Carte";
import { euros } from "@/lib/format";
import type { Statut } from "@/lib/moteur";
import {
  ACTIVITES,
  CATEGORIES_MICRO,
  FORMES_TPE,
  NOMS_REGIME,
  OU_LIRE_SON_NET,
  STATUTS,
  VERSANTS,
  type Activite,
  type CategorieMicro,
  type FormeTpe,
  type Regime,
  type Versant,
} from "@/lib/statuts";

export type EtatSaisie = {
  netMensuel: number;
  statut: Statut;
  formeTpe: FormeTpe | undefined;
  versant: Versant;
  activite: Activite;
  categorieMicro: CategorieMicro;
  versementLiberatoire: boolean;
  couple: boolean;
  enfants: number;
};

/**
 * Écran 1 : tu touches combien par mois.
 *
 * La règle du jeu est dite ICI, avant tout chiffre : on rejoue toute la
 * carrière avec ce salaire. Sans cette phrase, le total de l'écran suivant se
 * lit comme un prélèvement de l'année, et il paraît absurde.
 *
 * Le statut est visible. La forme juridique, l'activité et le versant
 * apparaissent quand le statut les exige, parce qu'ils décident du régime.
 * Le foyer, lui, est facultatif et reste replié : il ne divise que l'impôt.
 */
export function Saisie({
  etat,
  changer,
  regime,
  calculable,
  lancer,
  numero,
  total,
}: {
  etat: EtatSaisie;
  changer: (patch: Partial<EtatSaisie>) => void;
  regime: Regime | null;
  calculable: boolean;
  lancer: () => void;
  numero: number;
  total: number;
}) {
  const [foyerOuvert, setFoyerOuvert] = useState(false);
  const ouLire = OU_LIRE_SON_NET[regime ?? "salarie"];
  const pret = calculable && etat.netMensuel > 0;

  return (
    <Carte
      numero={numero}
      total={total}
      action={{ libelle: "Lancer la simulation", onClick: lancer, disabled: !pret }}
      pied={
        <p className="text-center text-[12.5px] text-encre-3">
          Rien n’est enregistré. Tout se calcule dans ton téléphone.{" "}
          <a href="/methode" className="underline underline-offset-2">La méthode.</a>
        </p>
      }
    >
      <div className="flex flex-col gap-2">
        <Question>Tu touches combien par mois ?</Question>
        <p className="text-[15px] leading-relaxed text-encre-2">
          On rejoue toute ta carrière avec ce salaire :{" "}
          <strong className="text-encre">43 ans, de 22 à 64 ans</strong>, en
          suivant la courbe moyenne des salaires en France.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 border-2 border-encre bg-papier-2 px-4 py-3.5">
        <div className="flex items-baseline gap-2">
          <input
            id="net"
            type="text"
            inputMode="numeric"
            value={euros(etat.netMensuel)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^\d]/g, ""));
              changer({ netMensuel: Number.isFinite(n) ? n : 0 });
            }}
            aria-label={ouLire.label}
            aria-describedby="net-aide"
            className="chiffres w-full min-w-0 bg-transparent font-mono text-[44px] font-semibold tracking-[-0.03em] outline-none focus:text-rouge-texte"
          />
          <span className="shrink-0 font-mono text-[12px] tracking-[0.1em] whitespace-nowrap text-encre-3">
            {etat.statut === "independant" && etat.activite === "micro" ? "€ DE CA" : "€ NET, AVANT IMPÔT"}
          </span>
        </div>
        <p id="net-aide" className="text-[13.5px] leading-snug text-encre-2">{ouLire.aide}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Kicker>Tu es</Kicker>
        <div className="grid grid-cols-2 gap-2">
          {STATUTS.map((s) => (
            <Pastille
              key={s.id}
              actif={etat.statut === s.id}
              onClick={() => changer({ statut: s.id, formeTpe: s.id === "tpe" ? etat.formeTpe : undefined })}
            >
              {s.libelle}
            </Pastille>
          ))}
        </div>
      </div>

      {etat.statut === "tpe" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] tracking-[0.14em] text-encre-3">TA SOCIÉTÉ</legend>
          {FORMES_TPE.map((f) => (
            <Pastille key={f.id} actif={etat.formeTpe === f.id} onClick={() => changer({ formeTpe: f.id })} large>
              <span className="block font-medium">{f.libelle}</span>
              <span className={`block text-[12.5px] ${etat.formeTpe === f.id ? "text-papier/90" : "text-encre-3"}`}>{f.precision}</span>
            </Pastille>
          ))}
        </fieldset>
      ) : null}

      {etat.statut === "independant" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] tracking-[0.14em] text-encre-3">TON ACTIVITÉ</legend>
          {ACTIVITES.map((a) => (
            <Pastille key={a.id} actif={etat.activite === a.id} onClick={() => changer({ activite: a.id })} large>
              <span className="block font-medium">{a.libelle}</span>
              <span className={`block text-[12.5px] ${etat.activite === a.id ? "text-papier/90" : "text-encre-3"}`}>{a.precision}</span>
            </Pastille>
          ))}
        </fieldset>
      ) : null}

      {etat.statut === "independant" && etat.activite === "micro" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] tracking-[0.14em] text-encre-3">CE QUE TU VENDS</legend>
          {CATEGORIES_MICRO.map((c) => (
            <Pastille key={c.id} actif={etat.categorieMicro === c.id} onClick={() => changer({ categorieMicro: c.id })} large>
              <span className="block font-medium">{c.libelle}</span>
              <span className={`block text-[12.5px] ${etat.categorieMicro === c.id ? "text-papier/90" : "text-encre-3"}`}>{c.precision}</span>
            </Pastille>
          ))}
          <Pastille actif={etat.versementLiberatoire} onClick={() => changer({ versementLiberatoire: !etat.versementLiberatoire })} large>
            <span className="block font-medium">J’ai pris le versement libératoire</span>
            <span className={`block text-[12.5px] ${etat.versementLiberatoire ? "text-papier/90" : "text-encre-3"}`}>
              Mon impôt est un pourcentage de mon chiffre d’affaires, payé avec mes cotisations.
            </span>
          </Pastille>
        </fieldset>
      ) : null}

      {etat.statut === "fonctionnaire" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] tracking-[0.14em] text-encre-3">TON VERSANT</legend>
          <div className="grid grid-cols-3 gap-2">
            {VERSANTS.map((v) => (
              <Pastille key={v.id} actif={etat.versant === v.id} onClick={() => changer({ versant: v.id })}>
                {v.libelle}
              </Pastille>
            ))}
          </div>
        </fieldset>
      ) : null}

      <button
        type="button"
        onClick={() => setFoyerOuvert(!foyerOuvert)}
        aria-expanded={foyerOuvert}
        className="flex items-center gap-2 self-start text-[15px] text-bleu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          {foyerOuvert ? <path d="M3 8h10" /> : <path d="M8 3v10M3 8h10" />}
        </svg>
        Mon foyer (facultatif)
      </button>

      {foyerOuvert ? (
        <fieldset className="flex flex-col gap-2 border-l-[3px] border-bleu bg-papier-3 py-3 pr-3 pl-3">
          <legend className="sr-only">Ton foyer</legend>
          <div className="flex flex-wrap gap-2">
            <Pastille actif={!etat.couple} onClick={() => changer({ couple: false })}>Seul</Pastille>
            <Pastille actif={etat.couple} onClick={() => changer({ couple: true })}>En couple</Pastille>
            <span className="mx-1 self-center font-mono text-[10px] text-encre-3">ENFANTS</span>
            {[0, 1, 2, 3].map((n) => (
              <Pastille key={n} actif={etat.enfants === n} onClick={() => changer({ enfants: n })}>
                {n === 3 ? "3+" : n}
              </Pastille>
            ))}
          </div>
          <p className="text-[12.5px] leading-snug text-encre-2">
            Le quotient familial divise l’impôt, pas les cotisations.
          </p>
        </fieldset>
      ) : null}

      {regime && !calculable ? (
        <p className="border-l-[3px] border-rouge bg-papier-3 py-3 pr-3 pl-3 text-[13.5px] leading-relaxed">
          <span className="font-semibold">Le régime {NOMS_REGIME[regime]} n’est pas encore instruit.</span>{" "}
          Lui servir le barème d’un régime voisin donnerait un chiffre faux. On préfère le dire.
        </p>
      ) : null}
    </Carte>
  );
}
