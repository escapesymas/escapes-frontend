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

  // Skip optimization for local assets or data URIs
  if (url.startsWith('data:') || url.startsWith('/')) return url;

  // Check if it's already optimized
  if (url.includes('wsrv.nl')) return url;

  const {
    width = 800,
    height,
    quality = 80,
    format = 'webp', // Default to WebP (mejor compatibilidad que AVIF)
    fit = 'cover'
  } = options;

  try {
    // Clean the URL parameters from the source
    const baseUrl = url.split('?')[0];

    // Construct the proxy URL
    let params = new URLSearchParams({
      url: baseUrl,
      w: width.toString(),
      q: quality.toString(),
      l: '5', // Level 5 compression
    });

    // Add format (webp, avif, or auto)
    if (format !== 'auto') {
      params.set('output', format);
    }

    // Add height and fit if specified
    if (height) {
      params.set('h', height.toString());
      params.set('fit', fit);
    }

    return `https://wsrv.nl/?${params.toString()}`;
  } catch (e) {
    // Fallback to original if something fails
    console.warn('Image optimization failed:', e);
    return url;
  }
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
      <source srcset="${optimizeImage(url, { width, format: 'avif' })}" type="image/avif">
      <source srcset="${optimizeImage(url, { width, format: 'webp' })}" type="image/webp">
      <img src="${optimizeImage(url, { width })}" alt="${alt}" class="${className || ''}" loading="lazy">
    </picture>
  `;
};