import React, { useEffect, useState, Suspense } from 'react';
import { ArrowRight, Loader2, AlertCircle, WifiOff, XCircle, RefreshCw, Trash2 } from 'lucide-react';
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
import { Product, BikeSelection, CartItem, User } from './types';

// Lazy Components
const Checkout = React.lazy(() => import('./components/Checkout').then(module => ({ default: module.Checkout })));
const Login = React.lazy(() => import('./components/Login').then(module => ({ default: module.Login })));
const Register = React.lazy(() => import('./components/Register').then(module => ({ default: module.Register })));
const MyOrders = React.lazy(() => import('./components/MyOrders').then(module => ({ default: module.MyOrders })));
const MyAccount = React.lazy(() => import('./components/MyAccount').then(module => ({ default: module.MyAccount })));
const Forum = React.lazy(() => import('./components/Forum').then(module => ({ default: module.Forum })));
const Warranty = React.lazy(() => import('./components/Warranty').then(module => ({ default: module.Warranty })));

type ViewState = 'catalog' | 'product' | 'cart' | 'checkout' | 'login' | 'register' | 'orders' | 'account' | 'categories' | 'forum' | 'contact' | 'warranty';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('catalog');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastView, setLastView] = useState<ViewState>('catalog'); 
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    loadFeaturedProducts();
    const savedUser = getSession();
    if (savedUser) setUser(savedUser);
  }, []);

  const loadFeaturedProducts = async () => {
    setLoading(true);
    setCurrentFilter(null);
    setError(null);
    setErrorDetail(null);
    try {
      const fetchedProducts = await fetchProducts();
      setProducts(fetchedProducts);
    } catch (e: any) {
      console.error("App Fetch Error:", e);
      setError("Error de conexión con el catálogo.");
      setErrorDetail(e.message || "Error desconocido");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lógica inteligente para verificar si un producto es compatible con el año seleccionado.
   * Maneja formatos como: "2017-20", "17-20", "2018", "20/21", "2020-2024" y guiones largos.
   */
  const isYearCompatible = (title: string, targetYearStr: string): boolean => {
    if (!targetYearStr || targetYearStr === 'General') return true;
    
    const targetYear = parseInt(targetYearStr);
    const titleLower = title.toLowerCase();
    
    // 1. Coincidencia Exacta (Ej: "2018" en el título)
    // Usamos word boundary (\b) para evitar coincidencias parciales con números de parte
    const exactRegex = new RegExp(`\\b${targetYearStr}\\b`);
    if (exactRegex.test(titleLower)) return true;
    
    // También buscar año corto: " 18 " para 2018 (con espacios alrededor)
    const shortYearStr = targetYearStr.slice(2);
    const shortRegex = new RegExp(`\\s${shortYearStr}\\s`);
    if (shortRegex.test(titleLower)) return true;

    // 2. Coincidencia de Rangos (Regex para buscar patrones como YYYY-YYYY, YY-YY, YYYY/YYYY)
    // Soporta guión (-), guión largo (–) y barra (/)
    const rangeRegex = /(\d{2,4})\s*[-/–]\s*(\d{2,4})/g;
    let match;

    while ((match = rangeRegex.exec(titleLower)) !== null) {
      let start = parseInt(match[1]);
      let end = parseInt(match[2]);

      // Normalizar años de 2 dígitos (Ej: 17 -> 2017)
      if (start < 100) start += 2000;
      if (end < 100) end += 2000;

      // Verificar si el año objetivo está en el rango [start, end]
      if (targetYear >= start && targetYear <= end) {
        return true;
      }
    }

    return false;
  };

  const handleBikeSearch = async (selection: BikeSelection) => {
    setLoading(true);
    setCurrentView('catalog'); 
    setSelectedProduct(null); 
    setError(null);
    
    // Buscamos primero por Marca + Modelo en el backend
    const backendQuery = `${selection.brand} ${selection.model}`;
    setCurrentFilter(`${selection.brand} ${selection.model} ${selection.year}`);
    
    try {
      // 1. Fetch amplio
      const matches = await fetchProducts(backendQuery);
      
      // 2. Filtrado fino por año en el cliente
      // Si el usuario seleccionó un año, filtramos los resultados que no coincidan
      let filteredMatches = matches;
      if (selection.year && selection.year !== 'General') {
         filteredMatches = matches.filter(p => isYearCompatible(p.title, selection.year));
      }

      setProducts(filteredMatches);
    } catch (e: any) {
      setError("Error en la búsqueda");
      setErrorDetail(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    loadFeaturedProducts();
    // Opcional: Resetear el BikeSelector si tuviéramos acceso a su estado interno, 
    // pero al recargar productos volvemos al estado inicial de listado.
  };

  const handleNavClick = (view: ViewState, category?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'catalog' && category) {
      handleCategorySelect(0, category); 
    } else if (view === 'contact') {
       setCurrentView('catalog');
       // Scroll al footer
       setTimeout(() => {
          document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
       }, 100);
    } else {
      setCurrentView(view);
      setSelectedProduct(null);
    }
  };

  const handleCategorySelect = async (categoryId: number, categoryName: string) => {
    setLoading(true);
    setCurrentView('catalog');
    setCurrentFilter(categoryName);
    setError(null);
    try {
      const matches = await fetchProducts(undefined, categoryId);
      setProducts(matches);
    } catch (e: any) {
      setError("Error cargando categoría");
      setErrorDetail(e.message);
    } finally {
      setLoading(false);
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

  const heroMobile = `https://wsrv.nl/?url=${encodeURIComponent(STORE_CONFIG.heroImage)}&w=600&h=800&fit=cover&output=webp&q=75`;
  const heroDesktop = `https://wsrv.nl/?url=${encodeURIComponent(STORE_CONFIG.heroImage)}&w=1920&output=webp&q=80`;

  return (
    <div className="min-h-screen flex flex-col bg-black w-full overflow-x-hidden">
      <Header 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
        user={user}
        onCartClick={() => setCurrentView('cart')}
        onLogoClick={() => { setCurrentView('catalog'); setSelectedProduct(null); loadFeaturedProducts(); }}
        onLoginClick={() => { setLastView(currentView); setCurrentView('login'); }}
        onLogoutClick={() => { setUser(null); logoutSession(); setCurrentView('catalog'); }}
        onOrdersClick={() => setCurrentView('orders')}
        onAccountClick={() => setCurrentView('account')}
        onNavClick={handleNavClick} 
      />
      
      <main className="flex-grow w-full">
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-racing-orange animate-spin" /></div>}>
          {currentView === 'login' && <Login onLoginSuccess={(u) => { setUser(u); saveSession(u); setCurrentView(lastView); }} onBack={() => setCurrentView(lastView)} onRegisterClick={() => setCurrentView('register')} />}
          {currentView === 'register' && <Register onRegisterSuccess={() => setCurrentView('login')} onBack={() => setCurrentView('login')} onGoToLogin={() => setCurrentView('login')} />}
          {currentView === 'forum' && <Forum user={user} onBack={() => setCurrentView('catalog')} onLoginRequest={() => setCurrentView('login')} />}
          {currentView === 'categories' && <CategoryBrowser onSelectCategory={handleCategorySelect} onBack={() => setCurrentView('catalog')} />}
          {currentView === 'checkout' && <Checkout cart={cart} user={user} onBack={() => setCurrentView('cart')} onOrderComplete={() => { setCart([]); setCurrentView('catalog'); }} onLoginSuccess={(u) => { setUser(u); saveSession(u); }} />}
          {currentView === 'orders' && user && <MyOrders user={user} onBack={() => setCurrentView('catalog')} />}
          {currentView === 'account' && user && <MyAccount user={user} onBack={() => setCurrentView('catalog')} onUpdateUser={setUser} />}
          {currentView === 'warranty' && <Warranty onBack={() => setCurrentView('catalog')} />}
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

        {currentView === 'catalog' && (
          <>
            <section className="relative h-[500px] md:h-[600px] flex items-center justify-center bg-zinc-900 overflow-hidden w-full">
              <div className="absolute inset-0 z-0">
                <picture>
                  <source media="(max-width: 768px)" srcSet={heroMobile} />
                  <img src={heroDesktop} alt="Taller Moto" className="w-full h-full object-cover grayscale opacity-40" />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-transparent"></div>
              </div>
              <div className="relative z-10 text-center px-4 mt-[-40px] w-full max-w-[100vw]">
                <span className="inline-block border border-racing-orange text-racing-orange px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-4 bg-black/50 backdrop-blur-sm">
                  Racing Store
                </span>
                {/* PR-4 added directly to H1, also keeping span padding. Flex box or block needed for padding to take effect on right correctly if text is long */}
                <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 uppercase italic leading-tight pr-4">
                  <span className="inline-block py-1 pr-2">{STORE_CONFIG.heroTitle}</span> <br/>
                  <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-racing-orange to-red-600 py-2 pr-4">
                    {STORE_CONFIG.heroSubtitle}
                  </span>
                </h1>
              </div>
            </section>

            <BikeSelector onSearch={handleBikeSearch} isLoading={loading && !!currentFilter} bikeData={BIKE_DATA} />

            <section className="py-20 bg-zinc-950 w-full">
              <div className="container mx-auto px-4">
                <div className="flex flex-wrap justify-between items-end mb-12 gap-4">
                  <div className="flex items-center gap-4">
                     {/* PR-2 to title */}
                     <h2 className="text-3xl font-extrabold text-white uppercase italic pr-2">
                       {currentFilter ? `Resultados: ${currentFilter}` : "Destacados"}
                     </h2>
                     {currentFilter && (
                       <button 
                        onClick={handleClearFilters}
                        className="bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 p-2 rounded-sm transition-colors"
                        title="Borrar filtros"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                     )}
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center h-64"><Loader2 className="w-12 h-12 text-racing-orange animate-spin" /></div>
                ) : error ? (
                   <div className="flex flex-col items-center justify-center py-20 bg-red-900/10 border border-red-900/50 rounded-sm p-8 text-center">
                      <WifiOff className="w-16 h-16 text-red-500 mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
                      
                      <div className="bg-black/30 p-4 rounded text-left text-xs font-mono text-red-300 mb-6 max-w-lg overflow-auto">
                        <p className="font-bold border-b border-red-800/50 pb-2 mb-2">Detalle Técnico:</p>
                        {errorDetail}
                        <p className="mt-2 text-zinc-500 italic">
                          Si persiste, verifica que la REST API de WooCommerce no esté desactivada por un plugin de seguridad.
                        </p>
                      </div>

                      <button 
                        onClick={loadFeaturedProducts}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase py-3 px-8 rounded-sm flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Reintentar Conexión
                      </button>
                   </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.length > 0 ? products.map(product => (
                      <ProductCard key={product.id} product={product} onClick={(p) => { setSelectedProduct(p); setCurrentView('product'); }} onAddToCart={() => addToCart(product, 1)} />
                    )) : (
                      <div className="col-span-full py-20 text-center">
                         <div className="bg-zinc-900 inline-block p-8 rounded-sm border border-zinc-800">
                            <p className="text-zinc-400 text-lg mb-4">No se encontraron productos compatibles con tu búsqueda.</p>
                            <button onClick={handleClearFilters} className="text-racing-orange font-bold uppercase text-sm hover:text-white">
                              Ver todo el catálogo
                            </button>
                         </div>
                      </div>
                    )}
                  </div>
                )}
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