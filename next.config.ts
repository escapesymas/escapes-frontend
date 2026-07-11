import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "img-src 'self' https: data:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.com https://*.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://*.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' http://127.0.0.1:3001 http://localhost:3001 https://api.stripe.com",
  "font-src 'self' data:",
].join('; ');

const isProduction = process.env.NODE_ENV === 'production';

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
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3001/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://127.0.0.1:3001/uploads/:path*',
      },
    ];
  },
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  experimental: {
    inlineCss: true,
  },
  compiler: {
    removeConsole: { exclude: ['error'] },
  },
  output: 'standalone',
};

export default nextConfig;
