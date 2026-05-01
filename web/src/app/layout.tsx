import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { MobileNav } from "@/components/layout/MobileNav";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

import siteConfig from "@/config/site.json";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name + " | Connect. Vibe. Live.",
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,

  // metadataBase lets Next.js resolve relative paths (/og-image.png)
  // to absolute URLs for all crawlers and social preview scrapers.
  metadataBase: new URL(siteConfig.url),

  // ── Open Graph (Facebook · LinkedIn · Discord · WhatsApp · Telegram · Slack · iMessage) ─────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,      // 1200×630, 1.91:1 — OG standard
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — Connect. Vibe. Live.`,
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X ───────────────────────────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@vibechat",
    creator: "@vibechat",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.twitterImage ?? siteConfig.ogImage,  // 1200×600, 2:1 — Twitter optimal
        width: 1200,
        height: 600,
        alt: `${siteConfig.name} — Connect. Vibe. Live.`,
      },
    ],
  },

  // ── Canonical ─────────────────────────────────────────────────────────────────────────────────
  alternates: {
    canonical: siteConfig.url,
  },

  // ── iOS / Apple ───────────────────────────────────────────────────────────────────────────────
  // apple-touch-icon and theme-color are injected separately via <head> icons config
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name,
  },

  // ── Indexing ──────────────────────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ── Favicon + Apple Touch Icon ─────────────────────────────────────────── */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/og-image.png" />
        {/* ── Theme color (WhatsApp, Chrome mobile, Safari, Discord embeds) ──────── */}
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="msapplication-TileColor" content="#0a0a0a" />
        {/* ── LinkedIn: prefers og:image:secure_url for HTTPS scraping ─────────── */}
        <meta property="og:image:secure_url" content={`${siteConfig.url}/og-image.png`} />
      </head>
      <body
        className={cn(
          "min-h-screen font-sans antialiased selection:bg-primary/30",
          outfit.variable
        )}
      >
        <Providers>
          {children}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
