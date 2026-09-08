"use client";

import { Carte, Commissaire, Kicker, Lien, Reponse, Volet } from "./Carte";
import type { Cadeau } from "@/lib/lien";
import type { Pieces } from "@/lib/images";
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
const REPLIQUE: Record<"partage" | "picotte", string> = {
  partage: "« Voilà un bon citoyen. On repasse le mois prochain, même heure. »",
  picotte: "« Ça picotte quarante-trois ans, oui. Après, on s’habitue. C’est prévu pour. »",
};

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
        L'annonce AVANT le dessin. Le dessin seul se lisait comme une
        illustration de fond de page : on ne comprenait pas qu'il montrait
        l'achat (Coq, 08/09/2026 : « il faudrait vraiment qu'on fasse
        comprendre VOILÀ CE QU'ILS SE SONT ACHETÉ »).
      */}
      <div className="-mx-5 -mt-16 flex flex-col gap-1 bg-jaune-police px-5 pt-16 pb-3 text-encre sm:-mx-6 sm:px-6">
        <span className="font-mono text-[10.5px] tracking-[0.16em] text-encre/65 uppercase">
          Scellé n° 1 · le butin
        </span>
        <p className="text-[20px] leading-tight font-bold">
          Voilà ce qu’ils se sont acheté avec vos{" "}
          <span className="chiffres font-mono tracking-[-0.02em] whitespace-nowrap">{eurosSigne(montant)}</span>.
        </p>
      </div>
      {/* Les rayures qui ferment le scellé, tendues d'un bord à l'autre. */}
      <div aria-hidden className="ruban -mx-5 -mt-4 h-[10px] sm:-mx-6" />

      <div className="relative -mx-5 h-[300px] overflow-hidden bg-papier sm:-mx-6">
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
            <>« Cash. Et il leur reste {eurosSigne(reste)} de monnaie. »</>
          ) : (
            <>« {objet.pointe} »</>
          )}
        </Commissaire>
        {/* La pointe du palier, sauf quand le commissaire vient de la dire. */}
        {objet.seuil > 0 && reste > 1000 ? (
          <p className="text-[15px] leading-relaxed text-papier-2 italic">{objet.pointe}</p>
        ) : null}
        {/*
          Les années de député ont sauté : un montant converti en carrière de
          quelqu'un d'autre n'apprend rien à personne (Coq, 08/09/2026 : « ce
          genre de trucs, on s'en fout »). Les années de SA vie restent : c'est
          la seule conversion qui parle de la personne devant l'écran.
        */}
        {montant >= SEUIL_ANNEES ? (
          <p className="text-[14.5px] leading-relaxed text-ligne">
            <span className="chiffres font-mono font-medium text-papier">{annees.toFixed(1).replace(".", ",")}</span> années de votre vie sans travailler, à votre niveau de vie.
          </p>
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
            <Reponse actif={cadeau === "partage"} onClick={() => repondreCadeau("partage")} teinte="vert">
              <span className="text-[15.5px]">Ça fait toujours plaisir de partager</span>
            </Reponse>
            <Reponse actif={cadeau === "picotte"} onClick={() => repondreCadeau("picotte")} teinte="rouge">
              <span className="text-[15.5px]">Ça picotte un peu</span>
            </Reponse>
          </div>
          {cadeau ? <Commissaire>{REPLIQUE[cadeau]}</Commissaire> : null}
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
