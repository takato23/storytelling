import type { Metadata } from "next";
import { Nunito, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { LanguageProvider } from "@/components/features/language/LanguageContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { SoundProvider } from "@/lib/contexts/SoundContext";
import { FairyDustCursor } from "@/components/effects/FairyDustCursor";
import { WishlistProvider } from "@/lib/contexts/WishlistContext";
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

const siteOrigin = getPublicSiteOriginForMetadata() ?? "http://localhost:3005";
const siteTitle = "StoryMagic | Cuentos Personalizados con IA";
const siteDescription =
  "Crea cuentos infantiles mágicos y únicos. Convierte a tu hijo en el héroe de su propia historia con inteligencia artificial.";

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
    description: "Convierte a tu hijo en el héroe de su propia historia",
    type: "website",
    url: siteOrigin ? new URL("/", siteOrigin).toString() : undefined,
    siteName: "StoryMagic",
    locale: "es_AR",
    images: [
      {
        url: "/stories/space-1.jpg",
        width: 1200,
        height: 630,
        alt: "StoryMagic cuentos personalizados",
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
        className={`${nunito.variable} ${playfair.variable} font-sans antialiased bg-cream-50`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <SoundProvider>
              <CartProvider>
                <WishlistProvider>
                  <Navbar />
                  <CartDrawer />
                  <FairyDustCursor />
                  <div className="flex-1 w-full">{children}</div>
                </WishlistProvider>
              </CartProvider>
            </SoundProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
