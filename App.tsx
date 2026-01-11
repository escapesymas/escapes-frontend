
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
import { fetchProducts, isConfigValid } from './services/woocommerce';
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
  const catalogRef = useRef<HTMLDivElement>(null);

  const [searchParams, setSearchParams] = useState<{ query?: string, categoryId?: number, bike?: BikeSelection | null }>({
    query: undefined,
    categoryId: undefined,
    bike: null
  });

  useEffect(() => {
    loadFeaturedProducts();
    const savedUser = getSession();
    if (savedUser) setUser(savedUser);
  }, []);

  useEffect(() => {
    let path = `/${currentView}`;
    if (currentView === 'product' && selectedProduct) {
      path = `/product/${selectedProduct.id}-${selectedProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    }
    pageview(path);
  }, [currentView, selectedProduct]);

  const loadFeaturedProducts = async () => {
    setLoading(true);
    setCurrentFilter(null);
    setError(null);
    setTotalPages(1);
    setCurrentPage(1);

    try {
      const { products: all } = await fetchProducts(undefined, undefined, 1, 100);
      
      const curated: Product[] = [];
      const usedCategories = new Set<string>();

      const targets = [
        { key: 'Filtro', pattern: /filtro/i },
        { key: 'Amortiguador', pattern: /amortiguador|suspension|ohlins/i },
        { key: 'Escape Completo', pattern: /linea completa|full system|racing line/i },
        { key: 'Silencioso', pattern: /silencioso|slip-on/i }
      ];

      for (const target of targets) {
        const match = all.find(p => 
          target.pattern.test(p.title) && 
          !curated.find(c => c.id === p.id) &&
          !usedCategories.has(p.category)
        );

        if (match) {
          curated.push(match);
          usedCategories.add(match.category);
        }
      }

      if (curated.length < 4) {
        for (const p of all) {
          if (curated.length >= 4) break;
          if (!usedCategories.has(p.category)) {
            curated.push(p);
            usedCategories.add(p.category);
          }
        }
      }

      setProducts(curated.slice(0, 4));
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
      const { products: matches, totalPages: pages } = await fetchProducts(
        searchParams.query, 
        searchParams.categoryId, 
        page, 
        20
      );

      let filtered = matches;
      if (searchParams.bike?.year && searchParams.bike.year !== 'General') {
        filtered = matches.filter(p => isYearCompatible(p.title, searchParams.bike!.year));
      }

      setProducts(filtered);
      setTotalPages(pages);
      setCurrentPage(page);
      
      if (page > 1 || currentView === 'catalog') {
        catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (e: any) {
      setError("Error cargando productos");
      setErrorDetail(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isYearCompatible = (title: string, targetYearStr: string): boolean => {
    if (!targetYearStr || targetYearStr === 'General') return true;
    const targetYear = parseInt(targetYearStr);
    const titleLower = title.toLowerCase();
    if (new RegExp(`\\b${targetYearStr}\\b`).test(titleLower)) return true;
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
  }, [searchParams]);

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

  const renderPagination = () => {
    if (totalPages <= 1 || loading) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="flex flex-wrap justify-center items-center gap-2 mt-12 py-8 border-t border-zinc-900">
        <button 
          disabled={currentPage === 1}
          onClick={() => handleProductFetch(currentPage - 1)}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white hover:border-racing-orange disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {pages.map(p => (
          <button 
            key={p}
            onClick={() => handleProductFetch(p)}
            className={`w-12 h-12 rounded-sm font-bold text-sm border transition-all ${currentPage === p ? 'bg-racing-orange border-racing-orange text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}
          >
            {p}
          </button>
        ))}

        <button 
          disabled={currentPage === totalPages}
          onClick={() => handleProductFetch(currentPage + 1)}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white hover:border-racing-orange disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderProductGrid = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-racing-orange animate-spin mb-4" />
          <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">Sincronizando catálogo...</p>
        </div>
      );
    }
    if (error) {
       return (
          <div className="flex flex-col items-center justify-center py-20 bg-red-900/10 border border-red-900/50 rounded-sm p-8 text-center">
            <WifiOff className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
            <div className="bg-black/30 p-4 rounded text-left text-xs font-mono text-red-300 mb-6 max-w-lg overflow-auto">
              {errorDetail}
            </div>
            <button onClick={handleClearFilters} className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase py-3 px-8 rounded-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Reintentar
            </button>
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
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} onClick={(p) => { setSelectedProduct(p); setCurrentView('product'); }} onAddToCart={() => addToCart(product, 1)} />
          ))}
        </div>
        {renderPagination()}
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
            onUpdateQuantity={(id, delta) => setCart(p => p.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + delta)} : i))} 
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

        {currentView === 'home' && (
          <>
            <section className="relative h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center bg-zinc-900 overflow-hidden w-full">
              <div className="absolute inset-0 z-0">
                <img 
                   src={optimizeImage(STORE_CONFIG.heroImage, 800)} 
                   srcSet={`${optimizeImage(STORE_CONFIG.heroImage, 800)} 800w, ${optimizeImage(STORE_CONFIG.heroImage, 1920)} 1920w`}
                   sizes="(max-width: 768px) 800px, 1920px"
                   alt="Hero Escapes y Mas" 
                   // Fixed attribute: changed fetchpriority to fetchPriority as required by React
                   fetchPriority="high"
                   width="800"
                   height="600"
                   className="w-full h-full object-cover grayscale opacity-40" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-transparent"></div>
              </div>
              <div className="relative z-10 text-center px-4 mt-[-40px] w-full max-w-[100vw]">
                <span className="inline-block border border-racing-orange text-racing-orange px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-4 bg-black/50 backdrop-blur-sm">
                  {STORE_CONFIG.name}
                </span>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-white mb-4 uppercase italic leading-tight">
                  <span className="inline-block py-1 pr-1 md:pr-3">{STORE_CONFIG.heroTitle}</span> <br/>
                  <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-racing-orange to-red-600 py-2 pr-2 md:pr-6 pb-2">
                    {STORE_CONFIG.heroSubtitle}
                  </span>
                </h1>
              </div>
            </section>

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

            <section className="py-20 bg-zinc-950 w-full">
              <div className="container mx-auto px-4">
                <div className="flex flex-wrap justify-between items-end mb-8 md:mb-12 gap-4">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white uppercase italic pr-2 border-l-4 border-racing-orange pl-4">
                    Selección <span className="text-racing-orange">Variety Pack</span>
                  </h2>
                  <button onClick={() => setCurrentView('catalog')} className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:text-white transition-colors">
                     Explorar Catálogo <ArrowRight className="w-4 h-4 text-racing-orange" />
                  </button>
                </div>
                {renderProductGrid()}
              </div>
            </section>
          </>
        )}

        {currentView === 'catalog' && (
          <div ref={catalogRef}>
            <section className="pt-24 pb-8 bg-zinc-950">
               <div className="container mx-auto px-4 mb-8 text-center">
                  <h1 className="text-2xl md:text-4xl font-extrabold text-white uppercase italic">
                     Buscador de Piezas
                  </h1>
               </div>
               <BikeSelector onSearch={handleBikeSearch} onTextSearch={handleTextSearch} isLoading={loading} bikeData={BIKE_DATA} />
            </section>

            <section className="py-12 bg-zinc-950 min-h-screen w-full border-t border-zinc-900">
              <div className="container mx-auto px-4">
                <div className="flex flex-wrap justify-between items-end mb-8 gap-4">
                   <h2 className="text-xl font-bold text-white uppercase italic border-l-4 border-racing-orange pl-4">
                     {currentFilter || "Catálogo"}
                   </h2>
                   {currentFilter && (
                       <button onClick={handleClearFilters} className="text-zinc-600 hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                         <Trash2 className="w-3.5 h-3.5" /> Limpiar Filtros
                       </button>
                   )}
                </div>
                {renderProductGrid()}
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer onNavClick={handleNavClick} />
    </div>
  );
}

export default App;
