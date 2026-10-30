import { SHIPPING_COST, FREE_SHIPPING_MIN } from '../lib/constants';
import { isExcludedSupplierBrand } from '../lib/brandSeo';

type OrganizationSchema = {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  contactPoint: {
    '@type': 'ContactPoint';
    email: string;
    contactType: string;
  };
  sameAs: string[];
};

type WebSiteSchema = {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
};

type ProductSchema = {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  image: string[];
  sku: string;
  mpn?: string;
  gtin?: string;
  brand: {
    '@type': 'Brand';
    name: string;
  };
  offers: {
    '@type': 'Offer';
    price: number;
    priceCurrency: string;
    priceValidUntil: string;
    itemCondition: string;
    availability: string;
    url: string;
    shippingDetails: {
      '@type': 'OfferShippingDetails';
      shippingRate: {
        '@type': 'MonetaryAmount';
        value: number;
        currency: 'EUR';
      };
      shippingDestination: {
        '@type': 'DefinedRegion';
        addressCountry: 'ES';
      };
      deliveryTime: {
        '@type': 'ShippingDeliveryTime';
        handlingTime: {
          '@type': 'QuantitativeValue';
          minValue: number;
          maxValue: number;
          unitCode: 'DAY';
        };
        transitTime: {
          '@type': 'QuantitativeValue';
          minValue: number;
          maxValue: number;
          unitCode: 'DAY';
        };
      };
    };
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy';
      applicableCountry: 'ES';
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow';
      merchantReturnDays: number;
      returnMethod: 'https://schema.org/ReturnByMail';
      returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility';
    };
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
    bestRating: 5;
    worstRating: 1;
  };
};

type BreadcrumbItem = {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
};

type BreadcrumbSchema = {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItem[];
};

const BASE_URL = 'https://escapesymas.com';

/** Valida códigos EAN/UPC (8, 12, 13 o 14 dígitos con dígito de control GS1) igual que en lib/google-feed.ts. */
export function validGtin(code?: string | null): string | null {
  const c = String(code || '').trim();
  if (!/^(\d{8}|\d{12,14})$/.test(c)) return null;
  const digits = c.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check ? c : null;
}

function toAbsoluteUrl(url?: string | null): string {
  const clean = String(url || '').trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${BASE_URL}${clean.startsWith('/') ? clean : `/${clean}`}`;
}

export function getOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Escapes y Más',
    url: BASE_URL,
    logo: `${BASE_URL}/logo-cabecera-negro.svg`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@escapesymas.com',
      contactType: 'customer service',
    },
    sameAs: [
      'https://www.instagram.com/escapesymas',
      'https://www.tiktok.com/@escapesymas',
    ],
  };
}

export function getWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Escapes y Más',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/universales/buscar/{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function getProductSchema(product: {
  name: string;
  description?: string;
  image?: string;
  images?: { src?: string }[];
  sku?: string;
  mpn?: string;
  barcode?: string;
  brand?: string;
  price: number;
  url?: string;
  inStock?: boolean;
  averageRating?: number;
  ratingCount?: number;
}): ProductSchema {
  const collectedImages: string[] = [];
  if (product.image) {
    const abs = toAbsoluteUrl(product.image);
    if (abs) collectedImages.push(abs);
  }
  for (const img of product.images || []) {
    const abs = toAbsoluteUrl(img?.src);
    if (abs && !collectedImages.includes(abs)) collectedImages.push(abs);
  }
  // Evita la incidencia «Falta el campo "image"» en Fichas de comerciante de Search Console
  // cuando una referencia del catálogo aún no tiene fotografía propia (p. ej. SKU 79900181).
  if (collectedImages.length === 0) {
    collectedImages.push(`${BASE_URL}/og-image.png`);
  }

  const safeBrand = product.brand && !isExcludedSupplierBrand(product.brand)
    ? product.brand.trim()
    : 'Escapes y Más';
  const cleanDesc = plainText(product.description || '')
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !/\bbihr\b/i.test(sentence))
    .join(' ')
    .slice(0, 5000)
    .trim();

  const roundedPrice = Number((Number(product.price) || 0).toFixed(2));
  const shippingFee = roundedPrice >= FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
  const gtin = validGtin(product.barcode);
  const mpn = String(product.mpn || '').trim().slice(0, 70);
  const priceValidUntil = `${new Date().getUTCFullYear() + 1}-12-31`;

  const ratingCount = Number(product.ratingCount) || 0;
  const averageRating = Number(product.averageRating) || 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: cleanDesc || `${product.name} en Escapes y Más`,
    image: collectedImages,
    sku: product.sku || '',
    ...(mpn ? { mpn } : {}),
    ...(gtin ? { gtin } : {}),
    brand: {
      '@type': 'Brand',
      name: safeBrand,
    },
    offers: {
      '@type': 'Offer',
      price: roundedPrice,
      priceCurrency: 'EUR',
      priceValidUntil,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: product.url || BASE_URL,
      // Política fija (AGENTS.md §1 y constants.ts): 19,99 € en España, gratis desde 200 €, entrega 5-10 días.
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: shippingFee,
          currency: 'EUR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'ES',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 4,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
      },
      // Coincide con /devoluciones: 14 días naturales en España por correo, portes a cargo del comprador salvo defecto.
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'ES',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
      },
    },
    ...(ratingCount > 0 && averageRating > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(Math.min(5, Math.max(1, averageRating)).toFixed(2)),
            reviewCount: Math.round(ratingCount),
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

/** Texto plano para JSON-LD: sin etiquetas ni entidades HTML (&aacute; → á). */
function plainText(html: string): string {
  const named: Record<string, string> = {
    nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ordm: 'º', ordf: 'ª', deg: '°', euro: '€',
    aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü', iexcl: '¡', iquest: '¿',
    Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Uuml: 'Ü',
  };
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => named[n] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

export function getFaqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  };
}

export function getItemListSchema(params: {
  name: string;
  url: string;
  items: {
    name: string;
    url: string;
    image?: string;
    price?: number;
    inStock?: boolean;
  }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: params.name,
    url: `${BASE_URL}${params.url}`,
    numberOfItems: params.items.length,
    itemListElement: params.items.map((item, index) => {
      const fullUrl = /^https?:\/\//.test(item.url) ? item.url : `${BASE_URL}${item.url}`;
      if (typeof item.price === 'number' && item.price > 0) {
        const imgUrl = item.image
          ? (/^https?:\/\//.test(item.image) ? item.image : `${BASE_URL}${item.image}`)
          : `${BASE_URL}/og-image.png`;
        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: item.name,
            url: fullUrl,
            image: imgUrl,
            offers: {
              '@type': 'Offer',
              price: Number(item.price.toFixed(2)),
              priceCurrency: 'EUR',
              availability: item.inStock !== false
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              url: fullUrl,
            },
          },
        };
      }
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: fullUrl,
      };
    }),
  };
}

export default function SchemaMarkup() {
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebSiteSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(websiteSchema),
        }}
      />
    </>
  );
}

/**
 * JSON para <script type="application/ld+json">: se escapan «<», «>» y «&» para
 * que ningún texto (nombre o descripción de un producto) pueda cerrar la
 * etiqueta <script> e inyectar código.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
