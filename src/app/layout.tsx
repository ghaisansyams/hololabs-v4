import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import { ChromeProvider } from "@/components/layout/chrome-context";
import { siteConfig } from "@/data/site";
import { getSiteContent } from "@/lib/cms";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

// Headlines in Unbounded, a wide geometric display face, with a mono face
// for labels and readouts: the "tech" voice of the redesign. (The CSS
// variable keeps its old name.) Self-hosted variable font (OFL), because
// Google's Unbounded URLs trip next/font/google.
const space = localFont({
  src: "./fonts/unbounded-latin-wght-normal.woff2",
  weight: "200 900",
  variable: "--font-space",
  display: "swap",
});

// Wide labels above section titles (as on hololabs.id).
const label = localFont({
  src: "./fonts/michroma-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-michroma",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { brand } = await getSiteContent();
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: brand.seoTitle,
      template: `%s · ${brand.siteName}`,
    },
    description: brand.seoDescription,
    applicationName: brand.siteName,
    keywords: [
      "pameran hololabs",
      "pemesanan pertunjukan",
      "reservasi kursi daring",
      "tiket pertunjukan",
      "pembayaran transfer bank",
    ],
    authors: [{ name: siteConfig.builtBy }],
    creator: siteConfig.builtBy,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: siteConfig.url,
      siteName: brand.siteName,
      title: brand.seoTitle,
      description: brand.seoDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: brand.seoTitle,
      description: brand.seoDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#050308",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom is locked on purpose, per the client: the page is designed
  // for a fixed mobile layout and zooming exposed horizontal overflow.
  // minimumScale 1: browser HP (Chrome/Oppo/in-app WhatsApp) tidak boleh
  // "zoom out otomatis" untuk memuat elemen yang melebihi lebar layar.
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { brand, navigation } = await getSiteContent();
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${space.variable} ${mono.variable} ${label.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <ChromeProvider
          value={{
            logoLockup: brand.logoLockup,
            logoMark: brand.logoMark,
            siteName: brand.siteName,
            reservationLabel: navigation.reservationLabel,
            menuItems: navigation.menuItems.filter((item) => item.label && item.href),
          }}
        >
          {children}
        </ChromeProvider>
      </body>
    </html>
  );
}
