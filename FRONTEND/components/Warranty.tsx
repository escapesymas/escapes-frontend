
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ShieldCheck, Plus, Trash2, Upload, Loader2, CheckCircle, AlertCircle, Camera, Search, FileText } from 'lucide-react';
import { fetchProducts, fetchCustomerOrders } from '../services/apiService';
import { Product, Order, User } from '../types';

interface WarrantyProps {
  user: User | null;
  onBack: () => void;
  onLoginRequest: () => void;
}

interface WarrantyProduct {
  name: string;
  issue: string;
}

const ProductSearchInput = ({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) => {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length > 2 && showDropdown) {
        setLoading(true);
        try {
          const results = await fetchProducts(value);
          setSuggestions(results.products);
        } catch (e) {
          console.error("Error buscando productos", e);
        } finally {
          setLoading(false);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [value, showDropdown]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="w-full bg-black border border-zinc-700 p-3 pl-10 text-white rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500"
          placeholder={placeholder}
        />
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
        {loading && <Loader2 className="absolute right-3 top-3.5 w-4 h-4 text-racing-orange animate-spin" />}
      </div>

      {showDropdown && value.length > 2 && (
        <div className="absolute z-50 w-full bg-zinc-900 border border-zinc-700 mt-1 rounded-sm shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {suggestions.length > 0 ? (
            suggestions.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  onChange(product.title);
                  setShowDropdown(false);
                }}
                className="w-full text-left p-3 hover:bg-zinc-800 text-sm text-zinc-300 border-b border-zinc-800 last:border-0 flex items-center gap-3 transition-colors group"
              >
                <div className="w-8 h-8 bg-white rounded-sm overflow-hidden flex-shrink-0 border border-zinc-700">
                  <img src={product.image} className="w-full h-full object-contain" alt="" />
                </div>
                <span className="truncate group-hover:text-white transition-colors">{product.title}</span>
              </button>
            ))
          ) : (
            !loading && <div className="p-3 text-zinc-500 text-xs italic">No se encontraron productos.</div>
          )}
        </div>
      )}
    </div>
  );
};

