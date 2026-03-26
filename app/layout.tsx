import type { Metadata } from "next";
import { Caveat, Nunito, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { LanguageProvider } from "@/components/features/language/LanguageContext";
import { SoundProvider } from "@/lib/contexts/SoundContext";
import { WishlistProvider } from "@/lib/contexts/WishlistContext";
import { siteContent } from "@/lib/site-content";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { getPublicSiteOriginForMetadata } from "@/lib/config";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const siteOrigin = getPublicSiteOriginForMetadata() ?? "http://localhost:3005";
const siteTitle = `${siteContent.brand.name} | Cuentos personalizados infantiles`;
const siteDescription =
  "Cuentos personalizados infantiles para regalar, leer y guardar. Subí una foto y convertí a tu hijo en el protagonista de su propia historia.";

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: siteTitle,
  description: siteDescription,
  keywords: ["cuentos personalizados", "libros infantiles", "IA", "regalo personalizado", "niños"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteTitle,
    description: "Cuentos personalizados infantiles para leer, regalar y guardar.",
    type: "website",
    url: siteOrigin ? new URL("/", siteOrigin).toString() : undefined,
    siteName: siteContent.brand.name,
    locale: "es_AR",
    images: [
      {
        url: "/stories/space-1.jpg",
        width: 1200,
        height: 630,
        alt: `${siteContent.brand.name} cuentos personalizados`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/stories/space-1.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${nunito.variable} ${playfair.variable} ${caveat.variable} font-sans antialiased bg-cream-50`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <SoundProvider>
              <WishlistProvider>
                <Navbar />
                <div className="flex-1 w-full">{children}</div>
              </WishlistProvider>
            </SoundProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
