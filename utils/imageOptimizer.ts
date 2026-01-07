/**
 * Utility to optimize images on the fly using wsrv.nl (formerly images.weserv.nl).
 * This solves three critical performance issues:
 * 1. Serving huge images (1700px) in small containers (400px).
 * 2. Serving unoptimized formats (JPG/PNG) instead of WebP.
 * 3. Missing Cache-Control headers on the original WordPress server.
 */
export const optimizeImage = (url: string, width: number = 800, height?: number): string => {
  if (!url) return '';
  
  // Skip optimization for local assets or data URIs
  if (url.startsWith('data:') || url.startsWith('/')) return url;

  // Check if it's already optimized or from a source we don't want to touch (optional)
  if (url.includes('wsrv.nl')) return url;

  try {
    // Clean the URL parameters from the source if any (like ?v=1) to ensure better caching
    const baseUrl = url.split('?')[0];
    
    // Construct the proxy URL
    // &output=webp -> Force WebP format (smaller size)
    // &q=80 -> 80% Quality (good balance)
    // &w={width} -> Resize to exact width needed
    // &l=5 -> Level 5 compression
    let optimizedUrl = `https://wsrv.nl/?url=${encodeURIComponent(baseUrl)}&w=${width}&output=webp&q=80&l=5`;
    
    if (height) {
      optimizedUrl += `&h=${height}&fit=cover`;
    }

    return optimizedUrl;
  } catch (e) {
    // Fallback to original if something fails
    return url;
  }
};