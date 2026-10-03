/** Tramos por importe: deben coincidir con ORDER_TIERS del backend
 *  (lib/order-pricing.ts). Los importes que se muestran en el carrito vienen de
 *  /api/cart/quote; esto solo sirve para la barra de progreso y el primer pintado. */
/** Envío estándar y umbral de envío gratis (los reales vienen de shipping_methods). */
export const SHIPPING_COST = 19.99;
export const FREE_SHIPPING_MIN = 200;

export const MARKETING_TIERS = {
  BRONCE: { min: 0, discount: 0, label: 'BRONCE', shipping: SHIPPING_COST },
  PLATA: { min: 150, discount: 5, label: 'PLATA', shipping: SHIPPING_COST },
  ORO: { min: 300, discount: 10, label: 'ORO', shipping: 0 },
  PLATINO: { min: 500, discount: 15, label: 'PLATINO', shipping: 0 },
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
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : 'https://api.escapesymas.com').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const finalPath = cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
  return `${baseUrl}${finalPath}`;
}

/**
 * fetch contra el backend enviando siempre la cookie de sesión (eym_jwt).
 * La API vive en otro origen (api.escapesymas.com), así que sin
 * `credentials: 'include'` el backend trata la petición como anónima.
 */
export function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(getApiUrl(path), { credentials: 'include', ...init });
}

export function formatOrderNumber(orderId: number | string | null | undefined, dateInput?: Date | string | null): string {
  if (orderId === null || orderId === undefined || orderId === '') return '';
  const strId = String(orderId).trim();
  if (/^\d{14}$/.test(strId)) return strId;

  const cleanId = strId.replace(/\D/g, '');
  const idNum = parseInt(cleanId || '0', 10);
  const paddedId = String(idNum).padStart(6, '0');

  const d = dateInput ? new Date(dateInput) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const mm = String(validDate.getMonth() + 1).padStart(2, '0');
  const yyyy = String(validDate.getFullYear());
  const dd = String(validDate.getDate()).padStart(2, '0');

  return `${mm}${yyyy}${dd}${paddedId}`;
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

