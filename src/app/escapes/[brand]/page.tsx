import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import MotoBrandClient from './MotoBrandClient';
import { fetchMotoBrand } from '../../../lib/motoSeo';
import {
  getBreadcrumbSchema,
  getItemListSchema,
  jsonLd,
} from '../../../components/SchemaMarkup';

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: rawBrand } = await params;
  const res = await fetchMotoBrand(rawBrand);

  if ('missing' in res) {
    return {
      title: 'Marca no encontrada — Escapes y Más',
      robots: { index: false, follow: false },
    };
  }
  if ('redirectTo' in res) {
    return {
      alternates: { canonical: res.redirectTo },
    };
  }

  const { brand } = res;
  const canonical = `/escapes/${brand.slug}`;
  const hasActiveModels = brand.activeModelCount > 0;
  const escapeMention =
    brand.escapeProductCount > 0
      ? `${brand.escapeProductCount} escapes homologados y racing y `
      : '';

  return {
    title: `Escapes para ${brand.name} — Silenciosos ITV y Recambios por Modelo | Escapes y Más`,
    description: `Catálogo de ${escapeMention}recambios compatibles para ${brand.activeModelCount} modelos de ${brand.name}. Elige tu modelo y año con envío gratis desde 200 €.`,
    alternates: { canonical },
    ...(!hasActiveModels ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `Escapes y Recambios para ${brand.name} | Escapes y Más`,
      description: `Busca tu modelo de ${brand.name}: escapes completos, silenciosos homologados ITV y recambios específicos con stock real.`,
      url: `https://escapesymas.com${canonical}`,
      type: 'website',
    },
  };
}

export default async function MotoBrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: rawBrand } = await params;
  const data = await fetchMotoBrand(rawBrand);

  if ('missing' in data) notFound();
  if ('redirectTo' in data) permanentRedirect(data.redirectTo);

  const canonical = `/escapes/${data.brand.slug}`;
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Escapes por Moto', url: '/escapes' },
    { name: data.brand.name, url: canonical },
  ]);

  const activeModels = data.models.filter((m) => m.hasProducts).slice(0, 30);
  const itemListSchema = getItemListSchema({
    name: `Escapes y recambios por modelo ${data.brand.name}`,
    url: canonical,
    items: activeModels.map((m) => ({
      name: `Escapes ${data.brand.name} ${m.model}`,
      url: `/escapes/${data.brand.slug}/${m.slug}`,
    })),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      {activeModels.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
        />
      )}
      <MotoBrandClient data={data} />
    </>
  );
}
