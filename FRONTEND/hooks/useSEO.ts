import { useMemo } from 'react';
import { Product } from '../types';
import { CATEGORIES } from '../storeData';

interface UseSEOProps {
  currentView: string;
  urlCategory?: string;
  selectedProduct?: Product | null;
  query?: string;
  motoParam?: string | null;
  brandParam?: string | null;
}

export function useSEO({ currentView, urlCategory, selectedProduct, query, motoParam, brandParam }: UseSEOProps) {
  return useMemo(() => {
    switch (currentView) {
      case 'home':
        return {
          title: 'Tienda de Escapes y Recambios para Moto',
          description: 'Encuentra los mejores escapes y accesorios para tu moto. Akrapovic, Mivv, Arrow y más al mejor precio.',
          canonical: '/'
        };
      case 'catalog':
        const knownCat = CATEGORIES.find(c => c.id === urlCategory);
        const catName = knownCat ? knownCat.name : (urlCategory ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1) : 'Catálogo');

        let seoTitle = query ? `Búsqueda: ${query}` : `${catName} para Moto`;
        let seoDesc = query
          ? `Resultados de búsqueda para "${query}" en Escapes y Más.`
          : knownCat?.description || `Compra ${catName.toLowerCase()} online. Gran variedad de marcas y modelos para tu moto.`;

        // SEO dinámico para Filtros
        if (motoParam) {
          const cleanParam = decodeURIComponent(motoParam);
          const parts = cleanParam.includes('|') ? cleanParam.split('|') : cleanParam.split('-');
          const [brand, model, year] = parts;
          seoTitle = `${catName} para ${brand} ${model}${year && year !== 'General' ? ` (${year})` : ''}`;
          seoDesc = `Selección exclusiva de ${catName.toLowerCase()} compatibles con tu ${brand} ${model}. Máximo rendimiento y ajuste perfecto garantizado.`;
        } else if (brandParam) {
          seoTitle = `${catName} de la marca ${brandParam}`;
          seoDesc = `Catálogo completo de ${catName.toLowerCase()} ${brandParam}. Compra productos originales con garantía oficial del fabricante.`;
        }

        const jsonLd: any[] = [
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Inicio",
                "item": "https://escapesymas.com/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": catName,
                "item": `https://escapesymas.com/${urlCategory || 'recambios'}`
              }
            ]
          }
        ];

        if (!query && !motoParam && !brandParam) {
          jsonLd.push({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": seoTitle,
            "description": seoDesc,
            "url": `https://escapesymas.com/${urlCategory || 'recambios'}`
          });
        }

        return {
          title: seoTitle,
          description: seoDesc,
          canonical: (!urlCategory || urlCategory === 'recambios') ? '/recambios' : `/${urlCategory}`,
          jsonLd
        };
      case 'product':
        if (selectedProduct) {
          const cleanDesc = selectedProduct.description?.replace(/<[^>]*>/g, '').substring(0, 160).trim() || `Comprar ${selectedProduct.title}`;
          return {
            title: selectedProduct.title,
            description: cleanDesc,
            canonical: `/${selectedProduct.categorySlug || 'recambios'}/${selectedProduct.id}${selectedProduct.slug ? `-${selectedProduct.slug}` : ''}`,
            image: selectedProduct.image,
            jsonLd: [
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": selectedProduct.title,
                "image": [selectedProduct.image],
                "description": cleanDesc,
                "sku": selectedProduct.sku,
                "brand": {
                  "@type": "Brand",
                  "name": selectedProduct.brand || "Generico"
                },
                "offers": {
                  "@type": "Offer",
                  "url": `https://escapesymas.com/${selectedProduct.categorySlug || 'recambios'}/${selectedProduct.id}${selectedProduct.slug ? `-${selectedProduct.slug}` : ''}`,
                  "priceCurrency": "EUR",
                  "price": selectedProduct.price,
                  "availability": selectedProduct.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  "itemCondition": "https://schema.org/NewCondition"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": selectedProduct.averageRating && selectedProduct.averageRating > 0 ? selectedProduct.averageRating : 5,
                  "reviewCount": selectedProduct.ratingCount && selectedProduct.ratingCount > 0 ? selectedProduct.ratingCount : 1
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://escapesymas.com/"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": selectedProduct.category || "Recambios",
                    "item": `https://escapesymas.com/${selectedProduct.categorySlug || 'recambios'}`
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": selectedProduct.title,
                    "item": `https://escapesymas.com/${selectedProduct.categorySlug || 'recambios'}/${selectedProduct.id}${selectedProduct.slug ? `-${selectedProduct.slug}` : ''}`
                  }
                ]
              }
            ]
          };
        }
        return { title: 'Cargando producto...', canonical: '' };
      case 'contact':
        return { title: 'Contacto', description: 'Contacta con nuestro equipo para dudas sobre escapes y recambios.', canonical: '/contacto' };
      case 'cart':
        return { title: 'Carrito', canonical: '/carrito' };
      case 'checkout':
        return { title: 'Finalizar Compra', canonical: '/checkout' };
      default:
        // Evitamos usar window.location aquí si podemos evitarlo para ser SSR friendly
        return { title: 'Escapes y Más', canonical: '/' };
    }
  }, [currentView, urlCategory, selectedProduct, query, motoParam, brandParam]);
}
