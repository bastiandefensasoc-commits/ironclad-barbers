import type { Metadata } from "next";
import { Barlow_Condensed, Work_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteUrl } from "@/lib/seo";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ironclad Barbers — Barbershop in Austin, TX",
    template: "%s | Ironclad Barbers",
  },
  description:
    "A two-chair barbershop in Austin, Texas. Classic cuts, beard work, and hot towel shaves from four barbers — book online in under a minute.",
  openGraph: {
    type: "website",
    siteName: "Ironclad Barbers",
    locale: "en_US",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${workSans.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
