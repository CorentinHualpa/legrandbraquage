/**
 * `/api/avis` : la une du journal, en image, aux chiffres de CE dossier.
 *
 * Deux besoins qu'une image figée ne couvre pas :
 *
 * 1. L'aperçu d'un lien partagé. WhatsApp, LinkedIn, Messenger et X lisent
 *    la balise OpenGraph. Avec un PNG posé dans `public/`, tout le monde
 *    voyait la même vignette, quel que soit le montant annoncé dans le
 *    message. Ici l'aperçu porte le montant de celui qui partage.
 * 2. Instagram et TikTok n'affichent AUCUN aperçu de lien et ne rendent pas
 *    les liens cliquables. Là-bas, seule une image circule : le bouton
 *    « Enregistrer l'image » de l'écran de fin ouvre cette route.
 *
 * ⚠ Les polices sont lues sur le DISQUE, pas chez Google. Une image de
 * partage qui dépend d'un tiers au moment où un réseau vient la chercher
 * casse un jour, silencieusement, et personne ne le voit passer.
 *
 * ⚠ Satori n'accepte qu'un sous-ensemble de CSS : que du flex (pas de grid),
 * tout élément à plusieurs enfants doit dire `display: flex`, aucune classe
 * Tailwind du projet, aucun `oklch`. La une est donc remise en page ici
 * plutôt que réutilisée telle quelle ; `uneDuCas` garantit que les CHIFFRES,
 * eux, sont les mêmes des deux côtés.
 */
import fs from "node:fs";
import path from "node:path";

import { ImageResponse } from "next/og";

import { casDepuisRequete, REQUETE_UNE_PAR_DEFAUT } from "@/lib/lien";
import { SITE_HOTE } from "@/lib/site";
import { uneDuCas, type Une } from "@/lib/une";

export const runtime = "nodejs";
/* Le dossier tient tout entier dans l'URL : deux appels identiques rendent
   la même image, elle peut donc se garder longtemps. */
export const revalidate = 86400;

const LARGEUR = 1200;
const HAUTEUR = 630;

const ENCRE = "#1b2733";
const ENCRE_2 = "#3d4b5a";
const ENCRE_3 = "#6b7885";
const PAPIER = "#ece5d5";
const ROUGE = "#b3341f";
const BLEU = "#2c4a6e";
const VERT = "#24663f";
const CARTON = "#3f3a32";

function police(fichier: string) {
  return fs.readFileSync(path.join(process.cwd(), "src", "polices", fichier));
}

/**
 * Le portrait du suspect, en data URI : Satori ne va pas chercher de fichier
 * local, et il ne décode PAS le webp. Le dossier n'a que du webp, d'où le
 * `13-braqueur-og.png` posé à côté, produit une fois pour cette route :
 *
 *   node -e "…sharp('public/images/13-braqueur.webp').resize({width:460}).png()…"
 */
