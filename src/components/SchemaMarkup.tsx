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
  brand: {
    '@type': 'Brand';
    name: string;
  };
  offers: {
    '@type': 'Offer';
    price: number;
    priceCurrency: string;
    availability: string;
    url: string;
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
  sku?: string;
  brand?: string;
  price: number;
  url?: string;
  inStock?: boolean;
}): ProductSchema {
  const imageUrls = product.image ? [/^https?:\/\//.test(product.image) ? product.image : `${BASE_URL}${product.image}`] : [];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: plainText(product.description || '').slice(0, 5000) || `${product.name} en Escapes y Más`,
    image: imageUrls,
    sku: product.sku || '',
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Escapes y Más',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'EUR',
      availability: product.inStock 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      url: product.url || BASE_URL,
    },
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

export default function SchemaMarkup() {
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebSiteSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  );
}