import React, { useState } from 'react';
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
  fetchProductsList: (search: string, page: number, append: boolean, isSilent?: boolean, filters?: Record<string, string>) => Promise<void>;
  handleDeleteProduct: (id: number) => Promise<void>;
}

type ColumnKey = 'image' | 'name' | 'brand' | 'sku' | 'barcode' | 'supplier_code' | 'cost' | 'price' | 'sale_price' | 'stock' | 'dropshipping' | 'ondemand' | 'delivery_plant' | 'category' | 'category2' | 'category3' | 'weight' | 'dimensions' | 'compatibility' | 'status' | 'created_at' | 'actions';

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'image', label: 'Imagen' },
  { key: 'name', label: 'Producto' },
  { key: 'brand', label: 'Marca' },
  { key: 'sku', label: 'SKU' },
  { key: 'barcode', label: 'Código Barras' },
  { key: 'supplier_code', label: 'Cód. Proveedor' },
  { key: 'cost', label: 'Coste' },
  { key: 'price', label: 'Precio Base' },
  { key: 'sale_price', label: 'Precio Oferta' },
  { key: 'stock', label: 'Stock' },
  { key: 'dropshipping', label: 'Dropshipping' },
  { key: 'ondemand', label: 'Bajo Demanda' },
  { key: 'delivery_plant', label: 'Planta Entrega' },
  { key: 'category', label: 'Categoría' },
  { key: 'category2', label: 'Subcat 2' },
  { key: 'category3', label: 'Subcat 3' },
  { key: 'weight', label: 'Peso' },
  { key: 'dimensions', label: 'Dimensiones' },
  { key: 'compatibility', label: 'Compat.' },
  { key: 'status', label: 'Estado' },
  { key: 'created_at', label: 'Creado' },
  { key: 'actions', label: 'Acciones' },
];

