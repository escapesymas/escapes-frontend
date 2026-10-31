import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import MotoModelClient from './MotoModelClient';
import { fetchMotoModel, MotoModelData } from '../../../../lib/motoSeo';
import {
  getBreadcrumbSchema,
  getFaqSchema,
  getItemListSchema,
  jsonLd,
} from '../../../../components/SchemaMarkup';
import {
  DELIVERY_ES,
  FREE_SHIPPING_MIN,
  getImageUrl,
  SHIPPING_COST,
} from '../../../../lib/constants';
import { effectivePrice } from '../../../../lib/pricing';

export const revalidate = 600;

function formatYearSpan(yearFrom: number | null, yearTo: number | null): string {
  if (!yearFrom) return '';
  if (!yearTo || yearFrom === yearTo) return String(yearFrom);
  return `${yearFrom}-${yearTo}`;
}

function buildModelFaqs(data: MotoModelData): { question: string; answer: string }[] {
  const { bike, totalProducts, totalPrimaryEscapes, totalEscapes, categories } = data;
  const fullName = `${bike.brandName} ${bike.model}`;
  const yearsText = formatYearSpan(bike.yearFrom, bike.yearTo);
  const topCatNames = categories
    .slice(0, 5)
    .map((c) => c.name.toLowerCase())
    .join(', ');

  return [
    {
      question: `¿Qué escapes y recambios son compatibles con la ${fullName}${yearsText ? ` (${yearsText})` : ''}?`,
      answer:
        totalPrimaryEscapes > 0
          ? `Actualmente contamos con ${totalPrimaryEscapes} ${totalPrimaryEscapes === 1 ? 'escape o silencioso compatible' : 'escapes completos, silenciosos y colectores compatibles'} y un total de ${totalProducts} piezas verificadas para ${fullName}${yearsText ? ` (años ${yearsText})` : ''}${topCatNames ? `, incluyendo ${topCatNames}` : ''}. Puedes filtrar en esta misma página por el año exacto de matriculación.`
          : totalEscapes > 0
          ? `Disponemos de ${totalProducts} recambios específicos y ${totalEscapes} accesorios de montaje de escape verificados para ${fullName}${yearsText ? ` (años ${yearsText})` : ''}${topCatNames ? `, abarcando ${topCatNames}` : ''}.`
          : `Disponemos de ${totalProducts} recambios específicos con compatibilidad verificada para ${fullName}${yearsText ? ` (años ${yearsText})` : ''}${topCatNames ? `, en categorías como ${topCatNames}` : ''}.`,
    },
    {
      question: `¿Cómo comprobar si un escape para ${fullName} pasa la ITV?`,
      answer: `Para circular por vía pública y superar la ITV en España con tu ${fullName}, el silencioso o línea completa debe contar con homologación europea (Euro 3, Euro 4 o Euro 5 / Euro 5+ según el año de tu moto), mantener el dB-killer instalado y conservar el catalizador homologado cuando el escape sustituya al colector original. En la descripción de cada ficha indicamos si es homologado o de uso racing en circuito.`,
    },
    {
      question: `¿Cuánto cuesta y cuánto tarda el envío de piezas para ${fullName}?`,
      answer: `El envío estándar en España peninsular tiene un coste de ${SHIPPING_COST.toFixed(2).replace('.', ',')} € y es gratis en todos los pedidos a partir de ${FREE_SHIPPING_MIN} €. El plazo de entrega habitual es de ${DELIVERY_ES}.`,
    },
  ];
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string; model: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const [{ brand: rawBrand, model: rawModel }, sp] = await Promise.all([params, searchParams]);
  const yearParam = typeof sp.year === 'string' && /^\d{4}$/.test(sp.year.trim()) ? sp.year.trim() : undefined;
  const res = await fetchMotoModel(rawBrand, rawModel, yearParam);

  if ('missing' in res) {
    return {
      title: 'Modelo de moto no encontrado — Escapes y Más',
      robots: { index: false, follow: false },
    };
  }
  if ('redirectTo' in res) {
    return {
      alternates: { canonical: res.redirectTo.split('?')[0] },
    };
  }

  const { bike, totalProducts, totalPrimaryEscapes, totalEscapes } = res;
  const canonical = `/escapes/${bike.brandSlug}/${bike.modelSlug}`;
  const yearSpan = formatYearSpan(bike.yearFrom, bike.yearTo);
  const fullName = `${bike.brandName} ${bike.model}`;
  const hasQueryParams = Object.keys(sp).length > 0;
  const shouldNoIndex = hasQueryParams || totalProducts === 0;

  let title: string;
  let description: string;

  if (totalPrimaryEscapes > 0) {
    title = `Escapes ${fullName}${yearSpan ? ` (${yearSpan})` : ''} — Homologados ITV y Recambios | Escapes y Más`;
    description = `Compra escapes completos, silenciosos homologados ITV y ${totalProducts} recambios compatibles con ${fullName}${yearSpan ? ` (${yearSpan})` : ''}. Stock real y envío gratis desde ${FREE_SHIPPING_MIN} €.`;
  } else if (totalEscapes > 0) {
    title = `Recambios y Accesorios de Escape ${fullName}${yearSpan ? ` (${yearSpan})` : ''} | Escapes y Más`;
    description = `${totalProducts} recambios verificados y accesorios de escape compatibles con ${fullName}${yearSpan ? ` (${yearSpan})` : ''}: frenos, motor, transmisión y mantenimiento. Envío gratis desde ${FREE_SHIPPING_MIN} €.`;
  } else {
    title = `Recambios y Accesorios para ${fullName}${yearSpan ? ` (${yearSpan})` : ''} | Escapes y Más`;
    description = `Catálogo de ${totalProducts} recambios específicos compatibles con ${fullName}${yearSpan ? ` (${yearSpan})` : ''}. Compatibilidad verificada por año y envío gratis desde ${FREE_SHIPPING_MIN} €.`;
  }

  return {
    title,
    description,
    alternates: { canonical },
    ...(shouldNoIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url: `https://escapesymas.com${canonical}`,
      type: 'website',
    },
  };
}

