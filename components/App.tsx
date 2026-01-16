import React, { useEffect, useState, Suspense } from 'react';
import { ArrowRight, Loader2, AlertCircle, WifiOff, XCircle, RefreshCw, Trash2, Zap, Shield, Trophy, Users, MessageSquare, AlertTriangle } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BikeSelector } from './components/BikeSelector';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { Cart } from './components/Cart';
import { CategoryBrowser } from './components/CategoryBrowser';
import { STORE_CONFIG, FEATURES, BIKE_DATA } from './storeData';
import { fetchProducts, isConfigValid } from './services/woocommerce';
import { saveSession, getSession, logoutSession } from './services/auth';
import { pageview } from './services/analytics'; // Importar Analytics
import { Product, BikeSelection, CartItem, User } from './types';

// Lazy Components
const Checkout = React.lazy(() => import('./components/Checkout').then(module => ({ default: module.Checkout as React.ComponentType<any> })));
const Login = React.lazy(() => import('./components/Login').then(module => ({ default: module.Login as React.ComponentType<any> })));
const Register = React.lazy(() => import('./components/Register').then(module => ({ default: module.Register as React.ComponentType<any> })));
const MyOrders = React.lazy(() => import('./components/MyOrders').then(module => ({ default: module.MyOrders as React.ComponentType<any> })));
const MyAccount = React.lazy(() => import('./components/MyAccount').then(module => ({ default: module.MyAccount as React.ComponentType<any> })));
const Forum = React.lazy(() => import('./components/Forum').then(module => ({ default: module.Forum as React.ComponentType<any> })));
const Warranty = React.lazy(() => import('./components/Warranty').then(module => ({ default: module.Warranty as React.ComponentType<any> })));

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

  useEffect(() => {
    // Carga inicial de productos y sesión de usuario
    loadFeaturedProducts();
    const savedUser = getSession();
    if (savedUser) setUser(savedUser);
  }, []);

  // ANALYTICS: Trackear cambios de vista (Virtual Page Views)
  useEffect(() => {
    let path = `/${currentView}`;
    if (currentView === 'product' && selectedProduct) {
      path = `/product/${selectedProduct.id}-${selectedProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    }
    pageview(path);
  }, [currentView, selectedProduct]);

  // Función genérica para manejar cualquier carga de productos
  const handleProductFetch = async (fetcher: () => Promise<Product[]>, filterName: string | null = null) => {
    setLoading(true);
    setCurrentFilter(filterName);
    setError(null);
    setErrorDetail(null);
    try {
      const fetchedProducts = await fetcher();
      setProducts(fetchedProducts);
    } catch (e: any) {
      console.error("App Fetch Error:", e);
      setError("Fallo de Conexión con el Catálogo");
      setErrorDetail(e.message);
      setProducts([]); // Limpiamos productos en caso de error
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedProducts = async () => {
    handleProductFetch(async () => {
      const fetched = await fetchProducts();
      // Filtrar y limitar para la portada
      return fetched
        .filter(p => p.image !== STORE_CONFIG.defaultProductImage)
        .slice(0, 4);
    });
  };

  const isYearCompatible = (title: string, targetYearStr: string): boolean => {
    if (!targetYearStr || targetYearStr === 'General') return true;
    const targetYear = parseInt(targetYearStr);
    const titleLower = title.toLowerCase();
    if (new RegExp(`\\b${targetYearStr}\\b`).test(titleLower)) return true;
    const shortYearStr = targetYearStr.slice(2);
    if (new RegExp(`\\s${shortYearStr}\\s`).test(titleLower)) return true;
    const rangeRegex = /(\d{2,4})\s*[-/–]\s*(\d{2,4})/g;
    let match;
    while ((match = rangeRegex.exec(titleLower)) !== null) {
      let start = parseInt(match[1]);
      let end = parseInt(match[2]);
      if (start < 100) start += 2000;
      if (end < 100) end += 2000;
      if (targetYear >= start && targetYear <= end) return true;
    }
    return false;
  };

  const handleBikeSearch = (selection: BikeSelection) => {
    if (currentView !== 'catalog') setCurrentView('catalog');
    setSelectedProduct(null);
    const filter = `${selection.brand} ${selection.model} ${selection.year || ''}`.trim();
    handleProductFetch(async () => {
      const backendQuery = `${selection.brand} ${selection.model}`;
      const matches = await fetchProducts(backendQuery);
      return selection.year && selection.year !== 'General'
        ? matches.filter(p => isYearCompatible(p.title, selection.year))
        : matches;
    }, filter);
  };

  const handleTextSearch = (query: string) => {
    if (currentView !== 'catalog') setCurrentView('catalog');
    setSelectedProduct(null);
    handleProductFetch(() => fetchProducts(query), `Búsqueda: "${query}"`);
  };

  const handleClearFilters = () => {
    setCurrentView('catalog');
    handleProductFetch(() => fetchProducts());
  };

  const handleNavClick = (view: ViewState, category?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'catalog' && category) {
      handleCategorySelect(0, category);
    } else if (view === 'contact') {
      if (currentView !== 'home') setCurrentView('home');
      setTimeout(() => {
        document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setCurrentView(view);
      setSelectedProduct(null);
      if (view === 'home' && products.length > 4) loadFeaturedProducts();
      if (view === 'catalog' && !category && !currentFilter) handleClearFilters();
    }
  };

  const handleCategorySelect = (categoryId: number, categoryName: string) => {
    setCurrentView('catalog');
    setSelectedProduct(null);
    handleProductFetch(() => fetchProducts(undefined, categoryId), categoryName);
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

  const heroMobile = `https://wsrv.nl/?url=${encodeURIComponent(STORE_CONFIG.heroImage)}&w=600&h=800&fit=cover&output=webp&q=75`;
  const heroTablet = `https://wsrv.nl/?url=${encodeURIComponent(STORE_CONFIG.heroImage)}&w=1200&output=webp&q=80`;
  const heroDesktop = `https://wsrv.nl/?url=${encodeURIComponent(STORE_CONFIG.heroImage)}&w=1920&output=webp&q=80`;

  const renderProductGrid = () => {
    if (loading) {
      return <div className="flex justify-center h-64"><Loader2 className="w-12 h-12 text-racing-orange animate-spin" /></div>;
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-red-900/10 border border-red-900/50 rounded-sm p-8 text-center">
          <WifiOff className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
          <p className="text-zinc-400 mb-6">Parece que no podemos conectar con el servidor. Inténtalo de nuevo.</p>
          <button onClick={handleClearFilters} className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase py-3 px-8 rounded-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
          <div className="bg-black/30 p-4 rounded text-left text-xs font-mono text-red-300 mt-6 max-w-lg overflow-auto">
            <p className="font-bold border-b border-red-800/50 pb-2 mb-2">Detalle Técnico:</p>
            {errorDetail || "No se pudo obtener un mensaje de error detallado."}
          </div>
        </div>
      );
    }
    if (products.length === 0) {
      return (
        <div className="col-span-full py-20 text-center">
          <div className="bg-zinc-900 inline-block p-8 rounded-sm border border-zinc-800">
            <p className="text-zinc-400 text-lg mb-4">No se encontraron productos compatibles.</p>
            <button onClick={handleClearFilters} className="text-racing-orange font-bold uppercase text-sm hover:text-white">
              Ver todo el catálogo
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} onClick={(p) => { setSelectedProduct(p); setCurrentView('product'); }} onAddToCart={() => addToCart(product, 1)} />
        ))}
      </div>
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
        </Suspense>

        {currentView === 'cart' && (
          <Cart
            items={cart}
            onUpdateQuantity={(id, delta) => setCart(p => p.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))}
            onRemove={(id) => setCart(p => p.filter(i => i.id !== id))}
            onCheckout={() => setCurrentView('checkout')}
            onContinueShopping={() => setCurrentView('catalog')}
          />
        )}

        {currentView === 'product' && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setCurrentView('catalog')}
            onAddToCart={(qty) => { addToCart(selectedProduct, qty); setCurrentView('cart'); }}
          />
        )}

        {/* --- HOME PAGE VIEW --- */}
        {currentView === 'home' && (
          <>
            <section className="relative h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center bg-zinc-900 overflow-hidden w-full">
              <div className="absolute inset-0 z-0">
                <picture>
                  <source media="(max-width: 640px)" srcSet={heroMobile} />
                  <source media="(max-width: 1024px)" srcSet={heroTablet} />
                  <img src={heroDesktop} alt="Taller Moto" className="w-full h-full object-cover grayscale opacity-40" />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-transparent"></div>
              </div>
              <div className="relative z-10 text-center px-4 mt-[-40px] w-full max-w-[100vw]">
                <span className="inline-block border border-racing-orange text-racing-orange px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-4 bg-black/50 backdrop-blur-sm">
                  {STORE_CONFIG.name}
                </span>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-white mb-4 uppercase italic leading-tight">
                  <span className="inline-block py-1 pr-1 md:pr-3">{STORE_CONFIG.heroTitle}</span> <br />
                  <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-racing-orange to-red-600 py-2 pr-2 md:pr-6 pb-2">
                    {STORE_CONFIG.heroSubtitle}
                  </span>
                </h1>
              </div>
            </section>

            {/* FEATURES BANNER */}
            <section className="bg-zinc-900 w-full border-y border-zinc-800 shadow-xl relative z-10">
              <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {FEATURES.map((feat, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-3">
                      <div className="text-racing-orange p-2 bg-zinc-950 rounded-full border border-zinc-800">
                        <feat.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-white uppercase italic text-sm leading-tight mb-1">{feat.title}</p>
                        <p className="text-zinc-500 text-xs font-medium leading-tight">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* COMMUNITY SECTION (HOME ONLY) */}
            <section className="py-16 bg-gradient-to-r from-zinc-900 to-black border-b border-zinc-800">
              <div className="container mx-auto px-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-racing-orange/5 rounded-full blur-3xl group-hover:bg-racing-orange/10 transition-colors"></div>

                  <div className="flex items-start gap-6 relative z-10 max-w-2xl">
                    <div className="hidden md:block p-4 bg-black border border-zinc-800 rounded-full">
                      <Users className="w-10 h-10 text-racing-orange" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-5 h-5 text-racing-orange md:hidden" />
                        <span className="text-racing-orange font-bold uppercase tracking-widest text-xs">Comunidad Paddock</span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-extrabold text-white uppercase italic mb-4">
                        ¿Dudas sobre tu setup?
                      </h2>
                      <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                        Únete a nuestra comunidad de pilotos y mecánicos. Comparte tus experiencias, resuelve dudas sobre compatibilidad y encuentra el mejor material para tu moto.
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <button
                      onClick={() => setCurrentView('forum')}
                      className="bg-white hover:bg-zinc-200 text-black font-black uppercase py-4 px-8 rounded-sm transition-transform hover:scale-105 flex items-center gap-2 shadow-xl"
                    >
                      Entrar al Foro <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURED PRODUCTS */}
            <section className="py-20 bg-zinc-950 w-full">
              <div className="container mx-auto px-4">
                <div className="flex flex-wrap justify-between items-end mb-8 md:mb-12 gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white uppercase italic pr-2">
                      Destacados
                    </h2>
                  </div>
                  <button onClick={() => setCurrentView('catalog')} className="text-racing-orange font-bold uppercase text-xs flex items-center gap-1 hover:text-white transition-colors">
                    Ver todo el catálogo <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {renderProductGrid()}
              </div>
            </section>
          </>
        )}

        {/* --- CATALOG VIEW (SEARCH) --- */}
        {currentView === 'catalog' && (
          <>
            <section className="pt-24 pb-8 bg-zinc-950">
              <div className="container mx-auto px-4 mb-8 text-center">
                <h1 className="text-2xl md:text-4xl font-extrabold text-white uppercase italic">
                  Buscador de Piezas
                </h1>
                <p className="text-zinc-500 text-sm mt-2">Encuentra exactamente lo que necesitas para tu máquina.</p>
              </div>

              <BikeSelector
                onSearch={handleBikeSearch}
                onTextSearch={handleTextSearch}
                isLoading={loading && !!currentFilter}
                bikeData={BIKE_DATA}
              />
            </section>

            <section className="py-12 bg-zinc-950 min-h-screen w-full border-t border-zinc-900">
              <div className="container mx-auto px-4">
                <div className="flex flex-wrap justify-between items-end mb-8 gap-4">
                  <h2 className="text-xl font-bold text-white uppercase italic">
                    {currentFilter ? `Resultados: ${currentFilter}` : "Catálogo Completo"}
                  </h2>
                  {currentFilter && (
                    <button
                      onClick={handleClearFilters}
                      className="bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 p-2 rounded-sm transition-colors flex items-center gap-2 text-xs font-bold uppercase px-4"
                    >
                      <Trash2 className="w-4 h-4" /> Limpiar Filtros
                    </button>
                  )}
                </div>

                {renderProductGrid()}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer onNavClick={handleNavClick} />
    </div>
  );
}

export default App;