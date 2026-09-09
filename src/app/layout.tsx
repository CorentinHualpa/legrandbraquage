import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--police-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--police-mono",
  display: "swap",
});

/**
 * ⚠ VOUVOYER. Le produit vouvoie partout depuis que le commissaire est le seul
 * à parler, et cette phrase est la plus lue de toutes : c'est elle qui s'affiche
 * sous le lien quand quelqu'un le partage sur WhatsApp ou LinkedIn. Elle
 * tutoyait encore, seule survivante de la version d'avant.
 */
const DESCRIPTION =
  "Chaque mois, quelqu'un passe chez vous avant vous. On chiffre ce qu'il emporte, ce qu'il repose, et lequel des deux pèse le plus lourd. Barèmes officiels, moteur de calcul public.";

/**
 * L'image de partage par DÉFAUT, pour l'adresse nue.
 *
 * ⚠ Ce n'est plus l'image de tout le monde. Un lien partagé porte le dossier
 * dans sa requête, et `generateMetadata` de la page pointe alors sur
 * `/api/avis?…`, qui refabrique la une aux chiffres de celui qui partage.
 * `og.png` ne sert qu'à celui qui arrive sans paramètre : il montre le
 * salarié médian. On le refait avec `node scripts/og/rendre.mjs`, qui appelle
 * la même route ; il n'y a plus deux mises en page à tenir d'accord.
 */
const PARTAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "La Gazette des Prélèvements : braqué de 1 017 844 € sur une carrière au salaire médian, 2 190 € net avant impôt par mois. Placés en fonds euros à 0,7 %, ils auraient fait 1 160 777 €, contre 1 040 463 € rendus. Manque à gagner : 120 314 €. Coupable.",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Le Grand Braquage",
    template: "%s · Le Grand Braquage",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Le Grand Braquage",
    images: [PARTAGE],
  },
  // Sans `twitter`, X et LinkedIn retombent sur une vignette carrée recadrée au
  // centre, qui coupe le bordereau. La carte large est la seule qui garde les
  // chiffres lisibles.
  twitter: {
    card: "summary_large_image",
    title: "Le Grand Braquage",
    description: DESCRIPTION,
    images: [PARTAGE.url],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#efe9dc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${serif.variable} ${mono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