export default async function MotoModelPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string; model: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ brand: rawBrand, model: rawModel }, sp] = await Promise.all([params, searchParams]);
  const yearParam = typeof sp.year === 'string' && /^\d{4}$/.test(sp.year.trim()) ? sp.year.trim() : undefined;
  const data = await fetchMotoModel(rawBrand, rawModel, yearParam);

  if ('missing' in data) notFound();
  if ('redirectTo' in data) permanentRedirect(data.redirectTo);

  const { bike } = data;
  const canonical = `/escapes/${bike.brandSlug}/${bike.modelSlug}`;
  const fullName = `${bike.brandName} ${bike.model}`;

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Escapes por Moto', url: '/escapes' },
    { name: bike.brandName, url: `/escapes/${bike.brandSlug}` },
    { name: fullName, url: canonical },
  ]);

  const topItems = data.products.slice(0, 12).map((p) => {
    const slug = p.slug || p.sku || String(p.id);
    const hasVariants = !!p.family && (p.family.variantCount || 0) > 1;
    const price =
      hasVariants && p.family?.priceMin != null
        ? p.family.priceMin
        : effectivePrice(p);
    const inStock = hasVariants
      ? p.family?.inStock !== false
      : p.inStock !== false && (p.stock ?? 0) > 0;
    return {
      name: p.name,
      description: p.description || p.shortDescription || `${p.name} compatible con ${fullName}`,
      brand: p.brand || undefined,
      sku: p.sku || undefined,
      url: `/producto/${encodeURIComponent(slug)}`,
      image: getImageUrl(p.image) || undefined,
      price,
      inStock,
    };
  });

  const itemListSchema = getItemListSchema({
    name: `Escapes y recambios compatibles con ${fullName}`,
    url: canonical,
    items: topItems,
  });

  const faqs = buildModelFaqs(data);
  const faqSchema = getFaqSchema(faqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      {topItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />
      <MotoModelClient data={data} faqs={faqs} />
    </>
  );
}
