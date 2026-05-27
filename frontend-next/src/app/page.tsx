'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bike, Cpu, ChevronLeft, ChevronRight, AlertCircle, Check, ShoppingCart, Wrench, Loader2 } from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import CategoryList from '../components/CategoryList';
import CompatibleProducts from '../components/CompatibleProducts';
import PaddockFeed from '../components/PaddockFeed';
import SearchBar from '../components/SearchBar';
import ProductImage from '../components/ProductImage';
import { fetchProducts } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const BikeSelectorModal = dynamic(() => import('../components/BikeSelectorModal'), { ssr: false });
const GarageView = dynamic(() => import('../components/GarageView'), { ssr: false });
const AdvisorView = dynamic(() => import('../components/AdvisorView'), { ssr: false });
const PaddockView = dynamic(() => import('../components/PaddockView'), { ssr: false });
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
  const [searchResults, setSearchResults] = useState<any[]>([]);
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
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
        // limpiar URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  const [advisorInput, setAdvisorInput] = useState('');
  const [advisorMessages, setAdvisorMessages] = useState<Array<{role: 'user' | 'assistant', text: string}>>([
    { role: 'assistant', text: '¡Hola, piloto! Soy tu asesor de moto. Pregúntame sobre compatibilidades, repuestos, equipación o cualquier duda técnica sobre tu moto.' }
  ]);

  const handleAddToCart = (product: any) => {
    addToCart(product);
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

  const handleSearch = async (query: string, pageNum = 1) => {
    setSearchQuery(query);
    setSearchPage(pageNum);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchTotal(0);
      setSearchTotalPages(0);
      return;
    }

    setIsSearchLoading(true);
    try {
      const data = await fetchProducts({ search: query, page: pageNum, per_page: 12 });
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
  const processedSearchResults = searchResults.map((product) => ({
    ...product,
    isCompatible: selectedBike
      ? product.compatibility?.some((c: any) => {
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
      className="bg-background text-foreground flex flex-col font-sans"
      style={{ height: '100dvh' }}
    >

      <Header
        selectedBike={selectedBike}
        onOpenBikeSelector={() => setIsSelectorOpen(true)}
        onCartClick={() => setActiveTab('cart')}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* El main tiene overflow-y:auto propio — así el BottomNav puede
          estar en flujo normal al fondo sin necesitar position:fixed */}
      <main
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="container mx-auto px-4 py-6 max-w-5xl">

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
                  Tu tienda de moto de confianza
                </span>
                <h1 className="font-mono font-bold uppercase tracking-tight text-2xl md:text-4xl mb-3 leading-tight text-foreground">
                  Todo para tu moto<br />
                  <span className="text-accent-text">y para el motero</span>
                </h1>
                <p className="text-text-muted mb-6 text-xs md:text-sm max-w-md font-sans">
                  Repuestos mecánicos, accesorios, cascos, equipación y mucho más. Miles de referencias con verificación de compatibilidad directa con tu moto.
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
                    onClick={() => setActiveTab('catalog')}
                    className="px-5 py-2.5 text-xs font-mono font-bold rounded-sm border border-card-border text-foreground hover:border-accent/50 hover:bg-select-bg transition-all cursor-pointer"
                  >
                    Ver catálogo
                  </button>
                </div>
              </div>
            </section>

            {/* Buscador de referencias */}
            <section className="px-4 md:px-0 -mt-4">
              <SearchBar onSearch={(q) => handleSearch(q, 1)} isLoading={isSearchLoading} initialValue={searchQuery} />
            </section>

            {searchQuery ? (
              <section className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-card-border/60 pb-4 px-4 md:px-0">
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase text-foreground">
                      Resultados de búsqueda para: <span className="text-accent-text">"{searchQuery}"</span>
                    </h3>
                    <p className="text-[10px] text-text-muted font-mono mt-1">
                      Encontrados {searchTotal} productos {selectedBike && `• Ordenados por compatibilidad con ${selectedBike}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSearch('', 1)}
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
                        <a
                          key={product.id}
                          href={`/producto/${product.id}`}
                          className="bg-card border rounded-md overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer"
                          style={{ borderColor: product.isCompatible ? 'var(--badge-border)' : 'var(--card-border)' }}
                        >
                          <div className="p-4 bg-image-wrapper flex items-center justify-center relative min-h-[160px] overflow-hidden">
                            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-card border border-card-border text-foreground shadow-sm">
                                {product.brand}
                              </span>
                              {product.isCompatible && (
                                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-badge text-badge-text border border-badge-border flex items-center gap-0.5 shadow-sm">
                                  <Check className="w-3 h-3 stroke-[3]" /> Compatible
                                </span>
                              )}
                            </div>

                            <ProductImage
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-contain p-2"
                              wrapperClassName="w-full h-full absolute inset-0"
                            />
                          </div>

                          <div className="p-4 flex flex-col justify-between flex-grow">
                            <div className="mb-4">
                              <h4 className="font-mono text-xs font-bold uppercase text-foreground line-clamp-1 mb-1">
                                {product.name}
                              </h4>
                              <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed">
                                {product.shortDescription}
                              </p>
                              {product.supplier_code && (
                                <p className="text-[9px] font-mono text-text-muted mt-2">
                                  Ref: <span className="text-foreground/80">{product.supplier_code}</span>
                                </p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-card-border/60 flex items-center justify-between">
                              <div>
                                <span className="text-[8px] font-mono text-text-muted uppercase font-bold block">Precio</span>
                                <span className="text-sm font-mono font-bold text-foreground">
                                  {product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                </span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAddToCart(product);
                                }}
                                className="p-2 rounded bg-accent text-slate-950 hover:bg-accent-hover active:scale-95 transition-all shadow-sm cursor-pointer"
                                aria-label="Añadir al carrito"
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>

                    {/* Paginación */}
                    {searchTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 mt-8">
                        <button
                          disabled={searchPage <= 1}
                          onClick={() => handleSearch(searchQuery, searchPage - 1)}
                          className="p-2 border border-card-border rounded bg-card hover:bg-icon-box/40 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono text-text-muted">
                          Página {searchPage} de {searchTotalPages}
                        </span>
                        <button
                          disabled={searchPage >= searchTotalPages}
                          onClick={() => handleSearch(searchQuery, searchPage + 1)}
                          className="p-2 border border-card-border rounded bg-card hover:bg-icon-box/40 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            ) : (
              <>
                <section>
                  <CategoryList onSelectCategory={(cat) => console.log('Categoría seleccionada:', cat)} />
                </section>

                <section>
                  <CompatibleProducts
                    selectedBike={selectedBike}
                    onAddToCart={handleAddToCart}
                  />
                </section>

                <section className="mb-6">
                  <PaddockFeed selectedBike={selectedBike} />
                </section>
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


        {activeTab === 'paddock' && (
          <PaddockView selectedBike={selectedBike} />
        )}

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
