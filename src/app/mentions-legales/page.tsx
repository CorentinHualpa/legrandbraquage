import type { Metadata } from "next";
import Link from "next/link";

import { EnTete, Feuille, Renvoi, Tampon } from "@/components/papier";
import { SITE_HOTE } from "@/lib/site";

/**
 * Mentions légales. Elles n'existaient pas, et le site est en ligne depuis le
 * 7 septembre 2026 : c'est une obligation d'éditeur (LCEN, article 6-III), et
 * sur un dossier à charge c'est aussi la première chose qu'on nous demandera.
 *
 * Les faits de l'éditeur sont ceux, mot pour mot, des pages légales de
 * revolutionagency.ai, pour que les deux ne divergent jamais.
 */
export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Qui édite Le Grand Braquage, qui l’héberge, et comment nous joindre.",
};

const CONTACT = "contact@revolutionagency.ai";

export default function MentionsLegales() {
  return (
    <main className="min-h-dvh bg-papier pb-16">
      <Feuille>
        <EnTete
          nature="PIÈCE ADMINISTRATIVE · VERSÉE AU DOSSIER"
          titre="Mentions légales"
          tampon={<Tampon couleur="bleu" sens="droite">PUBLIC</Tampon>}
        />

        <section className="flex flex-col gap-3">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-rouge-texte">L’ÉDITEUR</h2>
          <p className="text-[14.5px] leading-relaxed">
            Ce site est édité par <span className="font-semibold">Revolution Agency</span>, société
            en cours de constitution au Pérou, cofondée par Corentin Pinel et Alejandra Castillo. Le
            RUC de la société est en cours d’attribution par la SUNAT et sera publié ici dès son
            émission. Pendant la constitution, l’exploitant du site est Corentin Pinel, immatriculé
            au registre fiscal péruvien sous le RUC 10490823153.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            Directeur de la publication : Corentin Pinel. Contact :{" "}
            <a href={`mailto:${CONTACT}`} className="font-semibold text-rouge-texte underline">
              {CONTACT}
            </a>
            .
          </p>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-bleu">L’HÉBERGEUR</h2>
          <p className="text-[14.5px] leading-relaxed">
            Le site est hébergé par <span className="font-semibold">Railway Corporation</span>{" "}
            (railway.com), 80 Bogart St, Brooklyn, NY 11206, États-Unis. L’assistant du
            commissaire est servi par la plateforme Dale Voz, hébergée sur la même infrastructure.
          </p>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-bleu">CE QUE CE SITE EST</h2>
          <p className="text-[14.5px] leading-relaxed">
            Un simulateur de prélèvements obligatoires, et une démonstration de ce que nous
            construisons : un agent conversationnel, un site qui réagit, une bande son, des images
            et des voix produites pour l’occasion. Les personnages sont fictifs. Le commissaire est
            une intelligence artificielle, il le dit, et il ne parle au nom d’aucun parti ni
            d’aucune administration.
          </p>
          <p className="text-[14.5px] leading-relaxed">
            Le moteur de calcul est public :{" "}
            <a
              href="https://github.com/CorentinHualpa/legrandbraquage"
              className="font-semibold text-rouge-texte underline"
              rel="noreferrer"
            >
              github.com/CorentinHualpa/legrandbraquage
            </a>
            . Chaque barème renvoie à son texte officiel, et{" "}
            <Link href="/methode" className="underline underline-offset-2">
              la méthode
            </Link>{" "}
            dit ce qui est calculé, ce qui ne l’est pas, et ce que le dossier ne compte pas.
          </p>
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
          <h2 className="font-mono text-[10px] tracking-[0.13em] text-bleu">
            SIGNALER UN CONTENU, UNE ERREUR, UN CHIFFRE
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            Une erreur de barème, une source qui a bougé, un calcul que vous contestez : écrivez à{" "}
            <a href={`mailto:${CONTACT}`} className="font-semibold text-rouge-texte underline">
              {CONTACT}
            </a>
            . Les corrections sont visibles dans l’historique public du dépôt.
          </p>
        </section>

        <Renvoi>
          Vos données :{" "}
          <Link href="/confidentialite" className="underline underline-offset-2">
            ce qui sort de votre téléphone, et ce qui n’en sort pas
          </Link>
          . Le site : {SITE_HOTE}.
        </Renvoi>
      </Feuille>
    </main>
  );
}
