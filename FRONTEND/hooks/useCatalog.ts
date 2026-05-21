import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { fetchProducts, fetchCompatibleProducts, fetchCategories } from '../services/woocommerce';
import { STORE_CONFIG, TIRE_CATEGORY_ID } from '../storeData';

interface UseCatalogProps {
  currentView: string;
  urlCategory?: string;
  query?: string;
  motoParam?: string | null;
  categoryIdParam?: string | null;
  brandParam?: string | null;
  tireParam?: string | null;
  brandUrl?: string;
  modelUrl?: string;
  yearUrl?: string;
}

export function useCatalog({
  currentView,
  urlCategory,
  query,
  motoParam,
  categoryIdParam,
  brandParam,
  tireParam,
  brandUrl,
  modelUrl,
  yearUrl
}: UseCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCatalogProducts, setTotalCatalogProducts] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'price-asc'>('date');

  const renderFeaturedFromPool = useCallback((pool: { category: string, products: Product[] }[]) => {
    const curated: Product[] = [];
    pool.forEach(catPool => {
      if (catPool.products.length > 0) {
        const validOptions = catPool.products.filter(p => !curated.some(c => c.id === p.id));
        if (validOptions.length > 0) {
          const randomIndex = Math.floor(Math.random() * validOptions.length);
          curated.push(validOptions[randomIndex]);
        }
      }
    });

    if (curated.length < 4) {
      fetchProducts(undefined, undefined, 1, 10, 'date', 'desc', true).then(res => {
        const remaining = res.products.filter(p => !curated.some(c => c.id === p.id) && p.image !== STORE_CONFIG.defaultProductImage && p.inStock);
        const finalSet = [...curated, ...remaining.slice(0, 4 - curated.length)];
        setProducts(finalSet.slice(0, 4));
      }).catch(() => setProducts(curated.slice(0, 4)));
    } else {
      setProducts(curated.slice(0, 4));
    }
  }, []);

  const loadFeaturedProducts = useCallback(async () => {
    const CACHE_KEY = 'home_featured_pool';
    const CACHE_TTL = 1000 * 60 * 60; // 1 hour

    let cachedPool: { category: string, products: Product[] }[] | null = null;
    let isExpired = true;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        cachedPool = parsed.pool;
        isExpired = Date.now() - parsed.timestamp > CACHE_TTL;
      }
    } catch (e) { console.error('Cache read error', e); }

    if (cachedPool) {
      renderFeaturedFromPool(cachedPool);
    }

    if (!cachedPool || isExpired) {
      if (!cachedPool) setLoading(true);

      const searchTerms = ['casco integral', 'baul', 'chaqueta', 'silencioso'];
      try {
        const promises = searchTerms.map(term => fetchProducts(term, undefined, 1, 10, 'date', 'desc', true));
        const results = await Promise.all(promises);

        const newPool = results.map((res, index) => {
          let validProducts = res.products.filter(p => p.image !== STORE_CONFIG.defaultProductImage && p.inStock && p.title.toLowerCase().includes(searchTerms[index].split(' ')[0]));
          if (validProducts.length === 0) {
            validProducts = res.products.filter(p => p.image !== STORE_CONFIG.defaultProductImage && p.inStock);
          }
          return { category: searchTerms[index], products: validProducts };
        });

        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), pool: newPool }));
        renderFeaturedFromPool(newPool);
      } catch (e: any) {
        if (!cachedPool) setError("Error de conexión con el catálogo.");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    fetchProducts(undefined, undefined, 1, 1, 'date', 'desc', true).then(r => {
      if (r.totalProducts > 0) setTotalCatalogProducts(r.totalProducts);
    }).catch(() => { });
  }, [renderFeaturedFromPool]);

  const handleProductFetch = useCallback(async (pageToLoad: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const orderBy = sortBy === 'date' ? 'date' : 'price';
      const order = sortBy === 'price-asc' ? 'asc' : 'desc';

      let targetCatId: number | undefined = undefined;
      if (categoryIdParam) {
        const parsed = parseInt(categoryIdParam);
        if (!isNaN(parsed)) {
          targetCatId = parsed;
          try {
            const allCats = await fetchCategories();
            const match = allCats.find(c => c.id === parsed);
            if (match && currentView === 'catalog') setCurrentFilter(match.name);
          } catch {}
        } else {
          try {
            const allCats = await fetchCategories();
            const decodedCat = decodeURIComponent(categoryIdParam).toLowerCase();
            const match = allCats.find(c =>
              c.slug.toLowerCase() === decodedCat ||
              c.name.toLowerCase() === decodedCat ||
              c.slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === decodedCat.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            );
            if (match) {
              targetCatId = match.id;
              if (currentView === 'catalog') setCurrentFilter(match.name);
            }
          } catch (err) {
            console.error("Error resolving categoryIdParam slug", err);
          }
        }
      }

      const activeBrand = brandUrl || (motoParam ? decodeURIComponent(motoParam).split(motoParam.includes('|') ? '|' : '-')[0] : undefined);
      const activeModel = modelUrl || (motoParam ? decodeURIComponent(motoParam).split(motoParam.includes('|') ? '|' : '-')[1] : undefined);
      const activeYear = yearUrl || (motoParam ? decodeURIComponent(motoParam).split(motoParam.includes('|') ? '|' : '-')[2] : undefined);

      if (activeBrand && activeModel && activeYear && !query) {
        const { products: matches, totalPages: pages, totalProducts } = await fetchCompatibleProducts(
          activeBrand, activeModel, activeYear, targetCatId, pageToLoad, perPage
        );
        
        setProducts(matches);
        setTotalPages(pages);
        if (totalProducts > 0) setTotalCatalogProducts(totalProducts);
        setCurrentPage(pageToLoad);
        return;
      }

      if (tireParam) {
        targetCatId = TIRE_CATEGORY_ID;
      } else if (!targetCatId && urlCategory) {
        try {
          const allCats = await fetchCategories();
          const decodedUrlCat = decodeURIComponent(urlCategory).toLowerCase();
          const match = allCats.find(c =>
            c.slug.toLowerCase() === decodedUrlCat ||
            c.name.toLowerCase() === decodedUrlCat ||
            c.slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === decodedUrlCat.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          );

          if (match) {
            targetCatId = match.id;
            if (currentView === 'catalog') setCurrentFilter(match.name);
          }
        } catch (err) {
          console.error("Error resolving category slug", err);
        }
      }

      const searchTerms: string[] = [];
      let motoData: { brand: string, model: string, year?: string } | undefined = undefined;

      if (query) searchTerms.push(query);

      if (motoParam) {
        const cleanParam = decodeURIComponent(motoParam);
        const separator = cleanParam.includes('|') ? '|' : '-';
        const [brand, model, year] = cleanParam.split(separator);
        motoData = { brand, model, year };
        searchTerms.push(`${brand} ${model}`);
      }

      if (brandParam) {
        searchTerms.push(brandParam);
      }

      if (tireParam) {
        const cleanTire = tireParam.replace(/[/\-]/g, ' ');
        searchTerms.push(cleanTire);
      }

      const combinedQuery = searchTerms.length > 0 ? searchTerms.join(' ') : undefined;

      const { products: matches, totalPages: pages, totalProducts } = await fetchProducts(
        combinedQuery, targetCatId, pageToLoad, perPage, orderBy, order, false, motoData
      );

      setProducts(matches);
      setTotalPages(pages);
      if (totalProducts > 0) setTotalCatalogProducts(totalProducts);
      setCurrentPage(pageToLoad);
    } catch (e: any) {
      setError("Error cargando productos");
      setErrorDetail(e.message);
    } finally {
      setLoading(false);
    }
  }, [categoryIdParam, motoParam, query, perPage, tireParam, urlCategory, currentView, brandParam, sortBy, brandUrl, modelUrl, yearUrl]);

  // Handle Home Featured loading
  useEffect(() => {
    if (currentView === 'home') {
      loadFeaturedProducts();
    }
  }, [currentView, loadFeaturedProducts]);

  // Handle Catalog fetching
  useEffect(() => {
    if (currentView === 'catalog') {
      if (brandUrl && modelUrl) {
        setCurrentFilter(`${brandUrl} ${modelUrl} ${yearUrl && yearUrl !== 'General' ? yearUrl : ''}`.trim());
      } else if (motoParam) {
        const cleanParam = decodeURIComponent(motoParam);
        const separator = cleanParam.includes('|') ? '|' : '-';
        const [brand, model, year] = cleanParam.split(separator);
        setCurrentFilter(`${brand} ${model} ${year}`);
      } else if (tireParam) {
        setCurrentFilter(`Neumáticos: ${tireParam}`);
      } else if (urlCategory) {
        const decoded = decodeURIComponent(urlCategory);
        setCurrentFilter(decoded.charAt(0).toUpperCase() + decoded.slice(1));
      } else if (query) {
        setCurrentFilter(`Búsqueda: "${query}"`);
      } else {
        setCurrentFilter(null);
      }

      if (brandUrl || motoParam || urlCategory || query || categoryIdParam) {
        handleProductFetch(currentPage);
      } else {
        setProducts([]);
        setTotalPages(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, urlCategory, query, motoParam, categoryIdParam, brandParam, tireParam, perPage, sortBy, currentPage, brandUrl, modelUrl, yearUrl]);

  useEffect(() => {
    if (currentView === 'catalog' && currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCategory, query, motoParam, categoryIdParam, brandParam, tireParam, perPage, sortBy, brandUrl, modelUrl, yearUrl]);

  return {
    products, setProducts, loading, setLoading, error, errorDetail,
    currentFilter, setCurrentFilter, currentPage, setCurrentPage,
    totalPages, totalCatalogProducts, perPage, setPerPage, sortBy, setSortBy,
    handleProductFetch, loadFeaturedProducts
  };
}
