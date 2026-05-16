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
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-20 text-center">
                        <Icons.Package size={48} className="mx-auto mb-4 text-zinc-700" />
                        <p className="font-bold uppercase italic text-zinc-500">Módulo de productos listo para poblar.</p>
                        <button className="mt-6 bg-[#ff4d00] text-white px-8 py-3 rounded-full font-black uppercase italic text-xs tracking-widest shadow-xl shadow-orange-900/30">Nuevo Producto</button>
                    </div>
                )}
            </main>
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
