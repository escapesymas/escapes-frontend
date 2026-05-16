import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, Package, ShoppingCart, Users, MessageSquare, 
    TrendingUp, AlertCircle, Loader2, Save, Search, Filter,
    ChevronRight, ArrowUpRight, ShieldCheck, RefreshCw, Database
} from 'lucide-react';
import { User as UserType } from '../types';

interface AdminStats {
    users: number;
    posts: number;
    orders: number;
    sales: number;
}

export const AdminDashboard: React.FC<{ user: UserType | null; onBack: () => void }> = ({ user, onBack }) => {
    const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders' | 'forum'>('stats');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let currentUser = user;
        
        // Si no tenemos usuario por prop, intentamos buscarlo en el storage local
        if (!currentUser) {
            const stored = localStorage.getItem('escapes_user');
            if (stored) currentUser = JSON.parse(stored);
        }

        const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'info@escapesymas.com';
        
        if (!currentUser || !isAdmin) {
            setError("No tienes permisos para acceder a esta zona.");
            setLoading(false);
            return;
        }

        loadStats(currentUser);
    }, [user]);

    const loadStats = async (u: any) => {
        setLoading(true);
        try {
            const userId = u?.id || u?.user_id || u?.wpId;
            const userEmail = u?.email || u?.user_email;
            const res = await fetch(`/api/admin?action=dashboard-stats&userId=${userId}&email=${userEmail}`);
            if (!res.ok) throw new Error("Error al cargar estadísticas");
            const data = await res.json();
            setStats(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-black">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-racing-orange animate-spin mx-auto mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest italic">Iniciando Sistemas Maestro...</p>
            </div>
        </div>
    );

    if (error && !stats) return (
        <div className="h-screen flex items-center justify-center bg-black p-4">
            <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 p-8 rounded-2xl text-center shadow-2xl">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white italic uppercase mb-2">Acceso Restringido</h2>
                <p className="text-zinc-400 mb-8">{error}</p>
                <button onClick={onBack} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-all">Volver</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
            {/* Sidebar Lateral */}
            <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-auto md:h-screen sticky top-0 z-50">
                <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-racing-orange to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-900/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black italic uppercase tracking-tighter text-xl">Escapes <span className="text-racing-orange">Admin</span></h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Master Control v1.0</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-grow p-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold uppercase text-xs transition-all ${activeTab === 'stats' ? 'bg-zinc-900 text-racing-orange shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('products')}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold uppercase text-xs transition-all ${activeTab === 'products' ? 'bg-zinc-900 text-racing-orange shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}`}
                    >
                        <Package className="w-5 h-5" /> Productos & Stock
                    </button>
                    <button 
                        onClick={() => setActiveTab('orders')}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold uppercase text-xs transition-all ${activeTab === 'orders' ? 'bg-zinc-900 text-racing-orange shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}`}
                    >
                        <ShoppingCart className="w-5 h-5" /> Pedidos
                    </button>
                    <button 
                        onClick={() => setActiveTab('forum')}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold uppercase text-xs transition-all ${activeTab === 'forum' ? 'bg-zinc-900 text-racing-orange shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}`}
                    >
                        <MessageSquare className="w-5 h-5" /> Moderación Foro
                    </button>
                </nav>

                <div className="p-4 border-t border-zinc-800 mt-auto">
                    <button onClick={onBack} className="w-full bg-zinc-900 hover:bg-zinc-800 p-3 rounded-lg text-zinc-400 text-xs font-bold uppercase transition-colors">Salir al Site</button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <main className="flex-grow p-6 md:p-10 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tight mb-1">
                            {activeTab === 'stats' && 'Vista General'}
                            {activeTab === 'products' && 'Gestión de Inventario'}
                            {activeTab === 'orders' && 'Historial de Ventas'}
                            {activeTab === 'forum' && 'Moderación de Contenido'}
                        </h1>
                        <p className="text-zinc-500 text-sm font-medium">Panel de control unificado Escapes y Más.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                         <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs font-bold text-white">{user?.name}</span>
                            <span className="text-[10px] text-racing-orange font-black uppercase italic">Master Admin</span>
                         </div>
                         <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg">
                            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Users className="w-5 h-5 m-2.5 text-zinc-500" />}
                         </div>
                    </div>
                </header>

                {/* VISTA: DASHBOARD STATS */}
                {activeTab === 'stats' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 rounded-2xl shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-racing-orange/10 rounded-xl"><TrendingUp className="w-6 h-6 text-racing-orange" /></div>
                                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold">+12%</span>
                                </div>
                                <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Ventas Totales</h3>
                                <p className="text-3xl font-black italic">{(stats?.sales || 0 / 100).toLocaleString()}€</p>
                            </div>

                            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 rounded-2xl shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl"><ShoppingCart className="w-6 h-6 text-blue-500" /></div>
                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold">Activos</span>
                                </div>
                                <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Pedidos</h3>
                                <p className="text-3xl font-black italic">{stats?.orders}</p>
                            </div>

                            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 rounded-2xl shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-500/10 rounded-xl"><Users className="w-6 h-6 text-purple-500" /></div>
                                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-bold">Comunidad</span>
                                </div>
                                <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Usuarios</h3>
                                <p className="text-3xl font-black italic">{stats?.users}</p>
                            </div>

                            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 rounded-2xl shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-yellow-500/10 rounded-xl"><MessageSquare className="w-6 h-6 text-yellow-500" /></div>
                                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-bold">Foro</span>
                                </div>
                                <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Posts Paddock</h3>
                                <p className="text-3xl font-black italic">{stats?.posts}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                                <h3 className="text-xl font-bold uppercase italic mb-6">Actividad Reciente</h3>
                                <div className="space-y-4">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800 group hover:border-racing-orange transition-all cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center"><Users className="w-4 h-4 text-zinc-500" /></div>
                                                <div>
                                                    <p className="text-sm font-bold">Nuevo usuario registrado</p>
                                                    <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">Hace {i} horas • ID: #45{i}</p>
                                                </div>
                                            </div>
                                            <ArrowUpRight className="w-5 h-5 text-zinc-700 group-hover:text-racing-orange transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
                                <h3 className="text-xl font-bold uppercase italic mb-6">Estado del Sistema</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Database className="w-5 h-5 text-green-500" />
                                            <span className="text-sm font-bold">PostgreSQL VPS</span>
                                        </div>
                                        <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded font-bold">ONLINE</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <RefreshCw className="w-5 h-5 text-blue-500" />
                                            <span className="text-sm font-bold">Sync Catálogo</span>
                                        </div>
                                        <span className="text-[10px] bg-blue-500/20 text-blue-500 px-2 py-1 rounded font-bold">STABLE</span>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-zinc-800">
                                        <p className="text-xs text-zinc-500 mb-4 font-bold uppercase tracking-widest">Sincronización manual</p>
                                        <button className="w-full bg-racing-orange hover:bg-orange-600 text-white font-black uppercase italic py-3 rounded-xl transition-all shadow-lg shadow-orange-900/20">Sincronizar CSV Proveedor</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA: PRODUCTOS */}
                {activeTab === 'products' && <InventoryView user={user} />}

                {/* VISTA: PEDIDOS (PLACEHOLDER) */}
                {activeTab === 'orders' && (
                    <div className="flex flex-col items-center justify-center py-32 text-zinc-700 animate-pulse">
                        <ShoppingCart className="w-24 h-24 mb-4" />
                        <span className="font-black italic uppercase text-sm tracking-widest">Módulo de Pedidos en construcción...</span>
                    </div>
                )}

                {/* VISTA: FORO (PLACEHOLDER) */}
                {activeTab === 'forum' && (
                    <div className="flex flex-col items-center justify-center py-32 text-zinc-700 animate-pulse">
                        <MessageSquare className="w-24 h-24 mb-4" />
                        <span className="font-black italic uppercase text-sm tracking-widest">Módulo de Moderación en construcción...</span>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- SUB-COMPONENTES ---

const InventoryView: React.FC<{ user: any }> = ({ user }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const u = user || JSON.parse(localStorage.getItem('escapes_user') || '{}');
            const userId = u?.id || u?.user_id || u?.wpId;
            const userEmail = u?.email || u?.user_email;
            const res = await fetch(`/api/admin?action=products-list&userId=${userId}&email=${userEmail}`);
            if (res.ok) setProducts(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div className="flex gap-4">
                    <button onClick={() => setShowNewForm(true)} className="bg-racing-orange hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black uppercase italic text-xs tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-orange-900/20">
                        <Package size={16} /> Nuevo Producto
                    </button>
                    <button className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-black uppercase italic text-xs tracking-widest border border-zinc-800 transition-all">
                        Importar CSV Proveedor
                    </button>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-zinc-500 uppercase italic">
                    Inventario: <span className="text-white">{products.length}</span> items
                </div>
            </div>

            {showNewForm && (
                <NewProductForm 
                    onClose={() => setShowNewForm(false)} 
                    onSuccess={() => { setShowNewForm(false); loadProducts(); }}
                    user={user}
                />
            )}

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/40 text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-800">
                                <th className="px-6 py-5">Producto / Marca</th>
                                <th className="px-6 py-5">SKU</th>
                                <th className="px-6 py-5">Precio</th>
                                <th className="px-6 py-5">Stock</th>
                                <th className="px-6 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-zinc-600 italic font-bold uppercase text-xs tracking-widest">Sincronizando con PostgreSQL...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-zinc-600 italic font-bold uppercase text-xs tracking-widest">Base de datos vacía. Crea el primer producto.</td></tr>
                            ) : products.map(p => (
                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black rounded-xl border border-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <Package className="text-zinc-800 w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black italic uppercase text-white group-hover:text-racing-orange transition-colors">{p.name}</p>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{p.brand || 'Escapes y Más'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-xs font-mono text-zinc-500">{p.sku}</td>
                                    <td className="px-6 py-5 text-sm font-black italic text-white">{p.price}€</td>
                                    <td className="px-6 py-5">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase italic ${p.stock > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                                            {p.stock > 0 ? `${p.stock} Unidades` : 'Sin Stock'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
                                            <Save size={16} />
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

const NewProductForm: React.FC<{ onClose: () => void, onSuccess: () => void, user: any }> = ({ onClose, onSuccess, user }) => {
    const [formData, setFormData] = useState({
        name: '', sku: '', price: '', stock: '', category: 'Escapes', brand: '', imageUrl: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const u = user || JSON.parse(localStorage.getItem('escapes_user') || '{}');
            const userId = u?.id || u?.user_id || u?.wpId;
            const userEmail = u?.email || u?.user_email;
            
            const res = await fetch(`/api/admin?action=create-product&userId=${userId}&email=${userEmail}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock)
                })
            });
            if (res.ok) onSuccess();
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden my-auto animate-in zoom-in duration-300">
                <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/30">
                    <div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">Nuevo Producto Nativo</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Almacén PostgreSQL VPS</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">✕</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">Nombre Completo</label>
                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-racing-orange outline-none transition-all font-bold" placeholder="Ej: Escape Scorpion Serket Taper Carbon" />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">SKU / Referencia</label>
                            <input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-racing-orange outline-none transition-all font-mono" placeholder="SC-100-XP" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">Marca</label>
                            <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-racing-orange outline-none transition-all font-bold" placeholder="Scorpion Exhausts" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">Precio PVP (€)</label>
                            <div className="relative">
                                <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-10 pr-5 py-4 text-sm focus:border-racing-orange outline-none transition-all font-black text-racing-orange" placeholder="0.00" />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">€</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">Stock Disponible</label>
                            <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-racing-orange outline-none transition-all font-bold" placeholder="10" />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">URL Imagen del Producto</label>
                            <input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-racing-orange outline-none transition-all" placeholder="https://mi-servidor.com/imagen.webp" />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button disabled={submitting} type="submit" className="w-full bg-racing-orange hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-5 rounded-[2rem] font-black uppercase italic tracking-widest transition-all shadow-xl shadow-orange-900/40 flex items-center justify-center gap-3">
                            {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            {submitting ? 'Guardando en VPS...' : 'Crear Producto Maestro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
