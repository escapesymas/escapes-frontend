export const MARKETING_TIERS = {
  BRONCE: { min: 0, discount: 0, label: 'BRONCE', shipping: 6.99 },
  PLATA: { min: 200, discount: 10, label: 'PLATA', shipping: 4.99 },
  ORO: { min: 500, discount: 15, label: 'ORO', shipping: 2.99 },
  PLATINO: { min: 1000, discount: 20, label: 'PLATINO', shipping: 0 },
} as const;

const DANGEROUS_TAGS = /<\/?(script|iframe|object|embed|form|input|button|select|textarea|style|link|meta|base|svg|math|●)/gi;
const DANGEROUS_ATTRS = /\s(on\w+|href|src|action|formaction|data|cite|background|xlink:href|innerHTML|outerHTML|dangerouslySetInnerHTML)\s*=/gi;
const JAVASCRIPT_URI = /[\s'"]javascript:/gi;
const DATA_URI = /[\s'"]data:(?!image\/(png|jpg|jpeg|gif|webp|svg\+xml))/gi;

export function sanitizeHTML(html: string): string {
  if (!html) return '';

  let clean = String(html);

  clean = clean.replace(DANGEROUS_TAGS, (match) => {
    const tag = match.toLowerCase().replace(/[<>]/g, '');
    if (['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'style', 'link', 'meta', 'base', 'svg', 'math'].includes(tag)) {
      return '';
    }
    return match;
  });

  clean = clean.replace(DANGEROUS_ATTRS, ' data-blocked="1"');

  clean = clean.replace(JAVASCRIPT_URI, ' blocked:');
  clean = clean.replace(DATA_URI, ' blocked:');

  return clean;
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
