import type { Metadata } from "next";
import Link from "next/link";

import { EnTete, Feuille, PiecesVersees, Renvoi, Tampon } from "@/components/papier";
import { etatDuSavoir } from "@/lib/savoir";

export const metadata: Metadata = {
  title: "Les coulisses",
  description:
    "Le commissaire est un agent conversationnel. Ce qu'il est, ce qui l'empêche d'inventer, et comment en avoir un qui parle de votre métier.",
};

const DALEVOZ = "https://dalevoz.revolutionagency.ai";

/**
 * LA PAGE OÙ LE COMMISSAIRE DIT CE QU'IL EST.
 *
 * Elle existe parce qu'une question revient dès qu'on a parlé deux minutes au
 * commissaire : « c'est quoi ce truc, je peux avoir le même ? ». Jusqu'ici il
 * n'y avait rien à répondre que le nom d'une agence.
 *
 * ── Pourquoi ICI et pas un lien vers le site de l'agence ────────────────────
 *
 * Trois raisons, et la première est une règle du dossier : un lien qui SORT du
 * parcours fait perdre la déposition en cours, ce qui a déjà été signalé une
 * fois. On reste donc sur le même domaine, et le lien vers Dale Voz s'ouvre
 * dans un onglet neuf.
 *
 * La deuxième : revolutionagency.ai redirige vers `/en`. Un visiteur français
 * qui vient de lire un dossier écrit dans cette langue-là atterrirait sur une
 * page corporate en anglais.
 *
 * La troisième est la vraie : l'argument de vente n'est pas une plaquette,
 * c'est ce que la personne vient de vivre. Elle a parlé à un agent qui a
 * cherché avant de répondre, qui a cité ses sources et qui a refusé d'inventer.
 * Cette page ne fait que nommer ce qu'elle a vu, puis pose UN bouton.
 *
 * ⚠ Les chiffres viennent de `etatDuSavoir()`, qui compte les fiches du dépôt.
 * Écrits à la main, ils se seraient périmés au premier ajout, en silence.
 */
export default function Coulisses() {
  const savoir = etatDuSavoir();

  return (
    <main className="min-h-dvh bg-papier pb-16">
      <Feuille>
        <EnTete
          nature="NOTE DE SERVICE · SUR CELUI QUI TIENT CE BUREAU"
          titre="Le commissaire n'est pas un homme"
          tampon={
            <Tampon couleur="bleu" sens="droite">
              AVEU
            </Tampon>
          }
        />

        <p className="text-[15.5px] leading-relaxed">
          C&rsquo;est un <span className="font-semibold">agent conversationnel</span>. Un
          programme qui parle. Le bureau, la lampe verte et les quarante ans de
          carrière sont une mise en scène ; le dossier, lui, est vrai, et
          c&rsquo;est tout ce qui compte ici.
        </p>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-rouge-texte">
            CE QUI L&rsquo;EMPÊCHE D&rsquo;INVENTER
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            Un modèle de langage laissé seul répond à tout, y compris à ce
            qu&rsquo;il ne sait pas, et il le fait avec aplomb. Sur un dossier de
            chiffres, un seul montant inventé démolit tout le reste. Le
            commissaire est donc tenu par trois choses :
          </p>
          <ul className="flex flex-col gap-2.5 text-[14.5px] leading-relaxed">
            <li className="border-l-[3px] border-cadre-bord pl-3">
              <span className="font-semibold">
                Il cherche avant de répondre.
              </span>{" "}
              {savoir.fiches > 0 ? (
                <>
                  Ses {savoir.fiches} fiches sont versées au dossier, écrites à
                  la main et relues.
                </>
              ) : (
                <>Ses fiches sont versées au dossier, écrites à la main et relues.</>
              )}{" "}
              Une question de fond déclenche une recherche dedans, pas une
              improvisation.
            </li>
            <li className="border-l-[3px] border-cadre-bord pl-3">
              <span className="font-semibold">Il cite d&rsquo;où ça sort.</span>{" "}
              L&rsquo;organisme et l&rsquo;année, à la fin de la phrase.
              {savoir.sources.length > 0 ? (
                <> Les fiches renvoient à {savoir.sources.join(", ")}.</>
              ) : null}{" "}
              Le détail du calcul est sur{" "}
              <Link href="/methode" className="font-semibold text-rouge-texte underline">
                la note de méthode
              </Link>
              .
            </li>
            <li className="border-l-[3px] border-cadre-bord pl-3">
              <span className="font-semibold">
                Il dit quand il ne sait pas.
              </span>{" "}
              Si la réponse n&rsquo;est pas dans le dossier, il le dit et il
              s&rsquo;arrête. Il ne donne aucun conseil fiscal ni patrimonial, et
              il ne prend parti sur rien.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-rouge-texte">
            LE MÊME, CHEZ VOUS
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            Il a été monté avec <span className="font-semibold">Dale Voz</span>, la
            plateforme de Revolution Agency. Ce qu&rsquo;il fait ici, un agent le
            fait chez une entreprise avec le métier de cette entreprise :
            répondre aux clients sur le site, sur WhatsApp, sur Messenger, sur
            Instagram ou au téléphone, à partir de ce qu&rsquo;on lui a appris, et
            passer la main à un humain quand la question le dépasse.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            Le détail qui change tout, et qui est vrai pour ce commissaire-là :{" "}
            <span className="font-semibold">
              on règle un agent en lui parlant
            </span>
            . On branche son propre Claude ou son ChatGPT sur la plateforme, on
            décrit ce qu&rsquo;on veut, il pose les questions qui manquent et il
            construit.
          </p>

          <a
            href={DALEVOZ}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center justify-center gap-2 self-start rounded-[3px] border-2 border-rouge px-4 py-2.5 font-mono text-[12px] font-semibold tracking-[0.08em] text-rouge-texte transition-colors hover:bg-rouge hover:text-papier"
          >
            VOIR DALE VOZ →
          </a>
          <p className="font-mono text-[10px] leading-relaxed text-encre-3">
            DALEVOZ.REVOLUTIONAGENCY.AI · 100 CONVERSATIONS OFFERTES CHAQUE MOIS,
            SANS CARTE. S&rsquo;OUVRE DANS UN NOUVEL ONGLET, VOTRE DÉPOSITION
            RESTE OUVERTE DERRIÈRE.
          </p>
        </section>

        <Renvoi>
          Le commissaire ne prend aucune coordonnée et ne rappelle personne. Il
          répond à cette question quand on la lui pose, et il retourne à la
          déposition.
        </Renvoi>

        <p className="text-[14px]">
          <Link href="/" className="font-semibold text-rouge-texte underline">
            ← Retour au dossier
          </Link>
        </p>

        <PiecesVersees />
      </Feuille>
    </main>
  );
}
