import type { Metadata } from "next";
import localFont from "next/font/local";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { hasToken } from "@/lib/session";
import { ABOUT, TAGLINE } from "@/lib/site";
import "./globals.css";

const camingo = localFont({
  src: [
    { path: "../../fonts/camingocode/CamingoCode-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../fonts/camingocode/CamingoCode-Italic.ttf", weight: "400", style: "italic" },
    { path: "../../fonts/camingocode/CamingoCode-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../fonts/camingocode/CamingoCode-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-camingo",
  display: "swap",
});

const catgirl = localFont({
  src: "../../fonts/catgirl-system-font/CatgirlSystemFont-Regular.otf",
  variable: "--font-catgirl",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `GitHarvey: ${TAGLINE}`, template: "%s | GitHarvey" },
  description: ABOUT,
  openGraph: { type: "website", siteName: "GitHarvey", title: `GitHarvey: ${TAGLINE}`, description: ABOUT },
  twitter: { card: "summary_large_image", title: `GitHarvey: ${TAGLINE}`, description: ABOUT },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${camingo.variable} ${catgirl.variable}`}>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header hasToken={await hasToken()} />
        <div id="main" className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
