import type { Metadata } from 'next';
import MarcasDirectoryClient from './MarcasDirectoryClient';
import { fetchBrandsDirectory, POPULAR_FOOTER_MANUFACTURER_BRANDS } from '../../lib/brandSeo';
import {
  getBreadcrumbSchema,
  getFaqSchema,
  getItemListSchema,
  jsonLd,
} from '../../components/SchemaMarkup';
import { DELIVERY_ES, FREE_SHIPPING_MIN, SHIPPING_COST } from '../../lib/constants';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Marcas de Escapes, Recambios y Equipamiento de Moto — Catálogo Oficial | Escapes y Más',
  description:
    'Directorio completo de más de 200 fabricantes oficiales de escapes homologados, frenos, kits de transmisión, cascos y neumáticos de moto: IXIL, Yasuni, Tecnigas, Yoshimura, Brembo, Arai, AFAM y Michelin.',
  alternates: {
    canonical: '/marcas',
  },
  openGraph: {
    title: 'Marcas de Escapes, Recambios y Equipamiento de Moto | Escapes y Más',
    description:
      'Explora más de 200 fabricantes de escapes, recambios y accesorios de moto con stock en tiempo real, garantía de 3 años y envío gratis desde 200 €.',
    url: 'https://escapesymas.com/marcas',
    type: 'website',
  },
};

const MARCAS_FAQS = [
  {
    question: '¿Son originales todos los productos de las marcas del catálogo?',
    answer:
      'Sí. En Escapes y Más comercializamos únicamente recambios, sistemas de escape, neumáticos y equipamiento 100 % originales de cada fabricante, con referencia oficial, código EAN verificable y garantía legal de 3 años en España.',
  },
  {
    question: '¿Qué fabricantes de escapes homologados y racing trabajáis?',
    answer:
      'Contamos con catálogo activo de fabricantes especialistas como IXIL, Yasuni, Tecnigas, Fresco, Yoshimura US, Pro Circuit, Polini, Malossi, HP Corse, HMF y Scorpion, además de accesorios térmicos y juntas de escape Centauro y Acousta-Fil.',
  },
  {
    question: '¿Cómo compruebo qué piezas de una marca sirven para mi moto exacta?',
    answer:
      'En la ficha de cada producto encontrarás la lista completa de marcas, modelos y años compatibles verificados. También puedes usar nuestro buscador por moto en /escapes para ver solo los recambios que encajan en tu vehículo.',
  },
  {
    question: '¿Cuánto cuesta el envío al comprar productos de cualquier marca?',
    answer: `El envío a España peninsular tiene una tarifa plana de ${SHIPPING_COST.toFixed(2).replace('.', ',')} € y es gratis en todos los pedidos a partir de ${FREE_SHIPPING_MIN} € (puedes combinar artículos de distintas marcas en el mismo carrito). El plazo de entrega es de ${DELIVERY_ES}.`,
  },
];

export default async function MarcasHubPage() {
  const directory = await fetchBrandsDirectory();

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Marcas', url: '/marcas' },
  ]);

  const listItems =
    directory && directory.featuredBrands.length > 0
      ? directory.featuredBrands.slice(0, 24).map((b) => ({
          name: b.name,
          url: `/marcas/${b.slug}`,
        }))
      : POPULAR_FOOTER_MANUFACTURER_BRANDS.map((b) => ({
          name: b.name,
          url: b.href,
        }));

  const itemListSchema = getItemListSchema({
    name: 'Principales marcas de escapes, recambios y equipamiento de moto',
    url: '/marcas',
    items: listItems,
  });

  const faqSchema = getFaqSchema(MARCAS_FAQS);

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
      <MarcasDirectoryClient directory={directory} faqs={MARCAS_FAQS} />
    </>
  );
}
