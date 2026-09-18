import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";

import { site } from "@/site.config";

import LightningClouds from "./components/lightning-clouds";
import SiteFooter from "./components/site-footer";
import SiteHeader from "./components/site-header";
import { PREFERENCES_SCRIPT } from "./components/preferences";
import "./globals.css";

const display = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const sans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · ${site.role}`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  alternates: { types: { "application/rss+xml": "/writing/rss.xml" } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The preferences script stamps data-theme and data-motion before
    // hydration, which the server HTML cannot know about.
    <html
      suppressHydrationWarning
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <LightningClouds intensity={0.7} />
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-6">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
