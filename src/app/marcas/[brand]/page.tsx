import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import MarcaLandingClient from './MarcaLandingClient';
import { fetchBrandLanding } from '../../../lib/brandSeo';
import {
  getBreadcrumbSchema,
  getFaqSchema,
  getItemListSchema,
  jsonLd,
} from '../../../components/SchemaMarkup';
import { effectivePrice } from '../../../lib/pricing';
import { DELIVERY_ES, FREE_SHIPPING_MIN, SHIPPING_COST } from '../../../lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parsePage(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(String(v || '1'), 10);
  return Number.isFinite(n) && n > 1 ? n : 1;
}

function strParam(raw: string | string[] | undefined): string {
  return typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? (raw[0] || '').trim() : '';
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const [{ brand: brandSlug }, sp] = await Promise.all([params, searchParams]);
  const page = parsePage(sp.page);
  const data = await fetchBrandLanding(brandSlug, { page, perPage: 24 });

  if ('missing' in data || 'redirectTo' in data) {
    return {
      title: 'Marca no encontrada · Escapes y Más',
      robots: { index: false, follow: true },
    };
  }

  const { brand, totalPages } = data;
  const filtered = Object.keys(sp).some((k) => k !== 'page');
  const outOfRange = page > 1 && page > Math.max(1, totalPages);
  const basePath = `/marcas/${brand.slug}`;
  const canonical = !filtered && !outOfRange && page > 1 ? `${basePath}?page=${page}` : basePath;
  const pageSuffix = !filtered && page > 1 ? ` · Página ${page}` : '';

  const topCatsText = brand.topCategories
    .slice(0, 3)
    .map((c) => c.name)
    .join(', ');

  const title = brand.isEscapeSpecialist
    ? `Escapes ${brand.name} para Moto${pageSuffix} — Silenciosos y Colectores | Escapes y Más`
    : `${brand.name} Moto${pageSuffix} — Catálogo Oficial${topCatsText ? ` (${topCatsText})` : ''} | Escapes y Más`;

  const description = brand.isEscapeSpecialist
    ? `Compra escapes completos, silenciosos homologados y colectores ${brand.name} para moto (${brand.modelCount.toLocaleString('es-ES')} modelos disponibles). Precios con IVA, stock real y envío gratis desde ${FREE_SHIPPING_MIN} €.`
    : `Catálogo oficial ${brand.name} para moto en Escapes y Más: ${brand.modelCount.toLocaleString('es-ES')} modelos${topCatsText ? ` en ${topCatsText.toLowerCase()}` : ''} con precios con IVA, garantía de 3 años y envío gratis desde ${FREE_SHIPPING_MIN} €.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `https://escapesymas.com${canonical}`,
      siteName: 'Escapes y Más',
      locale: 'es_ES',
    },
    ...(filtered || outOfRange ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function MarcaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ brand: brandSlug }, sp] = await Promise.all([params, searchParams]);
  const page = parsePage(sp.page);
  const catRaw = parseInt(strParam(sp.category_id), 10);
  const categoryId = Number.isFinite(catRaw) && catRaw > 0 ? catRaw : null;
  const inStock = strParam(sp.in_stock) === '1' || strParam(sp.in_stock) === 'true';
  const sort = strParam(sp.sort) || 'relevance';
  const q = strParam(sp.q);

  const data = await fetchBrandLanding(brandSlug, {
    page,
    perPage: 24,
    categoryId,
    inStock,
    sort,
    q,
  });

  if ('redirectTo' in data) {
    permanentRedirect(data.redirectTo);
  }
  if ('missing' in data) {
    notFound();
  }

  const { brand, products } = data;
  const canonicalPath = page > 1 ? `/marcas/${brand.slug}?page=${page}` : `/marcas/${brand.slug}`;

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Marcas', url: '/marcas' },
    { name: brand.name, url: `/marcas/${brand.slug}` },
  ]);

  const itemListSchema = getItemListSchema({
    name: brand.isEscapeSpecialist
      ? `Escapes y recambios ${brand.name} para moto`
      : `Catálogo oficial ${brand.name} para moto`,
    url: canonicalPath,
    items: products.slice(0, 24).map((p) => ({
      name: p.name || p.title,
      description: p.description || p.shortDescription || `${p.name || p.title} de la marca ${brand.name}`,
      brand: brand.name || p.brand || undefined,
      sku: p.sku || undefined,
      url: `/producto/${encodeURIComponent(p.slug || p.sku)}`,
      image: p.image || p.images?.[0]?.src,
      price: effectivePrice(p),
      inStock: p.inStock && p.stock > 0,
    })),
  });

  const topCatNames = brand.topCategories.slice(0, 4).map((c) => c.name.toLowerCase()).join(', ');
  const faqs = [
    {
      question: `¿Son originales los productos ${brand.name} que vendéis en Escapes y Más?`,
      answer: `Sí, todas nuestras referencias ${brand.name} (${brand.productCount.toLocaleString('es-ES')} referencias en catálogo${topCatNames ? `, destacando ${topCatNames}` : ''}) son 100 % originales del fabricante e incluyen 3 años de garantía legal en España.`,
    },
    {
      question: `¿Cómo sé qué referencia de ${brand.name} es compatible con mi modelo y año de moto?`,
      answer: `En la ficha de cada artículo ${brand.name} mostramos la tabla verificada de marcas, modelos y años compatibles. También puedes seleccionar tu vehículo en nuestro buscador por moto (/escapes) para filtrar únicamente piezas compatibles.`,
    },
    {
      question: `¿Cuánto tarda el envío y cuánto cuesta pedir productos ${brand.name}?`,
      answer: `El plazo habitual de entrega en España peninsular es de ${DELIVERY_ES}. El envío cuesta ${SHIPPING_COST.toFixed(2).replace('.', ',')} € y es totalmente gratis en pedidos desde ${FREE_SHIPPING_MIN} €.`,
    },
  ];

  const faqSchema = getFaqSchema(faqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />
      <MarcaLandingClient
        data={data}
        initialCategoryId={categoryId}
        initialInStock={inStock}
        initialSort={sort}
        initialQuery={q}
        faqs={faqs}
      />
    </>
  );
}