function portrait(): string | null {
  const dossier = path.join(process.cwd(), "public", "images");
  const candidats = ["13-braqueur-og.png", "13-braqueur.png", "13-braqueur.jpg", "13-braqueur.jpeg"];
  for (const nom of candidats) {
    const chemin = path.join(dossier, nom);
    if (!fs.existsSync(chemin)) continue;
    const type = nom.endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${type};base64,${fs.readFileSync(chemin).toString("base64")}`;
  }
  return null;
}

/**
 * Un filet double, à la main. `border: 4px double` fait lever Satori
 * (« Failed to parse declaration ») : il ne connaît que `solid`. Deux traits
 * empilés donnent le même œil de journal.
 */
function FiletDouble() {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ display: "flex", height: 3, background: ENCRE }} />
      <div style={{ display: "flex", height: 2 }} />
      <div style={{ display: "flex", height: 1, background: ENCRE }} />
    </div>
  );
}

function Journal({ une, visage }: { une: Une; visage: string | null }) {
  /*
   * ⚠ L'image de partage titrait « BRAQUÉ DE » le montant PRIS, et affichait
   * trois lignes plus bas un rendu SUPÉRIEUR à ce montant, avec un tampon
   * COUPABLE. C'est la pièce qui circule sur WhatsApp et LinkedIn, donc la plus
   * facile à retourner contre le dossier : elle porte maintenant les deux
   * plateaux et le solde.
   */
  const accent = une.issue === "coupable" ? ROUGE : une.issue === "relaxe" ? VERT : ENCRE_2;
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: CARTON, padding: 16 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: PAPIER,
          color: ENCRE,
          padding: "18px 26px 20px 26px",
          fontFamily: "Newsreader",
        }}
      >
        {/* L'oreille du journal. */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 4 }}>
          <span style={{ fontFamily: "Plex", fontSize: 13, letterSpacing: 2, color: ENCRE_3 }}>
            ÉDITION SPÉCIALE
          </span>
          <span style={{ fontFamily: "Plex", fontSize: 13, letterSpacing: 2, color: ENCRE_3 }}>
            PRIX : DÉJÀ PAYÉ
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            borderTop: `1px solid ${ENCRE}`,
            borderBottom: `1px solid ${ENCRE}`,
            padding: "5px 0",
          }}
        >
          <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: 1 }}>
            LA GAZETTE DES PRÉLÈVEMENTS
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 7px 0" }}>
          <span style={{ fontFamily: "Plex", fontSize: 12, letterSpacing: 3, color: ENCRE_3 }}>
            QUARANTE-TROIS ANS D’ENQUÊTE · TRIBUNAL DES PRÉLÈVEMENTS
          </span>
        </div>
        <FiletDouble />

        {/* La manchette et le portrait, côte à côte. */}
        <div style={{ display: "flex", flexGrow: 1, gap: 22, paddingTop: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 232 }}>
            {/* Hauteur EXPLICITE : sans elle l'image garde sa proportion et
                laisse une bande de fond sous elle, le cadre étant plus haut. */}
            <div
              style={{
                display: "flex",
                height: 300,
                border: `1px solid ${ENCRE}`,
                background: "#ded5c0",
                overflow: "hidden",
              }}
            >
              {visage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={visage} alt="" width={230} height={298} style={{ objectFit: "cover" }} />
              ) : null}
            </div>
            <span style={{ fontSize: 14, color: ENCRE_2, paddingTop: 5, lineHeight: 1.25 }}>
              Le suspect, hier soir. Se présente chaque mois. A une clé. A le droit.
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <span style={{ fontFamily: "Plex", fontSize: 13, letterSpacing: 2, color: accent }}>
              {une.issue === "coupable"
                ? "BRAQUAGE À DOMICILE, TOUS LES MOIS, PENDANT UNE CARRIÈRE"
                : une.issue === "relaxe"
                  ? "ENQUÊTE CLOSE · LA MAISON REND PLUS QU’ELLE NE PREND"
                  : "ENQUÊTE CLOSE · LES DEUX PLATEAUX S’ÉQUILIBRENT"}
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, letterSpacing: -1 }}>PRIS</span>
              <span style={{ fontFamily: "Plex", fontSize: 46, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>
                {une.preleve}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                paddingTop: 2,
                color: VERT,
              }}
            >
              <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, letterSpacing: -1 }}>RENDU</span>
              <span style={{ fontFamily: "Plex", fontSize: 46, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>
                {une.recu}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: `1px solid ${ENCRE}`,
                marginTop: 8,
                paddingTop: 6,
                color: accent,
              }}
            >
              <span style={{ fontSize: 21, fontWeight: 700 }}>
                {une.solde.startsWith("−") ? "À VOTRE CHARGE" : "EN VOTRE FAVEUR"}
              </span>
              <span style={{ fontFamily: "Plex", fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
                {une.solde}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderTop: `1px solid ${ENCRE}`,
                marginTop: 8,
                paddingTop: 5,
              }}
            >
              <span style={{ fontFamily: "Plex", fontSize: 12, letterSpacing: 2, color: ENCRE_3 }}>
                LE SCÉNARIO DE LA DÉFENSE · TOUT PLACÉ EN {une.placement.toUpperCase()}
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
                <span style={{ fontSize: 18, color: ENCRE_2 }}>
                  Ça aurait fait {une.capital} · écart avec le rendu {une.ecartPlace}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* L'ours : en pièces détachées, l'adresse, le tampon. */}
        <div style={{ display: "flex", marginTop: 12 }}>
          <FiletDouble />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 10,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Plex", fontSize: 12, letterSpacing: 2, color: ROUGE }}>
              {une.objetTitre}
            </span>
            <span style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15 }}>{une.objet}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: 16, color: ENCRE_2 }}>Et chez vous, pris ou rendu ?</span>
              <span style={{ fontFamily: "Plex", fontSize: 16, color: ENCRE_3 }}>{SITE_HOTE}</span>
            </div>
            <div
              style={{
                display: "flex",
                border: `4px solid ${accent}`,
                color: accent,
                padding: "3px 14px",
                transform: "rotate(-7deg)",
              }}
            >
              <span style={{ fontFamily: "Plex", fontSize: 30, fontWeight: 600, letterSpacing: 3 }}>
                {une.issue === "coupable" ? "COUPABLE" : une.issue === "relaxe" ? "RELAXE" : "NON-LIEU"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function GET(requete: Request) {
  const recherche = new URL(requete.url).search;
  /* Sans dossier valable dans l'URL, on montre le salarié médian : c'est le
     cas type de la page d'accueil, et c'est lui que l'aperçu doit annoncer
     quand quelqu'un partage l'adresse nue. */
  const cas = casDepuisRequete(recherche) ?? casDepuisRequete(REQUETE_UNE_PAR_DEFAUT);
  let une: Une;
  try {
    if (!cas) throw new Error("cas par défaut illisible");
    une = uneDuCas(cas);
  } catch {
    // Un régime non instruit lève : on ne fabrique pas une image fausse.
    return new Response("Dossier incalculable", { status: 422 });
  }

  return new ImageResponse(<Journal une={une} visage={portrait()} />, {
    width: LARGEUR,
    height: HAUTEUR,
    fonts: [
      { name: "Newsreader", data: police("newsreader-400.ttf"), weight: 400, style: "normal" },
      { name: "Newsreader", data: police("newsreader-700.ttf"), weight: 700, style: "normal" },
      { name: "Plex", data: police("ibm-plex-mono-400.ttf"), weight: 400, style: "normal" },
      { name: "Plex", data: police("ibm-plex-mono-600.ttf"), weight: 600, style: "normal" },
    ],
  });
}
