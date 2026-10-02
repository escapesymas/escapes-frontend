import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // /_next/ (CSS y JS) debe poder leerse para que Google renderice las páginas,
        // y las fotos de producto se sirven por /api/image-proxy.
        allow: ['/', '/api/image-proxy', '/api/catalog/'],
        disallow: ['/api/', '/admin/', '/wp-content/', '/checkout', '/perfil', '/login'],
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
        userAgent: 'bingbot',
        crawlDelay: 2,
      },
    ],
    sitemap: 'https://escapesymas.com/sitemap.xml',
  };
}