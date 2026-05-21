import { useMemo } from 'react';
import { Product } from '../types';
import { CATEGORIES, FLAT_CATEGORIES } from '../storeData';
import { cleanProductTitle } from '../utils/productUtils';

interface UseSEOProps {
  currentView: string;
  urlCategory?: string;
  selectedProduct?: Product | null;
  query?: string;
  motoParam?: string | null;
  brandParam?: string | null;
  brandUrl?: string;
  modelUrl?: string;
  yearUrl?: string;
}

export function useSEO({ currentView, urlCategory, selectedProduct, query, motoParam, brandParam, brandUrl, modelUrl, yearUrl }: UseSEOProps) {
  return useMemo(() => {
    switch (currentView) {
      case 'home':
        return {
          title: 'Tienda de Escapes y Recambios para Moto',
          description: 'Encuentra los mejores escapes y accesorios para tu moto. Akrapovic, Mivv, Arrow y más al mejor precio.',
          canonical: '/'
        };
      case 'catalog':
        const flatCat = urlCategory ? (FLAT_CATEGORIES[decodeURIComponent(urlCategory).toLowerCase()] || FLAT_CATEGORIES[urlCategory]) : null;
        const catName = flatCat ? flatCat.name : (urlCategory ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1) : 'Catálogo');
        const knownCat = CATEGORIES.find(c => c.id === urlCategory) || flatCat;

        let seoTitle = query ? `Búsqueda: ${query}` : `${catName} para Moto`;
        let seoDesc = query
          ? `Resultados de búsqueda para "${query}" en Escapes y Más.`
          : knownCat?.description || `Compra ${catName.toLowerCase()} online. Gran variedad de marcas y modelos para tu moto.`;

        // SEO dinámico para Filtros (Unificado SWR + Hierarchical URLs)
        const activeBrand = brandUrl || (motoParam ? decodeURIComponent(motoParam).split(motoParam.includes('|') ? '|' : '-')[0] : undefined);
        const activeModel = modelUrl || (motoParam ? decodeURIComponent(motoParam).split(motoParam.includes('|') ? '|' : '-')[1] : undefined);
        const activeYear = yearUrl || (motoParam ? decodeURIComponent(motoParam).split(motoParam.includes('|') ? '|' : '-')[2] : undefined);

        if (activeBrand && activeModel) {
          seoTitle = `${catName} para ${activeBrand} ${activeModel}${activeYear && activeYear !== 'General' ? ` (${activeYear})` : ''}`;
          seoDesc = `Selección exclusiva de ${catName.toLowerCase()} compatibles con tu ${activeBrand} ${activeModel}. Máximo rendimiento y ajuste perfecto garantizado.`;
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
          const cleanTitle = cleanProductTitle(selectedProduct.title);
          const cleanDesc = selectedProduct.description?.replace(/<[^>]*>/g, '').substring(0, 160).trim() || `Comprar ${cleanTitle}`;
          
          const activeBrand = brandUrl || (motoParam ? decodeURIComponent(motoParam).split(motoParam.includes('|') ? '|' : '-')[0] : undefined);
          const activeModel = modelUrl || (motoParam ? decodeURIComponent(motoParam).split(motoParam.includes('|') ? '|' : '-')[1] : undefined);
          const activeYear = yearUrl || (motoParam ? decodeURIComponent(motoParam).split(motoParam.includes('|') ? '|' : '-')[2] : undefined);

          const breadcrumbs: any[] = [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Inicio",
              "item": "https://escapesymas.com/"
            }
          ];

          let currentPos = 2;
          if (activeBrand && activeModel) {
            const bikeName = `${activeBrand} ${activeModel}${activeYear && activeYear !== 'General' ? ` (${activeYear})` : ''}`;
            const bikeSlug = `/recambios/${encodeURIComponent(activeBrand)}/${encodeURIComponent(activeModel)}/${encodeURIComponent(activeYear || 'General')}`;
            
            breadcrumbs.push({
              "@type": "ListItem",
              "position": currentPos++,
              "name": bikeName,
              "item": `https://escapesymas.com${bikeSlug}`
            });

            breadcrumbs.push({
              "@type": "ListItem",
              "position": currentPos++,
              "name": selectedProduct.category || "Recambios",
              "item": `https://escapesymas.com${bikeSlug}/${selectedProduct.categorySlug || 'recambios'}`
            });
          } else {
            breadcrumbs.push({
              "@type": "ListItem",
              "position": currentPos++,
              "name": selectedProduct.category || "Recambios",
              "item": `https://escapesymas.com/${selectedProduct.categorySlug || 'recambios'}`
            });
          }

          breadcrumbs.push({
            "@type": "ListItem",
            "position": currentPos,
            "name": cleanTitle,
            "item": `https://escapesymas.com/${selectedProduct.categorySlug || 'recambios'}/${selectedProduct.id}${selectedProduct.slug ? `-${selectedProduct.slug}` : ''}`
          });

          return {
            title: cleanTitle,
            description: cleanDesc,
            canonical: `/${selectedProduct.categorySlug || 'recambios'}/${selectedProduct.id}${selectedProduct.slug ? `-${selectedProduct.slug}` : ''}`,
            image: selectedProduct.image,
            jsonLd: [
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": cleanTitle,
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
                "itemListElement": breadcrumbs
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
