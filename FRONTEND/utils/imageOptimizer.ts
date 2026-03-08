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

  // Handle already proxied URLs or backend URLs
  const isProxied = url.startsWith('/api/proxy?');
  const isBackend = url.startsWith('https://backendescapes.com/');

  if (isProxied || isBackend) {
    let relativePath = '';
    if (isProxied) {
      try {
        const urlObj = new URL(url, 'https://dummy.com');
        relativePath = urlObj.searchParams.get('media') || '';
      } catch (e) {
        const match = url.match(/[?&]media=([^&]+)/);
        relativePath = match ? decodeURIComponent(match[1]) : '';
      }
    } else {
      relativePath = url.replace('https://backendescapes.com/', '');
    }

    if (relativePath) {
      // 1. Convertir siempre el path base a .webp si no lo es (ya que borramos originales)
      const lastDotIndex = relativePath.lastIndexOf('.');
      let baseName = lastDotIndex !== -1 ? relativePath.substring(0, lastDotIndex) : relativePath;

      // Si el path ya termina en extensiones de imagen que borramos, lo pasamos a webp
      if (/\.(jpg|jpeg|png)$/i.test(relativePath)) {
        relativePath = baseName + '.webp';
      }

      // 2. Si el ancho coincide con uno de nuestros pre-optimizados (550, 315, 150)
      const staticWidths = [550, 315, 150];
      const isStaticWidth = options.width && staticWidths.includes(options.width);
      const useWebp = !options.format || options.format === 'webp' || options.format === 'auto';

      if (isStaticWidth && useWebp) {
        // imagen.webp -> imagen-550w.webp
        const staticPath = `${baseName}-${options.width}w.webp`;
        return `/api/proxy?media=${encodeURIComponent(staticPath)}`;
      }

      // 3. Para cualquier otro caso (desktop 800px, 1100px, etc), usar el .webp base
      // y dejar que el proxy redimensione a partir de ese.
      const params = new URLSearchParams();
      params.append('media', relativePath); // Aquí ya es .webp
      if (options.width) params.append('w', options.width.toString());
      if (options.height) params.append('h', options.height.toString());
      if (options.fit) params.append('fit', options.fit);
      params.append('fmt', options.format && options.format !== 'auto' ? options.format : 'webp');
      return `/api/proxy?${params.toString()}`;
    }
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