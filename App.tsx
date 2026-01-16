
import React, { useEffect, useState, Suspense, useRef } from 'react';
import { ArrowRight, Loader2, AlertCircle, WifiOff, XCircle, RefreshCw, Trash2, Zap, Shield, Trophy, Users, MessageSquare, ChevronLeft } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BikeSelector } from './components/BikeSelector';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { Cart } from './components/Cart';
import { CategoryBrowser } from './components/CategoryBrowser';
import { Contact } from './components/Contact';
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

type ViewState = 'home' | 'catalog' | 'product' | 'cart' | 'checkout' | 'login' | 'register' | 'orders' | 'account' | 'categories' | 'forum' | 'contact' | 'warranty';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastView, setLastView] = useState<ViewState>('home');
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'price-asc'>('date');
  const catalogRef = useRef<HTMLDivElement>(null);

  const [searchParams, setSearchParams] = useState<{ query?: string, categoryId?: number, bike?: BikeSelection | null }>({
    query: undefined,
    categoryId: undefined,
    bike: null
  });

  // --- LÓGICA DE DEEP LINKING (URL SYNC) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as ViewState;
    const idParam = params.get('id');
    const catParam = params.get('cat');
    const queryParam = params.get('q');
    const pageParam = params.get('p');

    const initialize = async () => {
      if (viewParam === 'product' && idParam) {
        try {
          const { products: matches } = await fetchProducts(undefined, undefined, 1, 100);
          const found = matches.find(p => p.id === parseInt(idParam));
          if (found) {
            setSelectedProduct(found);
            setCurrentView('product');
          }
        } catch (e) { }
      } else if (viewParam === 'catalog') {
        setCurrentView('catalog');
        if (pageParam) setCurrentPage(parseInt(pageParam));
        if (catParam) {
          setSearchParams({ categoryId: parseInt(catParam), bike: null });
        } else if (queryParam) {
          setSearchParams({ query: queryParam, bike: null });
        }
      } else if (viewParam && ['home', 'cart', 'forum', 'contact', 'warranty', 'categories'].includes(viewParam)) {
        setCurrentView(viewParam);
      }

      loadFeaturedProducts();
      const savedUser = getSession();
      if (savedUser) {
        setUser(savedUser);
        // Recuperar carrito guardado del servidor
        if (savedUser.id && savedUser.id > 0) {
          const savedCart = await getUserCart(savedUser.id);
          if (savedCart.length > 0) {
            // Cargar productos completos del carrito guardado
            try {
              const { products: allProducts } = await fetchProducts(undefined, undefined, 1, 100);
              const restoredCart = savedCart.map(item => {
                const product = allProducts.find(p => p.id === item.product_id);
                if (product) {
                  return { ...product, quantity: item.quantity };
                }
                return null;
              }).filter(Boolean) as CartItem[];

              if (restoredCart.length > 0) {
                setCart(restoredCart);
                console.log('[CART] Restored cart from server:', restoredCart.length, 'items');
              }
            } catch (e) {
              console.error('[CART] Failed to restore cart:', e);
            }
          }
        }
      }
    };

    initialize();

    const handlePopState = () => {
      try { window.location.reload(); } catch (e) { }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('view', currentView);

    if (currentView === 'product' && selectedProduct) {
      params.set('id', selectedProduct.id.toString());
    } else if (currentView === 'catalog') {
      if (searchParams.categoryId) params.set('cat', searchParams.categoryId.toString());
      if (searchParams.query) params.set('q', searchParams.query);
      if (currentPage > 1) params.set('p', currentPage.toString());
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    try {
      window.history.pushState({}, '', newUrl);
    } catch (e) {
      console.warn("History API restricted");
    }

    pageview(newUrl);
  }, [currentView, selectedProduct, searchParams, currentPage]);

  const loadFeaturedProducts = async () => {
    setLoading(true);
    setCurrentFilter(null);
    setError(null);
    try {
      const { products: all } = await fetchProducts(undefined, undefined, 1, 10);
      const curated = all.filter(p => p.image !== STORE_CONFIG.defaultProductImage).slice(0, 4);
      setProducts(curated);
    } catch (e: any) {
      setError("Error de conexión con el catálogo.");
      setErrorDetail(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProductFetch = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      // Mapear sortBy a orderby/order de WooCommerce
      const orderBy = sortBy === 'date' ? 'date' : 'price';
      const order = sortBy === 'price-asc' ? 'asc' : 'desc';

      const { products: matches, totalPages: pages } = await fetchProducts(
        searchParams.query,
        searchParams.categoryId,
        page,
        perPage,
        orderBy,
        order
      );
      setProducts(matches);
      setTotalPages(pages);
      setCurrentPage(page);

      // Scroll al inicio del catálogo si estamos navegando páginas
      if (page > 1 || (currentView === 'catalog' && catalogRef.current)) {
        catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (e: any) {
      setError("Error cargando productos");
      setErrorDetail(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBikeSearch = (selection: BikeSelection) => {
    setCurrentView('catalog');
    setCurrentPage(1);
    setSearchParams({ query: `${selection.brand} ${selection.model}`, categoryId: undefined, bike: selection });
    setCurrentFilter(`${selection.brand} ${selection.model} ${selection.year}`);
  };

  const handleTextSearch = (query: string) => {
    setCurrentView('catalog');
    setCurrentPage(1);
    setSearchParams({ query, categoryId: undefined, bike: null });
    setCurrentFilter(`Búsqueda: "${query}"`);
  };

  const handleCategorySelect = (categoryId: number, categoryName: string) => {
    setCurrentView('catalog');
    setCurrentPage(1);
    setSearchParams({ query: undefined, categoryId, bike: null });
    setCurrentFilter(categoryName);
  };

  useEffect(() => {
    if (currentView === 'catalog') {
      handleProductFetch(1);
    }
  }, [searchParams, perPage, sortBy]);

  const handleClearFilters = () => {
    if (currentView === 'home') {
      loadFeaturedProducts();
    } else {
      setCurrentPage(1);
      setSearchParams({ query: undefined, categoryId: undefined, bike: null });
      setCurrentFilter(null);
    }
  };

  const handleNavClick = (view: ViewState, category?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'catalog' && category) {
      handleCategorySelect(0, category);
    } else {
      setCurrentView(view);
      setSelectedProduct(null);
      if (view === 'home') loadFeaturedProducts();
      if (view === 'catalog' && !category) handleClearFilters();
    }
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

  // Sincronizar carrito con el servidor cuando cambia (para usuarios logueados)
  useEffect(() => {
    if (user && user.id && user.id > 0 && cart.length > 0) {
      const cartData = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));
      saveUserCart(user.id, cartData);
    }
  }, [cart, user]);

  const renderPagination = () => {
    if (totalPages <= 1 || loading) return null;

    // Genera un rango inteligente de páginas a mostrar
    const getPageRange = () => {
      const delta = 2; // Páginas a mostrar a cada lado de la actual
      const range: (number | string)[] = [];

      // Siempre mostrar primera página
      range.push(1);

      // Calcular inicio y fin del rango central
      const start = Math.max(2, currentPage - delta);
      const end = Math.min(totalPages - 1, currentPage + delta);

      // Agregar elipsis si hay hueco después de la primera página
      if (start > 2) range.push('...');

      // Agregar páginas del rango central
      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      // Agregar elipsis si hay hueco antes de la última página
      if (end < totalPages - 1) range.push('...');

      // Siempre mostrar última página (si hay más de 1)
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
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={(p) => { setSelectedProduct(p); setCurrentView('product'); }}
              onAddToCart={() => addToCart(product, 1)}
            />
          ))}
        </div>
        {currentView === 'catalog' && renderPagination()}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-black w-full overflow-x-hidden">
      <Header
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        user={user}
        onCartClick={() => setCurrentView('cart')}
        onLogoClick={() => { setCurrentView('home'); setSelectedProduct(null); loadFeaturedProducts(); }}
        onLoginClick={() => { setLastView(currentView); setCurrentView('login'); }}
        onLogoutClick={() => { setUser(null); logoutSession(); setCurrentView('home'); }}
        onOrdersClick={() => setCurrentView('orders')}
        onAccountClick={() => setCurrentView('account')}
        onNavClick={handleNavClick}
      />

      <main className="flex-grow w-full">
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-racing-orange animate-spin" /></div>}>
          {currentView === 'login' && <Login onLoginSuccess={(u) => { setUser(u); saveSession(u); setCurrentView(lastView); }} onBack={() => setCurrentView(lastView)} onRegisterClick={() => setCurrentView('register')} />}
          {currentView === 'register' && <Register onRegisterSuccess={() => setCurrentView('login')} onBack={() => setCurrentView('login')} onGoToLogin={() => setCurrentView('login')} />}
          {currentView === 'forum' && <Forum user={user} onBack={() => setCurrentView('home')} onLoginRequest={() => setCurrentView('login')} />}
          {currentView === 'categories' && <CategoryBrowser onSelectCategory={handleCategorySelect} onBack={() => setCurrentView('home')} />}
          {currentView === 'checkout' && <Checkout cart={cart} user={user} onBack={() => setCurrentView('cart')} onOrderComplete={() => { setCart([]); setCurrentView('home'); }} onLoginSuccess={(u) => { setUser(u); saveSession(u); }} />}
          {currentView === 'orders' && user && <MyOrders user={user} onBack={() => setCurrentView('home')} />}
          {currentView === 'account' && user && <MyAccount user={user} onBack={() => setCurrentView('home')} onUpdateUser={setUser} />}
          {currentView === 'warranty' && <Warranty onBack={() => setCurrentView('home')} />}
          {currentView === 'contact' && <Contact onBack={() => setCurrentView('home')} />}
        </Suspense>

        {currentView === 'cart' && (
          <Cart
            items={cart}
            user={user}
            onUpdateQuantity={(id, delta) => setCart(p => p.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))}
            onRemove={(id) => setCart(p => p.filter(i => i.id !== id))}
            onCheckout={() => setCurrentView('checkout')}
            onContinueShopping={() => setCurrentView('catalog')}
            onRestoreCart={(items) => setCart(items)}
          />
        )}

        {currentView === 'product' && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setCurrentView('catalog')}
            onAddToCart={(qty) => { addToCart(selectedProduct, qty); setCurrentView('cart'); }}
          />
        )}

        {currentView === 'home' && (
          <>
            <section className="relative h-[500px] flex items-center justify-center bg-zinc-900 overflow-hidden">
              <picture className="absolute inset-0 w-full h-full">
                <source media="(max-width: 640px)" srcSet={`https://wsrv.nl/?url=${encodeURIComponent(STORE_CONFIG.heroImage)}&w=600&h=800&fit=cover&output=webp&q=75`} />
                <source media="(max-width: 1024px)" srcSet={`https://wsrv.nl/?url=${encodeURIComponent(STORE_CONFIG.heroImage)}&w=1200&output=webp&q=80`} />
                <img src={`https://wsrv.nl/?url=${encodeURIComponent(STORE_CONFIG.heroImage)}&w=1920&output=webp&q=80`} className="w-full h-full object-cover opacity-40 grayscale" alt="Taller Moto" fetchPriority="high" loading="eager" />
              </picture>
              <div className="relative z-10 text-center px-4">
                <h1 className="text-5xl md:text-7xl font-extrabold text-white uppercase italic mb-4">
                  {STORE_CONFIG.heroTitle}
                </h1>
                <p className="text-racing-orange font-bold uppercase tracking-widest text-xl">{STORE_CONFIG.heroSubtitle}</p>
              </div>
            </section>
            <section className="py-20 bg-zinc-950">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-white uppercase italic mb-10 border-l-4 border-racing-orange pl-4">Destacados</h2>
                {renderProductGrid()}
              </div>
            </section>
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
      </main>
      <Footer onNavClick={handleNavClick} />
    </div>
  );
}

export default App;
