import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const isProduction = process.env.NODE_ENV === 'production';

const connectSrc = isProduction
  ? "'self' https://api.stripe.com https://api.escapesymas.com https://umami.escapesymas.com"
  : "'self' http://127.0.0.1:3001 http://localhost:3001 https://api.stripe.com https://api.escapesymas.com https://umami.escapesymas.com";

const csp = [
  "default-src 'self'",
  "img-src 'self' https: data:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.com https://*.stripe.com https://umami.escapesymas.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://*.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  `connect-src ${connectSrc}`,
  "font-src 'self' data:",
].join('; ');

const nextConfig: NextConfig = {
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
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
        ],
      },
      {
        source: '/(.*)',
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
    inlineCss: true,
  },
  compiler: {
    removeConsole: { exclude: ['error'] },
  },
  output: 'standalone',
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
