import type { Metadata } from "next";
import { Inter, Nunito, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { BedtimeProvider } from "@/components/features/bedtime/BedtimeContext";
import { SoothingPlayer } from "@/components/features/bedtime/SoothingPlayer";
import { LanguageProvider } from "@/components/features/language/LanguageContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { SoundProvider } from "@/lib/contexts/SoundContext";
import { FairyDustCursor } from "@/components/effects/FairyDustCursor";
import { WishlistProvider } from "@/lib/contexts/WishlistContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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

export const metadata: Metadata = {
  title: "StoryMagic | Cuentos Personalizados con IA",
  description: "Crea cuentos infantiles mágicos y únicos. Convierte a tu hijo en el héroe de su propia historia con inteligencia artificial.",
  keywords: ["cuentos personalizados", "libros infantiles", "IA", "regalo personalizado", "niños"],
  openGraph: {
    title: "StoryMagic | Cuentos Personalizados con IA",
    description: "Convierte a tu hijo en el héroe de su propia historia",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${nunito.variable} ${playfair.variable} font-sans antialiased bg-cream-50`}
      >
        <LanguageProvider>
          <SoundProvider>
            <BedtimeProvider>
              <CartProvider>
                <WishlistProvider>
                  <Navbar />
                  <CartDrawer />
                  <FairyDustCursor />
                  <div className="flex-1 w-full">
                    {children}
                  </div>
                  <SoothingPlayer />
                </WishlistProvider>
              </CartProvider>
            </BedtimeProvider>
          </SoundProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
