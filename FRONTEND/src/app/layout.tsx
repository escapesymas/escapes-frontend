import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ToastProvider } from "../context/ToastContext";
import SchemaMarkup from "../components/SchemaMarkup";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";
import CookieBanner from "../components/CookieBanner";
import ChatWidget from "../components/ChatWidget";
import Footer from "../components/Footer";
import { GtmScript, GtmNoScript } from "../lib/analytics";

export const metadata: Metadata = {
  metadataBase: new URL('https://escapesymas.com'),
  title: "Escapes y Más — Escapes de Moto de Alto Rendimiento",
  description: "Encuentra escapes homologados y recambios oficiales para tu moto. Compatible con las marcas más exigentes del mercado.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Escapes y Más',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: "Escapes y Más — Escapes de Moto de Alto Rendimiento",
    description: "Encuentra escapes homologados y recambios oficiales para tu moto. Compatible con las marcas más exigentes del mercado.",
    url: 'https://escapesymas.com',
    siteName: 'Escapes y Más',
    locale: 'es_ES',
    images: [
      { url: 'https://escapesymas.com/icon-512.svg', width: 512, height: 512, alt: 'Escapes y Más' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Escapes y Más — Escapes de Moto de Alto Rendimiento",
    description: "Encuentra escapes homologados y recambios oficiales para tu moto.",
    images: ['https://escapesymas.com/icon-512.svg'],
  },
  alternates: { canonical: 'https://escapesymas.com' },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon-192.svg', sizes: '192x192' },
      { url: '/icon-512.svg', sizes: '512x512' },
    ],
    apple: [
      { url: '/icon-192.svg', sizes: '192x192' },
    ],
  },
};

export const viewport: Viewport = {
  // viewport-fit=cover es imprescindible para que iOS exponga
  // env(safe-area-inset-bottom) correctamente
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`h-full antialiased`}
      suppressHydrationWarning
    >
<body className="min-h-full flex flex-col">
        <GtmScript />
        <GtmNoScript />
        <SchemaMarkup />
        <ServiceWorkerRegistration />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-slate-950 focus:px-4 focus:py-2 focus:rounded focus:font-mono focus:bold text-xs focus:uppercase focus:tracking-wider"
        >
          Saltar al contenido principal
        </a>
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <div className="flex-1 flex flex-col">
                {children}
              </div>
              <Footer />
              <CookieBanner />
              <ChatWidget />
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
