"use client";

import { useEffect, useRef, useState } from "react";

import { EnTete, Feuille, Renvoi, Scelle, Tampon } from "./papier";
import type { Pieces } from "@/lib/images";
import type { Simulation } from "@/lib/moteur";

const HOTE = "https://dalevoz.revolutionagency.ai";
/* Le slug ne bouge pas : le widget publié en dépend. Le PERSONNAGE, lui, est
    devenu le commissaire (Coq, 08/09/2026 : « on va avoir un seul perso »).
    Son prompt vit dans `agent/commissaire.md`, à la racine du dépôt. */
const AGENT = "le-braqueur";

/**
 * L'audition : le commissaire répond.
 *
 * Le widget se monte UNE fois, dans le cadre du procès-verbal, en mode
 * « embed » : il n'y a pas de pastille flottante à découvrir en bas d'écran,
 * la conversation fait partie de la pièce. C'est l'implémentation de référence
 * de la plateforme, on porte son mécanisme plutôt que d'en réécrire un.
 *
 * ⚠ CE COMMENTAIRE DISAIT L'INVERSE JUSQU'AU 08/09/2026, et c'était vrai à
 * l'époque : le widget ne transportait AUCUN contexte. La plateforme a gagné
 * `window.dalevoz.contexte()` depuis, et `Parcours.tsx` l'appelle à chaque
 * changement d'écran. Le commissaire a donc le dossier sous les yeux, et son
 * prompt lui interdit de redemander ce qu'il a déjà.
 *
 * Ce qui reste vrai : `data-greeting` est ignoré dès que l'agent a un accueil
 * configuré, c'est celui du serveur qui s'affiche. Et il ne CHIFFRE rien tant
 * que le salaire manque du dossier, parce que la balance penche des deux côtés
 * et qu'annoncer un sens avant de le connaître serait faux une fois sur deux.
 */
export function Audition({
  pieces,
  simulation,
  ouvrirAudition,
}: {
  pieces: Pieces;
  simulation: Simulation;
  /** Fait descendre jusqu'au cadre, sinon le widget se monte hors de l'écran. */
  ouvrirAudition: () => void;
}) {
  const [ouverte, setOuverte] = useState(false);
  const monte = useRef(false);
  const { verdict } = simulation;

  const cle = process.env.NEXT_PUBLIC_DALEVOZ_KEY;

  useEffect(() => {
    if (!ouverte || monte.current || !cle) return;
    monte.current = true;

    // Un identifiant par navigateur, jamais partagé : la mémoire d'un agent
    // s'accroche à cet identifiant, et deux personnes qui ouvriraient le même
    // lien avec le même se répéteraient mutuellement leurs confidences.
    let uid = "";
    try {
      uid = window.localStorage.getItem("lgb.uid") ?? "";
      if (!uid) {
        uid = crypto.randomUUID();
        window.localStorage.setItem("lgb.uid", uid);
      }
    } catch {
      uid = crypto.randomUUID();
    }

    const script = document.createElement("script");
    script.src = `${HOTE}/dalevoz-widget.js`;
    script.async = true;
    script.setAttribute("data-agent", AGENT);
    script.setAttribute("data-key", cle);
    script.setAttribute("data-host", HOTE);
    script.setAttribute("data-locale", "fr");
    script.setAttribute("data-mode", "embed");
    script.setAttribute("data-target", "#audition-cadre");
    script.setAttribute("data-uid", uid);
    script.setAttribute("data-title", "Le commissaire");
    document.body.appendChild(script);
  }, [ouverte, cle]);

  return (
    <Feuille id="audition" className="mt-10 border-t-2 border-dashed border-ligne pt-2">
      <EnTete
        nature="PROCÈS-VERBAL D’AUDITION"
        titre="Le commissaire vous reçoit"
        tampon={<Tampon>SUR RENDEZ-VOUS</Tampon>}
      />

      <div className="flex items-center gap-3 border border-ligne bg-papier-2 p-3">
        <div className="w-[52px] shrink-0">
          <Scelle
            numero={13}
            nom="Portrait"
            ratio="3:4"
            fichier={pieces[13]}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9.5px] tracking-[0.12em] text-encre-3">
            POLICE DES PRÉLÈVEMENTS
          </span>
          <span className="text-[17px] font-bold">Le commissaire</span>
          <span className="text-[13px] text-encre-2 italic">
            A tout vu. Ne s’indigne plus.
          </span>
        </div>
      </div>

      <p className="text-[14.5px] leading-relaxed">
        Il reprend le procès-verbal ligne par ligne, il détaille la méthode, et
        il argumente dans les deux sens. Il ne ment jamais sur un chiffre :
        quand le dossier ne contient pas la pièce, il le dit au lieu d’inventer.
      </p>

      <p className="text-[13.5px] leading-relaxed text-encre-2">
        Il a votre procès-verbal sous les yeux : votre net mensuel, votre
        statut, ce qui vous a été pris, et votre verdict, qui est de{" "}
        <span className="font-semibold text-encre">
          {verdict.braquage ? "braquage" : "relaxe"}
        </span>
        . Ne les lui redonnez pas, demandez-lui pourquoi.
      </p>

      {!cle ? (
        <p className="border-l-[3px] border-rouge bg-papier-3 px-3 py-3 text-[13.5px] leading-relaxed">
          <span className="font-semibold">L’audition n’est pas branchée ici.</span>{" "}
          La clé publiable manque dans l’environnement. Sur le déploiement, poser
          la variable <span className="font-mono text-[12.5px]">NEXT_PUBLIC_DALEVOZ_KEY</span>{" "}
          avant de construire : elle est incorporée à la compilation, pas lue au
          démarrage.
        </p>
      ) : !ouverte ? (
        <button
          type="button"
          onClick={() => {
            setOuverte(true);
            ouvrirAudition();
          }}
          className="bg-encre px-4 py-3.5 text-center text-[16px] font-semibold text-papier transition-colors hover:bg-bleu"
        >
          Parler au commissaire
        </button>
      ) : null}

      {/* Le cadre où le widget se monte. Il garde sa place avant l'ouverture. */}
      <div
        id="audition-cadre"
        className={`${ouverte ? "min-h-[520px]" : "hidden"} scroll-mt-4 border-2 border-encre bg-papier-2`}
      />

      <Renvoi>
        Personnage de fiction. Il ne parle au nom de personne, ne commente
        aucune actualité et ne dit à personne pour qui voter. Chaque chiffre
        qu’il cite renvoie à sa source, et il n’a aucun moyen d’enregistrer quoi
        que ce soit sur vous.
      </Renvoi>
    </Feuille>
  );
}
