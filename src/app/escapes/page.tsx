import type { Metadata } from 'next';
import MotosHubClient from './MotosHubClient';
import { fetchMotosHub, POPULAR_HOME_MOTOS } from '../../lib/motoSeo';
import {
  getBreadcrumbSchema,
  getFaqSchema,
  getItemListSchema,
  jsonLd,
} from '../../components/SchemaMarkup';
import { DELIVERY_ES, FREE_SHIPPING_MIN, SHIPPING_COST } from '../../lib/constants';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Escapes por Marca y Modelo de Moto — Homologados ITV y Racing | Escapes y Más',
  description:
    'Encuentra escapes completos, silenciosos homologados Euro 4 y Euro 5 para ITV, colectores y recambios verificados para tu marca, modelo y año de moto. Envío gratis desde 200 €.',
  alternates: {
    canonical: '/escapes',
  },
  openGraph: {
    title: 'Escapes y Recambios por Marca y Modelo de Moto | Escapes y Más',
    description:
      'Busca tu moto por marca, modelo y año: escapes IXIL, Yasuni, Tecnigas, Fresco, Yoshimura y más de 65.000 recambios compatibles en stock.',
    url: 'https://escapesymas.com/escapes',
    type: 'website',
  },
};

const HUB_FAQS = [
  {
    question: '¿Cómo sé si un escape es 100 % compatible con mi moto y año?',
    answer:
      'Cada página de modelo en Escapes y Más cruza la referencia exacta del fabricante (código de chasis y rango de años) con nuestro catálogo técnico. Además, puedes filtrar por el año exacto de matriculación de tu moto o consultar en directo con nuestros asesores.',
  },
  {
    question: '¿Los escapes que vendéis están homologados para pasar la ITV en España?',
    answer:
      'Disponemos tanto de líneas y silenciosos homologados Euro 3, Euro 4 y Euro 5 / Euro 5+ con contraseña de homologación grabada y certificado para ITV, como de escapes y supresores de catalizador de uso exclusivo en circuito. En la ficha de cada escape se especifica su homologación.',
  },
  {
    question: '¿Cuánto cuesta el envío y cuánto tarda en llegar un escape?',
    answer: `El envío estándar a España peninsular cuesta ${SHIPPING_COST.toFixed(2).replace('.', ',')} € y es totalmente gratis en pedidos a partir de ${FREE_SHIPPING_MIN} €. El plazo habitual de entrega es de ${DELIVERY_ES}.`,
  },
  {
    question: '¿Qué marcas de escapes para moto trabajáis?',
    answer:
      'Trabajamos con fabricantes líderes en calle, scooter, off-road y competición como IXIL, Yasuni, Tecnigas, Fresco, Polini, Pro Circuit, Yoshimura y Centauro, junto con juntas, muelles, dB-killers y colectores específicos.',
  },
];

export default async function EscapesHubPage() {
  const hub = await fetchMotosHub();

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Escapes por Moto', url: '/escapes' },
  ]);

  const listItems =
    hub && hub.featuredModels.length > 0
      ? hub.featuredModels.slice(0, 16).map((m) => ({
          name: `Escapes ${m.brandName} ${m.model}`,
          url: `/escapes/${m.brandSlug}/${m.modelSlug}`,
        }))
      : POPULAR_HOME_MOTOS.map((m) => ({
          name: `Escapes ${m.brandName} ${m.model}`,
          url: m.href,
        }));

  const itemListSchema = getItemListSchema({
    name: 'Escapes de moto por modelo más buscados',
    url: '/escapes',
    items: listItems,
  });

  const faqSchema = getFaqSchema(HUB_FAQS);

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
      <MotosHubClient hub={hub} faqs={HUB_FAQS} />
    </>
  );
}
