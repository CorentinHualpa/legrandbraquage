"use client";

import { Carte, Chiffre, Commissaire, Kicker, Lien, Reponse, Volet } from "./Carte";
import type { NumeroPiece, Pieces } from "@/lib/images";
import { euros, eurosSigne } from "@/lib/format";
import { texte } from "@/lib/repliques";
import {
  ALCOOL,
  CARBURANT,
  HABITUDES,
  POSTES,
  TABAC,
  detailAccises,
  type Habitudes,
  type PosteHabitude,
  type Simulation,
} from "@/lib/moteur";

/**
 * Une question par page, comme sur une feuille de déposition : le
 * commissaire demande, on répond, il tourne la page. Les trois questions
 * empilées sur un seul écran donnaient un formulaire, pas un interrogatoire
 * (Coq, 08/09/2026 : « chaque question doit être comme sur une feuille de
 * déposition, et quand je clique ça tourne la page »).
 */
/**
 * L'ordre des questions, et donc l'ordre dans lequel le compteur monte. Il
 * vient du moteur : ajouter un poste là-bas l'ajoute ici, dans le total et
 * dans le compteur, sans qu'une liste oubliée ne le compte à moitié.
 */
const ORDRE = POSTES;

const ECRAN: Record<PosteHabitude, {
  piece: NumeroPiece;
  legende: string;
  avant: string | null;
  note: string;
}> = {
  tabac: {
    piece: 26,
    legende: "CLICHÉ 26 · C’EST OFFERT",
    avant: "Café ? Cadeau. Enfin, 1,20 €, dont onze centimes qui repartent chez eux. Vous les aviez déjà payés, remarquez.",
    note: "Taxes sur votre tabac",
  },
  carburant: {
    piece: 10,
    legende: "CLICHÉ 10 · LA POMPE, LA NUIT",
    avant: null,
    note: "Taxes sur vos pleins",
  },
  alcool: {
    piece: 8,
    legende: "CLICHÉ 08 · LA TABLE DES SCELLÉS",
    avant: null,
    note: "Taxes sur votre alcool",
  },
};

/**
 * Écrans 3 à 5 : les trois questions du café.
 *
 * ⚠ Le texte de ces écrans a été jugé « trop technique, pas assez RP » (Coq,
 * 08/09/2026). Règle pour la suite : à l'écran, on dit ce qui se passe (« ils
 * prennent leur part à chaque passage en caisse »), jamais le nom du
 * mécanisme. « TVA », « accises » et « taux d'effort » vivent dans le volet,
 * avec leurs sources, et nulle part ailleurs.
 */
