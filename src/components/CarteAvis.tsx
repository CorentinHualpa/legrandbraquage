import { euros, eurosSigne } from "@/lib/format";
import { SITE_HOTE } from "@/lib/site";

/**
 * L'avis de recherche : la carte qui se partage.
 *
 * Elle porte le crime (le montant emporté), puis le procès tel qu'il a été
 * jugé : ce que l'argent aurait fait, placé là où la personne l'a dit, contre
 * ce qui a été rendu. Depuis le 08/09/2026, c'est ce coût d'opportunité qui
 * fait le verdict, donc c'est lui que la carte annonce ; une carte qui dirait
 * encore « préjudice net = pris moins rendu » ne correspondrait plus au
 * tampon qu'elle affiche.
 *
 * Composant purement présentationnel : il ne calcule rien, pour pouvoir être
 * rendu aussi bien dans la page que dans l'aperçu de partage.
 */
export function CarteAvis({
  preleve,
  placement,
  capital,
  recu,
  ecart,
  braquage,
  objet,
  portrait,
}: {
  preleve: number;
  /** « S&P 500 à 6,8 % » : où l'argent aurait été placé, et à quel taux réel. */
  placement: string;
  capital: number;
  recu: number;
  ecart: number;
  braquage: boolean;
  objet: string;
  portrait: string | null;
}) {
  return (
    /*
      ⚠ `text-encre` est OBLIGATOIRE ici. La carte n'imposait aucune couleur :
      rendue seule sur la page claire de l'OG elle héritait du texte sombre et
      paraissait juste, mais posée dans le dossier sombre elle héritait du
      crème et s'affichait crème sur beige, presque illisible (Coq,
      08/09/2026 : « l'image de fin n'est pas terrible en fait »).
    */
    <div className="mx-auto w-full max-w-[540px] bg-[#3f3a32] p-3 text-encre">
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
                MONTANT EMPORTÉ SUR UNE CARRIÈRE
              </p>
              <p className="chiffres font-mono text-[26px] leading-none font-semibold tracking-[-0.04em] whitespace-nowrap sm:text-[38px]">
                {euros(preleve)} €
              </p>
              <p className="mt-0.5 text-[11.5px] text-encre-2 italic">
                43 ans, en monnaie d’aujourd’hui
              </p>
            </div>

            <div className="flex flex-col gap-1 border-y border-cadre-bord py-2">
              <p className="font-mono text-[8.5px] tracking-[0.12em] text-encre-3 uppercase">
                Placé en {placement}
              </p>
              <div className="flex justify-between gap-3">
                <span className="text-[12.5px] leading-tight">Ça faisait</span>
                <span className="chiffres shrink-0 font-mono text-[12.5px] font-semibold">
                  {euros(capital)} €
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[12.5px]">Rendu sur place</span>
                <span className="chiffres shrink-0 font-mono text-[12.5px] font-semibold">
                  {euros(recu)} €
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] leading-tight font-bold">
                  {braquage ? "Manque à gagner" : "En votre faveur"}
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

        {/*
          Le tampon d'abord, l'adresse ensuite. L'URL en gros et en rouge
          faisait la promotion du site au bas d'une pièce de procédure : on
          lisait une publicité, pas un verdict (Coq, 08/09/2026 : « le lien de
          mon site est mal placé, faut que ce soit plus discret »).
        */}
        <div className="flex items-center justify-between gap-3 border-t-[3px] border-double border-encre pt-2.5">
          <span
            className={`shrink-0 -rotate-[7deg] border-[3px] px-3 py-1 font-mono text-[17px] font-bold tracking-[0.14em] sm:text-[21px] ${braquage ? "border-rouge-texte text-rouge-texte" : "border-bleu text-bleu"}`}
          >
            {braquage ? "COUPABLE" : "RELAXE"}
          </span>
          <div className="flex flex-col items-end text-right">
            <span className="text-[11px] text-encre-2 italic">
              Combien vous ont-ils braqué ?
            </span>
            <span className="font-mono text-[10.5px] tracking-[0.04em] text-encre-3">
              {SITE_HOTE}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
