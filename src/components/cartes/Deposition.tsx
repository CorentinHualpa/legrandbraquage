"use client";

import { useEffect, useRef, useState } from "react";

import { Carte, Commissaire, Kicker, Papier, Reponse } from "./Carte";
import type { Pieces } from "@/lib/images";
import { euros } from "@/lib/format";
import { dit } from "@/lib/repliques";
import { frapper, jouer } from "@/lib/sons";
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

/**
 * Trois montants pour démarrer quand on ne connaît pas son net par cœur :
 * SMIC 2026 (1 867,02 € brut), médian INSEE 2024 net avant impôt, et un
 * repère rond de cadre. Ce sont les mêmes que le mur de l'avis de recherche.
 */
const REPERES = [
  { net: 1478, libelle: "SMIC" },
  { net: 2190, libelle: "Médian" },
  { net: 5000, libelle: "5 000" },
];

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
  reagirAuMontant,
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
  /** Le commissaire commente le montant saisi. Appelé quand la frappe s'arrête. */
  reagirAuMontant: () => void;
  retour: () => void;
  numero: number;
  total: number;
}) {
  const [foyerOuvert, setFoyerOuvert] = useState(false);

  /**
   * IL COMMENTE LE MONTANT QUAND LA FRAPPE S'ARRÊTE, pas au clic sur signer.
   *
   * Une seconde et demie : assez pour ne pas réagir entre deux chiffres d'un
   * même nombre (« 2 », « 21 », « 219 »… donneraient quatre réactions dont
   * trois sur des montants qui n'existent pas), assez peu pour que ça reste lié
   * au geste. Le même arbitrage que la frappe du greffier, en plus long, parce
   * qu'ici c'est une PHRASE qui part et qu'on ne peut pas la reprendre.
   *
   * ⚠ La fonction est lue dans une ref au moment où la minuterie tombe, jamais
   * celle capturée à l'armement : le montant vient de changer, donc la version
   * capturée classerait la personne sur l'avant-dernière frappe.
   */
  const derniereReaction = useRef(reagirAuMontant);
  // Dans un effet, pas pendant le rendu : React interdit d'écrire une ref au
  // milieu d'un rendu, qui peut être rejoué ou abandonné.
  useEffect(() => {
    derniereReaction.current = reagirAuMontant;
  });
  const minuterieMontant = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commenterBientot = () => {
    if (minuterieMontant.current) clearTimeout(minuterieMontant.current);
    minuterieMontant.current = setTimeout(() => {
      /*
       * ⚠ On OUBLIE la minuterie en partant. Sans cette ligne, l'identifiant
       * périmé reste dans la ref, le démontage de la carte croit qu'une
       * réaction attend encore et la rejoue : on entendait la même phrase deux
       * fois, une fois à la frappe et une fois au clic sur « Signer ».
       */
      minuterieMontant.current = null;
      derniereReaction.current();
    }, 1_500);
  };
  /*
   * ⚠ En quittant la carte, une réaction EN ATTENTE est jouée au lieu d'être
   * jetée. Le cas courant est justement celui-là : on tape le montant et on
   * clique « Signer » dans la foulée, donc en moins d'une seconde et demie. La
   * réaction au salaire, qui est le seul moment où il commente ce qu'on vient
   * d'écrire, disparaissait précisément quand on va vite.
   */
  useEffect(() => () => {
    if (!minuterieMontant.current) return;
    clearTimeout(minuterieMontant.current);
    minuterieMontant.current = null;
    derniereReaction.current();
  }, []);
  /*
   * Le champ est GROUPÉ au repos (« 2 190 ») et BRUT pendant la saisie
   * (« 2190 »). Reformater à chaque frappe faisait sauter le curseur dès
   * qu'on corrigeait au milieu, et l'espace insécable se mangeait au retour
   * arrière sans que rien ne bouge à l'écran (Coq, 08/09/2026 : « pour
   * rentrer le chiffre au début ça bug, c'est mal designé »).
   */
  const [saisie, setSaisie] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  /* Tant que la ligne est vide, elle bat, et rien d'autre ne peut se faire. */
  const vide = !(etat.netMensuel > 0);
  const ouLire = OU_LIRE_SON_NET[regime ?? "salarie"];
  const micro = etat.statut === "independant" && etat.activite === "micro";
  const pret = calculable && etat.netMensuel > 0;

  /*
   * Le clavier s'ouvre tout seul sur la ligne à remplir : c'est la seule
   * chose à faire sur cet écran, et sur téléphone ça évite une visée.
   * `preventScroll` garde la photo du commissariat à l'écran.
   */
  useEffect(() => {
    if (vide) champ.current?.focus({ preventScroll: true });
    // Au montage seulement : re-focaliser à chaque frappe volerait le curseur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Carte
      numero={numero}
      total={total}
      nature="Déposition"
      retour={retour}
      photo={{ numero: 18, pieces, hauteur: 250, legende: "CLICHÉ 18 · LE COMMISSARIAT, 23 H 40" }}
      action={{
        libelle: vide ? "Le montant, d’abord" : "Signer la déposition",
        onClick: signer,
        disabled: !pret,
      }}
    >
      <Commissaire>
        {vide ? (
          <>{dit("deposition")}</>
        ) : (
          <>« Voilà. {euros(etat.netMensuel)} € par mois. On va pouvoir travailler. »</>
        )}
      </Commissaire>

      <Papier rotation={0.6} className="flex flex-col gap-1.5 px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <Kicker couleur="encre">Procès-verbal de déposition · ligne 1</Kicker>
          {vide ? (
            <span className="font-mono text-[9.5px] tracking-[0.14em] text-rouge-texte uppercase">À remplir</span>
          ) : null}
        </div>
        {/*
          L'unité vit SOUS la ligne, plus à côté : posée dans la même rangée,
          elle finissait par-dessus les chiffres dès que le montant s'allongeait.
        */}
        <div className={`relative border-b-[2px] pb-1 ${vide ? "ligne-a-remplir border-rouge" : "border-encre"}`}>
          <input
            ref={champ}
            id="net"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={saisie ? (etat.netMensuel > 0 ? String(etat.netMensuel) : "") : (etat.netMensuel > 0 ? euros(etat.netMensuel) : "")}
            onFocus={() => setSaisie(true)}
            onBlur={() => setSaisie(false)}
            onChange={(e) => {
              /*
               * Sept chiffres suffisent : au-delà, c'est une faute de frappe.
               *
               * ⚠ `\D` et pas `[^d]`. L'antislash avait sauté (commit 83b46a4),
               * et la classe voulait alors dire « tout sauf la lettre d » : le
               * champ effaçait donc chaque chiffre tapé et restait bloqué à
               * zéro, sur l'écran qui ouvre tout le parcours. Rien ne le
               * signalait, ni le typecheck ni le build, et le champ avait l'air
               * parfaitement normal.
               */
              const chiffres = e.target.value.replace(/\D/g, "").slice(0, 7);
              const nouveau = chiffres === "" ? 0 : Number(chiffres);
              // La machine ne frappe qu'à l'écriture : au retour arrière, rien.
              if (String(nouveau).length > String(etat.netMensuel).length) jouer("machine");
              /*
               * Et le greffier saisit ce qu'on vient de déclarer. Différé et
               * regroupé (cf. `frapper`) : une rafale APRÈS la dernière touche,
               * jamais une frappe qui suit le doigt.
               */
              frapper("long");
              changer({ netMensuel: nouveau });
              if (nouveau > 0) commenterBientot();
            }}
            aria-label={ouLire.label}
            aria-describedby="net-aide"
            className="chiffres w-full min-w-0 bg-transparent font-mono text-[46px] leading-none font-semibold tracking-[-0.03em] text-encre caret-rouge outline-none placeholder:text-cadre-bord"
            placeholder="0 000"
          />
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
          <span className="font-mono text-[11px] tracking-[0.1em] whitespace-nowrap text-encre-3">
            {micro ? "€ DE CHIFFRE D’AFFAIRES PAR MOIS" : "€ NET PAR MOIS, AVANT IMPÔT"}
          </span>
          {vide ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[9.5px] tracking-[0.12em] text-encre-3 uppercase">Au pif</span>
              {REPERES.map((r) => (
                <button
                  key={r.net}
                  type="button"
                  onClick={() => {
                    changer({ netMensuel: r.net });
                    champ.current?.focus({ preventScroll: true });
                  }}
                  className="border border-encre-3/60 px-2 py-[3px] font-mono text-[11px] text-encre-2 transition-colors hover:bg-encre hover:text-papier"
                >
                  {r.libelle}
                </button>
              ))}
            </div>
          ) : null}
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
