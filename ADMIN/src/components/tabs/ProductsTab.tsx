import React from 'react';
import * as Icons from 'lucide-react';

interface ProductsTabProps {
  products: any[];
  productsLoading: boolean;
  hasMoreProducts: boolean;
  productSearch: string;
  productPage: number;
  setProductSearch: (v: string) => void;
  setProductPage: (v: number) => void;
  setEditingProduct: (p: any) => void;
  setShowProductForm: (v: any) => void;
  fetchProductsList: (search: string, page: number, append: boolean) => Promise<void>;
  handleDeleteProduct: (id: number) => Promise<void>;
}

/**
 * ProductsTab — Catálogo de Productos en PostgreSQL
 *
 * Tabla de productos con búsqueda, paginación y acciones de edición/eliminación.
 */
const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  productsLoading,
  hasMoreProducts,
  productSearch,
  productPage,
  setProductSearch,
  setProductPage,
  setEditingProduct,
  setShowProductForm,
  fetchProductsList,
  handleDeleteProduct,
}) => {
  return (
    <div className="space-y-6">
      {/* Search Bar and Meta Information */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Icons.Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Buscar productos por nombre, SKU o descripción..."
            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-racing-orange transition-all shadow-inner"
          />
        </div>
        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-950 border border-zinc-900 px-4 py-3.5 rounded-xl">
          Mostrando <strong className="text-zinc-300 font-mono">{products.length}</strong> productos
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                <th className="pb-4">Imagen</th>
                <th className="pb-4">Producto</th>
                <th className="pb-4">SKU</th>
                <th className="pb-4">Precio Base</th>
                <th className="pb-4">Stock</th>
                <th className="pb-4">Compatibilidad</th>
                <th className="pb-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 italic">
                    {productsLoading ? 'Buscando recambios...' : 'No hay productos en el catálogo nativo.'}
                  </td>
                </tr>
              ) : products.map((p) => {
                let imgs: any[] = [];
                try { imgs = p.images ? JSON.parse(p.images) : []; } catch { }
                let compat: any[] = [];
                try { compat = p.compatibility ? JSON.parse(p.compatibility) : []; } catch { }

                const imageUrl = imgs[0]?.src || imgs[0] || '';

                return (
                  <tr key={p.id} className="hover:bg-white/[0.01]">
                    <td className="py-4">
                      <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                        {imageUrl ? (
                          <img src={imageUrl} className="w-full h-full object-cover" alt={p.name} />
                        ) : (
                          <Icons.Package className="w-5 h-5 text-zinc-700" />
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{p.name}</span>
                        <span className="text-[10px] text-zinc-500 truncate max-w-[220px]">{p.description}</span>
                      </div>
                    </td>
                    <td className="py-4 font-mono text-xs text-zinc-500">{p.sku}</td>
                    <td className="py-4 font-black italic text-zinc-300 text-sm">
                      {(p.price / 100).toFixed(2)}€
                      {p.sale_price && (
                        <span className="block text-[9px] text-green-500 not-italic font-bold line-through">
                          {(p.sale_price / 100).toFixed(2)}€
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase italic ${p.stock > 0 ? 'bg-green-950/20 text-green-500 border border-green-900/30' : 'bg-red-950/20 text-red-500 border border-red-900/30'}`}>
                        {p.stock > 0 ? `${p.stock} Uds` : 'Agotado'}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
                        {compat.length} Motos
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setShowProductForm('edit');
                          }}
                          className="text-zinc-400 hover:text-white p-1"
                          title="Editar"
                        >
                          <Icons.Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-red-500 hover:text-red-400 p-1"
                          title="Eliminar"
                        >
                          <Icons.Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {hasMoreProducts && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={async () => {
              const nextPage = productPage + 1;
              setProductPage(nextPage);
              await fetchProductsList(productSearch, nextPage, true);
            }}
            disabled={productsLoading}
            className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-300 px-6 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {productsLoading ? (
              <>
                <Icons.Loader2 className="w-4 h-4 animate-spin text-racing-orange" />
                Cargando productos...
              </>
            ) : (
              <>
                <Icons.ChevronDown className="w-4 h-4 text-racing-orange" />
                Cargar más productos
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
