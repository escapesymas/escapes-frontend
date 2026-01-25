
import React, { useEffect, useState, Suspense, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2, WifiOff, Trash2, ChevronLeft } from 'lucide-react';
import { Header } from './components/Header';
import { SEO } from './components/SEO';
import { Footer } from './components/Footer';
import { BikeSelector } from './components/BikeSelector';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { Cart } from './components/Cart';
import { CategoryBrowser } from './components/CategoryBrowser';
import { Contact } from './components/Contact';
import { BrandSlider } from './components/BrandSlider';
import { PromoBanner } from './components/PromoBanner';
import { FeaturesBanner } from './components/FeaturesBanner';
import { STORE_CONFIG, FEATURES, BIKE_DATA } from './storeData';
import { fetchProducts, saveUserCart, getUserCart } from './services/woocommerce';
import { saveSession, getSession, logoutSession } from './services/auth';
import { pageview } from './services/analytics';
import { Product, BikeSelection, CartItem, User } from './types';
import { optimizeImage } from './utils/imageOptimizer';

const Checkout = React.lazy(() => import('./components/Checkout').then(m => ({ default: m.Checkout })));
const Login = React.lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./components/Register').then(m => ({ default: m.Register })));
const MyOrders = React.lazy(() => import('./components/MyOrders').then(m => ({ default: m.MyOrders })));
const MyAccount = React.lazy(() => import('./components/MyAccount').then(m => ({ default: m.MyAccount })));
const Forum = React.lazy(() => import('./components/Forum').then(m => ({ default: m.Forum })));
const Warranty = React.lazy(() => import('./components/Warranty').then(m => ({ default: m.Warranty })));
const AIAdvisor = React.lazy(() => import('./components/AIAdvisor').then(m => ({ default: m.AIAdvisor })));

type ViewState = 'home' | 'catalog' | 'product' | 'cart' | 'checkout' | 'login' | 'register' | 'orders' | 'account' | 'categories' | 'forum' | 'contact' | 'warranty';

// Known category slugs for URL matching
const KNOWN_CATEGORIES = ['escapes', 'frenos', 'accesorios', 'protecciones', 'recambios', 'lubricantes', 'electrónica', 'suspensiones'];

