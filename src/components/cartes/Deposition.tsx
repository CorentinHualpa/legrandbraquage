"use client";

import { useState } from "react";

import { Carte, Commissaire, Kicker, Papier, Reponse } from "./Carte";
import type { Pieces } from "@/lib/images";
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
 * Écran 2 : le commissariat. Le commissaire prend ta déposition.
 *
 * La règle du jeu est dite ICI, sur le papier de la déposition : on rejoue
 * toute la carrière avec ce salaire. Le statut est visible ; la forme
 * juridique, l'activité et le versant apparaissent quand le statut les
 * exige, parce qu'ils décident du régime. Le foyer reste replié.
 */
export function Deposition({
  pieces,
  etat,
  changer,
  regime,
  calculable,
  signer,
  retour,
  numero,
  total,
}: {
  pieces: Pieces;
  etat: EtatSaisie;
  changer: (patch: Partial<EtatSaisie>) => void;
  regime: Regime | null;
  calculable: boolean;
  signer: () => void;
  retour: () => void;
  numero: number;
  total: number;
}) {
  const [foyerOuvert, setFoyerOuvert] = useState(false);
  const ouLire = OU_LIRE_SON_NET[regime ?? "salarie"];
  const micro = etat.statut === "independant" && etat.activite === "micro";
  const pret = calculable && etat.netMensuel > 0;

  return (
    <Carte
      numero={numero}
      total={total}
      nature="Déposition"
      retour={retour}
      photo={{ numero: 18, pieces, hauteur: 250, legende: "CLICHÉ 18 · LE COMMISSARIAT, 23 H 40" }}
      action={{ libelle: "Signer la déposition", onClick: signer, disabled: !pret }}
    >
      <Commissaire>
        « Asseyez-vous. Nom, prénom… non, laissez tomber. Ce qui m’intéresse, c’est combien vous touchez par mois. »
      </Commissaire>

      <Papier rotation={0.6} className="flex flex-col gap-1.5 px-4 py-3">
        <Kicker couleur="encre">Procès-verbal de déposition · ligne 1</Kicker>
        <div className="flex items-baseline gap-2 border-b-[1.5px] border-encre pb-1">
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
            className="chiffres w-full min-w-0 bg-transparent font-mono text-[42px] font-semibold tracking-[-0.03em] text-encre outline-none focus:text-rouge-texte"
          />
          <span className="shrink-0 font-mono text-[11px] tracking-[0.1em] whitespace-nowrap text-encre-3">
            {micro ? "€ DE CA PAR MOIS" : "€ NET, AVANT IMPÔT"}
          </span>
        </div>
        <p id="net-aide" className="text-[13px] leading-snug text-encre-2">
          {ouLire.aide} On rejoue toute votre carrière avec :{" "}
          <strong className="text-encre">43 ans, de 22 à 64 ans</strong>, sur la courbe moyenne des salaires.
        </p>
      </Papier>

      <div className="flex flex-col gap-2">
        <Kicker>Vous êtes</Kicker>
        <div className="grid grid-cols-2 gap-2">
          {STATUTS.map((s) => (
            <Reponse
              key={s.id}
              actif={etat.statut === s.id}
              onClick={() => changer({ statut: s.id, formeTpe: s.id === "tpe" ? etat.formeTpe : undefined })}
              centre
            >
              {s.libelle}
            </Reponse>
          ))}
        </div>
      </div>

      {etat.statut === "tpe" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ligne">VOTRE SOCIÉTÉ</legend>
          {FORMES_TPE.map((f) => (
            <Reponse key={f.id} actif={etat.formeTpe === f.id} onClick={() => changer({ formeTpe: f.id })}>
              <span className="block font-medium">{f.libelle}</span>
              <span className="block text-[12.5px] opacity-80">{f.precision}</span>
            </Reponse>
          ))}
        </fieldset>
      ) : null}

      {etat.statut === "independant" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ligne">VOTRE ACTIVITÉ</legend>
          {ACTIVITES.map((a) => (
            <Reponse key={a.id} actif={etat.activite === a.id} onClick={() => changer({ activite: a.id })}>
              <span className="block font-medium">{a.libelle}</span>
              <span className="block text-[12.5px] opacity-80">{a.precision}</span>
            </Reponse>
          ))}
        </fieldset>
      ) : null}

      {micro ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ligne">CE QUE VOUS VENDEZ</legend>
          {CATEGORIES_MICRO.map((c) => (
            <Reponse key={c.id} actif={etat.categorieMicro === c.id} onClick={() => changer({ categorieMicro: c.id })}>
              <span className="block font-medium">{c.libelle}</span>
              <span className="block text-[12.5px] opacity-80">{c.precision}</span>
            </Reponse>
          ))}
          <Reponse actif={etat.versementLiberatoire} onClick={() => changer({ versementLiberatoire: !etat.versementLiberatoire })}>
            <span className="block font-medium">J’ai pris le versement libératoire</span>
            <span className="block text-[12.5px] opacity-80">Mon impôt est un pourcentage de mon chiffre d’affaires, payé avec mes cotisations.</span>
          </Reponse>
        </fieldset>
      ) : null}

      {etat.statut === "fonctionnaire" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] tracking-[0.14em] text-ligne">VOTRE VERSANT</legend>
          <div className="grid grid-cols-3 gap-2">
            {VERSANTS.map((v) => (
              <Reponse key={v.id} actif={etat.versant === v.id} onClick={() => changer({ versant: v.id })} centre>
                {v.libelle}
              </Reponse>
            ))}
          </div>
        </fieldset>
      ) : null}

      <button
        type="button"
        onClick={() => setFoyerOuvert(!foyerOuvert)}
        aria-expanded={foyerOuvert}
        className="flex items-center gap-2 self-start text-[14.5px] text-ligne underline underline-offset-[3px]"
      >
        {foyerOuvert ? "Mon foyer" : "+ Mon foyer, si ça change quelque chose"}
      </button>

      {foyerOuvert ? (
        <fieldset className="flex flex-col gap-2 border-l-2 border-papier/40 pl-3">
          <legend className="sr-only">Votre foyer</legend>
          <div className="flex flex-wrap gap-2">
            <Reponse actif={!etat.couple} onClick={() => changer({ couple: false })} centre>Seul</Reponse>
            <Reponse actif={etat.couple} onClick={() => changer({ couple: true })} centre>En couple</Reponse>
            <span className="mx-1 self-center font-mono text-[10px] text-ligne">ENFANTS</span>
            {[0, 1, 2, 3].map((n) => (
              <Reponse key={n} actif={etat.enfants === n} onClick={() => changer({ enfants: n })} centre>
                {n === 3 ? "3+" : String(n)}
              </Reponse>
            ))}
          </div>
          <p className="text-[12.5px] leading-snug text-ligne">Le quotient familial divise l’impôt, pas les cotisations.</p>
        </fieldset>
      ) : null}

      {regime && !calculable ? (
        <p className="border-l-2 border-rouge-clair pl-3 text-[13.5px] leading-relaxed text-papier-2">
          <span className="font-semibold">Le régime {NOMS_REGIME[regime]} n’est pas encore instruit.</span>{" "}
          Lui servir le barème d’un régime voisin donnerait un chiffre faux. On préfère le dire.
        </p>
      ) : null}
    </Carte>
  );
}
