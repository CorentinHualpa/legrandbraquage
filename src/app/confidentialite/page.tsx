import type { Metadata } from "next";
import Link from "next/link";

import { EnTete, Feuille, Renvoi, Tampon } from "@/components/papier";

/**
 * Ce qui sort du téléphone, et ce qui n'en sort pas.
 *
 * ⚠ La couverture a promis « rien n'est enregistré » pendant huit jours, et
 * l'écran d'audition « il n'a aucun moyen d'enregistrer quoi que ce soit sur
 * vous », alors que le parcours envoie le net, le statut, les montants et le
 * verdict à l'assistant, avec un identifiant qui tient dans le navigateur. La
 * page dit maintenant la vérité, ligne par ligne : c'est le seul endroit du
 * dossier où une approximation nous coûterait la confiance et pas un point de
 * méthode.
 */
export const metadata: Metadata = {
  title: "Vos données",
  description:
    "Ce qui reste dans votre téléphone, ce qui part chez l’assistant, et comment tout effacer.",
};

const CONTACT = "contact@revolutionagency.ai";

export default function Confidentialite() {
  return (
    <main className="min-h-dvh bg-papier pb-16">
      <Feuille>
        <EnTete
          nature="PIÈCE ADMINISTRATIVE · VERSÉE AU DOSSIER"
          titre="Vos données"
          tampon={<Tampon couleur="bleu" sens="droite">PUBLIC</Tampon>}
        />

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-bleu">
            CE QUI NE SORT PAS DE VOTRE TÉLÉPHONE
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            <span className="font-semibold">Tout le simulateur.</span> Votre salaire, votre statut,
            vos réponses au commissaire, l’enveloppe choisie, le verdict : le calcul tourne dans
            votre navigateur, et rien n’est envoyé à un serveur pour l’obtenir. Il n’y a ni compte,
            ni formulaire, ni adresse mail à donner.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            Le lien que vous partagez, lui, porte vos réponses dans son adresse : c’est ce qui
            permet à la personne d’ouvrir votre dossier. Ne le publiez que si vous acceptez que ces
            chiffres soient lus.
          </p>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-rouge-texte">
            CE QUI SORT, SI VOUS PARLEZ AU COMMISSAIRE
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            Le commissaire est un assistant conversationnel servi par{" "}
            <span className="font-semibold">Dale Voz</span>, notre plateforme. Dès que le parcours
            commence, la page lui transmet l’écran où vous en êtes, votre net mensuel, votre statut,
            les montants pris et rendus, l’enveloppe choisie et l’issue, pour qu’il ne vous les
            redemande pas. Ces données, vos messages et ses réponses sont enregistrés sur nos
            serveurs, et un identifiant technique est posé dans votre navigateur pour retrouver la
            conversation si vous revenez.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            Ce transfert a lieu <span className="font-semibold">même si vous n’ouvrez jamais le
            panneau de discussion</span> : il suffit d’arriver au verdict. Si vous ne voulez rien
            transmettre, restez sur « Garder le silence » à l’ouverture, et n’ouvrez pas
            l’assistant.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            Nous ne demandons ni votre nom, ni votre adresse, ni aucune donnée de santé : les
            réponses sur l’école, les soins et le chômage sont des paliers de calcul, pas un
            dossier médical. N’écrivez rien de personnel au commissaire, il n’en a pas besoin pour
            répondre.
          </p>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-bleu">
            QUI TRAITE QUOI, ET OÙ
          </h2>
          <ul className="flex flex-col gap-2 text-[14.5px] leading-relaxed">
            <li>
              <span className="font-semibold">Railway</span> (États-Unis) héberge le site et la
              plateforme.
            </li>
            <li>
              <span className="font-semibold">OpenAI</span> fournit le modèle qui rédige les
              réponses du commissaire : vos messages lui sont transmis pour être traités.
            </li>
            <li>
              <span className="font-semibold">xAI</span> fournit la voix de l’assistant quand vous
              lui parlez.
            </li>
            <li>
              <span className="font-semibold">ElevenLabs</span> a servi à fabriquer les répliques
              enregistrées et les ambiances. Ce sont des fichiers figés : rien de vous ne lui est
              envoyé.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-bleu">
            EFFACER, DEMANDER, S’OPPOSER
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            Le bouton « Recommencer » de l’assistant ouvre une conversation neuve ; il n’efface pas
            la précédente. Pour obtenir une copie de vos échanges ou leur suppression, écrivez à{" "}
            <a href={`mailto:${CONTACT}`} className="font-semibold text-rouge-texte underline">
              {CONTACT}
            </a>{" "}
            en indiquant la date et l’heure approximatives de la conversation : c’est ce qui permet
            de la retrouver, puisque nous ne savons pas qui vous êtes.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            Aucun cookie publicitaire, aucun traceur tiers, aucune revente : le site ne charge ni
            Google Analytics, ni pixel Meta, ni régie. La mesure d’audience est faite par nos
            propres serveurs, sans cookie et sans identifiant de navigation.
          </p>
        </section>

        <Renvoi>
          L’éditeur et l’hébergeur sont nommés dans les{" "}
          <Link href="/mentions-legales" className="underline underline-offset-2">
            mentions légales
          </Link>
          . Le calcul, lui, est public :{" "}
          <Link href="/methode" className="underline underline-offset-2">
            la méthode
          </Link>
          .
        </Renvoi>
      </Feuille>
    </main>
  );
}