// Helper to parse URL path to view state
const parsePathToView = (path: string): { view: ViewState; category?: string; productId?: string } => {
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
  if (cleanPath.startsWith('/foro')) return { view: 'forum' };
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
  const [cart, setCart] = useState<CartItem[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'price-asc'>('date');
  const catalogRef = useRef<HTMLDivElement>(null);

  // Parse filters from URL
  const query = searchParams.get('q') || undefined;
  const categoryIdParam = searchParams.get('cat');
  const motoParam = searchParams.get('moto');


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
            const { fetchCustomerByEmail } = await import('./services/woocommerce');
            const freshData = await fetchCustomerByEmail(email);
            if (freshData && freshData.id > 0) {
              currentUser = { ...currentUser, ...freshData, token: (savedUser as any).token };
              saveSession(currentUser);
            }
          } catch (e) { console.error(e); }
        }
        setUser(currentUser);

        // Recover Cart
        if (currentUser.id && currentUser.id > 0) {
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
    pageview(window.location.pathname + window.location.search);
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
      const { fetchProductsByIds } = await import('./services/woocommerce');
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
        const [brand, model, year] = motoParam.split('-');
        setCurrentFilter(`${brand} ${model} ${year}`);
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
  }, [currentView, urlCategory, query, motoParam, perPage, sortBy]); // Removed currentPage from deps

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
      const { products: all } = await fetchProducts(undefined, undefined, 1, 10);
      const curated = all.filter(p => p.image !== STORE_CONFIG.defaultProductImage).slice(0, 4);
      setProducts(curated);
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

      // Resolve Category Slug to ID if needed
      if (!targetCatId && urlCategory) {
        try {
          const { fetchCategories } = await import('./services/woocommerce');
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

      const { products: matches, totalPages: pages } = await fetchProducts(
        query,
        targetCatId,
        pageToLoad,
        perPage,
        orderBy,
        order
      );

      // Filter by Moto locally if API doesn't support it yet
      let finalProducts = matches;
      if (motoParam) {
        const [brand, model] = motoParam.split('-');
        finalProducts = matches.filter(p =>
          p.title.toLowerCase().includes(brand.toLowerCase()) ||
          p.description?.toLowerCase().includes(brand.toLowerCase())
        );
      }

      setProducts(finalProducts);
      setTotalPages(pages);
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
    const param = `${selection.brand}-${selection.model}-${selection.year}`;
    setSearchParams({ moto: param });
    navigate(`/recambios?moto=${param}`);
  };

  const handleNavClick = (target: ViewState, cat?: string) => {
    if (target === 'home') navigate('/');
    else if (target === 'catalog') navigate(cat ? `/${cat.toLowerCase()}` : '/recambios');
    else if (target === 'cart') navigate('/carrito');
    else if (target === 'orders') navigate('/mis-pedidos');
    else if (target === 'account') navigate('/mi-cuenta');
    else if (target === 'login') navigate('/login');
    else if (target === 'forum') navigate('/foro');
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
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  // Sync Cart with Server
  useEffect(() => {
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
      <div className="text-center py-20 bg-zinc-900/30 rounded-sm border border-zinc-800 p-8">
        <p className="text-zinc-400 mb-4 font-bold">No se encontraron piezas compatibles.</p>
        <button onClick={handleClearFilters} className="text-racing-orange hover:text-white font-bold uppercase text-xs">Limpiar filtros</button>
      </div>
    );

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              priority={index < 4}
              product={product}
              onClick={(p) => { setSelectedProduct(p); navigate(`/${p.categorySlug || 'recambios'}/${p.id}`); }} // Using ID as slug part for now until slug util exists
              onAddToCart={() => addToCart(product, 1)}
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
          canonical: urlCategory ? `/${urlCategory}` : '/recambios'
        };
      case 'product':
        if (selectedProduct) {
          const cleanDesc = selectedProduct.description?.replace(/<[^>]*>/g, '').substring(0, 160).trim() || `Comprar ${selectedProduct.title}`;
          return {
            title: selectedProduct.title,
            description: cleanDesc,
            canonical: `/${selectedProduct.categorySlug || 'recambios'}/${selectedProduct.id}`,
            image: selectedProduct.image,
            jsonLd: {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": selectedProduct.title,
              "image": [selectedProduct.image],
              "description": cleanDesc,
              "sku": selectedProduct.sku,
              "brand": {
                "@type": "Brand",
                "name": selectedProduct.title.split(' ')[0] // Simple heuristic
              },
              "offers": {
                "@type": "Offer",
                "url": `https://escapesymas.com/${selectedProduct.categorySlug || 'recambios'}/${selectedProduct.id}`,
                "priceCurrency": "EUR",
                "price": selectedProduct.price,
                "availability": selectedProduct.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "itemCondition": "https://schema.org/NewCondition"
              }
            }
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
    <div className="min-h-screen flex flex-col bg-black w-full overflow-x-hidden">
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
          {currentView === 'forum' && <Forum user={user} onBack={() => navigate('/')} onLoginRequest={() => navigate('/login')} />}
          {currentView === 'categories' && <CategoryBrowser onSelectCategory={(_, name) => navigate(`/${name.toLowerCase()}`)} onBack={() => navigate('/')} />}
          {currentView === 'checkout' && <Checkout cart={cart} user={user} onBack={() => navigate('/carrito')} onOrderComplete={() => { setCart([]); navigate('/'); }} onLoginSuccess={(u) => { setUser(u); saveSession(u); }} />}
          {currentView === 'orders' && user && <MyOrders user={user} onBack={() => navigate('/')} />}
          {currentView === 'account' && user && <MyAccount user={user} onBack={() => navigate('/')} onUpdateUser={setUser} />}
          {currentView === 'warranty' && <Warranty user={user} onBack={() => navigate('/')} onLoginRequest={() => navigate('/login')} />}
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
              onAddToCart={(qty) => { addToCart(selectedProduct, qty); navigate('/carrito'); }}
              onProductClick={(product) => { setSelectedProduct(product); navigate(`/producto/${product.id}`); }}
            />
          )}

          {currentView === 'home' && (
            <>
              <section className="relative h-[500px] flex items-center justify-center bg-zinc-900 overflow-hidden">
                <picture className="absolute inset-0 w-full h-full">
                  <source media="(max-width: 640px)" srcSet={optimizeImage(STORE_CONFIG.heroImage, { width: 600, height: 800, fit: 'cover', format: 'webp' })} />
                  <source media="(max-width: 1024px)" srcSet={optimizeImage(STORE_CONFIG.heroImage, { width: 1200, format: 'webp' })} />
                  <img src={optimizeImage(STORE_CONFIG.heroImage, { width: 1920 })} className="w-full h-full object-cover opacity-40 grayscale" alt="Taller Moto" fetchPriority="high" />
                </picture>
                <div className="relative z-10 text-center px-4">
                  <h1 className="text-5xl md:text-7xl font-extrabold text-white uppercase italic mb-4">{STORE_CONFIG.heroTitle}</h1>
                  <p className="text-racing-orange font-bold uppercase tracking-widest text-xl">{STORE_CONFIG.heroSubtitle}</p>
                </div>
              </section>
              <PromoBanner onForumClick={() => navigate('/foro')} />
              <FeaturesBanner />
              <BrandSlider />
            </>
          )}

          {currentView === 'catalog' && (
            <div ref={catalogRef}>
              <section className="pt-32 pb-12 bg-zinc-950">
                <BikeSelector onSearch={handleBikeSearch} onTextSearch={handleTextSearch} isLoading={loading} bikeData={BIKE_DATA} />
              </section>
              <section className="py-12 bg-zinc-950 min-h-screen container mx-auto px-4 border-t border-zinc-900">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white uppercase italic">{currentFilter || "Catálogo"}</h2>
                    {currentFilter && <button onClick={handleClearFilters} className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"><Trash2 className="w-4 h-4" /> Limpiar</button>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs uppercase">Mostrar:</span>
                      <select
                        value={perPage}
                        onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-zinc-900 border border-zinc-800 text-white text-sm px-3 py-2 rounded-sm focus:border-racing-orange focus:outline-none cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs uppercase">Ordenar:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value as 'date' | 'price' | 'price-asc'); setCurrentPage(1); }}
                        className="bg-zinc-900 border border-zinc-800 text-white text-sm px-3 py-2 rounded-sm focus:border-racing-orange focus:outline-none cursor-pointer"
                      >
                        <option value="date">Relevancia</option>
                        <option value="price">Precio: Mayor a menor</option>
                        <option value="price-asc">Precio: Menor a mayor</option>
                      </select>
                    </div>
                  </div>
                </div>

                {renderProductGrid()}
              </section>
            </div>
          )}
        </Suspense>
      </main>
      <Footer onNavClick={handleNavClick} />

      <Suspense fallback={null}>
        <AIAdvisor onProductClick={(p) => { setSelectedProduct(p); navigate(`/producto/${p.id}`); }} onAddToCart={(p) => addToCart(p)} />
      </Suspense>
    </div>
  );
}

export default App;
