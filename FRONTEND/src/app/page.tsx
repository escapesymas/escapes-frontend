/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @next/next/no-img-element, @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bike, Cpu, ChevronLeft, ChevronRight, AlertCircle, Wrench, Loader2, X, ShieldCheck, Truck } from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import CompatibleProducts from '../components/CompatibleProducts';
import BrandCarousel from '../components/BrandCarousel';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import NotifyMeModal from '../components/NotifyMeModal';
import { fetchProducts } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Product, ProductCompatibility } from '../types';

const BikeSelectorModal = dynamic(() => import('../components/BikeSelectorModal'), { ssr: false });

const KNOWN_BRANDS = ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'BMW', 'Ducati', 'KTM', 'Aprilia', 'Triumph', 'Harley', 'Vespa', 'Piaggio', 'Kymco', 'SYM', 'Peugeot', 'Rieju', 'Gilera', 'Derbi', 'Moto Guzzi', 'Indian', 'Royal Enfield', 'Benelli', 'Mondial', 'QJ Motor', 'Lifan', 'Zontes', 'Voge', 'Mash', 'Motomel', 'Zanella', 'Corven', 'Bajaj', 'Hero', 'TVS', 'Husqvarna', 'KTM AG', 'SWM', 'Beta', 'Fantic', 'GasGas', 'Sherco', 'Vertigo', 'Scorpa', 'Montesa', 'Honda Motor'];

function parseBike(bike: string): { brand: string; model: string; year: string } {
  const cleaned = bike.trim();
  for (const b of KNOWN_BRANDS) {
    if (cleaned.toLowerCase().startsWith(b.toLowerCase() + ' ')) {
      const rest = cleaned.substring(b.length + 1).trim();
      const yearMatch = rest.match(/\((\d{4})\)|\b(\d{4})\b/);
      const year = yearMatch ? (yearMatch[1] || yearMatch[2]) : '';
      const model = yearMatch ? rest.replace(yearMatch[0], '').trim() : rest;
      return { brand: b, model, year };
    }
  }
  const yearMatch = cleaned.match(/\((\d{4})\)|\b(\d{4})\b/);
  const year = yearMatch ? (yearMatch[1] || yearMatch[2]) : '';
  const model = yearMatch ? cleaned.replace(yearMatch[0], '').trim() : cleaned;
  return { brand: '', model, year };
}

async function syncGarageToServer(userEmail: string, garageList: string[]) {
  try {
    const existingRes = await fetch(`/api/garage?userEmail=${encodeURIComponent(userEmail)}`);
    const existing: Array<{ id: number; brand: string; model: string; year: string }> = existingRes.ok ? await existingRes.json() : [];
    const existingKeys = new Set(existing.map((v) => `${(v.brand || '').toLowerCase()}|${(v.model || '').toLowerCase()}|${v.year || ''}`));

    for (const bike of garageList) {
      const parsed = parseBike(bike);
      if (!parsed.brand || !parsed.model) continue;
      const key = `${parsed.brand.toLowerCase()}|${parsed.model.toLowerCase()}|${parsed.year}`;
      if (existingKeys.has(key)) continue;
      await fetch('/api/garage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, brand: parsed.brand, model: parsed.model, year: parsed.year || new Date().getFullYear() }),
      }).catch(() => {});
    }
  } catch (e) {
    console.error('syncGarageToServer error:', e);
  }
}
const GarageView = dynamic(() => import('../components/GarageView'), { ssr: false });
const AdvisorView = dynamic(() => import('../components/AdvisorView'), { ssr: false });
const ProfileView = dynamic(() => import('../components/ProfileView'), { ssr: false });
const CartView = dynamic(() => import('../components/CartView'), { ssr: false });

