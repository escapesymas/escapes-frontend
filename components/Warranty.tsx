
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ShieldCheck, Plus, Trash2, Upload, Loader2, CheckCircle, AlertCircle, Camera, Search } from 'lucide-react';
import { fetchProducts } from '../services/woocommerce';
import { Product } from '../types';

interface WarrantyProps {
  onBack: () => void;
}

interface WarrantyProduct {
  name: string;
  issue: string;
}

// Sub-componente para el buscador predictivo
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
          // Destructure products from fetchProducts result
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
            !loading && <div className="p-3 text-zinc-500 text-xs italic">No se encontraron productos. Puedes seguir escribiendo manualmente.</div>
          )}
        </div>
      )}
    </div>
  );
};

export const Warranty: React.FC<WarrantyProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    purchaseDate: '',
    buyerName: '',
    email: '',
    phone: '',
  });

  const [products, setProducts] = useState<WarrantyProduct[]>([{ name: '', issue: '' }]);
  const [images, setImages] = useState<string[]>([]); 
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (products.some(p => !p.name || !p.issue)) {
      setError("Por favor, selecciona el producto y describe la incidencia.");
      setLoading(false);
      return;
    }

    try {
      // Ahora enviamos directamente a WordPress a través del proxy /wp-json
      const response = await fetch('/wp-json/escapes/v1/warranty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          products,
          images
        })
      });

      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        throw new Error("El servidor no devolvió una respuesta válida (JSON).");
      }

      if (response.ok && data.success) {
        setSuccess(true);
        window.scrollTo(0,0);
      } else {
        throw new Error(data.message || "Error al enviar la solicitud.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error de conexión. Inténtalo de nuevo.");
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
          <h2 className="text-3xl font-bold text-white uppercase italic mb-2">Solicitud Recibida</h2>
          <p className="text-zinc-400 mb-8">
            Tu caso ha sido registrado en nuestro sistema de <strong>Garantías</strong>.
            <br/><br/>
            Te hemos enviado un correo de confirmación y nuestro equipo técnico revisará las pruebas adjuntas.
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
              Garantías y Devoluciones
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Resolución de incidencias técnicas y devoluciones
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800 p-4 rounded-sm flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
             <div className="text-sm">
                <p className="text-red-200 font-bold mb-1">Hubo un problema:</p>
                <p className="text-red-300">{error}</p>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. Datos del Pedido y Cliente */}
          <section className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm">
            <h3 className="text-white font-bold uppercase mb-6 text-sm tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">1</span>
              Datos de Compra
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Nº Factura / Pedido</label>
                <input required name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" placeholder="Ej: PED-12345" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Fecha de Compra</label>
                <input required type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Nombre del Comprador</label>
                <input required name="buyerName" value={formData.buyerName} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Email</label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" placeholder="cliente@email.com" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Teléfono</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" placeholder="+34 600..." />
              </div>
            </div>
          </section>

          {/* 2. Productos Afectados */}
          <section className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-white font-bold uppercase text-sm tracking-wider flex items-center gap-2">
                 <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">2</span>
                 Productos a Devolver / Garantía
               </h3>
               <button type="button" onClick={addProductRow} className="text-racing-orange text-xs font-bold uppercase flex items-center gap-1 hover:text-white transition-colors">
                 <Plus className="w-4 h-4" /> Añadir otro producto
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
                      title="Eliminar línea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                       <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Producto del Catálogo</label>
                       <ProductSearchInput 
                         value={prod.name}
                         onChange={(val) => handleProductChange(index, 'name', val)}
                         placeholder="Escribe para buscar (Ej: Escape Akrapovic...)"
                       />
                    </div>
                    
                    <div>
                       <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Motivo de Devolución / Incidencia</label>
                       <input 
                         value={prod.issue}
                         onChange={(e) => handleProductChange(index, 'issue', e.target.value)}
                         className="w-full bg-black border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none"
                         placeholder="Ej: Defecto de fábrica, talla incorrecta, no compatible..."
                       />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Fotos y Evidencias */}
          <section className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm">
            <h3 className="text-white font-bold uppercase mb-6 text-sm tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">3</span>
              Fotos de la Incidencia (Opcional)
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
                <span className="text-xs uppercase font-bold">Añadir Foto</span>
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
            <p className="text-zinc-500 text-xs mt-4">
              * Formatos: JPG, PNG. Máx 5MB por foto. <br/>
              * Recomendamos no adjuntar más de 3-4 fotos para asegurar el envío rápido.
            </p>
          </section>

          <div className="flex justify-end pt-6 border-t border-zinc-800">
             <button 
               type="submit" 
               disabled={loading}
               className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-4 px-12 rounded-sm transition-all shadow-lg shadow-orange-900/20 flex items-center gap-2 disabled:opacity-50"
             >
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
               Enviar Solicitud
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
