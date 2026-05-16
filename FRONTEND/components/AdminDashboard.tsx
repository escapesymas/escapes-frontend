import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { User as UserType } from '../types';

export const AdminDashboard: React.FC<{ user: UserType | null; onBack: () => void }> = ({ user, onBack }) => {
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('escapes_user');
        const currentUser = user || (stored ? JSON.parse(stored) : null);
        
        if (!currentUser || (currentUser.email !== 'info@escapesymas.com' && currentUser.role !== 'admin')) {
            setError("Acceso restringido: Se requiere cuenta de administrador.");
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const userId = currentUser.id || currentUser.wpId || currentUser.user_id;
                const res = await fetch(`/api/admin?action=dashboard-stats&userId=${userId}&email=${currentUser.email}`);
                if (res.ok) setStats(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchStats();
    }, [user]);

    const [showNewForm, setShowNewForm] = useState(false);

    const handleCreateProduct = async (formData: any) => {
        try {
            const stored = localStorage.getItem('escapes_user');
            const currentUser = user || (stored ? JSON.parse(stored) : null);
            const userId = currentUser.id || currentUser.wpId || currentUser.user_id;
            
            const res = await fetch(`/api/admin?action=create-product&userId=${userId}&email=${currentUser.email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowNewForm(false);
                // Aquí podrías recargar estadísticas o lista
            }
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white italic uppercase tracking-widest">Sincronizando...</div>;

    return (
        <div className="min-h-screen bg-black text-white flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
                <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#ff4d00] rounded flex items-center justify-center"><Icons.Shield size={18} /></div>
                    <span className="font-black italic uppercase tracking-tighter">Master <span className="text-[#ff4d00]">Admin</span></span>
                </div>
                <nav className="p-4 space-y-1">
                    <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'stats' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                        <Icons.LayoutDashboard size={16} /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'products' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                        <Icons.Package size={16} /> Productos
                    </button>
                </nav>
                <button onClick={onBack} className="mt-auto p-6 text-zinc-600 hover:text-white text-[10px] font-bold uppercase">Cerrar Sesión Admin</button>
            </aside>

            {/* Main */}
            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-10 flex justify-between items-center">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                        {activeTab === 'stats' ? 'Vista General' : 'Inventario Nativo'}
                    </h1>
                </header>

                {activeTab === 'stats' && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatBox label="Usuarios" value={stats.users} icon={<Icons.Users className="text-purple-500" />} />
                        <StatBox label="Ventas" value={`${(stats.sales || 0) / 100}€`} icon={<Icons.TrendingUp className="text-[#ff4d00]" />} />
                        <StatBox label="Pedidos" value={stats.orders} icon={<Icons.ShoppingCart className="text-blue-500" />} />
                        <StatBox label="Foro" value={stats.posts} icon={<Icons.MessageSquare className="text-yellow-500" />} />
                    </div>
                )}

                {activeTab === 'products' && (
                    <InventoryList user={user} onOpenForm={() => setShowNewForm(true)} />
                )}

                {showNewForm && (
                    <NewProductForm 
                        onClose={() => setShowNewForm(false)} 
                        onSubmit={handleCreateProduct} 
                    />
                )}
            </main>
        </div>
    );
};

const InventoryList = ({ user, onOpenForm }: any) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const stored = localStorage.getItem('escapes_user');
            const u = user || (stored ? JSON.parse(stored) : null);
            const userId = u.id || u.wpId || u.user_id;
            const res = await fetch(`/api/admin?action=products-list&userId=${userId}&email=${u.email}`);
            if (res.ok) setProducts(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadProducts(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onOpenForm} className="bg-[#ff4d00] text-white px-6 py-3 rounded-xl font-black uppercase italic text-xs tracking-widest shadow-lg shadow-orange-900/30 hover:scale-105 transition-transform flex items-center gap-2">
                    <Icons.Package size={16} /> Nuevo Producto
                </button>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
                    Total: <span className="text-white">{products.length}</span> items
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/50 text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-800">
                            <th className="px-6 py-4">Imagen</th>
                            <th className="px-6 py-4 italic">Producto</th>
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4">Precio</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {loading ? (
                            <tr><td colSpan={6} className="py-10 text-center text-zinc-600 italic font-bold">Cargando Almacén VPS...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center text-zinc-600 italic font-bold">Inventario vacío. Pulsa "Nuevo Producto".</td></tr>
                        ) : products.map((p: any) => {
                            const imgs = parseJSON(p.images);
                            const compat = parseJSON(p.compatibility);
                            const priceEur = (p.price / 100).toFixed(2);
                            const salePriceEur = p.sale_price ? (p.sale_price / 100).toFixed(2) : null;
                            return (
                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center">
                                            {imgs.length > 0 ? <img src={imgs[0]} className="w-full h-full object-cover" /> : <Icons.Package size={20} className="text-zinc-700" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-black italic uppercase text-sm group-hover:text-[#ff4d00] transition-colors">{p.name}</p>
                                        {p.description && <p className="text-[10px] text-zinc-600 mt-0.5 line-clamp-1 max-w-[200px]">{p.description}</p>}
                                        {compat.length > 0 && <p className="text-[10px] text-blue-400/60 mt-0.5">{compat.length} vehículos compatibles</p>}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-zinc-500">{p.sku}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-black italic text-white text-sm">{priceEur}€</p>
                                        {salePriceEur && <p className="text-[10px] text-green-500 font-bold line-through">{salePriceEur}€</p>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase italic ${p.stock > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {p.stock > 0 ? `${p.stock} Uds` : 'Agotado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                            {p.status === 'published' ? 'Publicado' : 'Borrador'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Utilidad para parsear JSON seguro
const parseJSON = (str: any): any[] => {
    if (!str) return [];
    if (Array.isArray(str)) return str;
    try { return JSON.parse(str); } catch { return []; }
};

const NewProductForm = ({ onClose, onSubmit }: any) => {
    const [tab, setTab] = useState<'info' | 'media' | 'compat'>('info');
    const [form, setForm] = useState({
        name: '', sku: '', price: '', salePrice: '', stock: '',
        description: '', status: 'published',
        images: [''],
        compatibility: [{ brand: '', model: '', year: '' }]
    });

    const addImage = () => setForm({ ...form, images: [...form.images, ''] });
    const removeImage = (i: number) => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) });
    const updateImage = (i: number, val: string) => {
        const imgs = [...form.images];
        imgs[i] = val;
        setForm({ ...form, images: imgs });
    };

    const addCompat = () => setForm({ ...form, compatibility: [...form.compatibility, { brand: '', model: '', year: '' }] });
    const removeCompat = (i: number) => setForm({ ...form, compatibility: form.compatibility.filter((_, idx) => idx !== i) });
    const updateCompat = (i: number, field: string, val: string) => {
        const c = [...form.compatibility];
        (c[i] as any)[field] = val;
        setForm({ ...form, compatibility: c });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...form,
            images: form.images.filter(u => u.trim()),
            compatibility: form.compatibility.filter(c => c.brand || c.model)
        });
    };

    const inputCls = "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-[#ff4d00] outline-none transition-colors";
    const labelCls = "text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1";
    const tabCls = (active: boolean) => `px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${active ? 'bg-[#ff4d00] text-white' : 'text-zinc-500 hover:text-white bg-zinc-900'}`;

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl my-8">
                {/* Header */}
                <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/30">
                    <div>
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Nuevo Producto</h3>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Almacén Nativo PostgreSQL</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">✕</button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 flex gap-2">
                    <button type="button" className={tabCls(tab === 'info')} onClick={() => setTab('info')}>Información</button>
                    <button type="button" className={tabCls(tab === 'media')} onClick={() => setTab('media')}>Imágenes</button>
                    <button type="button" className={tabCls(tab === 'compat')} onClick={() => setTab('compat')}>Compatibilidad</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* TAB: INFO */}
                    {tab === 'info' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div>
                                <label className={labelCls}>Nombre del producto</label>
                                <input required className={inputCls} placeholder="Ej: Escape Akrapovic Slip-On Carbon" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                            </div>
                            <div>
                                <label className={labelCls}>Descripción</label>
                                <textarea className={`${inputCls} min-h-[100px] resize-y`} placeholder="Descripción completa del producto, materiales, características..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>SKU / Referencia</label>
                                    <input required className={inputCls} placeholder="AKR-SLIP-CBR650" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelCls}>Estado</label>
                                    <select className={inputCls} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                                        <option value="published">Publicado</option>
                                        <option value="draft">Borrador</option>
                                        <option value="out_of_stock">Sin stock</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelCls}>Precio PVP (€)</label>
                                    <input required type="number" step="0.01" className={inputCls} placeholder="899.00" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelCls}>Precio Oferta (€)</label>
                                    <input type="number" step="0.01" className={inputCls} placeholder="Dejar vacío si no hay" value={form.salePrice} onChange={e => setForm({...form, salePrice: e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelCls}>Stock</label>
                                    <input required type="number" className={inputCls} placeholder="10" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: MEDIA */}
                    {tab === 'media' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <p className="text-xs text-zinc-500">Añade URLs de imágenes del producto. La primera será la imagen principal.</p>
                            {form.images.map((img, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <label className={labelCls}>{i === 0 ? 'Imagen Principal' : `Imagen ${i + 1}`}</label>
                                        <input className={inputCls} placeholder="https://...imagen.webp" value={img} onChange={e => updateImage(i, e.target.value)} />
                                    </div>
                                    {img && (
                                        <div className="w-12 h-12 rounded-lg border border-zinc-800 overflow-hidden flex-shrink-0 mt-4">
                                            <img src={img} className="w-full h-full object-cover" onError={e => (e.target as HTMLImageElement).style.display='none'} />
                                        </div>
                                    )}
                                    {form.images.length > 1 && (
                                        <button type="button" onClick={() => removeImage(i)} className="text-red-500/50 hover:text-red-500 mt-4">
                                            <Icons.X size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={addImage} className="text-xs text-[#ff4d00] font-bold uppercase flex items-center gap-1 hover:underline">
                                <Icons.Plus size={14} /> Añadir imagen
                            </button>
                        </div>
                    )}

                    {/* TAB: COMPATIBILIDAD */}
                    {tab === 'compat' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <p className="text-xs text-zinc-500">Define con qué motos es compatible este producto.</p>
                            {form.compatibility.map((c, i) => (
                                <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-end">
                                    <div>
                                        <label className={labelCls}>Marca</label>
                                        <input className={inputCls} placeholder="Honda" value={c.brand} onChange={e => updateCompat(i, 'brand', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Modelo</label>
                                        <input className={inputCls} placeholder="CBR 650R" value={c.model} onChange={e => updateCompat(i, 'model', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Año</label>
                                        <input className={inputCls} placeholder="2024" value={c.year} onChange={e => updateCompat(i, 'year', e.target.value)} />
                                    </div>
                                    <button type="button" onClick={() => removeCompat(i)} className="text-red-500/50 hover:text-red-500 mb-1">
                                        <Icons.X size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addCompat} className="text-xs text-[#ff4d00] font-bold uppercase flex items-center gap-1 hover:underline">
                                <Icons.Plus size={14} /> Añadir vehículo
                            </button>
                        </div>
                    )}

                    {/* SUBMIT */}
                    <button type="submit" className="w-full bg-[#ff4d00] hover:bg-orange-600 py-4 rounded-xl font-black uppercase italic tracking-widest shadow-lg shadow-orange-900/40 transition-colors flex items-center justify-center gap-2">
                        <Icons.Save size={18} /> Crear Producto Maestro
                    </button>
                </form>
            </div>
        </div>
    );
};

const StatBox = ({ label, value, icon }: any) => (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
        <div className="mb-4">{icon}</div>
        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black italic">{value}</p>
    </div>
);