const DEFAULT_VISIBLE: ColumnKey[] = ['image', 'name', 'brand', 'sku', 'price', 'stock', 'dropshipping', 'compatibility', 'actions'];

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
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(DEFAULT_VISIBLE));
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Record<string, string>>({
    brand: '', category_id: '', category2_id: '', category3_id: '',
    stock_min: '', stock_max: '', price_min: '', price_max: '',
    dropshipping: '', ondemand: '', status: '', barcode: '', supplier_code: ''
  });

  const toggleColumn = (key: ColumnKey) => {
    const next = new Set(visibleColumns);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setVisibleColumns(next);
  };

  const updateFilter = (key: string, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const applyFilters = () => {
    setProductPage(1);
    const active = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
    fetchProductsList(productSearch, 1, false, false, active);
  };

  const clearFilters = () => {
    const cleared = Object.fromEntries(Object.keys(filters).map(k => [k, '']));
    setFilters(cleared);
    setProductPage(1);
    fetchProductsList(productSearch, 1, false);
  };

  const renderCell = (key: ColumnKey, p: any): React.ReactNode => {
    let imgs: any[] = [];
    try { imgs = p.images ? JSON.parse(p.images) : []; } catch { }
    let compat: any[] = [];
    try { compat = p.compatibility ? JSON.parse(p.compatibility) : []; } catch { }
    const imageUrl = imgs[0]?.src || imgs[0] || '';

    switch (key) {
      case 'image':
        return (
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
            {imageUrl ? (
              <img src={imageUrl} className="w-full h-full object-cover" alt={p.name} />
            ) : (
              <Icons.Package className="w-5 h-5 text-zinc-700" />
            )}
          </div>
        );
      case 'name':
        return (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">{p.name}</span>
            <span className="text-[10px] text-zinc-500 truncate max-w-[180px]">{p.description}</span>
          </div>
        );
      case 'brand':
        return <span className="text-xs font-bold text-zinc-400">{p.brand || '-'}</span>;
      case 'sku':
        return <span className="font-mono text-xs text-zinc-500">{p.sku}</span>;
      case 'barcode':
        return <span className="font-mono text-[10px] text-zinc-500">{p.barcode || '-'}</span>;
      case 'supplier_code':
        return <span className="font-mono text-[10px] text-zinc-500">{p.supplier_code || '-'}</span>;
      case 'cost':
        return <span className="font-mono text-xs text-zinc-500">{p.cost ? `€${(p.cost / 100).toFixed(2)}` : '-'}</span>;
      case 'price':
        return (
          <div className="font-black italic text-zinc-300 text-sm">
            {(p.price / 100).toFixed(2)}€
            {p.sale_price && (
              <span className="block text-[9px] text-green-500 not-italic font-bold line-through">
                {(p.sale_price / 100).toFixed(2)}€
              </span>
            )}
          </div>
        );
      case 'sale_price':
        return <span className="font-mono text-xs text-green-500">{p.sale_price ? `${(p.sale_price / 100).toFixed(2)}€` : '-'}</span>;
      case 'stock':
        return (
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase italic ${p.stock > 0 ? 'bg-green-950/20 text-green-500 border border-green-900/30' : 'bg-red-950/20 text-red-500 border border-red-900/30'}`}>
            {p.stock > 0 ? `${p.stock} Uds` : 'Agotado'}
          </span>
        );
      case 'dropshipping':
        return p.dropshipping ? (
          <span className="text-[10px] bg-blue-950/20 text-blue-400 border border-blue-900/30 px-2 py-0.5 rounded font-bold">Sí</span>
        ) : (
          <span className="text-[10px] text-zinc-600">No</span>
        );
      case 'ondemand':
        return p.ondemand ? (
          <span className="text-[10px] bg-yellow-950/20 text-yellow-400 border border-yellow-900/30 px-2 py-0.5 rounded font-bold">Sí</span>
        ) : (
          <span className="text-[10px] text-zinc-600">No</span>
        );
      case 'delivery_plant':
        return <span className="text-[10px] text-zinc-500">{p.delivery_plant || '-'}</span>;
      case 'category': {
        const catMap: Record<number, string> = {
          1: 'Escape', 2: 'Frenos', 3: 'Ciclista', 4: 'Electrónica',
          5: 'Transmisión', 6: 'Mantenimiento', 7: 'Neumáticos',
          8: 'Cascos', 9: 'Equipación', 10: 'Accesorios'
        };
        return <span className="text-[10px] text-zinc-400">{catMap[p.category_id] || p.category_id || '-'}</span>;
      }
      case 'category2':
        return <span className="text-[10px] text-zinc-500">{p.category2 || '-'}</span>;
      case 'category3':
        return <span className="text-[10px] text-zinc-500">{p.category3 || '-'}</span>;
      case 'weight':
        return <span className="text-[10px] text-zinc-500">{p.weight_g ? `${(p.weight_g / 1000).toFixed(2)} kg` : '-'}</span>;
      case 'dimensions':
        if (p.length_mm && p.width_mm && p.height_mm) {
          return <span className="text-[10px] text-zinc-500">{p.length_mm}×{p.width_mm}×{p.height_mm} mm</span>;
        }
        return <span className="text-[10px] text-zinc-500">-</span>;
      case 'compatibility':
        return (
          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">
            {compat.length} Motos
          </span>
        );
      case 'status': {
        const statusColors: Record<string, string> = {
          published: 'bg-green-950/20 text-green-400 border-green-900/30',
          draft: 'bg-zinc-900 text-zinc-500 border-zinc-800',
          out_of_stock: 'bg-red-950/20 text-red-400 border-red-900/30'
        };
        return (
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${statusColors[p.status] || 'bg-zinc-900 text-zinc-500'}`}>
            {p.status || 'draft'}
          </span>
        );
      }
      case 'created_at':
        return <span className="text-[10px] text-zinc-500">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => { setEditingProduct(p); setShowProductForm('edit'); }}
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
        );
      default:
        return null;
    }
  };

  const filterInputCls = "w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-racing-orange";
  const filterLabelCls = "text-[9px] uppercase font-black tracking-widest text-zinc-500 block mb-1";

  return (
    <div className="space-y-6">
      {/* Search, Columns, Filters Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Icons.Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setProductPage(1); fetchProductsList(e.currentTarget.value, 1, false, false, Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))); } }}
            placeholder="Buscar por nombre, SKU o descripción..."
            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-racing-orange transition-all shadow-inner"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${showFilters ? 'bg-racing-orange text-white border-racing-orange' : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:border-zinc-700'}`}
        >
          <Icons.Filter size={14} />
          Filtros
          {Object.values(filters).some(v => v !== '') && (
            <span className="w-2 h-2 rounded-full bg-racing-orange animate-pulse" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-zinc-950 text-zinc-400 border border-zinc-900 hover:border-zinc-700"
          >
            <Icons.Columns size={14} />
            Columnas
          </button>

          {showColumnMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColumnMenu(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-2xl min-w-[180px] max-h-80 overflow-y-auto">
                {ALL_COLUMNS.map(col => (
                  <label key={col.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-900 cursor-pointer text-[11px] text-zinc-400 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      className="accent-racing-orange"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-950 border border-zinc-900 px-4 py-3.5 rounded-xl whitespace-nowrap">
          <strong className="text-zinc-300 font-mono">{products.length}</strong> productos
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className={filterLabelCls}>Marca</label>
              <input className={filterInputCls} placeholder="Ej. NGK" value={filters.brand} onChange={e => updateFilter('brand', e.target.value)} />
            </div>
            <div>
              <label className={filterLabelCls}>Categoría</label>
              <select className={filterInputCls} value={filters.category_id} onChange={e => updateFilter('category_id', e.target.value)}>
                <option value="">Todas</option>
                <option value="1">Escape</option><option value="2">Frenos</option><option value="3">Ciclista</option>
                <option value="4">Electrónica</option><option value="5">Transmisión</option><option value="6">Mantenimiento</option>
                <option value="7">Neumáticos</option><option value="8">Cascos</option><option value="9">Equipación</option><option value="10">Accesorios</option>
              </select>
            </div>
            <div>
              <label className={filterLabelCls}>Estado</label>
              <select className={filterInputCls} value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
                <option value="">Todos</option>
                <option value="published">Publicado</option>
                <option value="draft">Borrador</option>
                <option value="out_of_stock">Sin stock</option>
              </select>
            </div>
            <div>
              <label className={filterLabelCls}>Dropshipping</label>
              <select className={filterInputCls} value={filters.dropshipping} onChange={e => updateFilter('dropshipping', e.target.value)}>
                <option value="">Todos</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className={filterLabelCls}>Bajo Demanda</label>
              <select className={filterInputCls} value={filters.ondemand} onChange={e => updateFilter('ondemand', e.target.value)}>
                <option value="">Todos</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className={filterLabelCls}>Stock Mín</label>
              <input type="number" className={filterInputCls} placeholder="0" value={filters.stock_min} onChange={e => updateFilter('stock_min', e.target.value)} />
            </div>
            <div>
              <label className={filterLabelCls}>Stock Máx</label>
              <input type="number" className={filterInputCls} placeholder="9999" value={filters.stock_max} onChange={e => updateFilter('stock_max', e.target.value)} />
            </div>
            <div>
              <label className={filterLabelCls}>Precio Mín (€)</label>
              <input type="number" step="0.01" className={filterInputCls} placeholder="0" value={filters.price_min} onChange={e => updateFilter('price_min', e.target.value)} />
            </div>
            <div>
              <label className={filterLabelCls}>Precio Máx (€)</label>
              <input type="number" step="0.01" className={filterInputCls} placeholder="9999" value={filters.price_max} onChange={e => updateFilter('price_max', e.target.value)} />
            </div>
            <div>
              <label className={filterLabelCls}>Código Barras</label>
              <input className={filterInputCls} placeholder="Ej. 843..." value={filters.barcode} onChange={e => updateFilter('barcode', e.target.value)} />
            </div>
            <div>
              <label className={filterLabelCls}>Cód. Proveedor</label>
              <input className={filterInputCls} placeholder="Ej. BIH-" value={filters.supplier_code} onChange={e => updateFilter('supplier_code', e.target.value)} />
            </div>
            <div>
              <label className={filterLabelCls}>Subcat 2 ID</label>
              <input type="number" className={filterInputCls} placeholder="101-1004" value={filters.category2_id} onChange={e => updateFilter('category2_id', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-900">
            <button onClick={clearFilters} className="text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg border border-zinc-900 hover:border-zinc-700 transition-all">
              Limpiar Filtros
            </button>
            <button onClick={applyFilters} className="bg-racing-orange hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase italic tracking-wider transition-all shadow-lg shadow-orange-950/20">
              <Icons.Filter size={12} className="inline mr-1" />
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                {ALL_COLUMNS.filter(col => visibleColumns.has(col.key)).map(col => (
                  <th key={col.key} className={`pb-4 ${col.key === 'actions' ? 'text-right' : ''}`}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={ALL_COLUMNS.filter(col => visibleColumns.has(col.key)).length} className="py-8 text-center text-zinc-500 italic">
                    {productsLoading ? 'Buscando recambios...' : 'No hay productos en el catálogo nativo.'}
                  </td>
                </tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.01]">
                  {ALL_COLUMNS.filter(col => visibleColumns.has(col.key)).map(col => (
                    <td key={col.key} className={`py-4 ${col.key === 'actions' ? 'text-right' : ''}`}>
                      {renderCell(col.key, p)}
                    </td>
                  ))}
                </tr>
              ))}
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
              const active = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
              await fetchProductsList(productSearch, nextPage, true, false, active);
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