import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";

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
 * L'image de partage, rendue une fois par `node scripts/og/rendre.mjs`.
 *
 * C'est un fichier posé dans `public/`, pas une image générée à la demande :
 * elle ne coûte rien au serveur et ne peut pas casser en production le jour où
 * une police distante répond mal. Les chiffres qu'elle affiche sortent du
 * moteur ; si un barème bouge, il faut la re-rendre.
 */
const PARTAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Dépôt de plainte : Le Grand Braquage. Sur une carrière à 2 500 € net par mois, 1 379 362 € prélevés contre 1 222 885 € restitués. Le verdict bascule à 2 219 € net.",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://braquage.revolutionagency.ai",
  ),
  title: {
    default: "Le Grand Braquage",
    template: "%s · Le Grand Braquage",
  },
  description:
    "Chaque mois, quelqu'un passe chez toi avant toi. On chiffre ce qu'il emporte, ce qu'il repose, et lequel des deux pèse le plus lourd. Barèmes officiels, moteur de calcul public.",
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
    description: PARTAGE.alt,
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
