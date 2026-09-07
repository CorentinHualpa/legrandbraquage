import { euros, eurosSigne } from "@/lib/format";

/**
 * L'avis de recherche : la carte qui se partage.
 *
 * Elle remplace la carte-résultat classique et c'est le moteur de viralité du
 * dossier. Son cadre de portrait est VIDE tant que la caricature n'est pas
 * dessinée : c'est la pièce n° 6 de la planche, générée sans visage exprès.
 * Une image qui contiendrait déjà un inconnu ne servirait à rien.
 *
 * Composant purement présentationnel : il ne calcule rien, pour pouvoir être
 * rendu aussi bien dans la page que dans l'aperçu de partage.
 */
export function CarteAvis({
  preleve,
  recu,
  ecart,
  braquage,
  objet,
  portrait,
}: {
  preleve: number;
  recu: number;
  ecart: number;
  braquage: boolean;
  objet: string;
  portrait: string | null;
}) {
  return (
    <div className="mx-auto w-full max-w-[540px] bg-[#3f3a32] p-3">
      <div className="papier-regle relative flex h-full flex-col gap-3 bg-[#e9e2d2] px-5 py-5 shadow-2xl">
        <div className="border-b-[3px] border-double border-encre pb-2 text-center">
          <p className="font-mono text-[9px] tracking-[0.28em] text-encre-3">
            RÉPUBLIQUE · TRIBUNAL DES PRÉLÈVEMENTS
          </p>
          <p className="mt-0.5 text-[30px] leading-none font-bold tracking-[-0.02em] sm:text-[40px]">
            AVIS DE RECHERCHE
          </p>
        </div>

        <div className="flex grow gap-4">
          <div className="flex w-[38%] shrink-0 flex-col gap-2">
            <div className="relative flex grow items-center justify-center border-2 border-encre bg-cadre">
              {portrait ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/images/${portrait}`}
                  alt="Portrait du suspect"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-2 text-center font-mono text-[9px] leading-relaxed tracking-[0.1em] text-encre-3">
                  PORTRAIT
                  <br />À INCRUSTER
                </span>
              )}
            </div>
            <div className="border-[1.5px] border-encre px-2 py-1.5 text-center">
              <p className="font-mono text-[8px] tracking-[0.12em] text-encre-3">
                SIGNALEMENT
              </p>
              <p className="mt-0.5 text-[12px] leading-tight font-semibold">
                Se présente chaque mois. A une clé. A le droit.
              </p>
            </div>
          </div>

          <div className="flex grow flex-col gap-2.5">
            <div>
              <p className="font-mono text-[8.5px] tracking-[0.14em] text-rouge-texte">
                MONTANT EMPORTÉ SUR LA CARRIÈRE
              </p>
              <p className="chiffres font-mono text-[30px] leading-none font-semibold tracking-[-0.04em] sm:text-[40px]">
                {euros(preleve)} €
              </p>
              <p className="mt-0.5 text-[11.5px] text-encre-2 italic">
                en monnaie d’aujourd’hui
              </p>
            </div>

            <div className="flex flex-col gap-1 border-y border-cadre-bord py-2">
              <div className="flex justify-between gap-3">
                <span className="text-[12.5px]">Reposé sur place</span>
                <span className="chiffres font-mono text-[12.5px] font-semibold">
                  {euros(recu)} €
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13.5px] font-bold">
                  {braquage ? "Préjudice net" : "En ta faveur"}
                </span>
                <span
                  className={`chiffres font-mono text-[20px] font-semibold tracking-[-0.02em] ${braquage ? "text-rouge-texte" : "text-bleu"}`}
                >
                  {eurosSigne(ecart)}
                </span>
              </div>
            </div>

            <div className="border-l-[3px] border-rouge bg-[#ddd4bf] px-2.5 py-2">
              <p className="font-mono text-[8px] tracking-[0.12em] text-rouge-texte">
                SOIT, EN PIÈCES DÉTACHÉES
              </p>
              <p className="mt-0.5 text-[14px] leading-tight font-semibold">
                {objet}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 border-t-[3px] border-double border-encre pt-2.5">
          <div className="flex flex-col">
            <span className="text-[16px] font-bold text-rouge-texte">
              legrandbraquage.fr
            </span>
            <span className="text-[11.5px] text-encre-2 italic">
              Combien t’ont-ils braqué ? Le dossier s’ouvre en dix secondes.
            </span>
          </div>
          <span className="shrink-0 font-mono text-[8.5px] text-encre-3">
            {braquage ? "COUPABLE" : "RELAXE"}
          </span>
        </div>
      </div>
    </div>
  );
}
