import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { User as UserType } from '../types';

export const AdminDashboard: React.FC<{ user: UserType | null; onBack: () => void }> = ({ user, onBack }) => {
    const [activeTab, setActiveTab] = useState('stats');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

        // Poll every 5 seconds for real-time telemetry and process monitoring
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
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
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans">
            {/* Mobile Top Header */}
            <header className="flex md:hidden bg-zinc-950 border-b border-zinc-800 p-4 justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#ff4d00] rounded flex items-center justify-center"><Icons.Shield size={18} /></div>
                    <span className="font-black italic uppercase tracking-tighter text-sm">Master <span className="text-[#ff4d00]">Admin</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-2 text-zinc-500 hover:text-white" title="Cerrar Sesión">
                        <Icons.LogOut size={18} />
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-300 hover:text-white transition-colors" aria-label="Abrir Menú">
                        {isMobileMenuOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
                    </button>
                </div>
            </header>

            {/* Mobile Sidebar / Drawer */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop overlay */}
                    <div 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden animate-fade-in animate-duration-200"
                    />
                    {/* Drawer menu */}
                    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-850 z-50 p-6 flex flex-col h-full md:hidden animate-slide-in-left animate-duration-200">
                        <div className="flex justify-between items-center pb-6 border-b border-zinc-850 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#ff4d00] rounded flex items-center justify-center"><Icons.Shield size={18} /></div>
                                <span className="font-black italic uppercase tracking-tighter">Master <span className="text-[#ff4d00]">Admin</span></span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-500 hover:text-white p-1">
                                <Icons.X size={18} />
                            </button>
                        </div>
                        <nav className="space-y-1 flex-1 overflow-y-auto">
                            <button onClick={() => { setActiveTab('stats'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'stats' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                                <Icons.LayoutDashboard size={16} /> Dashboard
                            </button>
                            <button onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'products' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                                <Icons.Package size={16} /> Productos
                            </button>
                            <button onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'orders' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                                <Icons.ShoppingCart size={16} /> Pedidos
                            </button>
                            <button onClick={() => { setActiveTab('coupons'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'coupons' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                                <Icons.Ticket size={16} /> Cupones
                            </button>
                            <button onClick={() => { setActiveTab('seo'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'seo' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                                <Icons.Link2 size={16} /> SEO Manager
                            </button>
                            <button onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'users' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                                <Icons.Users size={16} /> Usuarios
                            </button>
                            <button onClick={() => { setActiveTab('paddock'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'paddock' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                                <Icons.MessageSquare size={16} /> Moderación Foro
                            </button>
                        </nav>
                        <button onClick={() => { onBack(); setIsMobileMenuOpen(false); }} className="mt-auto p-4 border-t border-zinc-850 text-zinc-600 hover:text-white text-[10px] font-bold uppercase w-full text-left flex items-center gap-2">
                            <Icons.LogOut size={12} /> Cerrar Sesión Admin
                        </button>
                    </aside>
                </>
            )}

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-zinc-950 border-r border-zinc-800 hidden md:flex md:flex-col h-screen sticky top-0 flex-shrink-0">
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
                    <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'orders' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                        <Icons.ShoppingCart size={16} /> Pedidos
                    </button>
                    <button onClick={() => setActiveTab('coupons')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'coupons' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                        <Icons.Ticket size={16} /> Cupones
                    </button>
                    <button onClick={() => setActiveTab('seo')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'seo' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                        <Icons.Link2 size={16} /> SEO Manager
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'users' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                        <Icons.Users size={16} /> Usuarios
                    </button>
                    <button onClick={() => setActiveTab('paddock')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'paddock' ? 'bg-zinc-900 text-[#ff4d00]' : 'text-zinc-500'}`}>
                        <Icons.MessageSquare size={16} /> Moderación Foro
                    </button>
                </nav>
                <button onClick={onBack} className="mt-auto p-6 text-zinc-600 hover:text-white text-[10px] font-bold uppercase">Cerrar Sesión Admin</button>
            </aside>

            {/* Main */}
            <main className="flex-1 p-4 md:p-10 overflow-y-auto min-w-0">
                <header className="mb-6 md:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">
                        {activeTab === 'stats' ? 'Vista General' : 
                         activeTab === 'products' ? 'Inventario Nativo' : 
                         activeTab === 'orders' ? 'Logística y Pedidos' : 
                         activeTab === 'coupons' ? 'Cupones de Descuento' : 
                         activeTab === 'seo' ? 'SEO Auto-Linking' : 
                         activeTab === 'paddock' ? 'Moderación del Paddock' :
                         'Riders Registrados'}
                    </h1>
                </header>

                {activeTab === 'stats' && stats && (
                    <div className="space-y-10">
                        {/* Upper Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <StatBox label="Usuarios" value={stats.users} icon={<Icons.Users className="text-purple-500" />} />
                            <StatBox label="Ventas" value={`${(stats.sales || 0) / 100}€`} icon={<Icons.TrendingUp className="text-[#ff4d00]" />} />
                            <StatBox label="Pedidos" value={stats.orders} icon={<Icons.ShoppingCart className="text-blue-500" />} />
                            <StatBox label="Foro" value={stats.posts} icon={<Icons.MessageSquare className="text-yellow-500" />} />
                        </div>

                        {/* Real-Time Telemetry */}
                        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* VPS Telemetry Card */}
                            {stats.vps && (
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                        <div className="flex items-center gap-2">
                                            <Icons.Cpu className="text-[#ff4d00]" size={20} />
                                            <h3 className="font-black italic uppercase tracking-wider text-sm">Telemetría VPS</h3>
                                        </div>
                                        <span className="text-[9px] bg-zinc-950 text-zinc-500 px-2 py-0.5 rounded font-mono uppercase tracking-widest border border-zinc-850">{stats.vps.os}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                                        <div>
                                            <div className="flex justify-between mb-1.5 text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                                                <span>CPU ({stats.vps.cores} Cores)</span>
                                                <span className="font-black text-white">{stats.vps.cpu}%</span>
                                            </div>
                                            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800/80 p-[1px]">
                                                <div className="bg-[#ff4d00] h-full rounded-full transition-all duration-500" style={{ width: `${stats.vps.cpu}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1.5 text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                                                <span>RAM ({stats.vps.ramUsed} / {stats.vps.ramTotal})</span>
                                                <span className="font-black text-white">{stats.vps.ramPercent}%</span>
                                            </div>
                                            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800/80 p-[1px]">
                                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.vps.ramPercent}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center pt-2">
                                        <div className="bg-black/40 border border-zinc-850 p-3 rounded-xl">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Disco Duro</p>
                                            <p className="text-sm font-black italic text-zinc-100">{stats.vps.disk?.used || '20.5G'} / {stats.vps.disk?.total || '115G'}</p>
                                            <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden mt-2 border border-zinc-900 p-[1px]">
                                                <div className="bg-blue-500 h-full rounded-full" style={{ width: stats.vps.disk?.percent || '18%' }} />
                                            </div>
                                        </div>
                                        <div className="bg-black/40 border border-zinc-850 p-3 rounded-xl flex flex-col justify-center">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Uptime VPS</p>
                                            <p className="text-sm font-black italic text-zinc-300">{stats.vps.uptime}</p>
                                        </div>
                                        <div className="bg-black/40 border border-zinc-850 p-3 rounded-xl flex flex-col justify-center">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Carga Activa</p>
                                            <p className="text-sm font-black italic text-zinc-300">Estable</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <InventoryList user={user} onOpenForm={() => setShowNewForm(true)} />
                )}

                {activeTab === 'orders' && (
                    <OrdersTab user={user} />
                )}

                {activeTab === 'coupons' && (
                    <CouponsTab user={user} />
                )}

                {activeTab === 'seo' && (
                    <SeoTab user={user} />
                )}

                {activeTab === 'users' && (
                    <UsersTab user={user} />
                )}

                {activeTab === 'paddock' && (
                    <PaddockModerationTab user={user} />
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

const OrdersTab = ({ user }: any) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const stored = localStorage.getItem('escapes_user');
    const currentUser = user || (stored ? JSON.parse(stored) : null);
    const userId = currentUser?.id || currentUser?.wpId || currentUser?.user_id;

    const fetchOrders = async () => {
        try {
            const res = await fetch(`/api/admin?action=orders-list&userId=${userId}&email=${currentUser?.email}`);
            if (res.ok) setOrders(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (orderId: number, status: string) => {
        try {
            const res = await fetch(`/api/admin?action=update-order-status&userId=${userId}&email=${currentUser?.email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status })
            });
            if (res.ok) fetchOrders();
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="text-zinc-500 italic py-10 text-center animate-pulse">Cargando transacciones contables...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-4">Logística y Auditoría de Ventas</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-zinc-400 text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                                <th className="pb-3">ID Pedido</th>
                                <th className="pb-3">Cliente / Rider</th>
                                <th className="pb-3">Detalle Financiero</th>
                                <th className="pb-3">Artículos</th>
                                <th className="pb-3">Estado Logística</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o: any) => {
                                const s = o.shippingData || {};
                                return (
                                    <tr key={o.id} className="border-b border-zinc-850 hover:bg-zinc-900/30 transition-all">
                                        <td className="py-4 font-black italic text-zinc-200">#{o.id}</td>
                                        <td className="py-4">
                                            <div className="font-bold text-zinc-300">{s.nombre || 'Invitado'} {s.apellidos || ''}</div>
                                            <div className="text-[10px] text-zinc-500">{s.email || 'Sin correo'}</div>
                                            <div className="text-[9px] text-zinc-600 mt-0.5">{s.direccion || ''}, {s.ciudad || ''}</div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-[#ff4d00] text-sm">{(o.total / 100).toFixed(2)}€</span>
                                                <span className="text-[9px] text-zinc-500 mt-0.5">
                                                    Subt: {(o.shippingData?.financials?.subtotal || o.total / 100).toFixed(2)}€ | Envío: {(o.shippingData?.financials?.shippingCost || 0).toFixed(2)}€
                                                </span>
                                                {o.shippingData?.financials?.promoCode && (
                                                    <span className="text-[9px] text-emerald-500 font-bold mt-0.5">
                                                        Cupón: {o.shippingData?.financials?.promoCode} (-{(o.shippingData?.financials?.discountAmount || 0).toFixed(2)}€)
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="space-y-1">
                                                {o.items?.map((it: any, index: number) => (
                                                    <div key={index} className="text-[10px] text-zinc-300 flex items-center gap-1.5">
                                                        <span className="bg-zinc-800 px-1 rounded font-bold text-zinc-400">x{it.quantity}</span>
                                                        <span className="truncate max-w-[200px]">{it.product_name || `Producto #${it.productId}`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <select 
                                                value={o.status || 'pending'} 
                                                onChange={(e) => updateStatus(o.id, e.target.value)}
                                                className={`text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg border bg-black text-white focus:outline-none transition-all ${
                                                    o.status === 'completed' || o.status === 'delivered' ? 'border-emerald-900 text-emerald-400 bg-emerald-950/20' :
                                                    o.status === 'processing' || o.status === 'shipped' ? 'border-[#ff4d00]/30 text-[#ff4d00]' :
                                                    'border-zinc-800 text-zinc-400'
                                                }`}
                                            >
                                                <option value="pending">Pendiente</option>
                                                <option value="processing">Procesando</option>
                                                <option value="shipped">Enviado</option>
                                                <option value="delivered">Entregado</option>
                                                <option value="cancelled">Cancelado</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const CouponsTab = ({ user }: any) => {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Form fields
    const [code, setCode] = useState('');
    const [type, setType] = useState('percent');
    const [value, setValue] = useState('');
    const [maxUses, setMaxUses] = useState('999999');
    const [expiresAt, setExpiresAt] = useState('');
    const [active, setActive] = useState(1);

    const stored = localStorage.getItem('escapes_user');
    const currentUser = user || (stored ? JSON.parse(stored) : null);
    const userId = currentUser?.id || currentUser?.wpId || currentUser?.user_id;

    const fetchCoupons = async () => {
        try {
            const res = await fetch(`/api/admin?action=coupons-list&userId=${userId}&email=${currentUser?.email}`);
            if (res.ok) setCoupons(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleDelete = async (couponId: number) => {
        if (!confirm("¿Seguro que deseas eliminar este cupón?")) return;
        try {
            const res = await fetch(`/api/admin?action=delete-coupon&userId=${userId}&email=${currentUser?.email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ couponId })
            });
            if (res.ok) fetchCoupons();
        } catch (e) { console.error(e); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !value) return alert("Faltan datos");

        try {
            const valNum = type === 'fixed' ? Math.round(parseFloat(value) * 100) : parseInt(value);
            const res = await fetch(`/api/admin?action=create-coupon&userId=${userId}&email=${currentUser?.email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code, type, value: valNum, active, expiresAt: expiresAt || null, maxUses: parseInt(maxUses)
                })
            });
            if (res.ok) {
                setShowAddForm(false);
                setCode('');
                setValue('');
                setMaxUses('999999');
                setExpiresAt('');
                fetchCoupons();
            }
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="text-zinc-500 italic py-10 text-center animate-pulse">Cargando motor de cupones...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-zinc-100">Cupones y Campañas de Marketing</h3>
                <button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-[#ff4d00] hover:bg-[#e04400] text-black text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all"
                >
                    <Icons.Plus size={14} /> Crear Cupón
                </button>
            </div>

            {showAddForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
                    <form onSubmit={handleCreate} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
                            <h4 className="text-lg font-black uppercase tracking-tighter italic text-zinc-200">Nuevo Cupón</h4>
                            <button type="button" onClick={() => setShowAddForm(false)} className="text-zinc-500 hover:text-white"><Icons.X size={18} /></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Código de Cupón</label>
                                <input 
                                    type="text" 
                                    value={code} 
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="E.g. WELCOME20" 
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold placeholder-zinc-700 text-white focus:outline-none focus:border-[#ff4d00] uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Tipo</label>
                                    <select 
                                        value={type} 
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-[#ff4d00]"
                                    >
                                        <option value="percent">Porcentaje (%)</option>
                                        <option value="fixed">Importe Fijo (€)</option>
                                        <option value="free_shipping">Envío Gratis</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Valor</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        value={value} 
                                        disabled={type === 'free_shipping'}
                                        onChange={(e) => setValue(e.target.value)}
                                        placeholder={type === 'percent' ? "20" : "15.00"} 
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold placeholder-zinc-700 text-white focus:outline-none focus:border-[#ff4d00]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Límite Usos</label>
                                    <input 
                                        type="number" 
                                        value={maxUses} 
                                        onChange={(e) => setMaxUses(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-[#ff4d00]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Fecha Expiración</label>
                                    <input 
                                        type="datetime-local" 
                                        value={expiresAt} 
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-[#ff4d00]"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-[#ff4d00] hover:bg-[#e04400] text-black text-xs font-black uppercase tracking-wider py-3.5 rounded-xl transition-all"
                        >
                            Crear Cupón
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-zinc-400 text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                                <th className="pb-3">Código</th>
                                <th className="pb-3">Tipo Descuento</th>
                                <th className="pb-3">Valor Real</th>
                                <th className="pb-3">Canjes Totales</th>
                                <th className="pb-3">Fecha Vencimiento</th>
                                <th className="pb-3">Estado</th>
                                <th className="pb-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((c: any) => (
                                <tr key={c.id} className="border-b border-zinc-850 hover:bg-zinc-900/30 transition-all">
                                    <td className="py-4 font-black italic text-zinc-200 uppercase tracking-wider">{c.code}</td>
                                    <td className="py-4 font-bold text-zinc-300">
                                        {c.type === 'percent' ? 'Porcentaje' : c.type === 'fixed' ? 'Importe Fijo' : 'Envío Gratis'}
                                    </td>
                                    <td className="py-4 font-bold text-zinc-100">
                                        {c.type === 'percent' ? `${c.value}%` : c.type === 'fixed' ? `${(c.value / 100).toFixed(2)}€` : 'Coste Cero'}
                                    </td>
                                    <td className="py-4">
                                        <span className="font-bold text-zinc-300">{c.times_used}</span> / {c.max_uses === 999999 ? '∞' : c.max_uses}
                                    </td>
                                    <td className="py-4 text-zinc-500">
                                        {c.expires_at ? new Date(c.expires_at).toLocaleString() : 'Sin expiración'}
                                    </td>
                                    <td className="py-4">
                                        <span className={`inline-block py-1 px-2.5 rounded-full text-[9px] font-black uppercase ${
                                            c.active ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                                        }`}>
                                            {c.active ? 'Activo' : 'Pausado'}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(c.id)}
                                            className="text-zinc-600 hover:text-rose-500 p-1.5 transition-all"
                                        >
                                            <Icons.Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SeoTab = ({ user }: any) => {
    const [links, setLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [keyword, setKeyword] = useState('');
    const [url, setUrl] = useState('');
    const [active, setActive] = useState(1);

    const stored = localStorage.getItem('escapes_user');
    const currentUser = user || (stored ? JSON.parse(stored) : null);
    const userId = currentUser?.id || currentUser?.wpId || currentUser?.user_id;

    const fetchLinks = async () => {
        try {
            const res = await fetch(`/api/admin?action=seo-autolinks-list&userId=${userId}&email=${currentUser?.email}`);
            if (res.ok) setLinks(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    const handleDelete = async (linkId: number) => {
        if (!confirm("¿Seguro que deseas eliminar este enlace SEO automático?")) return;
        try {
            const res = await fetch(`/api/admin?action=seo-autolinks-delete&userId=${userId}&email=${currentUser?.email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkId })
            });
            if (res.ok) fetchLinks();
        } catch (e) { console.error(e); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword || !url) return alert("Faltan datos obligatorios");

        try {
            const res = await fetch(`/api/admin?action=seo-autolinks-save&userId=${userId}&email=${currentUser?.email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword, url, active })
            });
            if (res.ok) {
                setKeyword('');
                setUrl('');
                fetchLinks();
            }
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="text-zinc-500 italic py-10 text-center animate-pulse">Cargando SEO Manager...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6 lg:col-span-1 h-fit space-y-4">
                <h3 className="text-md font-black uppercase tracking-tighter italic text-zinc-200">Añadir Palabra Clave</h3>
                <p className="text-[10px] text-zinc-500">
                    Registra una palabra clave. Cuando un rider escriba esta palabra en el foro paddock, el sistema le inyectará un enlace dofollow a la URL catalogada de forma automática.
                </p>
                
                <form onSubmit={handleSave} className="space-y-4 pt-2">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Palabra Clave</label>
                        <input 
                            type="text" 
                            value={keyword} 
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="E.g. SC-Project" 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-[#ff4d00]"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">URL del Catálogo</label>
                        <input 
                            type="text" 
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="/escapes/sc-project" 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-[#ff4d00]"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-[#ff4d00] hover:bg-[#e04400] text-black text-xs font-black uppercase tracking-wider py-3.5 rounded-xl transition-all"
                    >
                        Guardar Término
                    </button>
                </form>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
                <h3 className="text-md font-bold text-zinc-100">Diccionario Dinámico de Enlazado (SEO)</h3>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-zinc-400 text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                                <th className="pb-3">Palabra Clave</th>
                                <th className="pb-3">URL Asociada</th>
                                <th className="pb-3">Estado</th>
                                <th className="pb-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {links.map((lk: any) => (
                                <tr key={lk.id} className="border-b border-zinc-850 hover:bg-zinc-900/30 transition-all">
                                    <td className="py-3 font-bold text-zinc-200">{lk.keyword}</td>
                                    <td className="py-3 text-zinc-400 font-mono">{lk.url}</td>
                                    <td className="py-3">
                                        <span className={`inline-block py-1 px-2.5 rounded-full text-[9px] font-black uppercase ${
                                            lk.active ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                                        }`}>
                                            {lk.active ? 'Activo' : 'Pausado'}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <button 
                                            onClick={() => handleDelete(lk.id)}
                                            className="text-zinc-600 hover:text-rose-500 p-1.5 transition-all"
                                        >
                                            <Icons.Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const UsersTab = ({ user }: any) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const stored = localStorage.getItem('escapes_user');
    const currentUser = user || (stored ? JSON.parse(stored) : null);
    const userId = currentUser?.id || currentUser?.wpId || currentUser?.user_id;

    const fetchUsers = async () => {
        try {
            const res = await fetch(`/api/admin?action=users-list&userId=${userId}&email=${currentUser?.email}`);
            if (res.ok) setUsers(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (targetUserId: number, role: string) => {
        try {
            const res = await fetch(`/api/admin?action=update-user-role&userId=${userId}&email=${currentUser?.email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUserId, role })
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="text-zinc-500 italic py-10 text-center animate-pulse">Cargando riders y perfiles...</div>;

    return (
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-zinc-100 mb-4">Usuarios y Rango de la Comunidad</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-zinc-400 text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                            <th className="pb-3">ID</th>
                            <th className="pb-3">Usuario / Email</th>
                            <th className="pb-3">Reputación</th>
                            <th className="pb-3">Rango Foro</th>
                            <th className="pb-3">Rol del Sistema</th>
                            <th className="pb-3">Fecha de Registro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u: any) => (
                            <tr key={u.id} className="border-b border-zinc-850 hover:bg-zinc-900/30 transition-all">
                                <td className="py-4 font-black italic text-zinc-200">#{u.id}</td>
                                <td className="py-4">
                                    <div className="font-bold text-zinc-300">{u.firstName || u.username} {u.lastName || ''}</div>
                                    <div className="text-[10px] text-zinc-500">{u.email}</div>
                                </td>
                                <td className="py-4 font-bold text-zinc-400 font-mono">
                                    {u.rankXp || 0} XP
                                </td>
                                <td className="py-4">
                                    <span className="bg-zinc-900 border border-zinc-800 py-1.5 px-3 rounded-lg text-zinc-300 font-bold">
                                        Nivel {u.rankLevel || 1}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <select 
                                        value={u.role || 'customer'} 
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        className={`text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-lg border bg-black text-white focus:outline-none transition-all ${
                                            u.role === 'admin' ? 'border-[#ff4d00]/30 text-[#ff4d00]' :
                                            u.role === 'moderator' ? 'border-blue-900 text-blue-400' :
                                            'border-zinc-850 text-zinc-500 hover:border-zinc-700'
                                        }`}
                                    >
                                        <option value="customer">Rider (Cliente)</option>
                                        <option value="moderator">Moderador</option>
                                        <option value="expert">Experto</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </td>
                                <td className="py-4 text-zinc-500">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PaddockModerationTab = ({ user }: any) => {
    const [threads, setThreads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
    const [replies, setReplies] = useState<any[]>([]);
    const [loadingReplies, setLoadingReplies] = useState(false);

    const stored = localStorage.getItem('escapes_user');
    const currentUser = user || (stored ? JSON.parse(stored) : null);
    const userId = currentUser?.id || currentUser?.wpId || currentUser?.user_id;

    const fetchThreads = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/forum?action=threads`);
            if (res.ok) {
                const json = await res.json();
                setThreads(json.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchReplies = async (threadId: number) => {
        setLoadingReplies(true);
        try {
            const res = await fetch(`/api/forum?action=thread-detail&thread_id=${threadId}`);
            if (res.ok) {
                const json = await res.json();
                setReplies(json.replies || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingReplies(false);
        }
    };

    useEffect(() => {
        fetchThreads();
    }, []);

    const handleModerateThread = async (threadId: number, options: { isPinned?: number; isClosed?: number; deleteThread?: boolean }) => {
        if (options.deleteThread && !confirm("¿Seguro que deseas ELIMINAR permanentemente este hilo y todas sus respuestas?")) {
            return;
        }

        try {
            const res = await fetch(`/api/admin?action=moderate-thread&userId=${userId}&email=${currentUser?.email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId, ...options })
            });

            if (res.ok) {
                if (options.deleteThread) {
                    setSelectedThreadId(null);
                    setReplies([]);
                }
                fetchThreads();
                if (selectedThreadId === threadId && !options.deleteThread) {
                    fetchReplies(threadId);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleModerateReply = async (replyId: number) => {
        if (!confirm("¿Seguro que deseas eliminar este comentario?")) return;
        try {
            const res = await fetch(`/api/admin?action=moderate-reply&userId=${userId}&email=${currentUser?.email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ replyId })
            });

            if (res.ok) {
                if (selectedThreadId) {
                    fetchReplies(selectedThreadId);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6 lg:col-span-2 space-y-4 min-w-0">
                <h3 className="text-lg font-bold text-zinc-100 mb-2">Hilos del Foro Paddock</h3>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="text-zinc-500 italic py-10 text-center animate-pulse">Cargando hilos...</div>
                    ) : threads.length === 0 ? (
                        <div className="text-zinc-650 italic py-10 text-center">No hay hilos activos en el foro.</div>
                    ) : (
                        <table className="w-full text-left text-zinc-400 text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                                    <th className="pb-3">Autor</th>
                                    <th className="pb-3">Título del Debate</th>
                                    <th className="pb-3">Estado</th>
                                    <th className="pb-3 text-right">Acciones de Control</th>
                                </tr>
                            </thead>
                            <tbody>
                                {threads.map((t: any) => (
                                    <tr 
                                        key={t.id} 
                                        onClick={() => {
                                            setSelectedThreadId(t.id);
                                            fetchReplies(t.id);
                                        }}
                                        className={`border-b border-zinc-850 hover:bg-zinc-900/30 transition-all cursor-pointer ${selectedThreadId === t.id ? 'bg-zinc-900/40 border-l-2 border-l-[#ff4d00] pl-1' : ''}`}
                                    >
                                        <td className="py-4">
                                            <div className="font-bold text-zinc-300">{t.authorName || 'Anónimo'}</div>
                                            <div className="text-[9px] text-zinc-500">{new Date(t.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="py-4 pr-4">
                                            <div className="font-black italic uppercase text-zinc-200 line-clamp-1 max-w-[280px]">{t.title}</div>
                                            <div className="text-[9px] text-zinc-500 mt-0.5">{t.likes || 0} me gusta</div>
                                        </td>
                                        <td className="py-4 space-y-1">
                                            {t.isPinned ? (
                                                <span className="inline-block py-0.5 px-2 rounded-full text-[8px] font-black uppercase bg-[#ff4d00]/10 text-[#ff4d00] border border-[#ff4d00]/30 mr-1">Fijado</span>
                                            ) : null}
                                            {t.isClosed ? (
                                                <span className="inline-block py-0.5 px-2 rounded-full text-[8px] font-black uppercase bg-red-950/20 text-red-400 border border-red-950">Cerrado</span>
                                            ) : (
                                                <span className="inline-block py-0.5 px-2 rounded-full text-[8px] font-black uppercase bg-emerald-950/10 text-emerald-400 border border-emerald-950/30">Abierto</span>
                                            )}
                                        </td>
                                        <td className="py-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={() => handleModerateThread(t.id, { isPinned: t.isPinned ? 0 : 1 })}
                                                className={`p-1.5 rounded-lg border transition-all ${t.isPinned ? 'border-[#ff4d00] text-[#ff4d00]' : 'border-zinc-800 text-zinc-500 hover:text-white'}`}
                                                title={t.isPinned ? 'Desfijar' : 'Fijar Hilo'}
                                            >
                                                <Icons.Pin size={12} />
                                            </button>
                                            <button 
                                                onClick={() => handleModerateThread(t.id, { isClosed: t.isClosed ? 0 : 1 })}
                                                className={`p-1.5 rounded-lg border transition-all ${t.isClosed ? 'border-red-950 text-red-400 bg-red-950/10' : 'border-zinc-800 text-zinc-500 hover:text-white'}`}
                                                title={t.isClosed ? 'Abrir Hilo' : 'Cerrar Hilo'}
                                            >
                                                <Icons.Lock size={12} />
                                            </button>
                                            <button 
                                                onClick={() => handleModerateThread(t.id, { deleteThread: true })}
                                                className="p-1.5 rounded-lg border border-zinc-800 text-zinc-600 hover:text-rose-500 hover:border-rose-950 transition-all"
                                                title="Eliminar Hilo"
                                            >
                                                <Icons.Trash2 size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Replies Side Drawer Backdrop on Mobile */}
            {selectedThreadId && (
                <div 
                    onClick={() => setSelectedThreadId(null)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden animate-fade-in animate-duration-200"
                />
            )}

            {/* Replies Side Panel (Desktop inline, Mobile slide-over) */}
            <div className={`
                fixed inset-y-0 right-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-40 p-6 flex flex-col shadow-2xl transition-transform duration-300 md:static md:w-auto md:max-w-none md:bg-zinc-950/60 md:border md:rounded-2xl md:z-0 md:shadow-none md:translate-x-0 lg:col-span-1 h-full md:h-fit
                ${selectedThreadId ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-4 md:pb-0 md:border-b-0">
                    <h3 className="text-md font-black uppercase tracking-tighter italic text-zinc-200">Respuestas del Hilo</h3>
                    <button 
                        onClick={() => setSelectedThreadId(null)}
                        className="md:hidden text-zinc-500 hover:text-white p-1"
                        title="Cerrar Respuestas"
                    >
                        <Icons.X size={18} />
                    </button>
                </div>
                
                {!selectedThreadId ? (
                    <p className="text-[10px] text-zinc-500 italic py-4 text-center">Selecciona un hilo para moderar sus respuestas.</p>
                ) : loadingReplies ? (
                    <div className="text-zinc-500 italic py-6 text-center animate-pulse">Cargando comentarios...</div>
                ) : replies.length === 0 ? (
                    <p className="text-[10px] text-zinc-500 italic py-4 text-center">Este hilo no tiene respuestas aún.</p>
                ) : (
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                        {replies.map((r: any) => (
                            <div key={r.id} className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-850 space-y-2 group transition-all hover:border-zinc-800">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-bold text-zinc-300">{r.authorName || 'Piloto'}</span>
                                        <span className="text-[8px] text-zinc-650 font-mono block">{new Date(r.createdAt || r.date).toLocaleString()}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleModerateReply(r.id)}
                                        className="text-zinc-650 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                        title="Borrar Comentario"
                                    >
                                        <Icons.Trash2 size={12} />
                                    </button>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: r.content }} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
