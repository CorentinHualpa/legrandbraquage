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

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://legrandbraquage.fr",
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
