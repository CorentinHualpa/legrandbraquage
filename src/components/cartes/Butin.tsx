"use client";

import { Carte, Commissaire, Kicker, Lien, Reponse, Volet } from "./Carte";
import type { Cadeau } from "@/lib/lien";
import type { Pieces } from "@/lib/images";
import { dit, texte } from "@/lib/repliques";
import { reagir } from "@/lib/sons";
import { eurosSigne } from "@/lib/format";
import type { Simulation } from "@/lib/moteur";
import { SEUIL_ANNEES, anneesSansTravailler, objetPour } from "@/lib/objets";

/**
 * Écran 4 : le butin. Avec ça, ils se sont payé…
 *
 * Le dessin du butin en plein cadre, l'objet en gros, et le commissaire qui
 * compte la monnaie. Les sources des prix sont au clic.
 */
/**
 * Ce que le commissaire répond selon qu'on assume ou pas. La réponse ne
 * change aucun chiffre : elle est ressortie au verdict, où elle pèse plus
 * lourd que sur le moment.
 */
export function Butin({
  pieces,
  simulation,
  cadeau,
  repondreCadeau,
  numero,
  total,
  suivant,
  retour,
}: {
  pieces: Pieces;
  simulation: Simulation;
  cadeau: Cadeau;
  repondreCadeau: (reponse: Cadeau) => void;
  numero: number;
  total: number;
  suivant: () => void;
  retour: () => void;
}) {
  const montant = simulation.plateauGauche.total;
  const objet = objetPour(montant);
  const reste = montant - objet.seuil;
  const annees = anneesSansTravailler(montant, simulation.netApresImpotActuel);
  void pieces;

/*
   * ⚠ Il répond AU CLIC, pas au bouton suivant. Une réaction qui arrive une
   * carte plus tard n'est plus une réaction, c'est un commentaire.
   */
  const repondre = (c: "partage" | "picotte") => {
    repondreCadeau(c);
    reagir(`cadeau-${c}`);
  };

  return (
    <Carte
      numero={numero}
      total={total}
      nature="Le butin"
      retour={retour}
      action={{ libelle: "Suivant", onClick: suivant }}
      teteSurClair
    >
      {/*
        ⚠⚠ CETTE CARTE NE PRÉSENTE PAS UNE PIÈCE, elle en montre le PRIX.

        Elle ouvrait sur un bandeau jaune « SCELLÉ N° 1 · LE BUTIN » suivi du
        ruban rayé, exactement le chrome de la carte précédente, et le
        commissaire y disait « Voilà le butin » une carte après « Voilà la pièce
        à conviction ». Deux scellés d'affilée, deux fois le même geste : les
        deux écrans se lisaient comme le même écran (Coq, 14/09/2026 : « ces
        deux pages se répètent »). Ce n'est pas l'information qui doublonnait,
        c'est la mise en scène.

        Donc : plus de bandeau, plus de ruban, le dessin s'ouvre en plein cadre,
        et il ne dit plus « Voilà ». La carte d'avant accuse (combien, et d'où
        ça sort) ; celle-ci convertit, en objet et en années de vie.

        ⚠ LE MONTANT NE SE RÉÉCRIT PAS ICI. Il est en entier, en 44 px, sur la
        carte précédente : c'est le seul gros chiffre en euros du parcours, et
        le réécrire une carte plus loin fait lire un NOUVEAU chiffre, quelle que
        soit sa taille (Coq, 13/09/2026). Les années, elles, ne sont pas des
        euros : elles ne peuvent pas se confondre avec la somme.

        ⚠ Le 13/09 j'avais RAPETISSÉ le montant au lieu de l'enlever. Demi-mesure :
        le doublon était toujours là le lendemain, en plus petit.
      */}
      <div className="relative -mx-5 -mt-16 h-[340px] overflow-hidden bg-papier sm:-mx-6">
        {objet.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/images/butin/${objet.image}.webp`} alt={objet.nom} className="h-full w-full object-cover" decoding="async" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[10px] tracking-[0.12em] text-encre-3">LE BUTIN, EN DESSIN</span>
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(15,21,28,0) 0%, rgba(15,21,28,0) 45%, #0f151c 100%)" }}
        />
        <p className="absolute inset-x-5 bottom-3 text-[30px] leading-[1.05] font-bold tracking-[-0.02em] text-papier sm:inset-x-6">
          {objet.nom}.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Commissaire>
          {objet.seuil > 0 && reste > 1000 ? (
            <>« {texte("butin")} Cash, et il leur reste {eurosSigne(reste)} de monnaie. »</>
          ) : (
            <>« {texte("butin")} {objet.pointe} »</>
          )}
        </Commissaire>
        {/* La pointe du palier, sauf quand le commissaire vient de la dire. */}
        {objet.seuil > 0 && reste > 1000 ? (
          <p className="text-[15px] leading-relaxed text-papier-2 italic">{objet.pointe}</p>
        ) : null}
        {/*
          LE CHIFFRE DE CETTE CARTE, et c'est ce qui la distingue de la
          précédente : elle convertit, elle ne compte pas. Les années de député
          ont sauté (un montant converti en carrière de quelqu'un d'autre
          n'apprend rien à personne, Coq 08/09/2026) ; les années de SA vie
          restent, c'est la seule conversion qui parle de la personne devant
          l'écran, et depuis le 14/09 c'est elle qu'on lit en grand.

          ⚠ 34 px et pas 44 : le 44 px est réservé à l'accusation, une carte
          plus tôt. Des ANNÉES ne peuvent pas se confondre avec des euros, mais
          deux chiffres de même taille à une carte d'intervalle se liraient
          comme deux annonces de même rang.
        */}
        {montant >= SEUIL_ANNEES ? (
          <div className="flex flex-col gap-0.5 border-t border-papier/15 pt-3">
            <Kicker couleur="jaune">Ce que ça vous coûte, en temps</Kicker>
            <p className="text-[34px] leading-none font-bold tracking-[-0.02em] text-papier">
              <span className="chiffres font-mono">{annees.toFixed(1).replace(".", ",")}</span> années
            </p>
            <p className="text-[14.5px] leading-relaxed text-ligne">
              de votre vie sans travailler, à votre niveau de vie.
            </p>
          </div>
        ) : null}
        {/*
          La question du cadeau. Elle ne calcule rien : elle sert à ce que la
          personne prenne position, pour qu'on puisse la lui ressortir au
          verdict. Les deux réponses mènent au même écran (Coq, 08/09/2026 :
          « oui ou non, même topo »), seule la réplique change.
        */}
        <div className="flex flex-col gap-2 border-t border-papier/15 pt-3">
          <Kicker couleur="jaune">Content de votre cadeau ?</Kicker>
          <div className="flex flex-col gap-2">
            <Reponse actif={cadeau === "partage"} onClick={() => repondre("partage")} teinte="vert">
              <span className="text-[15.5px]">Ça fait toujours plaisir de partager</span>
            </Reponse>
            <Reponse actif={cadeau === "picotte"} onClick={() => repondre("picotte")} teinte="rouge">
              <span className="text-[15.5px]">Ça picotte un peu</span>
            </Reponse>
          </div>
          {cadeau ? <Commissaire>{dit(`cadeau-${cadeau}`)}</Commissaire> : null}
        </div>
      </div>

      <div className="grow" />

      <Volet titre="D’où viennent ces prix ?">
        <p className="text-[14px] leading-relaxed text-ligne">
          <span className="font-medium text-papier">{objet.nom}</span> : {objet.source}.
        </p>
        <Lien href="/methode">Toutes les sources</Lien>
      </Volet>
    </Carte>
  );
}