export default function Home() {
  const { user, isAuthenticated, syncGarage } = useAuth();
  const { addToCart } = useCart();
  const [selectedBike, setSelectedBike] = useState<string>('');
  const [garageList, setGarageList] = useState<string[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('shop');

  // Estados de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategoryId, setSearchCategoryId] = useState<number | undefined>(undefined);
  const [searchCategoryName, setSearchCategoryName] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(0);
  const [searchTotal, setSearchTotal] = useState(0);

  // Carga de la moto activa al montar el componente
  useEffect(() => {
    const active = localStorage.getItem('tg_selected_bike');
    if (active) {
      setSelectedBike(active);
    }
  }, []);

  // Sincronizar el estado del garaje con el perfil del usuario o localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      setGarageList(user.garage || []);
    } else if (!isAuthenticated) {
      const history = localStorage.getItem('tg_garage_history');
      if (history) {
        try {
          setGarageList(JSON.parse(history));
        } catch (e) {}
      }
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const hasParams = params.has('tab') || params.has('payment_intent') || params.has('emptyCart') || params.has('openSelector');

      if (hasParams) {
        const tab = params.get('tab');
        if (tab) {
          setActiveTab(tab);
        }

        if (params.get('openSelector') === 'true') {
          setIsSelectorOpen(true);
        }

        if (params.has('payment_intent')) {
          setActiveTab('cart');
          const pending = sessionStorage.getItem('stripe_pending_order');
          sessionStorage.removeItem('stripe_pending_order');
          sessionStorage.setItem('stripe_redirect_result', JSON.stringify({
            paymentIntentId: params.get('payment_intent'),
            redirectStatus: params.get('redirect_status'),
            orderId: pending ? JSON.parse(pending).orderId : null,
          }));
        }

        if (params.get('emptyCart') === '1') {
          setShowEmptyCartBanner(true);
          setTimeout(() => setShowEmptyCartBanner(false), 6000);
        }

        setTimeout(() => {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        }, 500);
      }
    }
  }, []);

  const [advisorInput, setAdvisorInput] = useState('');
  const [advisorMessages, setAdvisorMessages] = useState<Array<{role: 'user' | 'assistant', text: string}>>([
    { role: 'assistant', text: '¡Hola, piloto! Soy tu asesor de moto. Pregúntame sobre compatibilidades, repuestos, equipación o cualquier duda técnica sobre tu moto.' }
  ]);

  const [notifyProduct, setNotifyProduct] = useState<Product | null>(null);
  const [showEmptyCartBanner, setShowEmptyCartBanner] = useState(false);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const handleNotifyMe = (product: Product) => {
    setNotifyProduct(product);
  };

  const handleSelectBike = async (bike: string) => {
    setSelectedBike(bike);
    localStorage.setItem('tg_selected_bike', bike);

    if (bike && !garageList.includes(bike)) {
      const newList = [bike, ...garageList];
      setGarageList(newList);
      if (isAuthenticated && user) {
        try {
          await syncGarage(newList);
          syncGarageToServer(user.email, newList).catch(() => {});
        } catch (e) {
          console.error('Error syncing garage', e);
        }
      } else {
        localStorage.setItem('tg_garage_history', JSON.stringify(newList));
      }
    }
  };

  const handleRemoveBike = async (bikeToRemove: string) => {
    const newList = garageList.filter(b => b !== bikeToRemove);
    setGarageList(newList);

    if (selectedBike === bikeToRemove) {
      setSelectedBike('');
      localStorage.removeItem('tg_selected_bike');
    }

    if (isAuthenticated && user) {
      try {
        await syncGarage(newList);
      } catch (e) {
        console.error('Error syncing garage', e);
      }
    } else {
      localStorage.setItem('tg_garage_history', JSON.stringify(newList));
    }
  };

  const handleSetActiveBike = (bike: string) => {
    setSelectedBike(bike);
    localStorage.setItem('tg_selected_bike', bike);
  };

  const handleSearch = async (query: string, pageNum = 1, categoryId?: number) => {
    setSearchQuery(query);
    setSearchPage(pageNum);
    if (!query.trim() && !categoryId) {
      setSearchResults([]);
      setSearchTotal(0);
      setSearchTotalPages(0);
      setSearchCategoryId(undefined);
      setSearchCategoryName('');
      return;
    }

    setIsSearchLoading(true);
    try {
      const data = await fetchProducts({ search: query || undefined, category_id: categoryId, page: pageNum, per_page: 12 });
      setSearchResults(data.products || []);
      setSearchTotal(data.total || 0);
      setSearchTotalPages(data.totalPages || 0);
    } catch (e) {
      console.error('Error searching products', e);
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Mapeo dinámico de compatibilidades y ordenación para los resultados
  const processedSearchResults = searchResults
    .filter((product) => product.price > 0 && product.image)
    .map((product) => ({
    ...product,
    isCompatible: selectedBike
      ? product.compatibility?.some((c: ProductCompatibility | string) => {
          const search = selectedBike.split(' ')[0].toLowerCase();
          if (typeof c === 'string') return c.toLowerCase().includes(search);
          if (typeof c === 'object' && c !== null) {
            return Object.values(c).some((v) => String(v).toLowerCase().includes(search));
          }
          return false;
        })
      : false
  })).sort((a, b) => (b.isCompatible ? 1 : 0) - (a.isCompatible ? 1 : 0));

  const handleSendAdvisorMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorInput.trim()) return;

    const userText = advisorInput;
    setAdvisorMessages(prev => [...prev, { role: 'user', text: userText }]);
    setAdvisorInput('');

    setTimeout(() => {
      let replyText = 'Entendido. Puedo ayudarte con compatibilidades, características técnicas y recomendaciones de producto para tu moto.';
      const q = userText.toLowerCase();
      if (q.includes('escape') || q.includes('akrapovic') || q.includes('leovince') || q.includes('termignoni')) {
        replyText = `Para seleccionar el escape correcto para ${selectedBike || 'tu moto'} es importante verificar la homologación Euro 5 y si el modelo requiere mapa de centralita. Busca en el catálogo por marca de escape o por tu moto para ver las opciones compatibles.`;
      } else if (q.includes('ruido') || q.includes('itv') || q.includes('homolog')) {
        replyText = 'Para pasar la ITV correctamente necesitas el certificado de homologación del fabricante y respetar los límites de dB. Muchos accesorios homologados incluyen este certificado.';
      } else if (q.includes('cadena') || q.includes('piñon') || q.includes('corona') || q.includes('kit de transmision')) {
        replyText = `Para ${selectedBike || 'tu moto'} busca el kit de transmisión (cadena + piñón + corona) con el paso correcto. Si no sabes el paso original, búscalo en el manual de tu moto o en la etiqueta del basculante.`;
      } else if (q.includes('freno') || q.includes('pastilla') || q.includes('disco')) {
        replyText = 'Para frenos, verifica el diámetro del disco y el tipo de pastilla (sinterizada para uso intenso, orgánica para uso urbano). Las pastillas de competición necesitan temperatura para funcionar correctamente.';
      } else if (q.includes('aceite') || q.includes('filtro')) {
        replyText = 'Utiliza siempre el aceite especificado por el fabricante en viscosidad (ej. 10W-40) y tipo (JASO MA2 para cajas de cambio húmedas). Cambia el filtro de aceite en cada revisión.';
      }
      setAdvisorMessages(prev => [...prev, { role: 'assistant', text: replyText }]);
    }, 1000);
  };

  return (
    <div
      className="bg-background text-foreground flex flex-col font-sans min-h-screen"
    >

      <Header
        selectedBike={selectedBike}
        onOpenBikeSelector={() => setIsSelectorOpen(true)}
        onCartClick={() => setActiveTab('cart')}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {!isAuthenticated && (
        <div className="bg-accent/10 border-b border-accent/30 px-4 py-2 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 text-xs">
          <span className="font-mono uppercase tracking-wider text-accent font-bold whitespace-nowrap">
            🤖 Asistente IA
          </span>
          <span className="text-foreground/80 text-center md:text-left">
            Crea cuenta gratis y pregúntale sobre escapes y recambios.
          </span>
          <a
            href="/login"
            className="font-mono uppercase text-[10px] font-bold bg-accent text-slate-950 px-3 py-1 rounded hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            Iniciar sesión
          </a>
        </div>
      )}

      {/* Main con padding-bottom en mobile para no chocar con BottomNav fixed */}
      {/* El BottomNav está fixed en mobile, fuera del flujo del main */}
      <main
        id="main-content"
        className={`${activeTab === 'shop' ? 'flex-1 pb-16 md:pb-0' : 'flex-1 overflow-y-auto overscroll-contain pb-16 md:pb-0'}`}
        style={activeTab === 'shop' ? undefined : { WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="container mx-auto px-4 py-6 max-w-[1400px]">

        {showEmptyCartBanner && (
          <div className="mb-4 bg-accent/10 border border-accent/30 rounded-md p-3 flex items-center gap-3 animate-fade-in" role="status">
            <AlertCircle className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
            <p className="flex-1 text-xs font-mono text-foreground">
              Tu carrito está vacío. <a href="/universales" className="text-accent hover:underline font-bold">Explora el catálogo</a> para añadir productos.
            </p>
            <button
              type="button"
              onClick={() => setShowEmptyCartBanner(false)}
              className="p-1 hover:bg-icon-box rounded-full transition-colors"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="flex flex-col gap-8 animate-fade-in">

            <section className="relative overflow-hidden bg-card border border-card-border rounded-md py-10 px-6 md:py-14 md:px-10 shadow-sm">
              {/* Decoración de fondo */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none hidden md:block" aria-hidden="true">
                <div className="absolute inset-0 bg-gradient-to-l from-accent/5 to-transparent" />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 grid grid-cols-4 gap-2 opacity-10">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="w-5 h-5 border border-accent rounded-sm" />
                  ))}
                </div>
              </div>
              <div className="relative z-10 max-w-xl flex flex-col items-start text-left">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-accent-text bg-accent/10 border border-accent/20 px-3 py-1 rounded mb-4">
                  Distribuidor oficial · Envío 24/48h
                </span>
                <h1 className="font-mono font-bold uppercase tracking-tight text-2xl md:text-4xl mb-3 leading-tight text-foreground">
                  Más de 100.000 recambios<br />
                  <span className="text-accent-text">compatibles con tu moto</span>
                </h1>
                <p className="text-text-muted mb-6 text-xs md:text-sm max-w-md font-sans">
                  Cascos, escapes Akrapovič, kits de transmisión, frenos y equipamiento. Verificamos compatibilidad con tu moto antes de enviarte cualquier pieza.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsSelectorOpen(true)}
                    className="px-5 py-2.5 text-xs font-mono font-bold rounded-sm bg-accent text-slate-950 hover:bg-accent-hover transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Bike className="w-4 h-4" />
                    Selecciona tu moto
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById('buscador-inicio')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 text-xs font-mono font-bold rounded-sm border border-card-border text-foreground hover:border-accent/50 hover:bg-select-bg transition-all cursor-pointer"
                  >
                    Explorar catálogo
                  </button>
                </div>
              </div>
            </section>

            <section aria-label="Ventajas de comprar en Escapes y Más" className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 md:px-0">
              {[
                { icon: Truck, label: 'Envío gratis', sub: 'Pedidos +49€' },
                { icon: ShieldCheck, label: 'Pago seguro', sub: 'Stripe · SSL' },
                { icon: Bike, label: 'Compatibilidad', sub: 'Verificada por moto' },
                { icon: Wrench, label: 'Asesor técnico', sub: 'IA + expertos' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2 bg-card border border-card-border rounded p-3">
                  <Icon className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground truncate">{label}</div>
                    <div className="text-[9px] text-text-muted font-mono truncate">{sub}</div>
                  </div>
                </div>
              ))}
            </section>

            {/* Buscador de referencias */}
            <section id="buscador-inicio" className="px-4 md:px-0 -mt-4">
              <SearchBar onSearch={(q) => handleSearch(q, 1)} isLoading={isSearchLoading} initialValue={searchQuery} />
            </section>

            {searchQuery || searchCategoryId ? (
              <section className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-card-border/60 pb-4 px-4 md:px-0">
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase text-foreground">
                      {searchCategoryName
                        ? <>Categoría: <span className="text-accent-text">{searchCategoryName}</span></>
                        : <>Resultados para: <span className="text-accent-text">"{searchQuery}"</span></>
                      }
                    </h3>
                    <p className="text-[10px] text-text-muted font-mono mt-1">
                      Encontrados {searchTotal} productos {selectedBike && `• Ordenados por compatibilidad con ${selectedBike}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleSearch('', 1, undefined);
                      setSearchCategoryId(undefined);
                      setSearchCategoryName('');
                    }}
                    className="px-3 py-1.5 border border-card-border rounded hover:bg-icon-box/40 text-xs font-mono font-bold uppercase text-text-muted hover:text-foreground cursor-pointer transition-all"
                  >
                    Limpiar
                  </button>
                </div>

                {isSearchLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  </div>
                ) : processedSearchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Wrench className="w-10 h-10 text-text-muted" />
                    <p className="text-xs text-text-muted font-mono">No se encontraron productos para tu búsqueda.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-0">
                      {processedSearchResults.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onNotifyMe={handleNotifyMe}
                        />
                      ))}
                    </div>

                    {/* Paginación */}
                    {searchTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
                        <button
                          disabled={searchPage <= 1}
                          onClick={() => handleSearch(searchQuery, Math.max(1, searchPage - 1))}
                          className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider border border-card-border hover:border-accent/40 rounded text-text-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        {Array.from({ length: searchTotalPages }, (_, i) => i + 1).map((pageNum) => {
                          const isVisible =
                            pageNum === 1 ||
                            pageNum === searchTotalPages ||
                            Math.abs(pageNum - searchPage) <= 2;
                          const showEllipsis =
                            (pageNum === 2 && searchPage > 4) ||
                            (pageNum === searchTotalPages - 1 && searchPage < searchTotalPages - 3);
                          if (!isVisible) {
                            return showEllipsis ? (
                              <span key={pageNum} className="text-text-muted px-1 text-xs font-bold">…</span>
                            ) : null;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handleSearch(searchQuery, pageNum)}
                              className={`min-w-[36px] py-2 px-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded border transition-all cursor-pointer ${
                                searchPage === pageNum
                                  ? 'bg-accent border-accent text-slate-950'
                                  : 'border-card-border hover:border-accent/40 text-text-muted hover:text-foreground'
                              }`}
                              aria-label={`Página ${pageNum}`}
                              aria-current={searchPage === pageNum ? 'page' : undefined}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          disabled={searchPage >= searchTotalPages}
                          onClick={() => handleSearch(searchQuery, Math.min(searchTotalPages, searchPage + 1))}
                          className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider border border-card-border hover:border-accent/40 rounded text-text-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                          aria-label="Página siguiente"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            ) : (
              <>
                {selectedBike ? (
                  <>
                    <section>
                      <CompatibleProducts
                        selectedBike={selectedBike}
                        onAddToCart={handleAddToCart}
                        onNotifyMe={handleNotifyMe}
                      />
                    </section>

                    <section className="mt-8">
                      <BrandCarousel brand="RST" title="RST — Casual & Sport" onAddToCart={handleAddToCart} onNotifyMe={handleNotifyMe} />
                    </section>
                    <section className="mt-8">
                      <BrandCarousel brand="AKRAPOVIC" title="Akrapovič — Escapes" onAddToCart={handleAddToCart} onNotifyMe={handleNotifyMe} />
                    </section>
                  </>
                ) : (
                  <>
                    {/* Categorías principales (sin moto seleccionada) */}
                    <section className="mt-2">
                      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
                        <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
                          Compra por categoría
                        </h3>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 xl:grid-cols-9 gap-3 px-4 md:px-0">
                        {[
                          { id: 'cascos', name: 'Cascos', icon: '🪖' },
                          { id: 'chasis', name: 'Chasis', icon: '🏍️' },
                          { id: 'electricidad', name: 'Electricidad', icon: '⚡' },
                          { id: 'equipamiento-piloto', name: 'Equipamiento', icon: '🧥' },
                          { id: 'aceite-fluidos', name: 'Aceites', icon: '🛢️' },
                          { id: 'neumaticos', name: 'Neumáticos', icon: '⚙️' },
                          { id: 'herramientas', name: 'Herramientas', icon: '🔧' },
                          { id: 'escapes', name: 'Escapes', icon: '💨' },
                          { id: 'frenos', name: 'Frenos', icon: '🛑' },
                        ].map((cat) => (
                          <a
                            key={cat.id}
                            href={`/universales/${cat.id}`}
                            className="aspect-square bg-card border border-card-border rounded-md flex flex-col items-center justify-center gap-1 p-2 hover:border-accent hover:bg-select-bg transition-all text-center no-underline"
                          >
                            <span className="text-2xl">{cat.icon}</span>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-foreground">{cat.name}</span>
                          </a>
                        ))}
                      </div>
                    </section>

                    <section className="mt-10">
                      <BrandCarousel brand="AKRAPOVIC" title="Akrapovič — Escapes premium" onAddToCart={handleAddToCart} onNotifyMe={handleNotifyMe} />
                    </section>
                    <section className="mt-8">
                      <BrandCarousel brand="SHARK" title="SHARK — Cascos" onAddToCart={handleAddToCart} onNotifyMe={handleNotifyMe} />
                    </section>
                    <section className="mt-8">
                      <BrandCarousel brand="RST" title="RST — Equipación" onAddToCart={handleAddToCart} onNotifyMe={handleNotifyMe} />
                    </section>
                  </>
                )}
              </>
            )}

          </div>
        )}

        {activeTab === 'garage' && (
          <GarageView
            selectedBike={selectedBike}
            garageList={garageList}
            onOpenSelector={() => setIsSelectorOpen(true)}
            onClearBike={() => handleRemoveBike(selectedBike)}
            onRemoveBike={handleRemoveBike}
            onSetActiveBike={handleSetActiveBike}
          />
        )}


        {/* {activeTab === 'paddock' && (
          <PaddockView selectedBike={selectedBike} />
        )} */}

        {activeTab === 'profile' && (
          <ProfileView />
        )}

        {activeTab === 'cart' && (
          <CartView onContinueShopping={() => setActiveTab('shop')} />
        )}

        </div>
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        selectedBike={selectedBike}
      />

      <NotifyMeModal
        isOpen={!!notifyProduct}
        onClose={() => setNotifyProduct(null)}
        productName={notifyProduct?.name || ''}
        productId={notifyProduct?.id || 0}
      />

      <BikeSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelectBike={handleSelectBike}
        currentBike={selectedBike}
      />
    </div>
  );
}
