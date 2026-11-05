import { MetadataRoute } from 'next';

// /_next/ (CSS y JS) debe poder leerse para que Google renderice las páginas,
// y las fotos de producto se sirven por /api/image-proxy.
const ALLOW = ['/', '/api/image-proxy', '/api/catalog/'];
// /universales/buscar/<texto> es un espacio infinito (una URL por búsqueda) y ya va con noindex: no gastar rastreo en él.
const DISALLOW = [
  '/api/', '/admin/', '/wp-content/', '/checkout', '/perfil', '/login',
  '/universales/buscar', '/offline', '/confirmar-email', '/verificar-email',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },
      {
        // Un grupo propio anula el de «*»: sin repetir las reglas, Bing podía rastrear /api/, /checkout o /login.
        userAgent: 'bingbot',
        allow: ALLOW,
        disallow: DISALLOW,
        crawlDelay: 2,
      },
    ],
    // Un solo índice: de él cuelgan pages, motos, marcas, escapes y productos.
    sitemap: 'https://escapesymas.com/sitemap.xml',
  };
}
