import "./globals.css";
import { LangProvider } from "@/context/LangContext";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import PWARegister from "@/components/PWARegister";

export const metadata = {
  title: "ELALAMIA — Le souk d'Algérie en ligne",
  description: "ELALAMIA — marketplace algérienne multi-catégories. Prix cassés, livraison dans les 58 wilayas.",
  manifest: "/manifest.webmanifest",
  applicationName: "ELALAMIA",
  appleWebApp: {
    capable: true,
    title: "ELALAMIA",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport = {
  themeColor: "#0F7A4B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
            <PWARegister />
          </CartProvider>
        </LangProvider>
      </body>
    </html>
  );
}
