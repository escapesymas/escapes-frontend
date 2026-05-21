
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, ArrowLeft, AlertCircle, RotateCcw, Loader2, Package, ShieldCheck } from 'lucide-react';
import { CartItem, User, Order, Product } from '../types';
import { optimizeImage } from '../utils/imageOptimizer';
import { fetchPendingOrders, fetchProductsByIds, fetchUserRank, fetchProducts } from '../services/apiService';
import { MARKETING_TIERS } from '../storeData';
import { CartProgressBar } from './CartProgressBar';
import { ProductCard } from './ProductCard';

interface CartProps {
  items: CartItem[];
  user?: User | null;
  appliedPromo: string | null;
  setAppliedPromo: (promo: string | null) => void;
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
  onRestoreCart?: (items: CartItem[]) => void;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
}

export const Cart: React.FC<CartProps> = ({
  items,
  user,
  appliedPromo,
  setAppliedPromo,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  onContinueShopping,
  onRestoreCart,
  onProductClick,
  onAddToCart
}) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[] | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);

  const applyPromoCode = (code: string) => {
    setPromoError(null);
    setPromoSuccessMsg(null);
    const upperCode = code.trim().toUpperCase();

    if (upperCode === 'WELCOME10' || upperCode === 'RIDER20' || upperCode === 'ENVIOFREE') {
      setAppliedPromo(upperCode);
      setPromoSuccessMsg(`Cupón ${upperCode} aplicado con éxito.`);
    } else {
      setPromoError("El código de cupón no es válido o ha expirado.");
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoSuccessMsg(null);
    setPromoError(null);
    setPromoCodeInput('');
  };

  // Recommendations Logic
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Active Cart Cross-Selling State
  const [crossSellProducts, setCrossSellProducts] = useState<Product[]>([]);
  const [loadingCrossSells, setLoadingCrossSells] = useState(false);

  const MOCK_MAINTENANCE_PRODUCTS: Product[] = [
    {
      id: 97424,
      title: 'Twin Air Foaming Power Wash (750ml)',
      slug: 'twin-air-foaming-power-wash-750ml',
      price: 10.85,
      regularPrice: 10.85,
      sku: '97424',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop',
      inStock: true,
      stock: 10,
      category: 'Mantenimiento & Fluidos',
      categorySlug: 'mantenimiento',
      description: '',
      shortDescription: ''
    },
    {
      id: 110960,
      title: 'WD40 Spray Contact Cleaner 400ml',
      slug: 'wd40-spray-contact-cleaner-400ml',
      price: 13.99,
      regularPrice: 13.99,
      sku: '110960',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop',
      inStock: true,
      stock: 5,
      category: 'Mantenimiento & Fluidos',
      categorySlug: 'mantenimiento',
      description: '',
      shortDescription: ''
    },
    {
      id: 99901,
      title: 'Motul C1 Chain Clean (400ml)',
      slug: 'motul-c1-chain-clean-400ml',
      price: 11.90,
      regularPrice: 11.90,
      sku: '99901',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&auto=format&fit=crop',
      inStock: true,
      stock: 8,
      category: 'Mantenimiento & Fluidos',
      categorySlug: 'mantenimiento',
      description: '',
      shortDescription: ''
    },
    {
      id: 99349,
      title: 'VPart Filter Oil Breather',
      slug: 'vpart-filter-oil-breather',
      price: 12.95,
      regularPrice: 12.95,
      sku: '99349',
      image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop',
      inStock: true,
      stock: 12,
      category: 'Mantenimiento & Fluidos',
      categorySlug: 'mantenimiento',
      description: '',
      shortDescription: ''
    }
  ];

  useEffect(() => {
    if (items.length === 0) {
      setLoadingRecs(true);
      
      // Realizamos búsquedas en paralelo para garantizar un mix lógico y de diversas marcas
      Promise.all([
        fetchProducts(undefined, 601, 1, 25).catch(() => ({ products: [] })), // Filtros de aire (Twin Air, VParts...)
        fetchProducts('WD40', 6, 1, 25).catch(() => ({ products: [] }))        // Sprays de mantenimiento WD40
      ])
        .then(([filtersRes, spraysRes]) => {
          const allProducts = [...(filtersRes.products || []), ...(spraysRes.products || [])];
          const inStock = allProducts.filter(p => p.inStock);
          
          // Filtro estricto: precio <= 30€ para que sean económicos
          // Y que el título no contenga piezas mecánicas complejas o pesadas
          const isMechanicalPart = (title: string): boolean => {
            const uppercaseTitle = title.toUpperCase();
            const nonMaintenanceWords = [
              'PISTON', 'VARIATOR', 'DAMPER', 'CHAIN', 'VALVE', 'CLUTCH', 
              'CYLINDER', 'SHAFT', 'ROD', 'BEARING', 'GASKET', 'GEAR', 
              'SPROCKET', 'MANIFOLD', 'HEADLIGHT', 'DISC', 'PUMP', 'SWITCH',
              'BUTTON', 'BAR', 'PEG', 'FOOTPEG', 'LEVER', 'MIRROR', 'AXLE', 'CARBURETOR'
            ];
            return nonMaintenanceWords.some(word => uppercaseTitle.includes(word));
          };

          const filtered = inStock.filter(p => p.price <= 30 && !isMechanicalPart(p.title));
          const sorted = [...filtered].sort((a, b) => a.price - b.price);
          
          if (sorted.length > 0) {
            // Algoritmo de diversificación de marcas para evitar monotonía
            const uniqueBrandProducts: Product[] = [];
            const seenBrands = new Set<string>();
            
            const getProductBrand = (title: string): string => {
              const firstWord = title.trim().split(/\s+/)[0]?.toUpperCase() || 'GENERAL';
              if (firstWord.startsWith('TWIN')) return 'TWIN AIR';
              if (firstWord.startsWith('WD')) return 'WD-40';
              return firstWord;
            };

            // Intentar llenar la lista con marcas únicas primero
            for (const p of sorted) {
              const brand = getProductBrand(p.title);
              if (!seenBrands.has(brand)) {
                seenBrands.add(brand);
                uniqueBrandProducts.push(p);
                if (uniqueBrandProducts.length === 4) break;
              }
            }

            // Si no llegamos a 4 marcas únicas, rellenamos con los siguientes más económicos
            if (uniqueBrandProducts.length < 4) {
              for (const p of sorted) {
                if (!uniqueBrandProducts.some(up => up.id === p.id)) {
                  uniqueBrandProducts.push(p);
                  if (uniqueBrandProducts.length === 4) break;
                }
              }
            }

            setRecommended(uniqueBrandProducts.slice(0, 4));
          } else {
            setRecommended(MOCK_MAINTENANCE_PRODUCTS);
          }
        })
        .catch(err => {
          console.error('[CART] Failed to load recommendations:', err);
          setRecommended(MOCK_MAINTENANCE_PRODUCTS);
        })
        .finally(() => {
          setLoadingRecs(false);
        });
    }
  }, [items.length]);

  const MOCK_CROSS_SELLS: Product[] = [
    {
      id: 88801,
      title: 'Tapones de Válvula de Aluminio CNC (Par)',
      slug: 'tapones-valvula-aluminio-cnc-vpart',
      price: 4.95,
      regularPrice: 4.95,
      sku: '88801',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&auto=format&fit=crop',
      inStock: true,
      stock: 50,
      category: 'Accesorios',
      categorySlug: 'accesorios',
      description: '',
      shortDescription: ''
    },
    {
      id: 88802,
      title: 'Paño de Microfibra Premium Moto (40x40cm)',
      slug: 'motul-microfibra-premium',
      price: 3.50,
      regularPrice: 3.50,
      sku: '88802',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop',
      inStock: true,
      stock: 100,
      category: 'Mantenimiento & Fluidos',
      categorySlug: 'mantenimiento',
      description: '',
      shortDescription: ''
    },
    {
      id: 88803,
      title: 'Motul C2 Chain Lube Road (100ml)',
      slug: 'motul-c2-chain-lube-road-100ml',
      price: 7.90,
      regularPrice: 7.90,
      sku: '88803',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&auto=format&fit=crop',
      inStock: true,
      stock: 25,
      category: 'Lubricantes & Químicos',
      categorySlug: 'mantenimiento',
      description: '',
      shortDescription: ''
    },
    {
      id: 88804,
      title: 'Líquido de Frenos Brembo DOT 4 (250ml)',
      slug: 'brembo-brake-fluid-dot4',
      price: 8.50,
      regularPrice: 8.50,
      sku: '88804',
      image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop',
      inStock: true,
      stock: 15,
      category: 'Frenos & Recambios',
      categorySlug: 'frenos',
      description: '',
      shortDescription: ''
    }
  ];

  useEffect(() => {
    if (items.length > 0) {
      setLoadingCrossSells(true);

      const hasEscape = items.some(item => 
        item.categorySlug === 'escapes' || 
        item.title.toUpperCase().includes('ESCAPE') || 
        item.title.toUpperCase().includes('SILENCIOSO')
      );
      const hasFrenos = items.some(item => 
        item.categorySlug === 'frenos' || 
        item.title.toUpperCase().includes('PASTILLA') || 
        item.title.toUpperCase().includes('DISCO') || 
        item.title.toUpperCase().includes('FRENO')
      );
      const hasTransmision = items.some(item => 
        item.categorySlug === 'recambios' && (
          item.title.toUpperCase().includes('CADENA') || 
          item.title.toUpperCase().includes('KIT TRANSMISION') || 
          item.title.toUpperCase().includes('CORONA') || 
          item.title.toUpperCase().includes('PINON')
        )
      );

      let fetchPromise: Promise<{ products: Product[] }>;

      if (hasEscape) {
        fetchPromise = fetchProducts('junta', undefined, 1, 20);
      } else if (hasFrenos) {
        fetchPromise = fetchProducts('frenos', undefined, 1, 20);
      } else if (hasTransmision) {
        fetchPromise = fetchProducts('motul', undefined, 1, 20);
      } else {
        fetchPromise = fetchProducts(undefined, 6, 1, 20);
      }

      fetchPromise
        .then(res => {
          const alreadyInCartIds = new Set(items.map(i => i.id));
          const available = (res.products || []).filter(p => 
            p.inStock && 
            !alreadyInCartIds.has(p.id) && 
            p.price <= 20 &&
            !p.title.toUpperCase().includes('PISTON') &&
            !p.title.toUpperCase().includes('CYLINDER')
          );
          
          if (available.length >= 2) {
            const merged = [...available, ...MOCK_CROSS_SELLS];
            const seenIds = new Set<number>();
            const unique: Product[] = [];
            for (const p of merged) {
              if (!alreadyInCartIds.has(p.id) && !seenIds.has(p.id)) {
                seenIds.add(p.id);
                unique.push(p);
              }
              if (unique.length === 4) break;
            }
            setCrossSellProducts(unique);
          } else {
            setCrossSellProducts(MOCK_CROSS_SELLS.filter(p => !alreadyInCartIds.has(p.id)).slice(0, 4));
          }
        })
        .catch(err => {
          console.error('[CART] Failed to fetch active cart cross-sells:', err);
          const alreadyInCartIds = new Set(items.map(i => i.id));
          setCrossSellProducts(MOCK_CROSS_SELLS.filter(p => !alreadyInCartIds.has(p.id)).slice(0, 4));
        })
        .finally(() => {
          setLoadingCrossSells(false);
        });
    }
  }, [items.length]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleFetchPendingOrders = async () => {
    if (!user) {
      setRecoveryError("Debes iniciar sesión para recuperar tu carrito");
      return;
    }

    setIsRecovering(true);
    setRecoveryError(null);

    try {
      const customerId = user.id && user.id > 0 ? user.id : 0;
      const orders = await fetchPendingOrders(customerId, user.email);
      if (orders.length > 0) {
        setPendingOrders(orders);
      } else {
        setRecoveryError("No tienes pedidos pendientes que recuperar");
      }
    } catch (error) {
      setRecoveryError("Error al buscar pedidos pendientes");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRestoreOrder = async (order: Order) => {
    if (!onRestoreCart) return;

    setIsRecovering(true);
    setRecoveryError(null);
    try {
      const productIds = order.line_items.map(item => (item as any).product_id || item.id).filter(Boolean);

      if (productIds.length === 0) {
        setRecoveryError("El pedido no tiene productos válidos");
        return;
      }

      const products = await fetchProductsByIds(productIds);
      const restoredItems: CartItem[] = [];
      for (const lineItem of order.line_items) {
        const productId = (lineItem as any).product_id || lineItem.id;
        const product = products.find(p => p.id === productId);

        if (product) {
          restoredItems.push({ ...product, quantity: lineItem.quantity });
        }
      }

      if (restoredItems.length > 0) {
        onRestoreCart(restoredItems);
        setPendingOrders(null);
      } else {
        setRecoveryError("Los productos de este pedido ya no están disponibles en el catálogo");
      }
    } catch (error) {
      console.error('[CART] Error restoring order:', error);
      setRecoveryError("Error al recuperar el carrito");
    } finally {
      setIsRecovering(false);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Marketing Tier Logic
  const getTier = (amount: number) => {
    if (amount >= MARKETING_TIERS.PLATINO.min) return MARKETING_TIERS.PLATINO;
    if (amount >= MARKETING_TIERS.ORO.min) return MARKETING_TIERS.ORO;
    if (amount >= MARKETING_TIERS.PLATA.min) return MARKETING_TIERS.PLATA;
    return MARKETING_TIERS.BRONCE;
  };

  const currentTier = getTier(subtotal);
  const tierDiscount = (subtotal * currentTier.discount) / 100;

  // Calcular cupón de descuento
  const promoDiscount = appliedPromo === 'WELCOME10' 
    ? (subtotal * 0.10) 
    : appliedPromo === 'RIDER20' 
      ? (subtotal * 0.20) 
      : 0;

  const isFreeShippingPromo = appliedPromo === 'ENVIOFREE';
  const shippingCost = isFreeShippingPromo ? 0 : currentTier.shipping;
  const discountAmount = tierDiscount + promoDiscount;
  const total = Math.max(0, subtotal + shippingCost - discountAmount);
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="bg-zinc-100 dark:bg-zinc-900 p-6 rounded-full mb-6">
          <ShoppingBag className="w-12 h-12 text-zinc-400 dark:text-zinc-600" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 uppercase italic">Tu carrito está vacío</h2>
        <p className="text-zinc-600 dark:text-zinc-500 mb-8 max-w-md">
          Parece que aún no has añadido ninguna pieza para tu moto. Revisa nuestro catálogo para encontrar lo que necesitas.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button
            onClick={onContinueShopping}
            className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase tracking-wide py-3 px-8 rounded-sm transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a la tienda
          </button>

          {user && onRestoreCart && (
            <button
              onClick={handleFetchPendingOrders}
              disabled={isRecovering}
              className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold uppercase tracking-wide py-3 px-8 rounded-sm transition-colors flex items-center gap-2 border border-zinc-300 dark:border-zinc-700"
            >
              {isRecovering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Recuperar carrito anterior
            </button>
          )}
        </div>

        {/* Cross-selling when empty */}
        <div className="w-full max-w-5xl border-t border-zinc-200 dark:border-zinc-900 pt-12">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-8 text-center italic">Productos Recomendados de Mantenimiento y Limpieza</h3>
          {loadingRecs ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm animate-pulse">
                  <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-sm mb-3" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommended.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={onProductClick}
                  onAddToCart={onAddToCart ? () => onAddToCart(product, 1) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {recoveryError && (
          <div className="mt-6 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-2 rounded-sm text-sm">
            {recoveryError}
          </div>
        )}

        {pendingOrders && pendingOrders.length > 0 && (
          <div className="mt-8 w-full max-w-lg">
            <h3 className="text-zinc-900 dark:text-white font-bold uppercase text-sm mb-4">Pedidos pendientes encontrados:</h3>
            <div className="space-y-3 text-left">
              {pendingOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm flex justify-between items-center hover:border-zinc-300 dark:hover:bg-zinc-700 transition-colors shadow-sm dark:shadow-none"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-racing-orange" />
                      <span className="text-zinc-900 dark:text-white font-bold">Pedido #{order.id}</span>
                    </div>
                    <p className="text-zinc-500 text-xs">
                      {order.line_items.length} productos • {formatPrice(parseFloat(order.total))}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestoreOrder(order)}
                    disabled={isRecovering}
                    className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase text-xs py-2 px-4 rounded-sm transition-colors"
                  >
                    Recuperar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white uppercase italic flex items-center gap-3">
            Carrito de Compra <span className="text-zinc-500 dark:text-zinc-600 text-lg not-italic font-normal">({itemsCount} productos)</span>
          </h1>
        </div>
        <button onClick={onContinueShopping} className="text-zinc-500 hover:text-racing-orange text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 mb-1">
          <ArrowLeft className="w-4 h-4" /> Seguir comprando
        </button>
      </div>

      <CartProgressBar subtotal={subtotal} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm overflow-hidden">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => (
                <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                  <div className="w-24 h-24 bg-white rounded-sm overflow-hidden flex-shrink-0 p-2 border border-zinc-100 dark:border-zinc-800">
                    <img
                      src={optimizeImage(item.image, { width: 100 })}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-zinc-900 dark:text-white font-bold uppercase text-sm md:text-base leading-tight line-clamp-2">
                        {item.title}
                      </h3>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-zinc-300 hover:text-red-500 transition-colors p-2 ml-4 flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-zinc-500 text-xs mb-4">{item.category}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-1 text-zinc-500 hover:text-racing-orange transition-colors disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center text-sm font-bold text-zinc-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="px-3 py-1 text-zinc-500 hover:text-racing-orange transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-500 line-through leading-none mb-1 opacity-0">{formatPrice(item.price)}</p>
                        <p className="text-xl font-black text-racing-orange leading-none">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Highlights Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 border border-zinc-200 dark:border-zinc-800 rounded-sm flex items-start gap-4">
              <div className="bg-white dark:bg-zinc-800 p-2 rounded-sm"><ShieldCheck className="w-6 h-6 text-green-600" /></div>
              <div>
                <h4 className="text-[10px] font-black uppercase italic tracking-widest text-zinc-900 dark:text-white">Garantía Oficial</h4>
                <p className="text-[10px] text-zinc-500">Recambios originales y marcas premium directas del fabricante.</p>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 border border-zinc-200 dark:border-zinc-800 rounded-sm flex items-start gap-4">
              <div className="bg-white dark:bg-zinc-800 p-2 rounded-sm"><Truck className="w-6 h-6 text-racing-orange" /></div>
              <div>
                <h4 className="text-[10px] font-black uppercase italic tracking-widest text-zinc-900 dark:text-white">Envío Preferente</h4>
                <p className="text-[10px] text-zinc-500">Sigue tu pedido en tiempo real desde que sale de nuestro almacén.</p>
              </div>
            </div>
          </div>

          {/* Venta Cruzada Contextual (Frecuentemente Comprados Juntos) */}
          {crossSellProducts.length > 0 && (
            <div className="bg-zinc-50/50 dark:bg-zinc-900/10 p-6 border border-zinc-200 dark:border-zinc-800/80 rounded-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:bg-transparent dark:border-zinc-900 pb-3">
                <h3 className="text-zinc-900 dark:text-white font-black uppercase text-sm italic tracking-wider flex items-center gap-2">
                  <span className="text-racing-orange">✨</span> Frecuentemente comprados juntos
                </h3>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-sm">
                  Ahorra en Envío
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {crossSellProducts.map((product) => {
                  const firstWord = product.title.trim().split(/\s+/)[0]?.toUpperCase() || 'ACCESORIO';
                  const brandLabel = firstWord.startsWith('TWIN') ? 'TWIN AIR' : firstWord.startsWith('WD') ? 'WD-40' : firstWord;

                  return (
                    <div 
                      key={product.id} 
                      className="group bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 p-3 rounded-sm flex flex-col justify-between hover:border-racing-orange dark:hover:border-racing-orange transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <div className="space-y-2">
                        {/* Image Wrapper */}
                        <div className="aspect-square bg-zinc-50 dark:bg-zinc-900/60 rounded-sm overflow-hidden flex items-center justify-center p-2 relative">
                          <img 
                            src={product.image} 
                            alt={product.title} 
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                          <span className="absolute bottom-1 left-1 bg-black text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm scale-95 origin-left">
                            {brandLabel}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-zinc-800 dark:text-zinc-200 text-xs font-bold leading-tight line-clamp-2 h-8 group-hover:text-racing-orange transition-colors">
                          {product.title}
                        </h4>
                      </div>

                      {/* Price & Action */}
                      <div className="mt-3 pt-2 border-t border-zinc-50 dark:border-zinc-900/60 flex items-center justify-between gap-1">
                        <span className="text-sm font-black text-racing-orange">
                          {formatPrice(product.price)}
                        </span>
                        
                        <button
                          onClick={() => onAddToCart && onAddToCart(product, 1)}
                          className="bg-zinc-100 hover:bg-racing-orange dark:bg-zinc-900 dark:hover:bg-racing-orange text-zinc-700 hover:text-white dark:text-zinc-300 dark:hover:text-white text-[10px] font-extrabold uppercase py-1.5 px-2.5 rounded-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          + Añadir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-sm sticky top-24 shadow-2xl shadow-zinc-200/50 dark:shadow-none">
            <h3 className="text-zinc-900 dark:text-white font-bold uppercase mb-8 tracking-widest text-lg italic italic-black italic-bold">Resumen</h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-sm font-bold uppercase tracking-wider">
                <span>Subtotal</span>
                <span className="text-zinc-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>

              {tierDiscount > 0 && (
                <div className="flex justify-between text-racing-orange text-sm font-bold uppercase">
                  <span>Descuento {currentTier.label}</span>
                  <span>-{formatPrice(tierDiscount)}</span>
                </div>
              )}

              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-500 text-sm font-bold uppercase animate-pulse">
                  <span>Cupón {appliedPromo}</span>
                  <span>-{formatPrice(promoDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-sm font-bold uppercase tracking-wider">
                <span>Envío</span>
                <span className={shippingCost === 0 ? "text-green-500 font-black italic" : "text-zinc-900 dark:text-white"}>
                  {shippingCost === 0 ? "GRATIS" : formatPrice(shippingCost)}
                </span>
              </div>

              {/* Promo Code Section */}
              <div className="border-t border-zinc-100 dark:border-zinc-900 pt-4 mt-2">
                <span className="text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wide block mb-2">¿Tienes un cupón de descuento?</span>
                {appliedPromo ? (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-sm p-3 flex items-center justify-between">
                    <div>
                      <span className="text-green-600 dark:text-green-400 font-black text-xs block uppercase">Cupón {appliedPromo}</span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                        {appliedPromo === 'WELCOME10' ? '10% de descuento adicional' : appliedPromo === 'RIDER20' ? '20% de descuento adicional' : 'Envío Gratuito'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      className="text-red-500 hover:text-red-400 font-bold uppercase text-[10px] tracking-wide"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Introduce tu cupón"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm py-2 px-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-racing-orange flex-1 uppercase font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => applyPromoCode(promoCodeInput)}
                        className="bg-racing-orange hover:bg-black text-white font-bold uppercase py-2 px-4 rounded-sm text-xs transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 animate-bounce" /> {promoError}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="border-t-2 border-dashed border-zinc-100 dark:border-zinc-900 pt-6 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-zinc-400 dark:text-zinc-600 font-black uppercase text-xs italic">Total</span>
                <div className="text-right">
                  <span className="text-4xl font-black text-zinc-900 dark:text-white block leading-none">{formatPrice(total)}</span>
                  <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mt-2 block">IVA Incluido</span>
                </div>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-racing-orange hover:bg-black text-white font-black uppercase tracking-widest py-5 px-6 rounded-sm flex items-center justify-center gap-3 transition-all group"
            >
              Tramitar Pedido <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>

            {/* TRUST TRUST TRUST */}
            <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-900">
              <div className="flex flex-col items-center gap-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Pago Seguro Garantizado</span>
                <div className="flex items-center justify-center gap-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
                  <img src="/Visa_Inc._logo_(2021–present).svg" alt="Visa" className="h-4.5 w-auto object-contain" style={{ height: '18px' }} />
                  <svg className="w-auto" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: '22px' }} aria-label="Mastercard">
                    <circle cx="7" cy="7.5" r="7" fill="#EB001B"/>
                    <circle cx="17" cy="7.5" r="7" fill="#F79E1B"/>
                    <path d="M12 11.16a6.96 6.96 0 0 1-1.84-3.66 6.96 6.96 0 0 1 1.84-3.66c1.1 1 1.84 2.24 1.84 3.66s-.73 2.66-1.84 3.66Z" fill="#FF5F00"/>
                  </svg>
                  <svg className="w-auto" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: '18px' }} aria-label="PayPal">
                    <path d="M7.74 2.3A4.54 4.54 0 0 0 3.2 6.84c0 .88.22 1.73.66 2.47L7.4 21.6A.75.75 0 0 0 8.1 22h3.9c.53 0 .9-.55.72-1.05l-2.43-6.9a.75.75 0 0 1 .71-.99h4.6a4.54 4.54 0 0 0 4.54-4.54c0-2.5-2.03-4.53-4.54-4.53H7.74Z" fill="#003087"/>
                    <path d="M10.84 8.7a4.54 4.54 0 0 0-4.54 4.54c0 .88.22 1.73.66 2.47l3.54 12.28A.75.75 0 0 0 11.2 28h3.9c.53 0 .9-.55.72-1.05l-2.43-6.9a.75.75 0 0 1 .71-.99h4.6a4.54 4.54 0 0 0 4.54-4.54c0-2.5-2.03-4.53-4.54-4.53h-7.76Z" fill="#0079C1" opacity="0.8"/>
                  </svg>
                  <div className="text-[10px] font-black border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-sm">BIZUM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
