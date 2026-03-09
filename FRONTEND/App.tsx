
import React, { useEffect, useState, Suspense, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2, WifiOff, Trash2, ChevronLeft, Package, Truck, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { Header } from './components/Header';
import { SEO } from './components/SEO';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BikeSelector } from './components/BikeSelector';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { Cart } from './components/Cart';
import { CategoryBrowser } from './components/CategoryBrowser';
import { Contact } from './components/Contact';
import { BrandSlider } from './components/BrandSlider';
import { FeaturesBanner } from './components/FeaturesBanner';
import { ProductSkeleton } from './components/ProductSkeleton';
import { STORE_CONFIG, FEATURES, BIKE_DATA, CATEGORIES, TIRE_CATEGORY_ID } from './storeData';
import { fetchProducts, saveUserCart, getUserCart, fetchCategories, fetchCustomerByEmail, fetchProductsByIds } from './services/woocommerce';
import { saveSession, getSession, logoutSession } from './services/auth';
import { trackPageView, trackViewItem, trackAddToCart } from './utils/analytics';
import { Product, BikeSelection, TireSelection, CartItem, User } from './types';
import { optimizeImage } from './utils/imageOptimizer';

const Checkout = React.lazy(() => import('./components/Checkout').then(m => ({ default: m.Checkout })));
const Login = React.lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./components/Register').then(m => ({ default: m.Register })));
const MyOrders = React.lazy(() => import('./components/MyOrders').then(m => ({ default: m.MyOrders })));
const MyAccount = React.lazy(() => import('./components/MyAccount').then(m => ({ default: m.MyAccount })));
const Paddock = React.lazy(() => import('./components/social/Paddock').then(m => ({ default: m.Paddock })));
const Warranty = React.lazy(() => import('./components/Warranty').then(m => ({ default: m.Warranty })));
const AIAdvisor = React.lazy(() => import('./components/AIAdvisor').then(m => ({ default: m.AIAdvisor })));
const SocialFeed = React.lazy(() => import('./components/social/SocialFeed').then(m => ({ default: m.SocialFeed })));
const UserProfile = React.lazy(() => import('./components/social/UserProfile').then(m => ({ default: m.UserProfile })));

type ViewState = 'home' | 'catalog' | 'product' | 'cart' | 'checkout' | 'login' | 'register' | 'orders' | 'account' | 'categories' | 'forum' | 'contact' | 'warranty' | 'social' | 'user_profile';

// Known category slugs for URL matching
const KNOWN_CATEGORIES = ['escapes', 'frenos', 'accesorios', 'protecciones', 'recambios', 'lubricantes', 'electrónica', 'suspensiones'];

