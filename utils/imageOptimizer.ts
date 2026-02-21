/**
 * Utility to optimize images on the fly using wsrv.nl (formerly images.weserv.nl).
 * This solves three critical performance issues:
 * 1. Serving huge images (1700px) in small containers (400px).
 * 2. Serving unoptimized formats (JPG/PNG) instead of WebP/AVIF.
 * 3. Missing Cache-Control headers on the original WordPress server.
 */

type ImageFormat = 'webp' | 'avif' | 'auto';

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Optimiza una imagen usando wsrv.nl
 * @param url - URL de la imagen original
 * @param options - Opciones de optimización
 * @returns URL optimizada
 * 
 * @example
 * optimizeImage('https://example.com/image.jpg', { width: 400, format: 'avif' })
 */
export const optimizeImage = (
  url: string,
  options: OptimizeOptions = {}
): string => {
  if (!url) return '';

  // Si la imagen ya es local o data URI, no optimizar con servicio externo
  if (url.startsWith('data:') || url.startsWith('/')) return url;

  // BYPASS wsrv.nl completely for backend images.
  // Plesk's hotlink protection blocks external services (wsrv.nl) from fetching our images,
  // causing "This image was hotlinked" placeholders. Instead, serve them directly through our proxy.
  if (url.startsWith('https://backendescapes.com/')) {
    const relativePath = url.replace('https://backendescapes.com/', '');
    return `/api/proxy?media=${encodeURIComponent(relativePath)}`;
  }

  // For non-backend images, use wsrv.nl optimization as before
  const params = new URLSearchParams();
  params.append('url', url);

  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  else params.append('q', '70');

  if (options.format && options.format !== 'auto') {
    params.append('output', options.format);
  } else {
    params.append('output', 'webp');
  }

  if (options.fit) params.append('fit', options.fit);

  return `https://wsrv.nl/?${params.toString()}`;
};

/**
 * Genera srcSet responsive para una imagen
 * Útil para <img srcSet="..."> o <source srcSet="...">
 */
export const generateResponsiveSrcSet = (
  url: string,
  widths: number[] = [400, 800, 1200, 1600],
  format: ImageFormat = 'webp'
): string => {
  if (!url || url.startsWith('data:') || url.startsWith('/')) return '';

  return widths
    .map(w => `${optimizeImage(url, { width: w, format })} ${w}w`)
    .join(', ');
};

/**
 * Genera un <picture> element completo con AVIF, WebP y fallback
 * Para máxima optimización y compatibilidad
 */
export const generatePictureElement = (
  url: string,
  alt: string,
  className?: string,
  width = 800
): string => {
  if (!url) return '';

  return `
    <picture>
      <source srcset="${optimizeImage(url, { width, format: 'webp' })}" type="image/webp">
      <img src="${optimizeImage(url, { width })}" alt="${alt}" class="${className || ''}" loading="lazy">
    </picture>
  `;
};