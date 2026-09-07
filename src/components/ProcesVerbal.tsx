"use client";

import { EnTete, Feuille, Renvoi, Scelle, Tampon } from "./papier";
import type { Pieces } from "./Instruction";
import { euros, eurosSigne, pourcent } from "@/lib/format";
import {
  LIGNES_PERIMETRE,
  heureDeLiberation,
  type Perimetre,
  type Simulation,
  type Statut,
} from "@/lib/moteur";
import {
  SEUIL_ANNEES,
  anneesSansTravailler,
  comptageAbsurde,
  enAnneesDeDepute,
  objetPour,
} from "@/lib/objets";
import { STATUTS } from "@/lib/statuts";

export function ProcesVerbal({
  pieces,
  simulation,
  netMensuel,
  setNetMensuel,
  perimetre,
  setPerimetre,
  statut,
}: {
  pieces: Pieces;
  simulation: Simulation;
  netMensuel: number;
  setNetMensuel: (n: number) => void;
  perimetre: Perimetre;
  setPerimetre: (p: Perimetre) => void;
  statut: Statut;
}) {
  const { plateauGauche, plateauDroit, verdict } = simulation;
  const liberation = heureDeLiberation(simulation);
  const objet = objetPour(plateauGauche.total);
  const comptage = comptageAbsurde(plateauGauche.total);
  const annees = anneesSansTravailler(plateauGauche.total, netMensuel);
  const enAnnees = plateauGauche.total >= SEUIL_ANNEES;
  const nomStatut = STATUTS.find((s) => s.id === statut)?.libelle ?? "salarié";
  const detail = plateauDroit.detailPension;

  return (
    <Feuille className="mt-10 border-t-2 border-dashed border-ligne pt-2">
      <EnTete
        nature="PROCÈS-VERBAL DE CONSTAT"
        titre="Le Grand Braquage"
        tampon={<Tampon>SCELLÉ N° 4</Tampon>}
      />

      <Scelle
        numero={9}
        nom="L'effraction"
        ratio="4:3"
        legende="CLICHÉ 04 · LE PIED-DE-BICHE SUR LE CERFA"
        fichier={pieces[9]}
      />

      <p className="flex gap-2 font-mono text-[11px] text-encre-3">
        <span className="shrink-0">PARTIE CIVILE :</span>
        <span className="grow border-b border-encre text-encre">
          {nomStatut.toLowerCase()}, {euros(netMensuel)} € net
        </span>
      </p>

      {/* ─── Le curseur qui transforme tout en direct ─────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="curseur-salaire"
          className="font-mono text-[10px] tracking-[0.13em] text-encre-3"
        >
          FAIS GLISSER, LE BUTIN SUIT
        </label>
        <input
          id="curseur-salaire"
          type="range"
          min={1200}
          max={10000}
          step={10}
          value={Math.min(10000, Math.max(1200, netMensuel))}
          onChange={(e) => setNetMensuel(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-none bg-ligne accent-rouge"
        />
        <div className="flex justify-between font-mono text-[10px] text-encre-3">
          <span>1 200 €</span>
          <span>10 000 €</span>
        </div>
      </div>

      {/* ─── I. Le butin ───────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h3 className="font-mono text-[10px] tracking-[0.13em] text-rouge-texte">
          I. CE QU’ILS T’ONT BRAQUÉ
        </h3>
        <p className="flex items-baseline gap-2.5">
          <span className="chiffres montant-anime font-mono text-[38px] leading-none font-semibold tracking-[-0.03em] sm:text-[46px]">
            {euros(plateauGauche.total)}
          </span>
          <span className="text-[18px] text-encre-3">euros</span>
        </p>
        <p className="text-[14px] leading-snug text-encre-2 italic">
          Quarante-trois ans de casse, en monnaie d’aujourd’hui. Le hold-up est
          légal, voté, publié au Journal officiel. C’est ce qui le rend parfait.
        </p>

        {/* Les interrupteurs de périmètre : c'est l'utilisateur qui empile. */}
        <ul className="mt-1 flex flex-col border-t border-ligne">
          {LIGNES_PERIMETRE.map((ligne) => {
            const actif = perimetre[ligne.cle];
            const montant = plateauGauche.lignes[ligne.cle];
            return (
              <li key={ligne.cle} className="border-b border-ligne">
                <button
                  type="button"
                  onClick={() =>
                    setPerimetre({ ...perimetre, [ligne.cle]: !actif })
                  }
                  aria-pressed={actif}
                  className="flex w-full items-center gap-3 py-2.5 text-left"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center border-[1.6px] border-encre ${
                      actif ? "bg-encre" : "bg-transparent"
                    }`}
                    aria-hidden
                  >
                    {actif ? (
                      <span className="font-mono text-[10px] leading-none font-semibold text-papier">
                        ×
                      </span>
                    ) : null}
                  </span>
                  <span className="flex grow flex-col">
                    <span
                      className={`text-[14px] ${actif ? "font-medium text-encre" : "text-encre-3"}`}
                    >
                      {ligne.geste}
                    </span>
                    <span className="text-[12px] text-encre-3">{ligne.nom}</span>
                  </span>
                  <span
                    className={`chiffres shrink-0 font-mono text-[13px] ${actif ? "font-medium text-encre" : "text-encre-3"}`}
                  >
                    {euros(montant)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/*
          Deux pièces qui ne se versent au dossier QUE si l'on coche la ligne
          consommation : le caddie et le terminal de paiement. Le geste
          d'empiler un périmètre produit ses propres preuves, plutôt que de ne
          faire bouger qu'un total.
        */}
        {perimetre.consommation && (pieces[5] || pieces[7]) ? (
          <div className="grid grid-cols-[2fr_1fr] gap-2">
            <Scelle
              numero={5}
              nom="La reconstitution"
              ratio="16:9"
              legende="CLICHÉ 05 · LE CADDIE, À LA CRAIE"
              fichier={pieces[5]}
            />
            <Scelle
              numero={7}
              nom="Les empreintes sur le terminal"
              ratio="1:1"
              fichier={pieces[7]}
            />
          </div>
        ) : null}

        {/*
          ⚠ L'avertissement du COR voyage avec le chiffre, il ne vit pas dans
          une note de bas de page. Un employeur public cotise deux fois plus
          qu'un employeur privé, et ça ne veut PAS dire ce qu'on croit : sans
          cette phrase, la ligne « cotisations patronales » du fonctionnaire se
          lit comme un privilège alors qu'elle mesure une démographie.
        */}
        {simulation.entree.regime === "tns" && perimetre.patronales ? (
          <div className="border-l-[3px] border-bleu bg-papier-3 px-3 py-3">
            <p className="font-mono text-[9.5px] tracking-[0.12em] text-bleu">
              LA LIGNE À ZÉRO N’EST PAS UN TROU
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed">
              Tu n’as pas d’employeur, donc il n’y a rien à prendre avant ta
              paie. Tu vois{" "}
              <span className="font-semibold">cent pour cent de ce que tu verses</span>
              , ce qui fait de ta fiche la plus honnête des trois, et de ton
              total le plus bas à revenu net égal.
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed">
              Cette clarté a un prix, et le second plateau le porte : ton régime
              rend moins de droits que celui d’un salarié pour un même net.
            </p>
          </div>
        ) : null}

        {simulation.entree.regime === "fonctionnaire" && perimetre.patronales ? (
          <div className="border-l-[3px] border-bleu bg-papier-3 px-3 py-3">
            <p className="font-mono text-[9.5px] tracking-[0.12em] text-bleu">
              CE QUE CE CHIFFRE NE DIT PAS
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed">
              La contribution de ton employeur au régime de pension est
              beaucoup plus élevée que dans le privé, et le Conseil
              d’orientation des retraites écrit lui-même qu’elle{" "}
              <span className="font-semibold">
                « ne résulte pas d’une générosité plus importante du régime
                public »
              </span>{" "}
              et qu’elle{" "}
              <span className="font-semibold">
                « ne peut pas être comparée à la contribution des employeurs du
                secteur privé »
              </span>
              . Elle mesure une démographie : 1,29 cotisant par retraité contre
              2,25 au régime général. Le taux qui financerait les seuls droits,
              hors invalidité et départs anticipés, serait de 34,7 %.
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed">
              Et le biais joue dans l’autre sens aussi : ton employeur ne cotise
              pas au chômage, il s’auto-assure. Le coût existe, il n’apparaît sur
              aucune ligne. La contrepartie a donc disparu du second plateau
              plutôt que de t’être portée au crédit.
            </p>
          </div>
        ) : null}

        {/* Le convertisseur d'objets. */}
        <Scelle
          numero={8}
          nom="La table des scellés"
          ratio="16:9"
          legende="CLICHÉ 08 · LE BUTIN, CATALOGUÉ"
          fichier={pieces[8]}
          className="mt-1"
        />
        <div className="border-l-[3px] border-rouge bg-papier-3 px-3 py-3">
          <p className="font-mono text-[9.5px] tracking-[0.12em] text-rouge-texte">
            AVEC CE BUTIN, TU T’ACHETAIS
          </p>
          {/*
            L'objet reste TOUJOURS la tête d'affiche : c'est lui qui se
            transforme sous les yeux quand le curseur bouge, et c'est cette
            transformation qui fait le convertisseur. Les années de vie ne
            viennent qu'après, quand le montant est devenu trop gros pour qu'un
            objet veuille encore dire quelque chose.
          */}
          <p className="mt-0.5 text-[17px] leading-tight font-semibold">
            {objet.nom}
          </p>
          <p className="text-[13px] text-encre-2 italic">{objet.pointe}</p>
          {enAnnees ? (
            <p className="mt-2 border-t border-cadre-bord pt-2 text-[13.5px] leading-snug">
              Ou, plus honnêtement :{" "}
              <span className="font-semibold">
                {annees.toFixed(1).replace(".", ",")} années de ta vie
              </span>
              , à ton niveau de vie actuel, sans jamais remettre le réveil.
            </p>
          ) : null}
          <p className="mt-2 border-t border-cadre-bord pt-2 text-[13px] text-encre-2">
            Ou, si tu préfères compter :{" "}
            <span className="chiffres font-mono font-medium text-encre">
              {euros(comptage.nombre)}
            </span>{" "}
            {comptage.unite.pluriel}. Ou encore{" "}
            <span className="chiffres font-mono font-medium text-encre">
              {enAnneesDeDepute(plateauGauche.total).toFixed(1).replace(".", ",")}
            </span>{" "}
            années de rémunération d’un député.
          </p>
        </div>
      </section>

      {/* ─── L'heure de libération ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 border-2 border-encre bg-papier-2 p-4">
        <Scelle
          numero={10}
          nom="Le distributeur sous scellés"
          ratio="16:9"
          legende="CLICHÉ 10 · LE GUICHET, LA NUIT"
          fichier={pieces[10]}
        />
        <h3 className="font-mono text-[10px] tracking-[0.13em] text-bleu">
          L’HEURE DE LIBÉRATION
        </h3>
        <p className="text-[15px] leading-snug">
          Tu travailles pour eux jusqu’au{" "}
          <span className="font-semibold">{liberation.jour.texte}</span>. Dans
          une journée, tu commences à travailler pour toi à{" "}
          <span className="chiffres font-mono font-semibold">
            {liberation.heureTexte}
          </span>
          .
        </p>
        <p className="text-[13px] leading-relaxed text-encre-2">
          C’est {pourcent(liberation.part, 1)} de ce que ton travail coûte à ton
          employeur. Rapporté à ce qui arrive vraiment sur ton compte, la même
          somme vaut{" "}
          <span className="font-semibold text-encre">
            {(liberation.partDuNet).toFixed(2).replace(".", ",")} € prélevés pour
            1 € reçu
          </span>
          . Les deux chiffres sont exacts. Ils ne racontent pas la même histoire,
          et c’est le dénominateur qui décide : la page méthode dit lequel on a
          pris, et pourquoi.
        </p>
      </section>

      {/* ─── II. Ce qu'il a laissé ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 border-t-2 border-encre pt-5">
        <h3 className="font-mono text-[10px] tracking-[0.13em] text-bleu">
          II. CE QU’IL A LAISSÉ SUR PLACE
        </h3>
        <p className="flex items-baseline gap-2.5">
          <span className="chiffres font-mono text-[38px] leading-none font-semibold tracking-[-0.03em] sm:text-[46px]">
            {euros(plateauDroit.total)}
          </span>
          <span className="text-[18px] text-encre-3">euros</span>
        </p>
        <p className="text-[14px] leading-snug text-encre-2 italic">
          Le coffre n’était pas vide en repartant. C’est la partie du dossier que
          personne ne met en une.
        </p>

        <Scelle
          numero={4}
          nom="Le coffre, après"
          ratio="4:3"
          fichier={pieces[4]}
          className="mt-1"
        />

        <ul className="flex flex-col">
          {Object.entries(plateauDroit.lignes).map(([cle, ligne]) => (
            <li
              key={cle}
              className="flex items-baseline gap-3 border-b border-ligne py-2.5"
            >
              <span className="flex grow flex-col">
                <span className="text-[14px]">{ligne.libelle}</span>
                <span className="text-[12px] text-encre-3">
                  {ligne.calcule ? ligne.note : `ordre de grandeur · ${ligne.note}`}
                </span>
              </span>
              <span className="chiffres shrink-0 font-mono text-[13px]">
                {euros(ligne.montant)}
              </span>
            </li>
          ))}
        </ul>

        {detail && detail.brut === false ? (
          <div className="border-l-[3px] border-rouge bg-papier-3 px-3 py-3">
            <p className="font-mono text-[9.5px] tracking-[0.12em] text-rouge-texte">
              POURQUOI CETTE PENSION EST BIEN AU-DESSUS DE CE QU’ON LIT PARTOUT
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed">
              La pension moyenne d’un ancien artisan ou commerçant est de{" "}
              <span className="font-semibold">
                {euros(detail.ecartAvecLObserve.pensionMoyenneObservee)} €
              </span>
              , et le calcul ci-dessus en donne{" "}
              <span className="font-semibold">{euros(detail.totale)} €</span>. Les
              deux sont vrais, et ils ne portent pas sur la même population.
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed">
              Ici on simule une carrière ENTIÈRE passée en indépendant. C’est le
              cas de <span className="font-semibold">12 % d’entre eux</span> :
              97 % des anciens artisans touchent aussi d’un autre régime, et la
              moitié de leur pension vient d’un travail salarié. La moyenne basse
              mesure des carrières courtes dans le régime, pas des règles avares.
            </p>
          </div>
        ) : null}

        <Renvoi>
          Seule la première ligne est calculée au centime : c’est le capital qu’il
          faudrait avoir devant soi pour s’acheter la même rente à vie, indexée,
          avec réversion. Les trois autres sont des{" "}
          <span className="font-semibold">ordres de grandeur assumés</span>, à
          remplacer par un chiffrage par décile. On préfère l’écrire que le
          cacher.
        </Renvoi>
      </section>

      {/* ─── Le verdict, en bas du procès-verbal ───────────────────────────── */}
      <div className="relative border-2 border-encre bg-papier-2 p-4">
        <span
          className={`tampon-droite absolute -top-3 right-4 px-2.5 py-1 ${
            verdict.braquage ? "bg-rouge" : "bg-bleu"
          }`}
        >
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.12em] text-papier">
            CONSTAT
          </span>
        </span>
        <p className="text-[22px] leading-tight font-bold sm:text-[26px]">
          {verdict.libelle}
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-encre-2">
          {verdict.braquage ? (
            <>
              Le préjudice net est de{" "}
              <span className="font-semibold text-encre">
                {eurosSigne(verdict.ecart)}
              </span>
              . Il est réel, et il ne fait pas un million : ton braqueur a reposé
              presque tout ce qu’il avait pris.
            </>
          ) : (
            <>
              Tu repars avec{" "}
              <span className="font-semibold text-encre">
                {eurosSigne(verdict.ecart)}
              </span>{" "}
              de plus que tu n’as donné. Celui qu’on te présente comme le voleur
              t’a rendu davantage qu’il ne t’a pris.
            </>
          )}
        </p>
      </div>
    </Feuille>
  );
}
