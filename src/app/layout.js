import "./globals.css";
import { LangProvider } from "@/context/LangContext";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "ELALAMIA — Le souk d'Algérie en ligne",
  description: "ELALAMIA — marketplace algérienne multi-catégories. Prix cassés, livraison dans les 58 wilayas, paiement à la livraison.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LangProvider>
          <CartProvider>
            <Header />
            <CategoryNav />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </LangProvider>
      </body>
    </html>
  );
}
