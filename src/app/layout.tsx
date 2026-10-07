import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import "./globals.css";
import { QualityProvider } from "@/lib/quality";
import { identity } from "@/content/site";

/* Tipografi PRD bagian 5: judul geometris tebal, isi teks Inter. */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hololabs-web.vercel.app";
const title = `${identity.name} — ${identity.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s · ${identity.name}`,
  },
  description: identity.description,
  keywords: [
    "creative technology lab",
    "projection mapping",
    "interactive display",
    "immersive experience",
    "VR",
    "AI solutions",
    "3D printing",
    "Indonesia",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: identity.name,
    title,
    description: identity.description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: identity.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  colorScheme: "dark",
};

/** Structured data organisasi — butir checklist UAT "SEO & berbagi". */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: identity.name,
  url: siteUrl,
  slogan: identity.tagline,
  description: identity.description,
  email: identity.email,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}>
      <body>
        <script
          type="application/ld+json"
          // Data statis milik sendiri, bukan masukan pengguna.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <QualityProvider>{children}</QualityProvider>
      </body>
    </html>
  );
}
