import { euros, eurosSigne } from "@/lib/format";
import { SITE_HOTE } from "@/lib/site";

/**
 * La une du journal : la pièce qui clôt le dossier, et qui se partage.
 *
 * Elle a d'abord été un avis de recherche posé sur du noir. Coq l'a trouvée
 * fade (08/09/2026), et la une referme l'arc ouvert par la couverture, où
 * « VOUS AVEZ ÉTÉ BRAQUÉS » est déjà écrit comme un titre de journal. Le
 * format se capture bien : c'est la seule chose qui circule sur Instagram,
 * où un lien n'affiche aucun aperçu.
 *
 * Elle porte le crime (le montant emporté), puis le procès tel qu'il a été
 * jugé : ce que l'argent aurait fait, placé là où la personne l'a dit, contre
 * ce qui a été rendu. Depuis le 08/09/2026, c'est ce coût d'opportunité qui
 * fait le verdict, donc c'est lui que la une annonce.
 *
 * Composant purement présentationnel : il ne calcule rien, pour pouvoir être
 * rendu aussi bien dans la page que dans l'aperçu de partage.
 *
 * ⚠ `text-encre` est OBLIGATOIRE sur la racine. Sans elle, la une hérite du
 * crème du dossier sombre et s'affiche crème sur beige, presque illisible.
 * Rendue seule sur une page claire, elle paraît juste : le défaut ne se voit
 * que dans le parcours.
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
    <div className="mx-auto w-full max-w-[540px] bg-[#3f3a32] p-2.5 text-encre">
      <div className="flex h-full flex-col bg-[#ece5d5] px-4 py-3.5 shadow-2xl">
        {/* L'oreille du journal : titre, date, prix. */}
        <div className="flex items-end justify-between gap-2 pb-1">
          <span className="font-mono text-[7.5px] tracking-[0.14em] text-encre-3 uppercase">
            Édition spéciale
          </span>
          <span className="font-mono text-[7.5px] tracking-[0.14em] text-encre-3 uppercase">
            Prix : déjà payé
          </span>
        </div>
        <p className="border-y-[1px] border-encre py-1 text-center text-[19px] leading-none font-bold tracking-[0.02em] sm:text-[25px]">
          LA GAZETTE DES PRÉLÈVEMENTS
        </p>
        <p className="border-b-[3px] border-double border-encre pt-0.5 pb-1 text-center font-mono text-[7.5px] tracking-[0.18em] text-encre-3 uppercase">
          Quarante-trois ans d’enquête · Tribunal des prélèvements
        </p>

        {/* La manchette. */}
        <div className="border-b-[1px] border-encre py-2.5">
          <p className="font-mono text-[8.5px] tracking-[0.14em] text-rouge-texte uppercase">
            Braquage à domicile, tous les mois, pendant une carrière
          </p>
          <p className="mt-1 text-[38px] leading-[0.92] font-bold tracking-[-0.03em] sm:text-[52px]">
            BRAQUÉ DE
          </p>
          <p className="chiffres font-mono text-[34px] leading-[0.98] font-semibold tracking-[-0.04em] whitespace-nowrap sm:text-[46px]">
            {euros(preleve)} €
          </p>
          <p className="mt-1 text-[11.5px] leading-snug text-encre-2 italic">
            En monnaie d’aujourd’hui. La victime n’a jamais porté plainte : elle ne savait pas.
          </p>
        </div>

        {/* Les deux colonnes : la photo du suspect, et le compte. */}
        <div className="flex gap-3 border-b-[1px] border-encre py-2.5">
          <div className="flex w-[36%] shrink-0 flex-col gap-1">
            <div className="relative flex grow items-center justify-center border border-encre bg-cadre">
              {portrait ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/images/${portrait}`} alt="Portrait du suspect" className="h-full w-full object-cover" />
              ) : (
                <span className="px-2 text-center font-mono text-[8px] tracking-[0.1em] text-encre-3">
                  PORTRAIT
                </span>
              )}
            </div>
            <p className="text-[9.5px] leading-tight text-encre-2 italic">
              Le suspect, hier soir. Se présente chaque mois. A une clé. A le droit.
            </p>
          </div>

          <div className="flex grow flex-col gap-1">
            <p className="font-mono text-[8px] tracking-[0.14em] text-rouge-texte uppercase">L’enquête</p>
            <p className="border-b border-cadre-bord pb-0.5 text-[10.5px] leading-tight text-encre-2 italic">
              Placé en {placement}
            </p>
            <div className="flex justify-between gap-2">
              <span className="text-[12px] leading-tight">Ça faisait</span>
              <span className="chiffres shrink-0 font-mono text-[12px] font-semibold">{euros(capital)} €</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[12px] leading-tight">Rendu sur place</span>
              <span className="chiffres shrink-0 font-mono text-[12px] font-semibold">{euros(recu)} €</span>
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-2 border-t border-encre pt-1">
              <span className="text-[12.5px] leading-tight font-bold">
                {braquage ? "Manque à gagner" : "En votre faveur"}
              </span>
              <span
                className={`chiffres shrink-0 font-mono text-[19px] leading-none font-semibold tracking-[-0.02em] ${braquage ? "text-rouge-texte" : "text-bleu"}`}
              >
                {eurosSigne(ecart)}
              </span>
            </div>
          </div>
        </div>

        {/* Le second titre : ce que ça fait, en vrai. */}
        <div className="border-b-[3px] border-double border-encre py-2">
          <p className="font-mono text-[8px] tracking-[0.14em] text-rouge-texte uppercase">
            En pièces détachées
          </p>
          <p className="text-[16px] leading-tight font-bold sm:text-[19px]">{objet}</p>
        </div>

        {/* L'ours : le tampon, puis l'adresse, discrète. */}
        <div className="flex items-center justify-between gap-3 pt-2.5">
          <span
            className={`shrink-0 -rotate-[7deg] border-[3px] px-2.5 py-0.5 font-mono text-[16px] font-bold tracking-[0.14em] sm:text-[20px] ${braquage ? "border-rouge-texte text-rouge-texte" : "border-bleu text-bleu"}`}
          >
            {braquage ? "COUPABLE" : "RELAXE"}
          </span>
          <div className="flex flex-col items-end text-right">
            <span className="text-[11px] leading-tight text-encre-2 italic">
              Combien vous ont-ils braqué ?
            </span>
            <span className="font-mono text-[10.5px] tracking-[0.04em] text-encre-3">{SITE_HOTE}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
