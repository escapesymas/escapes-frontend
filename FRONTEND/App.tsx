import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Loader2, Trash2, Package, Truck, ShieldCheck, CheckCircle, AlertCircle, Bike } from 'lucide-react';
import { Header } from './components/Header';
import { SEO } from './components/SEO';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BikeSelector } from './components/BikeSelector';
import { CompatibleCategories } from './components/CompatibleCategories';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { Cart } from './components/Cart';
import { CategoryBrowser } from './components/CategoryBrowser';
import { Contact } from './components/Contact';
import { BrandSlider } from './components/BrandSlider';
import { FeaturesBanner } from './components/FeaturesBanner';
import { KlarnaBanner } from './components/KlarnaBanner';
import { SearchImprovementsBanner } from './components/SearchImprovementsBanner';
import { ProductSkeleton } from './components/ProductSkeleton';
import { ProductGrid } from './components/ProductGrid';
import { STORE_CONFIG, CATEGORIES } from './storeData';
import { fetchProductsByIds, fetchCompatibleCategories } from './services/woocommerce';
import { saveSession, logoutSession } from './services/auth';
import { trackPageView, trackViewItem } from './utils/analytics';
import { Product, BikeSelection, TireSelection, Category } from './types';

// Hooks personalizados extraídos
import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { useCatalog } from './hooks/useCatalog';
import { useSEO } from './hooks/useSEO';

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
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

type ViewState = 'home' | 'catalog' | 'product' | 'cart' | 'checkout' | 'login' | 'register' | 'orders' | 'account' | 'categories' | 'forum' | 'contact' | 'warranty' | 'social' | 'user_profile' | 'admin';

const KNOWN_CATEGORIES = ['escapes', 'frenos', 'accesorios', 'protecciones', 'recambios', 'lubricantes', 'electrónica', 'suspensiones'];

