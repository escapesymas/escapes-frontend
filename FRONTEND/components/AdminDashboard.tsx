import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, Package, ShoppingCart, Users, MessageSquare, 
    TrendingUp, AlertCircle, Loader2, Save, Search, Filter,
    ChevronRight, ArrowUpRight, ShieldCheck, RefreshCw, Database,
    Shield, LogOut
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
                <Loader2 className="w-12 h-12 text-[#ff4d00] animate-spin mx-auto mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest italic">Sincronizando Sistemas Maestro...</p>
            </div>
        </div>
    );

    if (error && !stats) return (
        <div className="h-screen flex items-center justify-center bg-black p-4">
            <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 p-8 rounded-2xl text-center shadow-2xl">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white italic uppercase mb-2">Acceso Restringido</h2>
                <p className="text-zinc-400 mb-8">{error}</p>
                <button onClick={onBack} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-all uppercase tracking-widest">Volver al Site</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-auto md:h-screen sticky top-0 z-50">
                <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#ff4d00] rounded-lg flex items-center justify-center shadow-lg shadow-orange-900/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black italic uppercase tracking-tighter text-xl leading-none">Escapes <span className="text-[#ff4d00]">Admin</span></h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Master Control v1.0</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-grow p-4 space-y-2">
                    <NavItem active={activeTab === 'stats'} icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setActiveTab('stats')} />
                    <NavItem active={activeTab === 'products'} icon={<Package size={20} />} label="Productos & Stock" onClick={() => setActiveTab('products')} />
                    <NavItem active={activeTab === 'orders'} icon={<ShoppingCart size={20} />} label="Pedidos" onClick={() => setActiveTab('orders')} />
                    <NavItem active={activeTab === 'forum'} icon={<MessageSquare size={20} />} label="Moderación Foro" onClick={() => setActiveTab('forum')} />
                </nav>

                <div className="p-4 border-t border-zinc-800 mt-auto">
                    <button onClick={onBack} className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 p-3 rounded-lg text-zinc-400 text-xs font-bold uppercase transition-colors">
                        <LogOut size={14} /> Salir
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 p-6 md:p-10 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tight mb-1">
                            {activeTab === 'stats' && 'Vista General'}
                            {activeTab === 'products' && 'Inventario Maestro'}
                            {activeTab === 'orders' && 'Gestión de Pedidos'}
                            {activeTab === 'forum' && 'Moderación Paddock'}
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Panel de control unificado Escapes y Más.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                         <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs font-bold text-white">{user?.user_display_name || 'Admin'}</span>
                            <span className="text-[10px] text-[#ff4d00] font-black uppercase italic tracking-tighter">Master Admin</span>
                         </div>
                         <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-lg flex items-center justify-center">
                            {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <Users className="w-6 h-6 text-zinc-700" />}
                         </div>
                    </div>
                </header>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'stats' && stats && <DashboardHome stats={stats} />}
                    {activeTab === 'products' && <InventoryView user={user} />}
                    {activeTab === 'orders' && <ModulePlaceholder icon={<ShoppingCart size={48} />} title="Gestión de Pedidos" />}
                    {activeTab === 'forum' && <ModulePlaceholder icon={<MessageSquare size={48} />} title="Moderación Foro" />}
                </div>
            </main>
        </div>
    );
};

// --- COMPONENTES AUXILIARES ---

