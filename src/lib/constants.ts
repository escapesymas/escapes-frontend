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

export function getImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api.escapesymas.com').replace(/\/$/, '');
    return `${baseUrl}${url}`;
  }
  return url;
}

export function getApiUrl(path: string): string {
  if (!path) return '/api';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
}

export const KNOWN_MOTORCYCLE_BRANDS = [
  'Harley-Davidson', 'Harley Davidson', 'Harley',
  'Royal Enfield', 'Moto Guzzi', 'MV Agusta', 'Gas Gas', 'GasGas',
  'Honda Motor', 'Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'BMW', 'Ducati', 'KTM',
  'Aprilia', 'Triumph', 'Vespa', 'Piaggio', 'Kymco', 'SYM', 'Peugeot', 'Rieju',
  'Gilera', 'Derbi', 'Indian', 'Benelli', 'Mondial', 'QJ Motor', 'Lifan',
  'Zontes', 'Voge', 'Mash', 'Motomel', 'Zanella', 'Corven', 'Bajaj', 'Hero',
  'TVS', 'Husqvarna', 'KTM AG', 'SWM', 'Beta', 'Fantic', 'Sherco', 'Vertigo',
  'Scorpa', 'Montesa', 'CFMoto', 'Macbor', 'Keeway', 'Brixton', 'Mitt', 'UM'
];

export function parseBike(bike: string | null | undefined): { brand: string; model: string; year: string } {
  if (!bike || typeof bike !== 'string') return { brand: '', model: '', year: '' };
  const cleaned = bike.trim();
  if (!cleaned) return { brand: '', model: '', year: '' };

  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const obj = JSON.parse(cleaned);
      if (obj.brand && obj.model) {
        return { brand: String(obj.brand), model: String(obj.model), year: String(obj.year || '') };
      }
    } catch {}
  }

  const sortedBrands = [...KNOWN_MOTORCYCLE_BRANDS].sort((a, b) => b.length - a.length);
  let brand = '';
  let rest = cleaned;

  for (const b of sortedBrands) {
    if (cleaned.toLowerCase().startsWith(b.toLowerCase() + ' ')) {
      brand = b.toUpperCase();
      rest = cleaned.substring(b.length + 1).trim();
      break;
    }
  }

  if (!brand) {
    const parts = cleaned.split(/\s+/);
    brand = (parts[0] || '').toUpperCase();
    rest = parts.slice(1).join(' ');
  }

  let year = '';
  let model = rest;

  const parenYearMatch = rest.match(/\((19[6-9]\d|20[0-3]\d)\)/);
  if (parenYearMatch) {
    year = parenYearMatch[1];
    model = rest.replace(parenYearMatch[0], '').trim();
  } else {
    const yearMatch = rest.match(/\b(19[6-9]\d|20[0-3]\d)\b/g);
    if (yearMatch && yearMatch.length > 0) {
      year = yearMatch[yearMatch.length - 1];
      const lastYearIdx = rest.lastIndexOf(year);
      model = (rest.substring(0, lastYearIdx) + rest.substring(lastYearIdx + year.length)).replace(/\(\s*\)/g, '').trim();
    }
  }

  return { brand, model, year };
}

