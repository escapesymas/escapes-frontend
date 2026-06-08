export const MARKETING_TIERS = {
  BRONCE: { min: 0, discount: 0, label: 'BRONCE', shipping: 6.99 },
  PLATA: { min: 200, discount: 10, label: 'PLATA', shipping: 4.99 },
  ORO: { min: 500, discount: 15, label: 'ORO', shipping: 2.99 },
  PLATINO: { min: 1000, discount: 20, label: 'PLATINO', shipping: 0 },
} as const;

export function sanitizeHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href="#"')
    .replace(/src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'src="#"');
}

export function isValidRedirect(url: string | null): string {
  if (!url) return '/';
  try {
    const parsed = new URL(url, 'http://localhost');
    const allowedHosts = ['escapesymas.com', 'localhost', 'test.escapesymas.com'];
    if (parsed.hostname && !allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) {
      return '/';
    }
  } catch {
    if (!url.startsWith('/')) return '/';
  }
  return url.startsWith('/') ? url : '/';
}

export const PHONE_REGEX = /^[+]?[\d\s()-]{6,20}$/;
export const POSTCODE_REGEX = /^\d{5}$/;
