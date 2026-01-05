import React, { useEffect, useState } from 'react';
import { ArrowRight, Loader2, AlertCircle, WifiOff, XCircle } from 'lucide-react';
import { Header } from './components/Header';
import { BikeSelector } from './components/BikeSelector';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { AIAdvisor } from './components/AIAdvisor';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { MyOrders } from './components/MyOrders';
import { MyAccount } from './components/MyAccount';
import { CategoryBrowser } from './components/CategoryBrowser';
import { Forum } from './components/Forum'; 
import { STORE_CONFIG, FEATURES, BIKE_DATA } from './storeData';
import { fetchProducts, isConfigValid } from './services/woocommerce';
import { saveSession, getSession, logoutSession } from './services/auth';
import { Product, BikeSelection, CartItem, User } from './types';

// Fallback Mock Data
const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    title: "Escape Akrapovic Titanio Racing Line (Demo)",
    price: 849.99,
    regularPrice: 999.00, // Example of discounted product
    image: "https://picsum.photos/seed/moto1/400/400",
    inStock: true,
    category: "Escapes",
    attributes: [
      { name: "Material", options: ["Titanio"] },
      { name: "Homologación", options: ["Racing (No road legal)"] }
    ],
    shortDescription: "<p>Sistema de escape completo diseñado para reducir peso y aumentar potencia en altas RPM.</p>"
  },
  {
    id: 2,
    title: "Filtro de Alto Flujo K&N Race Spec (Demo)",
    price: 64.50,
    regularPrice: 64.50,
    image: "https://picsum.photos/seed/moto2/400/400",
    inStock: true,
    category: "Admisión",
    attributes: [{ name: "Tipo", options: ["Lavable"] }],
    shortDescription: "<p>Filtro de aire de algodón de alto flujo. Lavable y reutilizable.</p>"
  },
  {
    id: 3,
    title: "Kit Transmisión DID Oro Reforzado (Demo)",
    price: 129.95,
    regularPrice: 145.00, // Example of discounted product
    image: "https://picsum.photos/seed/moto3/400/400",
    inStock: true,
    category: "Transmisión",
    attributes: [{ name: "Pasos", options: ["520", "525"] }],
    shortDescription: "<p>Cadena reforzada X-Ring color oro con piñón y corona aligerados.</p>"
  },
  {
    id: 4,
    title: "Caballete Hidráulico Universal Pro (Demo)",
    price: 95.00,
    regularPrice: 95.00,
    image: "https://picsum.photos/seed/moto4/400/400",
    inStock: false,
    category: "Taller",
    attributes: [],
    shortDescription: "<p>Soporta hasta 400kg. Ideal para mantenimiento en garaje.</p>"
  }
];

