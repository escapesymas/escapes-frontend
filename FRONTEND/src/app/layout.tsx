import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ToastProvider } from "../context/ToastContext";
import SchemaMarkup from "../components/SchemaMarkup";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";
import CookieBanner from "../components/CookieBanner";
import ChatWidget from "../components/ChatWidget";
import { GtmScript, GtmNoScript } from "../lib/analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <GtmScript />
        <GtmNoScript />
        <SchemaMarkup />
        <ServiceWorkerRegistration />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-slate-950 focus:px-4 focus:py-2 focus:rounded focus:font-mono focus:font-bold focus:text-xs focus:uppercase focus:tracking-wider"
        >
          Saltar al contenido principal
        </a>
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              {children}
              <CookieBanner />
              <ChatWidget />
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