const parsePathToView = (path: string): { view: ViewState; category?: string; productId?: string; userId?: string } => {
  const cleanPath = path.toLowerCase().replace(/\/$/, '');
  if (cleanPath === '' || cleanPath === '/') return { view: 'home' };
  if (cleanPath === '/recambios') return { view: 'catalog' };
  if (cleanPath === '/carrito') return { view: 'cart' };
  if (cleanPath === '/mi-cuenta') return { view: 'account' };
  if (cleanPath === '/admin') return { view: 'admin' };
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
  if (cleanPath.startsWith('/foro') || cleanPath.startsWith('/paddock')) return { view: 'forum' };
  if (cleanPath === '/social') return { view: 'social' };
  if (cleanPath === '/categorias') return { view: 'categories' };

  const parts = cleanPath.split('/').filter(Boolean);
  if (parts.length >= 2) {
    const idMatch = parts[1].match(/^(\d+)/);
    if (idMatch) {
      return { view: 'product', category: parts[0], productId: idMatch[1] };
    }
  }
  if (parts.length >= 1) {
    return { view: 'catalog', category: parts[0] };
  }
  return { view: 'home' };
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialParsed = parsePathToView(location.pathname);
  const [currentView, setCurrentView] = useState<ViewState>(initialParsed.view);
  const [urlCategory, setUrlCategory] = useState<string | undefined>(initialParsed.category);
  const [urlProductId, setUrlProductId] = useState<string | undefined>(initialParsed.productId);

  const query = searchParams.get('q') || undefined;
  const categoryIdParam = searchParams.get('cat');
  const motoParam = searchParams.get('moto');
  const brandParam = searchParams.get('brand');
  const tireParam = searchParams.get('tire');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Instanciar custom hooks refactorizados
  const { user, setUser } = useAuth();
  const { cart, setCart, addToCart } = useCart(user, setToast);
  const { 
    products, loading, setLoading, error, errorDetail,
    currentFilter, setCurrentFilter, currentPage, setCurrentPage,
    totalPages, totalCatalogProducts, perPage, setPerPage, sortBy, setSortBy,
    handleProductFetch 
  } = useCatalog({ currentView, urlCategory, query, motoParam, categoryIdParam, brandParam, tireParam });
  const seoData = useSEO({ currentView, urlCategory, selectedProduct, query, motoParam, brandParam });

  const catalogRef = useRef<HTMLDivElement>(null);
  const lastMotoRef = useRef<string | null>(null);
  const [compatibleCats, setCompatibleCats] = useState<Category[]>([]);
  const [compLoading, setCompLoading] = useState(false);
  const [selectedVehicleName, setSelectedVehicleName] = useState<string | null>(null);
  const [brands, setBrands] = useState<{ name: string; logo?: string }[]>([]);

  // Load Brands
  useEffect(() => {
    fetch('/all_brands.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBrands(data.map(name => ({ name })));
      })
      .catch(e => {
        fetch('/brands.txt')
          .then(res => res.text())
          .then(text => {
            const parsed = text.split('\n').filter(line => line.trim() !== '').map(line => {
              const [name, logo] = line.split(',');
              return { name: name?.trim(), logo: logo?.trim() };
            }).filter(b => b.name);
            setBrands(parsed);
          });
      });
  }, []);

  // Analytics & Scroll Top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageView(window.location.pathname + window.location.search);
  }, [location.pathname, location.search]);

  // URL -> State Sync
  useEffect(() => {
    const parsed = parsePathToView(location.pathname);
    setCurrentView(parsed.view);
    setUrlCategory(parsed.category);
    setUrlProductId(parsed.productId);

    const moto = searchParams.get('moto');
    if (moto) {
      const decoded = decodeURIComponent(moto);
      const [brand, model, year] = decoded.includes('|') ? decoded.split('|') : decoded.split('-');
      const vName = `${brand} ${model} ${year !== 'General' ? year : ''}`.trim();
      setSelectedVehicleName(vName);
      
      if (moto !== lastMotoRef.current && !compLoading && !categoryIdParam && !urlCategory && !query) {
        lastMotoRef.current = moto;
        setCompLoading(true);
        fetchCompatibleCategories(brand, model, year)
          .then(setCompatibleCats)
          .catch(err => {
             console.error(err);
             setCompatibleCats([]);
          })
          .finally(() => setCompLoading(false));
      }
    } else {
      setSelectedVehicleName(null);
      setCompatibleCats([]);
      lastMotoRef.current = null;
    }

    if (parsed.view === 'product' && parsed.productId) {
      const productId = parseInt(parsed.productId);
      if (!isNaN(productId) && (!selectedProduct || selectedProduct.id !== productId)) {
        setLoading(true);
        fetchProductsByIds([productId]).then(ps => {
          if (ps.length > 0) setSelectedProduct(ps[0]);
        }).finally(() => setLoading(false));
      }
    }
  }, [location.pathname, location.search]);

  const handleTextSearch = (q: string) => {
    setSearchParams({ q });
    navigate(`/recambios?q=${q}`);
  };

  const handleBikeSearch = (selection: BikeSelection) => {
    const param = `${selection.brand}|${selection.model}|${selection.year}`;
    const vehicleName = `${selection.brand} ${selection.model} ${selection.year !== 'General' ? selection.year : ''}`.trim();
    setSelectedVehicleName(vehicleName);
    setSearchParams({ moto: param });
    navigate(`/recambios?moto=${encodeURIComponent(param)}`);
  };

  const handleTireSearch = (selection: TireSelection) => {
    const param = `${selection.width}/${selection.profile}-${selection.rim}`;
    setSearchParams({ tire: param });
    navigate(`/recambios?tire=${encodeURIComponent(param)}`);
  };

  const handleNavClick = (target: ViewState, catOrQuery?: string) => {
    if (target === 'home') navigate('/');
    else if (target === 'catalog') {
      if (catOrQuery) {
        const isKnownCat = KNOWN_CATEGORIES.includes(catOrQuery.toLowerCase());
        if (isKnownCat) navigate(`/${catOrQuery.toLowerCase()}`);
        else navigate(`/recambios?q=${encodeURIComponent(catOrQuery)}`);
      } else navigate('/recambios');
    }
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

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black w-full overflow-x-hidden">
        <SEO {...seoData} />
        
        {/* Contextual Garage Banner */}
        {user?.garage && user.garage.length > 0 && (
          <div className="bg-zinc-950 border-b border-racing-orange/50 py-1.5 px-4 flex justify-between items-center z-[60] relative animate-fade-in shadow-lg">
            <div className="container mx-auto flex items-center justify-between text-[10px] md:text-xs">
              <div className="flex items-center gap-2 text-zinc-300 uppercase font-bold tracking-widest overflow-hidden">
                <Bike className="w-3.5 h-3.5 text-racing-orange shrink-0" />
                <span className="hidden sm:inline">Mi Garaje:</span>
                <select 
                  className="bg-transparent text-white border-none outline-none font-black italic cursor-pointer truncate max-w-[200px] md:max-w-xs focus:ring-0 appearance-none"
                  value={motoParam || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      navigate(`/recambios?moto=${e.target.value}`);
                    } else {
                      navigate(`/recambios`);
                    }
                  }}
                >
                  <option value="" className="bg-zinc-900 text-zinc-400">Ver catálogo completo</option>
                  {user.garage.map((bike, idx) => {
                    const val = encodeURIComponent(`${bike.brand}|${bike.model}|${bike.year}`);
                    return <option key={idx} value={val} className="bg-zinc-900 text-white">{bike.brand} {bike.model} {bike.year}</option>
                  })}
                </select>
              </div>
              <button onClick={() => navigate('/mi-cuenta')} className="text-racing-orange hover:text-white shrink-0 font-bold uppercase tracking-widest transition-colors">
                Gestionar
              </button>
            </div>
          </div>
        )}

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
            {currentView === 'admin' && <AdminDashboard user={user} onBack={() => navigate('/')} />}

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
                onProductClick={(product) => {
                  setSelectedProduct(product);
                  const slugSuffix = product.slug ? `-${product.slug}` : '';
                  navigate(`/${product.categorySlug || 'recambios'}/${product.id}${slugSuffix}`);
                }}
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

                <SearchImprovementsBanner onClick={() => navigate('/contacto')} />
                <KlarnaBanner onClick={() => navigate('/recambios')} />

                <section className="py-12 bg-white dark:bg-zinc-950 container mx-auto px-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white uppercase italic mb-8 border-l-4 border-racing-orange pl-4">Productos Destacados</h2>
                  {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {products.slice(0, 4).map((product) => (
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
                <section className={`pt-32 pb-12 transition-all duration-500 ${!motoParam && !query && !urlCategory ? 'bg-zinc-900 min-h-[60vh] flex items-center' : 'bg-white dark:bg-zinc-950'}`}>
                  <div className="w-full">
                    {!motoParam && !query && !urlCategory && (
                      <div className="text-center mb-12 animate-fade-in px-4">
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic mb-4">
                          Encuentra piezas <span className="text-racing-orange">Compatibles</span>
                        </h1>
                        <p className="text-zinc-400 max-w-xl mx-auto uppercase tracking-widest text-sm font-bold">
                          Selecciona tu vehículo para filtrar solo lo que le sirve a tu moto
                        </p>
                      </div>
                    )}
                    <BikeSelector
                      onSearch={handleBikeSearch}
                      onTireSearch={handleTireSearch}
                      onTextSearch={handleTextSearch}
                      onReset={handleClearFilters}
                      isLoading={loading || compLoading}
                    />
                  </div>
                </section>
                
                <section className="py-12 bg-white dark:bg-zinc-950 min-h-screen container mx-auto px-4 border-t border-zinc-200 dark:border-zinc-900">
                  {motoParam && !categoryIdParam && !urlCategory && !query ? (
                    <CompatibleCategories 
                      categories={compatibleCats}
                      onSelectCategory={(id) => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('cat', id.toString());
                        setSearchParams(newParams);
                        navigate(`/recambios?${newParams.toString()}`);
                      }}
                      isLoading={compLoading}
                      vehicleName={selectedVehicleName || 'tu moto'}
                    />
                  ) : (
                    <>
                      <div className="flex flex-col gap-6 mb-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white uppercase italic">
                              {urlCategory ? (CATEGORIES.find(c => c.id === urlCategory || c.name.toLowerCase() === urlCategory.toLowerCase())?.name || urlCategory) : (currentFilter || "Catálogo")}
                            </h2>
                            {(currentFilter || brandParam || motoParam) && (
                              <button onClick={handleClearFilters} className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> Limpiar
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
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

                            <select
                              value={urlCategory || ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                   const newParams = new URLSearchParams(searchParams);
                                   const match = CATEGORIES.find(c => c.name === e.target.value);
                                   if (match) newParams.set('cat', match.id.toString());
                                   navigate(`/recambios?${newParams.toString()}`);
                                } else {
                                   const newParams = new URLSearchParams(searchParams);
                                   newParams.delete('cat');
                                   navigate(`/recambios?${newParams.toString()}`);
                                }
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
                        {loading && products.length === 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
                          </div>
                        ) : (
                          <ProductGrid 
                            loading={loading}
                            error={error}
                            errorDetail={errorDetail}
                            products={products}
                            currentView={currentView}
                            urlCategory={urlCategory}
                            query={query}
                            onClearFilters={handleClearFilters}
                            onContactClick={() => navigate('/contacto')}
                            onViewAllClick={handleClearFilters}
                            onProductClick={(p) => {
                              setSelectedProduct(p);
                              const slugSuffix = p.slug ? `-${p.slug}` : '';
                              navigate(`/${p.categorySlug || 'recambios'}/${p.id}${slugSuffix}`);
                            }}
                            onAddToCart={(p) => addToCart(p, 1)}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => handleProductFetch(page)}
                          />
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}
          </Suspense>
        </main>
        <Footer onNavClick={handleNavClick} />

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
          <AIAdvisor onProductClick={(p) => { setSelectedProduct(p); navigate(`/producto/${p.id}`); }} onAddToCart={(p) => addToCart(p, 1)} user={user} onLoginRequest={() => navigate('/login')} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
