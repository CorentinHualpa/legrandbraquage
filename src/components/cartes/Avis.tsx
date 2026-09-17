"use client";

import { useMemo, useState } from "react";

import { Carte, Commissaire, Kicker, Volet } from "./Carte";
import { taux } from "./Bourse";
import { ETIQUETTES_PLACEMENT as ETIQUETTES } from "@/lib/placements";
import { Audition } from "../Audition";
import { CarteAvis } from "../CarteAvis";
import type { Pieces } from "@/lib/images";
import { dit } from "@/lib/repliques";
import { euros, eurosSigne } from "@/lib/format";
import { requeteDuCas, type Cas } from "@/lib/lien";
import { CRANS_FRAIS, CRANS_RENDEMENT, simuler, type Simulation } from "@/lib/moteur";
import { objetDuSolde } from "@/lib/une";
import { mesurer } from "@/lib/mesure";
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
  const { plateauGauche, plateauDroit, verdict } = simulation;
  const cran = CRANS_RENDEMENT.find((c) => c.id === cas.placementId) ?? CRANS_RENDEMENT[0];

  const objet = objetDuSolde(verdict.solde, simulation.netApresImpotActuel, verdict.issue);

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
        /*
         * ⚠ LES HABITUDES AUSSI. Le titre promet « mêmes réponses », et les six
         * réponses sur la consommation manquaient : la brève du salaire médian
         * affichait 967 729 € quand la personne, au même salaire médian, lisait
         * 989 940 € trois centimètres plus haut, sur le même écran. L'écart
         * valait exactement ses accises, 517 € par an sur 43 ans.
         */
        habitudes: cas.habitudes,
        placement: { rendementReel: cran.reel, fraisAnnuels: frais.annuels, fraisVersement: frais.versement },
      });
      return {
        ...m,
        pris: s.plateauGauche.total,
        rendu: s.plateauDroit.total,
        solde: s.verdict.solde,
        issue: s.verdict.issue,
      };
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

  /*
   * ⚠ La phrase partagée annonçait le SCÉNARIO du placement (« placé en S&P 500,
   * mon argent aurait fait plus… ») en le présentant comme « chiffré sur les
   * barèmes officiels » : les barèmes sont officiels, le placement est une
   * hypothèse, et les deux se retrouvaient dans la même phrase. Elle annonce
   * maintenant les deux plateaux, qui eux sont calculés. Et elle TUTOYAIT dans
   * sa branche relaxe, sur le message qui circule le plus loin.
   */
  const texte = `Sur ma carrière : pris ${euros(plateauGauche.total)} €, rendu ${euros(plateauDroit.total)} €.${
    verdict.issue === "coupable"
      ? " Le calcul est public, vérifiez le vôtre."
      : verdict.issue === "relaxe"
        ? " Oui, dans ce sens-là. Vérifiez le vôtre."
        : " Match nul. Vérifiez le vôtre."
  }`;

  /*
   * DEUX RÉSEAUX EN CLAIR, À CÔTÉ DU PARTAGE DU SYSTÈME.
   *
   * Le bouton « Partager » passe par `navigator.share` : sur téléphone il ouvre
   * la feuille du système, qui contient déjà WhatsApp, LinkedIn et Instagram.
   * Mais `navigator.share` N'EXISTE PAS sur la plupart des navigateurs de
   * bureau (vérifié : absent sur Chromium/Windows), donc là il se contente de
   * copier le lien, et rien à l'écran ne dit vers quoi on peut partager.
   *
   * ⚠ Les deux réseaux ne prennent PAS la même chose, et les traiter pareil
   * fait perdre la phrase du verdict :
   *   - WhatsApp n'a qu'un champ, `text` : on y met la phrase ET le lien ;
   *   - LinkedIn IGNORE tout texte pré-rempli depuis 2023 (`title`, `summary`
   *     et `text` sont sans effet sur `share-offsite`), il ne lit que `url`.
   *     C'est l'aperçu du lien qui doit porter le message, et c'est déjà le
   *     travail de `/api/avis`.
   *
   * Instagram n'a AUCUN partage de lien depuis le web : le seul chemin est
   * l'image, et il est déjà là, juste en dessous.
   */
  const versWhatsapp = lien ? `https://wa.me/?text=${encodeURIComponent(`${texte}\n${lien}`)}` : "";
  const versLinkedin = lien
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(lien)}`
    : "";

  async function partager() {
    if (!lien) return;
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
      /*
       * ⚠ CE BOUTON N’EFFACE RIEN, et son ancien nom « Refaire la déposition »
       * promettait l’inverse. Il ramène à la déposition en GARDANT le montant,
       * le statut, les paliers, l’enveloppe et le cadeau : c’est le geste utile
       * (on vient changer un chiffre, pas tout reprendre). Le vrai « tout
       * effacer » est le bouton de l’en-tête, en deux temps, et les deux se
       * ressemblaient assez pour qu’on clique le mauvais. Renommé le 10/09/2026.
       */
      actionSecondaire={{ libelle: "Modifier ma déposition", onClick: recommencer }}
      pied={
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <a
              href={versWhatsapp}
              target="_blank"
              rel="noopener"
              className="flex flex-1 items-center justify-center border border-papier/30 px-4 py-2.5 text-center text-[14.5px] text-papier-2 transition-colors hover:bg-papier/10"
            >
              WhatsApp
            </a>
            <a
              href={versLinkedin}
              target="_blank"
              rel="noopener"
              className="flex flex-1 items-center justify-center border border-papier/30 px-4 py-2.5 text-center text-[14.5px] text-papier-2 transition-colors hover:bg-papier/10"
            >
              LinkedIn
            </a>
          </div>
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
            <a href="/methode" target="_blank" rel="noreferrer" className="underline underline-offset-2">Comment c’est calculé.</a>
          </p>
        </div>
      }
    >
      <div className="-mt-6 -rotate-[1.5deg]">
        <CarteAvis
          preleve={plateauGauche.total}
          placement={`${ETIQUETTES[cran.id] ?? cran.nom} à ${taux(cran.reel)}`}
          capital={verdict.scenario?.capital ?? plateauGauche.total}
          recu={plateauDroit.total}
          solde={verdict.solde}
          ecartPlace={verdict.scenario?.ecart ?? plateauGauche.total - plateauDroit.total}
          issue={verdict.issue}
          objetTitre={objet.titre}
          objet={objet.texte}
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
              {/*
                ⚠ Les deux montants arrivaient nus, l'un sous l'autre, sans dire
                lequel est le vol et lequel est l'écart : « 483 831 € / RELAXE ·
                300 629 € » ne se déchiffre pas. Et « relaxe » est un mot de
                prétoire, pas un mot de tous les jours : il est doublé de ce
                qu'il veut dire ici.
              */}
              <span className="border-b border-cadre-bord pb-0.5 font-mono text-[7.5px] tracking-[0.12em] text-encre-3 uppercase">{m.nom}</span>
              <span className="font-mono text-[7px] tracking-[0.1em] text-encre-3 uppercase">Pris</span>
              <span className="chiffres font-mono text-[12px] leading-none font-semibold text-rouge-texte">{euros(m.pris)} €</span>
              <span className="font-mono text-[7px] tracking-[0.1em] text-encre-3 uppercase">Rendu</span>
              <span className="chiffres font-mono text-[12px] leading-none font-semibold text-vert">{euros(m.rendu)} €</span>
              <span
                className={`font-mono text-[7.5px] leading-tight tracking-[0.1em] ${m.issue === "coupable" ? "text-rouge-texte" : m.issue === "relaxe" ? "text-vert" : "text-encre-2"}`}
              >
                {m.issue === "coupable" ? "COUPABLE" : m.issue === "relaxe" ? "RELAXE" : "NON-LIEU"}
              </span>
              <span className="text-[9.5px] leading-tight text-encre-2">
                {m.solde < 0
                  ? <>il reste {eurosSigne(Math.abs(m.solde))} à sa charge</>
                  : <>reçoit {eurosSigne(m.solde)} de plus qu’on ne lui prend</>}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Commissaire qui="Le commissaire, chapeau à la main">{dit("avis")}</Commissaire>

      <div className="grow" />

      <Volet titre="Parler au commissaire">
        <div className="-mx-5 bg-papier text-encre sm:-mx-6">
          <Audition pieces={pieces} simulation={simulation} ouvrirAudition={() => {}} />
        </div>
      </Volet>

      {/*
        ⚠ LA SIGNATURE, ENFIN. Le parcours entier ne nommait ni Revolution
        Agency ni Dale Voz, et aucun écran ne menait aux coulisses : sur sept
        jours, la page a été vue 198 fois et /coulisses UNE fois, par le seul
        chemin qui existait, une réponse du commissaire. Un dossier qui sert de
        démonstration doit dire de quoi il est la démonstration, à l'endroit où
        la personne vient de voir ce qu'il sait faire.
      */}
      <div className="border-t border-ligne/30 pt-4">
        <p className="font-mono text-[10px] tracking-[0.12em] text-ligne uppercase">
          Ce dossier est une démonstration
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-papier-2">
          Le commissaire qui vous répond, ce parcours, sa bande son, ses images et sa voix ont été
          fabriqués par <span className="font-semibold text-papier">Revolution Agency</span>. C’est
          ce que nous montons pour nos clients, sur leur site et sur leurs messageries.
        </p>
        {/*
          Le contact passe AVANT la curiosité (Coq, 17/09/2026) : le site est une
          vitrine, et le bouton qui mène à l'offre est le seul qui rapporte. Il
          est plein, en premier, et compté à part : les deux clics portaient le
          même nom d'étape, donc personne ne savait combien partaient vers l'offre.
          Lien direct vers /offre : /precios n'est plus qu'une redirection.
        */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <a
            href="https://dalevoz.revolutionagency.ai/offre?utm_source=braquage&utm_medium=une&utm_campaign=offre"
            target="_blank"
            rel="noopener"
            onClick={() => mesurer("vers-offre")}
            className="flex-1 bg-papier px-4 py-2.5 text-center text-[14.5px] font-semibold text-encre transition-colors hover:bg-papier-2"
          >
            Construire mon agent →
          </a>
          <a
            href="/coulisses"
            onClick={() => mesurer("vers-coulisses")}
            className="flex-1 border border-papier/30 px-4 py-2.5 text-center text-[14.5px] text-papier-2 transition-colors hover:bg-papier/10"
          >
            Comment c’est fait
          </a>
        </div>
      </div>
    </Carte>
  );
}