// Helper to parse URL path to view state
const parsePathToView = (path: string): { view: ViewState; category?: string; productId?: string; userId?: string } => {
  const cleanPath = path.toLowerCase().replace(/\/$/, ''); // Remove trailing slash

  if (cleanPath === '' || cleanPath === '/') return { view: 'home' };
  if (cleanPath === '/recambios') return { view: 'catalog' };
  if (cleanPath === '/carrito') return { view: 'cart' };
  if (cleanPath === '/checkout') return { view: 'checkout' };
  if (cleanPath === '/login') return { view: 'login' };
  if (cleanPath === '/registro') return { view: 'register' };
  if (cleanPath.startsWith('/mi-cuenta')) return { view: 'account' };
  if (cleanPath === '/mis-pedidos') return { view: 'orders' };
  if (cleanPath === '/garantia') return { view: 'warranty' };
  if (cleanPath === '/contacto') return { view: 'contact' };
  if (cleanPath.startsWith('/paddock/user/')) {
    const parts = cleanPath.split('/paddock/user/');
    if (parts.length > 1 && parts[1]) return { view: 'user_profile', userId: parts[1].split('/')[0] };
  }
  if (cleanPath.startsWith('/foro') || cleanPath.startsWith('/paddock')) return { view: 'forum' }; // Map Paddock to Forum component
  if (cleanPath === '/social') return { view: 'social' };
  if (cleanPath === '/categorias') return { view: 'categories' };

  // Check for generic Product URL pattern: /category/123 or /category/123-slug
  const parts = cleanPath.split('/').filter(Boolean);

  if (parts.length >= 1) {
    // If second part exists and starts with a number, assume it's a product
    if (parts.length >= 2 && /^\d+/.test(parts[1])) {
      return { view: 'product', category: parts[0], productId: parts[1] };
    }

    // Otherwise, treat first part as category (e.g. /coronas, /escapes)
    // We implicitly trust that any single path segment might be a valid category
    // This allows WooCommerce categories like 'coronas' to work without hardcoding
    return { view: 'catalog', category: parts[0] };
  }

  // Fallback
  return { view: 'home' };
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL on first render
  const initialParsed = parsePathToView(location.pathname);

  // STATE: currentView is the source of truth
  const [currentView, setCurrentView] = useState<ViewState>(initialParsed.view);
  const [urlCategory, setUrlCategory] = useState<string | undefined>(initialParsed.category);
  const [urlProductId, setUrlProductId] = useState<string | undefined>(initialParsed.productId);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false); // Start as false, set to true when fetching
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('escapesymas_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCatalogProducts, setTotalCatalogProducts] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'price-asc'>('date');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  // Parse filters from URL


  // Parse filters from URL
  const query = searchParams.get('q') || undefined;
  const categoryIdParam = searchParams.get('cat');
  const motoParam = searchParams.get('moto');
  const brandParam = searchParams.get('brand'); // New Brand Filter
  const tireParam = searchParams.get('tire'); // New Tire Filter

  const [brands, setBrands] = useState<{ name: string; logo: string }[]>([]);

  // Load Brands for Filter
  useEffect(() => {
    fetch('/brands.txt')
      .then(res => res.text())
      .then(text => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const parsed = lines.map(line => {
          const [name, logo] = line.split(',');
          return { name: name?.trim(), logo: logo?.trim() };
        }).filter(b => b.name);
        setBrands(parsed);
      })
      .catch(e => console.error("Error loading brands", e));
  }, []);


  // Initialize Session
  useEffect(() => {
    const initialize = async () => {
      const savedUser = getSession();
      if (savedUser) {
        let currentUser = savedUser as unknown as User;
        // AUTO-REPAIR Logic
        if ((!currentUser.id || currentUser.id === 0) && (currentUser.email || (savedUser as any).user_email)) {
          try {
            const email = currentUser.email || (savedUser as any).user_email;
            const freshData = await fetchCustomerByEmail(email);
            if (freshData && freshData.id > 0) {
              currentUser = { ...currentUser, ...freshData, token: (savedUser as any).token };
              saveSession(currentUser);
            }
          } catch (e) { console.error(e); }
        }
        setUser(currentUser);

        // Recover Cart ONLY if local cart is empty to avoid overwriting recent changes
        const localCart = localStorage.getItem('escapesymas_cart');
        const hasLocalItems = localCart && JSON.parse(localCart).length > 0;

        if (currentUser.id && currentUser.id > 0 && !hasLocalItems) {
          try {
            const savedCart = await getUserCart(currentUser.id);
            if (savedCart.length > 0) {
              const { products: allProducts } = await fetchProducts(undefined, undefined, 1, 100);
              const restoredCart = savedCart.map(item => {
                const product = allProducts.find(p => p.id === item.product_id);
                return product ? { ...product, quantity: item.quantity } : null;
              }).filter(Boolean) as CartItem[];
              if (restoredCart.length > 0) setCart(restoredCart);
            }
          } catch (e) { console.error(e); }
        }
      }
    };
    initialize();
  }, []);

  // Analytics & Scroll Top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageView(window.location.pathname + window.location.search);
  }, [location.pathname, location.search]);

  // URL -> State Sync (runs on location change)
  useEffect(() => {
    const parsed = parsePathToView(location.pathname);
    setCurrentView(parsed.view);
    setUrlCategory(parsed.category);
    setUrlProductId(parsed.productId);

    // If we have a product ID from URL, try to fetch it
    if (parsed.view === 'product' && parsed.productId) {
      const productId = parseInt(parsed.productId);

      // Fetch if no product is selected OR if the selected product ID doesn't match URL
      if (!isNaN(productId) && (!selectedProduct || selectedProduct.id !== productId)) {
        console.log(`[APP] URL changed to product ${productId}, fetching...`);
        fetchProductById(productId);
      }
    }
  }, [location.pathname]);

  // Fetch product by ID helper
  const fetchProductById = async (id: number) => {
    setLoading(true);
    try {
      const products = await fetchProductsByIds([id]);
      if (products.length > 0) {
        setSelectedProduct(products[0]);
      }
    } catch (e) {
      console.error('Error fetching product by ID', e);
    } finally {
      setLoading(false);
    }
  };

  // Load Home Featured
  useEffect(() => {
    if (currentView === 'home') {
      loadFeaturedProducts();
    }
  }, [currentView]);

  // Initial data load on mount
  useEffect(() => {
    const initView = parsePathToView(location.pathname).view;
    if (initView === 'home') {
      loadFeaturedProducts();
    } else if (initView === 'catalog') {
      handleProductFetch(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // 1. Refetch when FILTERS change (Reset to Page 1)
  useEffect(() => {
    if (currentView === 'catalog') {
      if (motoParam) {
        // Decode in case it's URL encoded
        const cleanParam = decodeURIComponent(motoParam);
        const separator = cleanParam.includes('|') ? '|' : '-';
        const [brand, model, year] = cleanParam.split(separator);
        setCurrentFilter(`${brand} ${model} ${year}`);
      } else if (tireParam) {
        setCurrentFilter(`Neumáticos: ${tireParam}`);
      } else if (urlCategory) {
        // Decode URL to display proper text
        const decoded = decodeURIComponent(urlCategory);
        setCurrentFilter(decoded.charAt(0).toUpperCase() + decoded.slice(1));
      } else if (query) {
        setCurrentFilter(`Búsqueda: "${query}"`);
      } else {
        setCurrentFilter(null);
      }

      // ONLY reset to page 1 if the filters actually changed (handled by dependency array)
      setCurrentPage(1);
      handleProductFetch(1);
    }
  }, [currentView, urlCategory, query, motoParam, brandParam, tireParam, perPage, sortBy]); // Added tireParam

  // 2. Refetch when PAGE changes (Do not reset page)
  useEffect(() => {
    if (currentView === 'catalog') {
      // Avoid fetching if page is 1 (handled by filter effect above) 
      // UNLESS we are strictly paging. 
      // Actually, simplest is to just fetch. Use a ref to prevent double-fetch if needed, or rely on request de-duping/state.
      // But we removed currentPage from the above effect, so this isolates the page change.
      handleProductFetch(currentPage);
    }
  }, [currentPage]);

  // Load Product Detail - handled by URL sync effect above

  const loadFeaturedProducts = async () => {
    setLoading(true);
    try {
      // Fetch 50 products initially to ensure we find at least 4 with actual images
      const { products: all, totalProducts } = await fetchProducts(undefined, undefined, 1, 50);
      const curated = all.filter(p => p.image !== STORE_CONFIG.defaultProductImage).slice(0, 4);
      setProducts(curated);
      if (totalProducts > 0) setTotalCatalogProducts(totalProducts);
    } catch (e: any) {
      setError("Error de conexión con el catálogo.");
    } finally {
      setLoading(false);
    }
  };

  const handleProductFetch = async (pageToLoad: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const orderBy = sortBy === 'date' ? 'date' : 'price';
      const order = sortBy === 'price-asc' ? 'asc' : 'desc';

      let targetCatId = categoryIdParam ? parseInt(categoryIdParam) : undefined;

      // Restrict to Tires category if searching by tire dimension
      if (tireParam) {
        targetCatId = TIRE_CATEGORY_ID;
      } else if (!targetCatId && urlCategory) {
        try {
          const allCats = await fetchCategories();

          const decodedUrlCat = decodeURIComponent(urlCategory).toLowerCase();

          const match = allCats.find(c =>
            c.slug.toLowerCase() === decodedUrlCat ||
            c.name.toLowerCase() === decodedUrlCat ||
            // Fallback: Check if decoded URL contains the slug (handle partials like 'portamatriculas' vs 'portamatrículas')
            c.slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === decodedUrlCat.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          );

          if (match) {
            targetCatId = match.id;
            if (currentView === 'catalog') setCurrentFilter(match.name);
          } else {
            // If no exact match found, it might be a sub-category or custom route not in main list
            // Try to search by slug directly in product fetch if ID resolution fails
            console.warn(`[CATALOG] Category ID resolution failed for: ${urlCategory}`);
          }
        } catch (err) {
          console.error("Error resolving category slug", err);
        }
      }

      // 3. COMBINE SEARCH TERMS FOR SERVER-SIDE FILTERING
      // This forces the server to search across Title, SKU and Description
      const searchTerms: string[] = [];

      if (query) searchTerms.push(query);

      if (motoParam) {
        const cleanParam = decodeURIComponent(motoParam);
        const separator = cleanParam.includes('|') ? '|' : '-';
        const [brand, model, year] = cleanParam.split(separator);
        // Inject vehicle info into search - BROAD SEARCH (No Year) to find compatible consumables
        searchTerms.push(`${brand} ${model}`);
      }

      if (brandParam) {
        searchTerms.push(brandParam);
      }

      if (tireParam) {
        // We push the tire measure to search. 
        // We use space as separator for broad matching (120 70 17)
        const cleanTire = tireParam.replace(/[/\-]/g, ' ');
        searchTerms.push(cleanTire);
      }

      const combinedQuery = searchTerms.length > 0 ? searchTerms.join(' ') : undefined;

      const { products: matches, totalPages: pages, totalProducts } = await fetchProducts(
        combinedQuery,
        targetCatId,
        pageToLoad,
        perPage,
        orderBy,
        order
      );

      // No client-side filtering needed anymore as we are using the enhanced server search
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
  };

  const handleTextSearch = (q: string) => {
    setSearchParams({ q });
    navigate(`/recambios?q=${q}`);
  };

  const handleBikeSearch = (selection: BikeSelection) => {
    const param = `${selection.brand}|${selection.model}|${selection.year}`;
    setSearchParams({ moto: param });
    navigate(`/recambios?moto=${encodeURIComponent(param)}`);
  };

  const handleTireSearch = (selection: TireSelection) => {
    const param = `${selection.width}/${selection.profile}-${selection.rim}`;
    setSearchParams({ tire: param });
    navigate(`/recambios?tire=${encodeURIComponent(param)}`);
  };

  const handleNavClick = (target: ViewState, cat?: string) => {
    if (target === 'home') navigate('/');
    else if (target === 'catalog') navigate(cat ? `/${cat.toLowerCase()}` : '/recambios');
    else if (target === 'cart') navigate('/carrito');
    else if (target === 'orders') navigate('/mis-pedidos');
    else if (target === 'account') navigate('/mi-cuenta');
    else if (target === 'login') navigate('/login');
    else if (target === 'forum') navigate('/paddock');
    else if (target === 'social') navigate('/social');
    else if (target === 'contact') navigate('/contacto');
    else if (target === 'warranty') navigate('/garantia');
    else if (target === 'categories') navigate('/categorias');
  };

  const handleClearFilters = () => {
    setCurrentFilter(null);
    setSearchParams({});
    navigate('/recambios');
    handleProductFetch(1);
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    trackAddToCart(product, quantity);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });

    // Show Toast
    setToast({
      message: `Añadido: ${product.title} (${quantity})`,
      type: 'success'
    });

    // Auto-hide toast
    setTimeout(() => setToast(null), 3000);
  };

  // Sync Cart with LocalStorage and Server
  useEffect(() => {
    localStorage.setItem('escapesymas_cart', JSON.stringify(cart));

    if (user && user.id && user.id > 0 && cart.length > 0) {
      const cartData = cart.map(item => ({ product_id: item.id, quantity: item.quantity }));
      saveUserCart(user.id, cartData);
    }
  }, [cart, user]);

  const renderPagination = () => {
    if (totalPages <= 1 || loading) return null;

    const getPageRange = () => {
      const delta = 2; // Páginas a mostrar a cada lado de la actual
      const range: (number | string)[] = [];
      range.push(1);
      const start = Math.max(2, currentPage - delta);
      const end = Math.min(totalPages - 1, currentPage + delta);
      if (start > 2) range.push('...');
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      if (end < totalPages - 1) range.push('...');
      if (totalPages > 1) range.push(totalPages);
      return range;
    };

    const pages = getPageRange();

    const handleGoToPage = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const input = e.currentTarget.elements.namedItem('pageInput') as HTMLInputElement;
      const page = parseInt(input.value);
      if (page >= 1 && page <= totalPages) {
        handleProductFetch(page);
        input.value = '';
      }
    };

    return (
      <div className="flex flex-wrap justify-center items-center gap-2 mt-12 py-8 border-t border-zinc-900">
        <button
          disabled={currentPage === 1}
          onClick={() => handleProductFetch(currentPage - 1)}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white hover:border-racing-orange disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {pages.map((p, idx) => (
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="text-zinc-600 px-2">...</span>
          ) : (
            <button
              key={p}
              onClick={() => handleProductFetch(p as number)}
              className={`w-10 h-10 rounded-sm font-bold text-sm border transition-all ${currentPage === p ? 'bg-racing-orange border-racing-orange text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}
            >
              {p}
            </button>
          )
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => handleProductFetch(currentPage + 1)}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white hover:border-racing-orange disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Input para ir a página específica */}
        <form onSubmit={handleGoToPage} className="flex items-center gap-2 ml-4">
          <span className="text-zinc-500 text-xs">Ir a:</span>
          <input
            type="number"
            name="pageInput"
            min={1}
            max={totalPages}
            placeholder={currentPage.toString()}
            className="w-16 bg-zinc-900 border border-zinc-800 text-white text-sm px-2 py-2 rounded-sm focus:border-racing-orange focus:outline-none text-center"
          />
          <span className="text-zinc-600 text-xs">/ {totalPages}</span>
        </form>
      </div>
    );
  };

  const renderProductGrid = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-racing-orange animate-spin mb-4" />
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Sincronizando garaje...</p>
      </div>
    );

    if (error) return (
      <div className="text-center py-20 bg-zinc-900/30 rounded-sm border border-zinc-800 p-8">
        <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-white font-bold mb-2">{error}</h3>
        <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">{errorDetail}</p>
        <button onClick={handleClearFilters} className="bg-racing-orange text-white px-6 py-2 rounded-sm font-bold uppercase text-xs">Reintentar</button>
      </div>
    );

    if (products.length === 0) return (
      <div className="text-center py-24 bg-white dark:bg-zinc-900/10 rounded-sm border border-zinc-200 dark:border-zinc-800 p-12 max-w-2xl mx-auto shadow-sm">
        <div className="bg-zinc-100 dark:bg-zinc-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
        </div>
        <h3 className="text-2xl font-black uppercase italic text-zinc-900 dark:text-white mb-4">No hemos encontrado piezas exactas</h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          Nuestra base de datos es enorme, pero a veces el motor de búsqueda necesita un poco de ayuda. Prueba a buscar por marca o modelo general, o contacta con nuestros expertos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={handleClearFilters} className="bg-zinc-900 dark:bg-zinc-800 text-white px-8 py-3 rounded-sm font-bold uppercase text-xs tracking-widest hover:bg-black transition-colors">
            Ver todo el catálogo
          </button>
          <button onClick={() => navigate('/contacto')} className="border border-racing-orange text-racing-orange px-8 py-3 rounded-sm font-bold uppercase text-xs tracking-widest hover:bg-racing-orange hover:text-white transition-all">
            Contactar Experto
          </button>
        </div>
      </div>
    );

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product?.id || `p-${index}`}
              priority={index < 4}
              product={product}
              onClick={(p) => {
                if (!p?.id) return;
                setSelectedProduct(p);
                trackViewItem(p);
                navigate(`/${p.categorySlug || 'recambios'}/${p.id}`);
              }}
              onAddToCart={() => product && addToCart(product, 1)}
            />
          ))}
        </div>
        {currentView === 'catalog' && renderPagination()}
      </>
    );
  };

  // SEO Logic
  const seoData = useMemo(() => {
    switch (currentView) {
      case 'home':
        return {
          title: 'Tienda de Escapes y Recambios para Moto',
          description: 'Encuentra los mejores escapes y accesorios para tu moto. Akrapovic, Mivv, Arrow y más al mejor precio.',
          canonical: '/'
        };
      case 'catalog':
        const catName = urlCategory ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1) : 'Catálogo';
        const metaDesc = query
          ? `Resultados de búsqueda para "${query}" en Escapes y Más.`
          : `Compra ${catName.toLowerCase()} online. Gran variedad de marcas y modelos para tu moto.`;
        return {
          title: query ? `Buscar: ${query}` : `${catName} para Moto`,
          description: metaDesc,
          // Explicitly set /recambios for root catalog to disambiguate from home
          canonical: (!urlCategory || urlCategory === 'recambios') ? '/recambios' : `/${urlCategory}`
        };
      case 'product':
        if (selectedProduct) {
          const cleanDesc = selectedProduct.description?.replace(/<[^>]*>/g, '').substring(0, 160).trim() || `Comprar ${selectedProduct.title}`;
          return {
            title: selectedProduct.title,
            description: cleanDesc,
            canonical: `/${selectedProduct.categorySlug || 'recambios'}/${selectedProduct.id}`,
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
                  "url": `https://escapesymas.com/${selectedProduct.categorySlug || 'recambios'}/${selectedProduct.id}`,
                  "priceCurrency": "EUR",
                  "price": selectedProduct.price,
                  "availability": selectedProduct.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  "itemCondition": "https://schema.org/NewCondition"
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
                    "item": `https://escapesymas.com/${selectedProduct.categorySlug || 'recambios'}/${selectedProduct.id}`
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
        return { title: 'Escapes y Más', canonical: window.location.pathname };
    }
  }, [currentView, urlCategory, selectedProduct, query]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black w-full overflow-x-hidden">
        <SEO {...seoData} />
        <Header
          cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
          user={user}
          onCartClick={() => navigate('/carrito')}
          onLogoClick={() => navigate('/')}
          onLoginClick={() => navigate('/login')}
          onLogoutClick={() => { setUser(null); logoutSession(); navigate('/'); }}
          onOrdersClick={() => navigate('/mis-pedidos')}
          onAccountClick={() => navigate('/mi-cuenta')}
          onNavClick={handleNavClick}
        />

        <main className="flex-grow w-full">
          <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-racing-orange animate-spin" /></div>}>
            {currentView === 'login' && <Login onLoginSuccess={(u) => { setUser(u); saveSession(u); navigate(-1); }} onBack={() => navigate(-1)} onRegisterClick={() => navigate('/registro')} />}
            {currentView === 'register' && <Register onRegisterSuccess={() => navigate('/login')} onBack={() => navigate('/login')} onGoToLogin={() => navigate('/login')} />}
            {currentView === 'forum' && <Paddock user={user} onBack={() => navigate('/')} onLoginRequest={() => navigate('/login')} />}
            {currentView === 'categories' && <CategoryBrowser onSelectCategory={(_, name) => navigate(`/${name.toLowerCase()}`)} onBack={() => navigate('/')} />}
            {currentView === 'checkout' && <Checkout cart={cart} user={user} onBack={() => navigate('/carrito')} onOrderComplete={() => { setCart([]); navigate('/'); }} onLoginSuccess={(u) => { setUser(u); saveSession(u); }} />}
            {currentView === 'orders' && user && <MyOrders user={user} onBack={() => navigate('/')} />}
            {currentView === 'account' && user && <MyAccount user={user} onBack={() => navigate('/')} onUpdateUser={setUser} />}
            {currentView === 'warranty' && <Warranty user={user} onBack={() => navigate('/')} onLoginRequest={() => navigate('/login')} />}
            {currentView === 'social' && <SocialFeed user={user} onBack={() => navigate('/')} onLoginRequest={() => navigate('/login')} />}
            {currentView === 'user_profile' && <UserProfile currentUser={user} targetUserId={parseInt(parsePathToView(location.pathname).userId || '0')} onBack={() => window.history.back()} onLoginRequest={() => navigate('/login')} />}
            {currentView === 'contact' && <Contact onBack={() => navigate('/')} />}

            {currentView === 'cart' && (
              <Cart
                items={cart}
                user={user}
                onUpdateQuantity={(id, delta) => setCart(p => p.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))}
                onRemove={(id) => setCart(p => p.filter(i => i.id !== id))}
                onCheckout={() => navigate('/checkout')}
                onContinueShopping={() => navigate('/recambios')}
                onRestoreCart={(items) => setCart(items)}
              />
            )}

            {currentView === 'product' && selectedProduct && (
              <ProductDetail
                product={selectedProduct}
                onBack={() => navigate(-1)}
                onAddToCart={(qty) => addToCart(selectedProduct, qty)}
                onProductClick={(product) => { setSelectedProduct(product); navigate(`/${product.categorySlug || 'recambios'}/${product.id}`); }}
              />
            )}

            {currentView === 'home' && (
              <>
                <section className="relative h-[500px] flex items-center justify-center bg-zinc-900 overflow-hidden">
                  <picture className="absolute inset-0 w-full h-full">
                    <source media="(max-width: 480px)" srcSet="/hero-sm.avif" type="image/avif" />
                    <source media="(max-width: 768px)" srcSet="/hero-md.avif" type="image/avif" />
                    <source srcSet="/hero-lg.avif" type="image/avif" />
                    <img
                      src="/hero-lg.avif"
                      className="w-full h-full object-cover opacity-40 grayscale"
                      alt="Taller Moto"
                      fetchPriority="high"
                      width="1280"
                      height="1920"
                      decoding="async"
                    />
                  </picture>
                  <div className="relative z-10 text-center px-4">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white uppercase italic mb-4">{STORE_CONFIG.heroTitle}</h1>
                    <p className="text-racing-orange font-bold uppercase tracking-widest text-xl">{STORE_CONFIG.heroSubtitle}</p>
                  </div>
                </section>

                {/* Stock Counter Bar */}
                <section className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-t border-b border-zinc-700/50">
                  <div className="container mx-auto px-4 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-racing-orange/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-racing-orange" />
                        </div>
                        <div className="text-left">
                          <p className="text-2xl md:text-3xl font-extrabold text-white italic">
                            {totalCatalogProducts > 0 ? totalCatalogProducts.toLocaleString('es-ES') : '...'}
                          </p>
                          <p className="text-xs text-zinc-400 uppercase tracking-wider">Productos en stock</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-racing-orange/20 flex items-center justify-center">
                          <Truck className="w-5 h-5 text-racing-orange" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">Envío Rápido</p>
                          <p className="text-xs text-zinc-400">Península y Canarias</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-racing-orange/20 flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 text-racing-orange" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">Garantía Oficial</p>
                          <p className="text-xs text-zinc-400">Distribuidores autorizados</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Featured Products Section */}
                <section className="py-12 bg-white dark:bg-zinc-950 container mx-auto px-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white uppercase italic mb-8 border-l-4 border-racing-orange pl-4">Productos Destacados</h2>
                  {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {products.slice(0, 4).map((product, index) => (
                        <ProductCard
                          key={product.id}
                          priority={true}
                          product={product}
                          onClick={(p) => {
                            setSelectedProduct(p);
                            trackViewItem(p);
                            navigate(`/${p.categorySlug || 'recambios'}/${p.id}`);
                          }}
                          onAddToCart={() => addToCart(product, 1)}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <FeaturesBanner />
                <BrandSlider />
              </>
            )}

            {currentView === 'catalog' && (
              <div ref={catalogRef}>
                <section className="pt-32 pb-12 bg-white dark:bg-zinc-950">
                  <BikeSelector
                    onSearch={handleBikeSearch}
                    onTireSearch={handleTireSearch}
                    onTextSearch={handleTextSearch}
                    isLoading={loading}
                    bikeData={BIKE_DATA}
                  />
                </section>
                <section className="py-12 bg-white dark:bg-zinc-950 min-h-screen container mx-auto px-4 border-t border-zinc-200 dark:border-zinc-900">
                  <div className="flex flex-col gap-6 mb-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white uppercase italic">{currentFilter || "Catálogo"}</h2>
                        {(currentFilter || brandParam || motoParam) && (
                          <button onClick={handleClearFilters} className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Limpiar
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        {/* Brand Filter */}
                        <select
                          value={brandParam || ''}
                          onChange={(e) => {
                            const newParams = new URLSearchParams(searchParams);
                            if (e.target.value) newParams.set('brand', e.target.value);
                            else newParams.delete('brand');
                            setSearchParams(newParams);
                            navigate(`/recambios?${newParams.toString()}`);
                          }}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm px-3 py-2 rounded-sm focus:border-racing-orange focus:outline-none cursor-pointer max-w-[150px]"
                        >
                          <option value="">Todas las Marcas</option>
                          {brands.map(b => (
                            <option key={b.name} value={b.name}>{b.name}</option>
                          ))}
                        </select>

                        {/* Category Filter */}
                        <select
                          value={urlCategory || ''}
                          onChange={(e) => {
                            if (e.target.value) handleNavClick('catalog', e.target.value);
                            else handleNavClick('catalog');
                          }}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm px-3 py-2 rounded-sm focus:border-racing-orange focus:outline-none cursor-pointer max-w-[150px]"
                        >
                          <option value="">Todas las Categorías</option>
                          {CATEGORIES.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>

                        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

                        <div className="flex items-center gap-2">
                          <label htmlFor="perPage" className="text-zinc-500 text-xs uppercase hidden md:inline">Mostrar:</label>
                          <select
                            id="perPage"
                            value={perPage}
                            onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm px-3 py-2 rounded-sm focus:border-racing-orange focus:outline-none cursor-pointer"
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label htmlFor="sortBy" className="text-zinc-500 text-xs uppercase hidden md:inline">Ordenar:</label>
                          <select
                            id="sortBy"
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value as 'date' | 'price' | 'price-asc'); setCurrentPage(1); }}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm px-3 py-2 rounded-sm focus:border-racing-orange focus:outline-none cursor-pointer"
                          >
                            <option value="date">Relevancia</option>
                            <option value="price">Precio: Mayor a menor</option>
                            <option value="price-asc">Precio: Menor a mayor</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-[500px]">
                    {loading ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
                      </div>
                    ) : renderProductGrid()}
                  </div>
                </section>
              </div>
            )}
          </Suspense>
        </main>
        <Footer onNavClick={handleNavClick} />

        {/* Global Toast Notification */}
        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
            <div className={`px-6 py-4 rounded-sm shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-racing-orange text-white border-orange-400' :
              toast.type === 'error' ? 'bg-red-600 text-white border-red-400' :
                'bg-zinc-900 text-white border-zinc-700'
              }`}>
              {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-bold uppercase tracking-wider">{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <Suspense fallback={null}>
          <AIAdvisor onProductClick={(p) => { setSelectedProduct(p); navigate(`/producto/${p.id}`); }} onAddToCart={(p) => addToCart(p)} user={user} onLoginRequest={() => navigate('/login')} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