type ViewState = 'catalog' | 'product' | 'cart' | 'checkout' | 'login' | 'register' | 'orders' | 'account' | 'categories' | 'forum';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('catalog');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastView, setLastView] = useState<ViewState>('catalog'); // For login back navigation

  // User State
  const [user, setUser] = useState<User | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Initial Load
  useEffect(() => {
    // 1. Load Products
    loadFeaturedProducts();
    
    // 2. Check for saved session
    const savedUser = getSession();
    if (savedUser) {
      console.log("Session restored for:", savedUser.username);
      setUser(savedUser);
    }
  }, []);

  const loadFeaturedProducts = async () => {
    setLoading(true);
    try {
      const fetchedProducts = await fetchProducts();
      if (fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
        setUsingMockData(false);
      } else {
        setProducts(MOCK_PRODUCTS);
        setUsingMockData(true);
      }
    } catch (e) {
      console.error("Error loading products:", e);
      setProducts(MOCK_PRODUCTS);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBikeSearch = async (selection: BikeSelection) => {
    setLoading(true);
    setCurrentView('catalog'); // Ensure we go to catalog results
    setSelectedProduct(null); 
    
    const searchQuery = `${selection.brand} ${selection.model}`;
    setCurrentFilter(`${selection.brand} ${selection.model} ${selection.year}`);
    
    const matches = await fetchProducts(searchQuery);
    
    if (matches.length > 0) {
      setProducts(matches);
      setUsingMockData(false);
    } else {
      setProducts([]); 
    }
    setLoading(false);
  };

  const clearFilter = async () => {
    setCurrentFilter(null);
    loadFeaturedProducts();
  };

  // --- NAVIGATION HANDLERS ---
  const handleNavClick = (view: ViewState, category?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (view === 'catalog' && category) {
      handleCategorySelect(0, category); // Use 0 for ID when clicking header links for now, or update logic
    } else {
      setCurrentView(view);
      setSelectedProduct(null);
    }
  };

  const goToProduct = (product: Product) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedProduct(product);
    setCurrentView('product');
  };

  const goToCatalog = () => {
    setSelectedProduct(null);
    setCurrentView('catalog');
  };

  const goToCategories = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('categories');
  };

  const goToCart = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('cart');
  };

  const goToCheckout = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('checkout');
  };

  const goToLogin = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLastView(currentView); // Remember where we came from
    setCurrentView('login');
  };

  const goToRegister = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('register');
  };

  const goToOrders = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('orders');
  };

  const goToAccount = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('account');
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    saveSession(loggedInUser); // Save to LocalStorage
    
    // Return to previous view or Catalog if nothing stored
    if (lastView === 'login' || lastView === 'register') setCurrentView('catalog');
    else setCurrentView(lastView);
  };

  const handleLogout = () => {
    setUser(null);
    logoutSession(); // Clear LocalStorage
    goToCatalog();
  };

  // Called when a category is selected in the CategoryBrowser
  // UPDATED: Now accepts ID and Name for precise filtering
  const handleCategorySelect = async (categoryId: number, categoryName: string) => {
    setLoading(true);
    setCurrentView('catalog');
    setCurrentFilter(categoryName);
    
    // We treat category as a search term to find relevant products
    // Pass undefined for search string, and categoryId for filter
    const matches = await fetchProducts(undefined, categoryId);
    
    if (matches.length > 0) {
      setProducts(matches);
      setUsingMockData(false);
    } else {
      setProducts([]); // Or handle empty state
    }
    setLoading(false);
  };

  // --- CART HANDLERS ---
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

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const handleOrderComplete = () => {
    setCart([]);
    goToCatalog();
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Header */}
      <Header 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
        user={user}
        onCartClick={goToCart}
        onLogoClick={goToCatalog}
        onLoginClick={goToLogin}
        onLogoutClick={handleLogout}
        onOrdersClick={goToOrders}
        onAccountClick={goToAccount}
        onNavClick={handleNavClick} // New handler for Forum link
      />
      
      <main className="flex-grow">
        {currentView === 'login' && (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setCurrentView(lastView)}
            onRegisterClick={goToRegister}
          />
        )}

        {currentView === 'register' && (
          <Register
            onRegisterSuccess={goToLogin}
            onBack={() => setCurrentView('login')}
            onGoToLogin={goToLogin}
          />
        )}

        {/* FORUM VIEW */}
        {currentView === 'forum' && (
          <Forum 
            user={user}
            onBack={goToCatalog}
            onLoginRequest={goToLogin}
          />
        )}

        {currentView === 'categories' && (
          <CategoryBrowser 
            onSelectCategory={handleCategorySelect}
            onBack={goToCatalog}
          />
        )}

        {currentView === 'checkout' && (
          <Checkout 
            cart={cart}
            user={user}
            onBack={goToCart}
            onOrderComplete={handleOrderComplete}
            onLoginSuccess={handleLoginSuccess} // Pass login handler for inline login
          />
        )}

        {currentView === 'orders' && user && (
          <MyOrders 
            user={user}
            onBack={goToCatalog}
          />
        )}

        {currentView === 'account' && user && (
          <MyAccount 
            user={user}
            onBack={goToCatalog}
            onUpdateUser={setUser}
          />
        )}

        {currentView === 'cart' && (
           <Cart 
             items={cart}
             onUpdateQuantity={updateCartQuantity}
             onRemove={removeFromCart}
             onCheckout={goToCheckout}
             onContinueShopping={goToCatalog}
           />
        )}

        {currentView === 'product' && selectedProduct && (
          <ProductDetail 
            product={selectedProduct} 
            onBack={goToCatalog} 
            onAddToCart={(qty) => {
              addToCart(selectedProduct, qty);
              goToCart(); 
            }}
          />
        )}

        {currentView === 'catalog' && (
          <>
            {/* HERO SECTION */}
            <section className="relative h-[600px] flex items-center justify-center bg-zinc-900 overflow-hidden">
              <div className="absolute inset-0 z-0">
                <img 
                  src={STORE_CONFIG.heroImage}
                  alt="Taller Moto" 
                  className="w-full h-full object-cover grayscale opacity-40"
                  fetchPriority="high"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-transparent"></div>
              </div>

              <div className="relative z-10 container mx-auto px-4 text-center mt-[-60px]">
                <span className="inline-block border border-racing-orange text-racing-orange px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] mb-4 bg-black/50 backdrop-blur-sm">
                  Performance Parts Store
                </span>
                <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight uppercase italic">
                  {STORE_CONFIG.heroTitle} <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-racing-orange to-red-600 pr-4">
                    {STORE_CONFIG.heroSubtitle}
                  </span>
                </h1>
                <p className="text-xl text-zinc-300 max-w-2xl mx-auto mb-8 font-light">
                  El mayor catálogo de escapes, filtros y recambios técnicos para maximizar el rendimiento en pista y carretera.
                </p>
              </div>
            </section>

            {/* BIKE SELECTOR */}
            <BikeSelector 
              onSearch={handleBikeSearch} 
              isLoading={loading && !!currentFilter} 
              bikeData={BIKE_DATA}
            />

            {/* FEATURES BANNER */}
            <div className="bg-zinc-900 py-12 mt-12 border-b border-zinc-800">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {FEATURES.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border border-zinc-800 rounded-sm hover:border-zinc-700 transition-colors">
                      <div className="p-3 bg-zinc-800 rounded-full text-racing-orange">
                        <feat.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold uppercase text-sm">{feat.title}</h3>
                        <p className="text-zinc-500 text-sm">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PRODUCT GRID */}
            <section className="py-20 bg-zinc-950">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white uppercase italic tracking-wide">
                      {currentFilter ? (
                        <>Resultados para <span className="text-racing-orange">{currentFilter}</span></>
                      ) : (
                        <>Destacados <span className="text-racing-orange">Semana</span></>
                      )}
                    </h2>
                    <div className="h-1 w-24 bg-racing-orange mt-2"></div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {currentFilter && (
                      <button 
                        onClick={clearFilter}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm uppercase font-bold transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Borrar filtro
                      </button>
                    )}
                    {!currentFilter && (
                      <button 
                        onClick={goToCategories}
                        className="hidden md:flex items-center gap-2 text-racing-orange font-bold uppercase text-sm hover:text-white transition-colors"
                      >
                        Ver todo el catálogo <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* API Status Alerts */}
                {usingMockData && (
                  <div className={`mb-8 p-4 border rounded-sm flex items-start md:items-center gap-3 text-sm ${
                    isConfigValid() 
                    ? "bg-red-900/20 border-red-700/50 text-red-200" 
                    : "bg-yellow-900/20 border-yellow-700/50 text-yellow-200"
                  }`}>
                    {isConfigValid() ? (
                      <>
                        <WifiOff className="w-5 h-5 flex-shrink-0 text-red-500" />
                        <div>
                          <strong>Error de conexión con {STORE_CONFIG.name}:</strong> No se pudieron descargar los productos reales. 
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>
                          <strong>Modo Demo:</strong> No se detectó configuración válida de WooCommerce. Mostrando productos de ejemplo.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-12 h-12 text-racing-orange animate-spin" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-20 border border-zinc-800 border-dashed rounded-sm">
                    <p className="text-zinc-500 text-lg">No se encontraron productos para esta selección.</p>
                    <button onClick={clearFilter} className="mt-4 text-racing-orange hover:text-white font-bold uppercase text-sm">
                      Ver todos los productos
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onClick={goToProduct}
                        onAddToCart={() => addToCart(product, 1)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* AI ADVISOR BANNER (Visible on Catalog Only) */}
        {currentView === 'catalog' && (
          <section className="py-16 bg-zinc-900 border-t border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-racing-orange/10 to-transparent pointer-events-none"></div>
            <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="text-3xl font-bold text-white mb-4 uppercase">
                  ¿No sabes qué pieza elegir?
                </h2>
                <p className="text-zinc-400 mb-6">
                  Nuestro <strong className="text-racing-orange">Mecánico IA</strong> analiza la compatibilidad técnica de miles de referencias en segundos. Olvídate de devoluciones por piezas que no encajan.
                </p>
                <button className="bg-white text-black hover:bg-racing-orange hover:text-white px-6 py-3 font-bold uppercase tracking-wide rounded-sm transition-colors flex items-center gap-2">
                  Consultar ahora
                </button>
              </div>
              <div className="w-full md:w-1/3 aspect-video bg-zinc-800 rounded-sm border border-zinc-700 p-4 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
                <div className="text-center">
                  <div className="text-5xl font-mono text-racing-orange mb-2 font-bold animate-pulse">98%</div>
                  <div className="text-zinc-500 text-sm uppercase tracking-widest">Precisión Compatibilidad</div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-black border-t border-zinc-800 text-zinc-500 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-white font-bold uppercase mb-4 tracking-wider">{STORE_CONFIG.name}</h4>
            <p className="text-sm">Tu tienda de confianza para componentes de alto rendimiento. Envíos a toda la península.</p>
          </div>
          <div>
            <h4 className="text-white font-bold uppercase mb-4 tracking-wider">Ayuda</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-racing-orange">Envíos y Devoluciones</a></li>
              <li><a href="#" className="hover:text-racing-orange">Garantías</a></li>
              <li><a href={`mailto:${STORE_CONFIG.contactEmail}`} className="hover:text-racing-orange">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold uppercase mb-4 tracking-wider">Catálogo</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategorySelect(1, 'Escapes'); }} className="hover:text-racing-orange">Escapes</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategorySelect(2, 'Frenos'); }} className="hover:text-racing-orange">Frenos</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategorySelect(3, 'Neumáticos'); }} className="hover:text-racing-orange">Neumáticos</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold uppercase mb-4 tracking-wider">Newsletter</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Email..." className="bg-zinc-900 border border-zinc-800 px-3 py-2 w-full text-sm rounded-sm" />
              <button className="bg-racing-orange text-white px-3 py-2 rounded-sm font-bold">→</button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 pt-8 border-t border-zinc-900 text-xs text-center">
          &copy; {new Date().getFullYear()} {STORE_CONFIG.name}. Todos los derechos reservados.
        </div>
      </footer>

      <AIAdvisor />
    </div>
  );
}

export default App;