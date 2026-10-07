import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const isProduction = process.env.NODE_ENV === 'production';

// Audit 2026-08-15, finding #42: 'unsafe-eval' removed in production.
// 'unsafe-inline' must stay because Next.js emits hydration <script> blocks
// inline at runtime; migrating to nonce-based CSP is a follow-up (Bloque 1.7
// in the action plan). For development we keep 'unsafe-eval' because esbuild
// and SWC rely on it for hot reload.
const scriptSrc = isProduction
  ? "'self' 'unsafe-inline' https://js.stripe.com https://m.stripe.com https://*.stripe.com https://umami.escapesymas.com"
  : "'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.com https://*.stripe.com https://umami.escapesymas.com";

const connectSrc = isProduction
  ? "'self' https://api.stripe.com https://api.escapesymas.com https://umami.escapesymas.com"
  : "'self' http://127.0.0.1:3001 http://localhost:3001 https://api.stripe.com https://api.escapesymas.com https://umami.escapesymas.com";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' https: data:",
  `script-src ${scriptSrc}`,
  "frame-src https://js.stripe.com https://hooks.stripe.com https://*.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  `connect-src ${connectSrc}`,
  "font-src 'self' data:",
  "form-action 'self' https://hooks.stripe.com https://*.stripe.com",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig: NextConfig = {
  // Sin la cabecera X-Powered-By: no anunciar la tecnología del servidor.
  poweredByHeader: false,
  ...(isProduction ? {} : { allowedDevOrigins: ['192.168.1.131'] }),
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com" "https://pay.google.com" "https://applepay.cdn-apple.com")' },
        ],
      },
      {
        // Páginas: caché corta en el proxy. Excluye /_next/static (llevan hash y Next
        // las sirve como immutable; esta regla las dejaba en max-age=0).
        source: '/((?!_next/static|_next/image).*)',
        locale: false,
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.API_URL || 'https://api.escapesymas.com';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
  skipProxyUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  experimental: {
    cpus: 1,
    workerThreads: false,
    inlineCss: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.parallelism = 1;
    }
    return config;
  },
  turbopack: {
    root: process.cwd(),
  },
  compiler: process.env.NODE_ENV === 'production'
    ? { removeConsole: { exclude: ['error'] } }
    : {},
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.escapesymas.com',
      },
      {
        protocol: 'https',
        hostname: 'escapesymas.com',
      },
    ],
  },
};

// Bundle analyzer — only wraps when ANALYZE=true so production builds stay lean.
// Usage: `pnpm analyze` (alias for `ANALYZE=true pnpm build`)
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
  analyzerMode: 'static',
  logLevel: 'warn',
});

export default bundleAnalyzer(nextConfig);