export const Warranty: React.FC<WarrantyProps> = ({ user, onBack, onLoginRequest }) => {
  console.log('Warranty component mounting');
  const [formData, setFormData] = useState({
    requestType: 'warranty', // 'warranty' or 'return'
    invoiceNumber: '',
    purchaseDate: '',
    installationDate: '',
    buyerName: '',
    email: '',
    phone: '',
  });

  const [products, setProducts] = useState<WarrantyProduct[]>([{ name: '', issue: '' }]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Auto-fill user data and fetch orders
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        buyerName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.billing?.phone || ''
      }));

      // Fetch completed orders
      setLoadingOrders(true);
      setOrdersError(null);
      console.log('[Warranty] Fetching orders for user:', user.id);
      fetchCustomerOrders(user.id, 'completed')
        .then(data => {
          console.log('[Warranty] Orders loaded:', data.length);
          setOrders(data);
        })
        .catch(err => {
          console.error('[Warranty] Error loading orders:', err);
          setOrdersError(err.message || 'Error al cargar pedidos');
        })
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  const handleOrderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orderId = Number(e.target.value);
    const selected = orders.find(o => o.id === orderId);
    if (selected) {
      // Format date YYYY-MM-DD
      const date = selected.date_created ? new Date(selected.date_created).toISOString().split('T')[0] : '';

      // Auto-fill form data
      setFormData(prev => ({
        ...prev,
        invoiceNumber: String(selected.id),
        purchaseDate: date
      }));

      // Auto-fill products from order line items
      if (selected.line_items && selected.line_items.length > 0) {
        const orderProducts = selected.line_items.map(item => ({
          name: item.name,
          issue: '' // User needs to fill this
        }));
        setProducts(orderProducts);
        console.log('[Warranty] Auto-filled', orderProducts.length, 'products from order');
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProductChange = (index: number, field: keyof WarrantyProduct, value: string) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const addProductRow = () => {
    setProducts([...products, { name: '', issue: '' }]);
  };

  const removeProductRow = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB

      files.forEach(file => {
        if (file.size > MAX_SIZE) {
          alert(`La imagen ${file.name} supera el límite de 5MB.`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validación mínima
    if (products.some(p => !p.name.trim() || !p.issue.trim())) {
      setError("Por favor, completa la información de los productos y sus incidencias.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/warranty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          products,
          images
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        window.scrollTo(0, 0);
      } else {
        throw new Error(data.message || "Error al enviar la solicitud al servidor.");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "No se pudo conectar con el servidor de garantías. Asegúrate de que el endpoint esté activo y configurado.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-racing-carbon border border-zinc-800 p-8 rounded-sm max-w-lg w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white uppercase italic mb-2">Solicitud Enviada</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Tu solicitud de garantía ha sido recibida con éxito.
            <br /><br />
            Nuestro equipo técnico la revisará y te contactaremos en el email <strong>{formData.email}</strong> en un plazo de 24-48 horas laborables.
          </p>
          <button
            onClick={onBack}
            className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm transition-colors"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black animate-fade-in pb-20 pt-8">
      <div className="container mx-auto px-4 max-w-4xl">

        <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 text-xs font-bold uppercase tracking-widest transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
          <div className="w-12 h-12 bg-racing-orange rounded-sm flex items-center justify-center shadow-lg shadow-orange-900/50">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white uppercase italic leading-none">
              Portal de Garantías
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Servicio posventa oficial Escapes y Más
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800 p-4 rounded-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-red-200 font-bold mb-1">Error en el proceso:</p>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {!user ? (
          <div className="bg-zinc-900 border border-zinc-800 p-8 text-center rounded-sm">
            <ShieldCheck className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white uppercase italic mb-2">Requiere Iniciar Sesión</h2>
            <p className="text-zinc-400 mb-6 font-medium">
              Para gestionar garantías, necesitamos identificar tus pedidos y asegurar el seguimiento.
            </p>
            <button onClick={onLoginRequest} className="bg-racing-orange text-white font-bold uppercase py-3 px-8 rounded-sm hover:bg-orange-600 transition-colors shadow-lg shadow-orange-900/20">
              Iniciar Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">

            <section className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm">
              <h3 className="text-white font-bold uppercase mb-6 text-sm tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">1</span>
                Información del Pedido
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* SELECTOR DE PEDIDOS */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Seleccionar Pedido Completado</label>
                  {loadingOrders ? (
                    <div className="text-zinc-500 text-sm flex items-center gap-2 bg-zinc-900 p-3 rounded-sm border border-zinc-800">
                      <Loader2 className="w-4 h-4 animate-spin" /> Cargando historial...
                    </div>
                  ) : ordersError ? (
                    <div className="text-red-400 text-sm font-bold flex items-center gap-2 bg-red-900/10 p-3 rounded-sm border border-red-900/30">
                      <AlertCircle className="w-4 h-4" /> {ordersError}
                      <span className="text-xs text-zinc-500 ml-2">(Revisa la consola F12)</span>
                    </div>
                  ) : orders.length > 0 ? (
                    <select
                      onChange={handleOrderSelect}
                      className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none appearance-none cursor-pointer hover:border-zinc-500 transition-colors"
                      defaultValue=""
                    >
                      <option value="" disabled>-- Selecciona una factura --</option>
                      {orders.map(order => (
                        <option key={order.id} value={order.id}>
                          #{order.id} - {new Date(order.date_created).toLocaleDateString()} - {order.total}€
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-racing-orange text-sm font-bold flex items-center gap-2 bg-orange-900/10 p-3 rounded-sm border border-orange-900/30">
                      <AlertCircle className="w-4 h-4" /> No tienes pedidos completados disponibles para garantía.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Nº Factura / Pedido</label>
                  <div className="relative">
                    <input required name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 pl-10 text-white rounded-sm focus:border-racing-orange focus:outline-none" placeholder="Ej: 12345" />
                    <FileText className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Fecha de Compra</label>
                  <input required type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Fecha de Instalación / Recepción</label>
                  <input required type="date" name="installationDate" value={formData.installationDate} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Nombre Titular</label>
                  <input required name="buyerName" value={formData.buyerName} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none opacity-50 cursor-not-allowed" readOnly />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Email de Contacto</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none opacity-50 cursor-not-allowed" readOnly />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Teléfono Móvil</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none opacity-50 cursor-not-allowed" readOnly />
                </div>
              </div>
            </section>

            <section className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold uppercase text-sm tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">2</span>
                  Detalles del Problema
                </h3>
                <button type="button" onClick={addProductRow} className="text-racing-orange text-xs font-bold uppercase flex items-center gap-1 hover:text-white transition-colors">
                  <Plus className="w-4 h-4" /> Añadir otro artículo
                </button>
              </div>

              <div className="space-y-4">
                {products.map((prod, index) => (
                  <div key={index} className="bg-zinc-900 p-4 rounded-sm border border-zinc-800 relative group">
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProductRow(index)}
                        className="absolute top-2 right-2 p-2 text-zinc-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Producto</label>
                        <ProductSearchInput
                          value={prod.name}
                          onChange={(val) => handleProductChange(index, 'name', val)}
                          placeholder="Busca el producto..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Descripción de la falla</label>
                        <textarea
                          required
                          rows={2}
                          value={prod.issue}
                          onChange={(e) => handleProductChange(index, 'issue', e.target.value)}
                          className="w-full bg-black border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none resize-none"
                          placeholder="Ej: El escape presenta una grieta en la soldadura tras 2 meses..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm">
              <h3 className="text-white font-bold uppercase mb-6 text-sm tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">3</span>
                Evidencia Fotográfica
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square bg-black rounded-sm overflow-hidden border border-zinc-700 group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-sm flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-white hover:border-racing-orange transition-colors"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs uppercase font-bold">Subir Foto</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-zinc-500 text-[10px] mt-4 uppercase font-bold tracking-widest">
                Límite 5MB por archivo. Formatos permitidos: JPG, PNG.
              </p>
            </section>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-racing-orange hover:bg-orange-600 text-white font-black uppercase py-4 px-16 rounded-sm transition-all shadow-lg shadow-orange-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                Enviar Informe Técnico
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