export function Cafe({
  poste,
  pieces,
  simulation,
  habitudes,
  choisir,
  numero,
  total,
  suivant,
  retour,
  passer,
}: {
  poste: PosteHabitude;
  pieces: Pieces;
  simulation: Simulation;
  habitudes: Habitudes;
  choisir: (poste: PosteHabitude, id: string) => void;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
  /** Couper court aux questions restantes et filer à l'addition. */
  passer: () => void;
}) {
  const ecran = ECRAN[poste];
  const definition = HABITUDES[poste];
  const detail = detailAccises(habitudes);
  const parAnDuPoste = detail[poste];
  const rang = ORDRE.indexOf(poste);
  const dernier = rang === ORDRE.length - 1;

  const annee =
    simulation.carriere.annees.find((a) => a.age === simulation.entree.ageActuel)
    ?? simulation.carriere.annees[0];
  const parMois = annee.taxesConsommation / 12;
  const surLaCarriere = simulation.carriere.totaux.taxesConsommation;
  const accisesMois = (detail.tabac + detail.carburant + detail.alcool) / 12;

  /*
   * LE COMPTEUR NE COMPTE QUE CE QU'ON A DÉJÀ DEMANDÉ.
   *
   * `detailAccises` rend les trois postes d'un coup, et deux d'entre eux ont
   * une valeur PAR DÉFAUT (un plein par mois, une bouteille par semaine). Un
   * total qui les additionnerait tous dès la première carte afficherait donc
   * des taxes sur des réponses que personne n'a encore données, et le compteur
   * ne monterait plus : il baisserait, au gré des réponses. On somme jusqu'au
   * poste courant, et lui seul.
   */
  const releve = ORDRE.slice(0, rang + 1).reduce((s, p) => s + detail[p], 0);

  return (
    <Carte
      numero={numero}
      total={total}
      nature={`Le café · ${rang + 1} sur ${ORDRE.length}`}
      retour={retour}
      photo={{ numero: ecran.piece, pieces, hauteur: 230, legende: ecran.legende }}
      action={{ libelle: dernier ? "Voir l’addition" : "Question suivante", onClick: suivant }}
      /*
       * ⚠ On ne retient personne sur un interrogatoire FACULTATIF. Ces trois
       * questions affinent une estimation, elles ne conditionnent aucun autre
       * écran : quelqu'un qui ne veut pas dire ce qu'il boit doit pouvoir
       * avancer sans avoir l'impression de tricher. Le libellé nomme ce qui
       * suit (« l'addition ») plutôt que de s'excuser d'abandonner.
       */
      actionSecondaire={dernier ? undefined : { libelle: "Ça ira, passez à l’addition", onClick: passer }}
    >
      {/*
        LE COMPTEUR, tenu d'une carte à l'autre. Sans lui, on répondait sur la
        clope, la voiture et l'alcool sans savoir de quoi on parlait : le mot
        « taxe » n'existait que dans le volet replié, et le montant en kraft
        pouvait se lire comme ce qu'on DÉPENSE en cigarettes plutôt que comme
        ce qu'on paie dessus (Coq, 13/09/2026 : « c'est pas vraiment clair
        qu'on est en mode TVA »).
      */}
      <div className="flex items-baseline justify-between gap-3 border-y border-papier/15 py-1.5">
        <span className="font-mono text-[10px] tracking-[0.14em] text-ligne uppercase">
          Taxes relevées · {rang + 1} sur {ORDRE.length}
        </span>
        <span className="chiffres montant-anime font-mono text-[15px] leading-none font-semibold tracking-[-0.02em] text-jaune-police">
          {eurosSigne(releve)} <span className="text-[10.5px] font-normal text-ligne">par an</span>
        </span>
      </div>

      {/*
        La bulle porte exactement ce que la voix DIT, plus, pour le café, la
        phrase d'ouverture qui explique la photo. Voir la règle dans
        `src/lib/repliques.ts` : on peut lire plus qu'on n'entend, jamais
        l'inverse.
      */}
      <Commissaire>« {ecran.avant ? `${ecran.avant} ` : ""}{texte(poste)} »</Commissaire>

      {/*
        LE DÉCOR, une fois, sur la première carte. Il dit ce qui se passe sans
        nommer le mécanisme : « TVA » et « accises » restent dans le volet, avec
        leurs sources (règle du 08/09/2026, « trop technique, pas assez RP »).
        Le mot « taxes », lui, n'est pas du jargon : c'est le sujet.
      */}
      {rang === 0 ? (
        <p className="text-[14.5px] leading-relaxed text-papier-2">
          Sur tout ce que vous achetez, une part part en taxes avant vous. Elle ne figure sur aucune
          fiche de paie, et personne ne vous demande de signer. Trois questions, et on chiffre la
          vôtre.
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Kicker>{definition.question}</Kicker>
        <div className="flex flex-col gap-1.5" role="radiogroup" aria-label={definition.question}>
          {definition.choix.map((c) => (
            <Reponse key={c.id} actif={habitudes[poste] === c.id} onClick={() => choisir(poste, c.id)}>
              <span className="block text-[15.5px] leading-tight">{c.libelle}</span>
              <span className={`block text-[12.5px] leading-snug ${habitudes[poste] === c.id ? "text-encre-3" : "text-ligne"}`}>
                {c.pointe}
              </span>
            </Reponse>
          ))}
        </div>
      </div>

      {/* La note du PV, en kraft : ce qu'il écrit après votre réponse. */}
      <div className="flex flex-col gap-0.5 border-l-4 border-bleu bg-[#cdb98d] px-3.5 py-2.5 text-encre shadow-[0_12px_24px_rgba(0,0,0,0.45)]">
        <span className="font-mono text-[9.5px] tracking-[0.14em] text-[#5a4a2a] uppercase">{ecran.note}</span>
        <span className="chiffres montant-anime font-mono text-[26px] leading-none font-semibold tracking-[-0.03em] text-bleu">
          {eurosSigne(parAnDuPoste)} <span className="text-[13px] font-normal">par an</span>
        </span>
      </div>

      {dernier ? (
        <div className="flex flex-col gap-1">
          <Kicker couleur="rouge">Chaque mois, à la caisse, sans rien signer</Kicker>
          <Chiffre taille={44}>{eurosSigne(parMois)}</Chiffre>
          <p className="text-[14.5px] leading-relaxed text-ligne italic">
            Ils prennent leur part sur tout ce que vous achetez, du pain au plein d’essence, et vous ne
            voyez jamais passer la note. Sur une carrière, {eurosSigne(surLaCarriere)}.
          </p>
        </div>
      ) : null}

      <div className="grow" />

      <Volet titre="D’où sortent ces chiffres ?">
        <p className="text-[14px] leading-relaxed text-ligne">
          Sur tout ce que vous achetez, la TVA se cache dans le prix affiché. On ne connaît pas votre
          caddie : on applique à ce qu’il vous reste après impôt le taux d’effort moyen des gens qui
          vivent comme vous, mesuré par décile de niveau de vie. Ça fait{" "}
          <span className="font-medium text-papier">{euros(parMois - accisesMois)} €</span> par mois. Le
          café du commissaire, lui, est à 10 % : onze centimes sur 1,20 €.
        </p>
        <p className="text-[14px] leading-relaxed text-ligne">
          S’y ajoutent les taxes sur ce que vous venez de dire : un paquet à{" "}
          {TABAC.prixPaquet.toFixed(2).replace(".", ",")} € dont {Math.round(TABAC.partTaxes * 100)} % de
          taxes, soit <span className="font-medium text-papier">{detail.taxesParPaquet.toFixed(2).replace(".", ",")} €</span>{" "}
          par paquet ; un plein de {CARBURANT.litres} litres à{" "}
          {CARBURANT.prixPlein.toFixed(2).replace(".", ",")} € dont{" "}
          <span className="font-medium text-papier">{euros(detail.taxesParPlein)} €</span> de taxes ;
          l’alcool en ordre de grandeur, {ALCOOL.parfoisParAn} € par an pour une bouteille par semaine,{" "}
          {ALCOOL.chaqueSoirParAn} € pour un verre chaque soir.
        </p>
        <p className="text-[13px] leading-relaxed text-ligne">
          Ce sont des ESTIMATIONS, et l’alcool est celle qui l’assume le plus : le droit dépend du
          produit, un verre de vin n’est presque pas taxé, un verre de spiritueux beaucoup. {TABAC.source}.{" "}
          {CARBURANT.source}. {ALCOOL.source}.
        </p>
        <Lien href="/methode">La méthode, ligne par ligne</Lien>
      </Volet>
    </Carte>
  );
}