const NavItem: React.FC<{ active: boolean, icon: React.ReactNode, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold uppercase text-xs transition-all ${active ? 'bg-zinc-900 text-[#ff4d00] shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}`}
    >
        {icon} {label}
    </button>
);

const DashboardHome: React.FC<{ stats: AdminStats }> = ({ stats }) => (
    <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<TrendingUp size={24} className="text-[#ff4d00]" />} label="Ventas Totales" value={`${(stats.sales / 100).toLocaleString()}€`} trend="+12%" color="orange" />
            <StatCard icon={<ShoppingCart size={24} className="text-blue-500" />} label="Pedidos" value={stats.orders} trend="Activos" color="blue" />
            <StatCard icon={<Users size={24} className="text-purple-500" />} label="Usuarios" value={stats.users} trend="Comunidad" color="purple" />
            <StatCard icon={<MessageSquare size={24} className="text-yellow-500" />} label="Posts Paddock" value={stats.posts} trend="Foro" color="yellow" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
                <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2"><ArrowUpRight className="text-[#ff4d00]" /> Actividad Reciente</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-black border border-zinc-900 rounded-2xl hover:border-zinc-700 transition-all cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors"><Users size={20} /></div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">Nuevo usuario registrado</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">ID: #45{i} • Hace {i}h</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-800 group-hover:text-[#ff4d00] group-hover:translate-x-1 transition-all" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
                <h3 className="text-xl font-black italic uppercase mb-6">Estado</h3>
                <div className="space-y-4">
                    <StatusItem icon={<Database size={18} className="text-green-500" />} label="PostgreSQL VPS" status="ONLINE" />
                    <StatusItem icon={<RefreshCw size={18} className="text-blue-500" />} label="Sync Catálogo" status="STABLE" />
                    <div className="mt-10 p-6 bg-black rounded-2xl border border-zinc-900">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Sincronización Crítica</p>
                        <button className="w-full bg-[#ff4d00] hover:bg-orange-600 text-white font-black uppercase italic py-4 rounded-xl transition-all shadow-lg shadow-orange-900/40 text-xs tracking-widest">Sincronizar CSV</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const InventoryView: React.FC<{ user: any }> = ({ user }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);

    useEffect(() => { loadProducts(); }, []);

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex gap-4">
                    <button onClick={() => setShowNewForm(true)} className="bg-[#ff4d00] hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest flex items-center gap-2 shadow-xl shadow-orange-900/30">
                        <Package size={18} /> Nuevo Producto
                    </button>
                    <button className="bg-zinc-900 border border-zinc-800 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest">Importar CSV</button>
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Items: {products.length}</div>
            </div>

            {showNewForm && <NewProductForm onClose={() => setShowNewForm(false)} onSuccess={() => { setShowNewForm(false); loadProducts(); }} user={user} />}

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/50 text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-800">
                            <th className="px-8 py-6 italic">Producto</th>
                            <th className="px-8 py-6">SKU</th>
                            <th className="px-8 py-6">Precio</th>
                            <th className="px-8 py-6 text-right">Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {loading ? (
                            <tr><td colSpan={4} className="py-20 text-center text-zinc-600 italic font-bold">Cargando Almacén...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={4} className="py-20 text-center text-zinc-600 italic font-bold">No hay productos nativos en PostgreSQL.</td></tr>
                        ) : products.map(p => (
                            <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-8 py-6 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black border border-zinc-800 rounded-xl flex-shrink-0 flex items-center justify-center">
                                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <Package size={20} className="text-zinc-800" />}
                                    </div>
                                    <div>
                                        <p className="font-black italic uppercase text-white group-hover:text-[#ff4d00] transition-colors">{p.name}</p>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase">{p.brand || 'Escapes y Más'}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-xs font-mono text-zinc-500">{p.sku}</td>
                                <td className="px-8 py-6 font-black italic text-white">{p.price}€</td>
                                <td className="px-8 py-6 text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase italic ${p.stock > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {p.stock > 0 ? `${p.stock} Uds` : 'Agotado'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const NewProductForm: React.FC<{ onClose: () => void, onSuccess: () => void, user: any }> = ({ onClose, onSuccess, user }) => {
    const [formData, setFormData] = useState({ name: '', sku: '', price: '', stock: '', brand: '', imageUrl: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = user || JSON.parse(localStorage.getItem('escapes_user') || '{}');
            const userId = u?.id || u?.user_id || u?.wpId;
            const res = await fetch(`/api/admin?action=create-product&userId=${userId}&email=${u.email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) onSuccess();
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/30">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Nuevo Producto</h3>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-10 space-y-6">
                    <div className="space-y-4">
                        <FormInput label="Nombre del Producto" value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="Escape Akrapovic..." />
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput label="SKU" value={formData.sku} onChange={v => setFormData({...formData, sku: v})} placeholder="AK-123" />
                            <FormInput label="Marca" value={formData.brand} onChange={v => setFormData({...formData, brand: v})} placeholder="Akrapovic" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput label="Precio (€)" value={formData.price} onChange={v => setFormData({...formData, price: v})} type="number" placeholder="0.00" />
                            <FormInput label="Stock" value={formData.stock} onChange={v => setFormData({...formData, stock: v})} type="number" placeholder="10" />
                        </div>
                    </div>
                    <button disabled={loading} className="w-full bg-[#ff4d00] hover:bg-orange-600 disabled:bg-zinc-800 py-5 rounded-[2rem] font-black uppercase italic tracking-widest shadow-xl shadow-orange-900/40 flex items-center justify-center gap-3">
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {loading ? 'Creando...' : 'Crear Producto Maestro'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- MICRO COMPONENTES ---

const StatCard: React.FC<{ icon: any, label: string, value: any, trend: string, color: string }> = ({ icon, label, value, trend, color }) => (
    <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-3xl shadow-xl hover:border-zinc-700 transition-all">
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 bg-${color}-500/10 rounded-2xl`}>{icon}</div>
            <span className={`text-[10px] font-black uppercase italic px-3 py-1 rounded-full bg-${color}-500/20 text-${color}-500`}>{trend}</span>
        </div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-4xl font-black italic tracking-tighter">{value}</p>
    </div>
);

const StatusItem: React.FC<{ icon: any, label: string, status: string }> = ({ icon, label, status }) => (
    <div className="flex items-center justify-between p-4 bg-black border border-zinc-900 rounded-2xl">
        <div className="flex items-center gap-3">
            {icon}
            <span className="text-xs font-bold text-zinc-300">{label}</span>
        </div>
        <span className="text-[10px] font-black bg-green-500/10 text-green-500 px-3 py-1 rounded-full uppercase">{status}</span>
    </div>
);

const FormInput: React.FC<{ label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }> = ({ label, value, onChange, type = "text", placeholder }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-zinc-500 italic ml-1 tracking-widest">{label}</label>
        <input required type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-[#ff4d00] outline-none transition-all font-bold" placeholder={placeholder} />
    </div>
);

const ModulePlaceholder: React.FC<{ icon: any, title: string }> = ({ icon, title }) => (
    <div className="flex flex-col items-center justify-center py-40 text-zinc-800 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[3rem]">
        {icon}
        <h2 className="text-xl font-black italic uppercase mt-6 mb-2 text-zinc-700">{title}</h2>
        <p className="text-xs font-bold uppercase tracking-[0.3em]">Sistemas en Construcción</p>
    </div>
);
