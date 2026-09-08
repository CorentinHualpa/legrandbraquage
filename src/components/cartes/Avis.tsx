"use client";

import { useMemo, useState } from "react";

import { Carte, Commissaire, Kicker, Volet } from "./Carte";
import { taux } from "./Bourse";
import { ETIQUETTES_PLACEMENT as ETIQUETTES } from "@/lib/placements";
import { Audition } from "../Audition";
import { CarteAvis } from "../CarteAvis";
import type { Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
import { requeteDuCas, type Cas } from "@/lib/lien";
import { CRANS_FRAIS, CRANS_RENDEMENT, simuler, type Simulation } from "@/lib/moteur";
import { SEUIL_ANNEES, anneesSansTravailler, objetPour } from "@/lib/objets";
import { partsFiscales } from "@/lib/statuts";

/**
 * Les trois avis déjà collés sur le mur : le SMIC, le médian, le cadre.
 * Ils donnent l'échelle sans une ligne d'explication. Le net du SMIC est le
 * net mensuel 2026 du SMIC de juin (1 867,02 € brut), le médian est celui de
 * l'INSEE (2024, net avant impôt), le cadre est un repère rond.
 */
const MUR = [
  { id: "smic", nom: "Au SMIC", net: 1478 },
  { id: "median", nom: "Au salaire médian", net: 2190 },
  { id: "cadre", nom: "Cadre à 5 000 €", net: 5000 },
];

/**
 * Écran 15 : l'avis de recherche, collé sur le mur, à côté des autres.
 *
 * Le lien rouvre CE dossier, réponses et enveloppe comprises, sur l'écran du
 * verdict. Le commissaire répond ici, au clic, puis il raccompagne.
 */
export function Avis({
  pieces,
  simulation,
  cas,
  numero,
  total,
  retour,
  recommencer,
}: {
  pieces: Pieces;
  simulation: Simulation;
  cas: Cas;
  numero: number;
  total: number;
  retour: () => void;
  recommencer: () => void;
}) {
  const [copie, setCopie] = useState(false);
  const { plateauGauche, plateauDroit, verdict, opportunite } = simulation;
  const cran = CRANS_RENDEMENT.find((c) => c.id === cas.placementId) ?? CRANS_RENDEMENT[0];

  const annees = anneesSansTravailler(plateauGauche.total, simulation.netApresImpotActuel);
  const objet =
    plateauGauche.total >= SEUIL_ANNEES
      ? `${annees.toFixed(1).replace(".", ",")} années de vie sans travailler`
      : objetPour(plateauGauche.total).nom;

  /*
   * Le mur : les trois cas types, avec LES MÊMES réponses et LA MÊME
   * enveloppe que la personne, en salarié du privé. Sinon on comparerait
   * son procès à trois autres procès.
   */
  const mur = useMemo(() => {
    const frais = CRANS_FRAIS.find((f) => f.id === cas.fraisId) ?? CRANS_FRAIS[0];
    return MUR.map((m) => {
      const s = simuler({
        netMensuel: m.net,
        statut: "salarie",
        parts: partsFiscales(cas.couple, cas.enfants),
        couple: cas.couple,
        perimetre: cas.perimetre,
        paliers: cas.paliers,
        placement: { rendementReel: cran.reel, fraisAnnuels: frais.annuels, fraisVersement: frais.versement },
      });
      return { ...m, pris: s.plateauGauche.total, braquage: s.verdict.braquage, ecart: s.verdict.ecart };
    });
  }, [cas, cran]);

  const requete = requeteDuCas(cas);
  const lien =
    typeof window === "undefined" ? "" : `${window.location.origin}/${requete}#verdict`;
  /*
   * L'image, pour les endroits où un lien ne sert à rien : Instagram et TikTok
   * n'affichent aucun aperçu et ne rendent pas les liens cliquables. On ouvre
   * le PNG dans un onglet plutôt que de forcer un téléchargement : sur iOS
   * l'attribut `download` ne fait rien, alors qu'un appui long sur l'image
   * enregistre dans la pellicule.
   */
  const image = `/api/avis${requete}`;

  async function partager() {
    if (!lien) return;
    const texte = verdict.braquage
      ? `Placé en ${cran.nom}, mon argent aurait fait plus que ce qu’ils m’auront rendu. Chiffré sur les barèmes officiels.`
      : `Placé en ${cran.nom}, mon argent aurait fait moins que ce qu’ils m’auront rendu. Vérifie le tien.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Le Grand Braquage", text: texte, url: lien });
        return;
      }
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 3000);
    } catch {
      // Partage refusé ou annulé : rien à signaler, la carte reste à l'écran.
    }
  }

  return (
    <Carte
      numero={numero}
      total={total}
      nature="L’édition de demain"
      retour={retour}
      photo={{ numero: 6, pieces, hauteur: 220 }}
      action={{ libelle: copie ? "Lien copié" : "Partager", onClick: partager }}
      actionSecondaire={{ libelle: "Refaire la déposition", onClick: recommencer }}
      pied={
        <div className="flex flex-col gap-2">
          <a
            href={image}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center border border-papier/30 px-4 py-2.5 text-center text-[14.5px] text-papier-2 transition-colors hover:bg-papier/10"
          >
            Enregistrer la une en image
            <span className="ml-2 font-mono text-[10px] tracking-[0.12em] text-ligne uppercase">Pour Instagram</span>
          </a>
          <p className="text-center text-[12.5px] text-ligne">
            Le lien porte votre salaire, votre statut, vos réponses et votre enveloppe, rien d’autre.{" "}
            <a href="/methode" className="underline underline-offset-2">Comment c’est calculé.</a>
          </p>
        </div>
      }
    >
      <div className="-mt-6 -rotate-[1.5deg]">
        <CarteAvis
          preleve={plateauGauche.total}
          placement={`${ETIQUETTES[cran.id] ?? cran.nom} à ${taux(cran.reel)}`}
          capital={opportunite?.capital ?? plateauGauche.total}
          recu={plateauDroit.total}
          ecart={verdict.ecart}
          braquage={verdict.braquage}
          objet={objet}
          portrait={pieces[13]}
        />
      </div>

      {/* Les brèves de la même page : trois autres cas, mêmes réponses. */}
      <div className="flex flex-col gap-2">
        <Kicker>Dans la même affaire · mêmes réponses, même enveloppe</Kicker>
        <div className="grid grid-cols-3 gap-2">
          {mur.map((m, i) => (
            <div
              key={m.id}
              className="flex flex-col gap-1 bg-[#ece5d5] px-2 py-2 text-encre shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              style={{ transform: `rotate(${[-2, 1.5, -1][i]}deg)` }}
            >
              <span className="border-b border-cadre-bord pb-0.5 font-mono text-[7.5px] tracking-[0.12em] text-encre-3 uppercase">En bref</span>
              <span className="text-[12px] leading-tight font-semibold">{m.nom}</span>
              <span className="chiffres font-mono text-[12px] leading-none font-semibold text-rouge-texte">{euros(m.pris)} €</span>
              <span className={`font-mono text-[7.5px] tracking-[0.1em] ${m.braquage ? "text-rouge-texte" : "text-bleu"}`}>
                {m.braquage ? "COUPABLE" : "RELAXE"} · {eurosSigne(m.ecart)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Commissaire qui="Le commissaire, chapeau à la main">
        « Si vous voulez porter plainte pour de vrai, c’est pas ici. C’est tous les cinq ans, même guichet. »
      </Commissaire>

      <div className="grow" />

      <Volet titre="Parler au commissaire">
        <div className="-mx-5 bg-papier text-encre sm:-mx-6">
          <Audition pieces={pieces} simulation={simulation} ouvrirAudition={() => {}} />
        </div>
      </Volet>
    </Carte>
  );
}
