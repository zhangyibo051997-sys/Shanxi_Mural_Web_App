import type { Metadata } from "next";
import {
  IBM_Plex_Sans,
  Literata,
  Noto_Sans_SC,
  Noto_Serif_SC,
} from "next/font/google";
import AppI18n from "@/components/i18n/AppI18n";
import { HTML_LANG } from "@/lib/i18n/locales";
import { localeMetadata, getRequestLocale } from "@/lib/i18n/requestLocale";
import "./globals.css";

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui-cn",
  display: "swap",
});

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-editorial-cn",
  display: "swap",
});

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui-western",
  display: "swap",
});

const literata = Literata({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-editorial-western",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  return localeMetadata("meta.title", "meta.description");
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  return (
    <html lang={HTML_LANG[locale]}>
      <body
        className={`${notoSans.variable} ${notoSerif.variable} ${ibmPlex.variable} ${literata.variable} font-sans antialiased`}
      >
        <AppI18n initialLocale={locale}>{children}</AppI18n>
      </body>
    </html>
  );
}
