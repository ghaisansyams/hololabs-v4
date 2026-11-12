import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { ChromeProvider } from "@/components/layout/chrome-context";
import { siteConfig } from "@/data/site";
import { getSiteContent } from "@/lib/cms";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

// Editorial serif for headlines — v3's visual language follows the
// meatguysteakhouse.com reference (centered, badge-laden, generous
// whitespace), which pairs a serif display face against a plain sans body.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
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
      "hololabs exhibition",
      "booking pameran",
      "reservasi kursi online",
      "tiket exhibition",
      "transfer bank booking",
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
      className={`${jakarta.variable} ${playfair.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <ChromeProvider
          value={{
            logoLockup: brand.logoLockup,
            logoMark: brand.logoMark,
            siteName: brand.siteName,
            reservationLabel: navigation.reservationLabel,
            menuItems: navigation.menuItems.filter((item) => item.label && item.href),
            menuImage: navigation.menuImage,
            menuEyebrow: navigation.menuEyebrow,
            menuTagline: navigation.menuTagline,
          }}
        >
          {children}
        </ChromeProvider>
      </body>
    </html>
  );
}
