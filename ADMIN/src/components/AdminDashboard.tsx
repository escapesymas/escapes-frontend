import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import AccountingTab from './AccountingTab';
import SyncTab from './tabs/SyncTab';
import UsersTab from './tabs/UsersTab';
import ProductsTab from './tabs/ProductsTab';
import OrdersTab from './tabs/OrdersTab';

interface AdminDashboardProps {
  session: any;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ session, onLogout }) => {
  const [activeTab, setActiveTab] = useState('stats');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [carts, setCarts] = useState<any[]>([]);
  const [cartsSubTab, setCartsSubTab] = useState<'current' | 'abandoned'>('current');
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Products Search & Pagination
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  // Modals / Form States
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showProductForm, setShowProductForm] = useState<any>(null); // 'create' | 'edit' | null
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Orders Search & Filtering
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');

  // React State-Based Confirmations (Bypasses Native Browser Dialog Blocks)
  const [orderDeletingId, setOrderDeletingId] = useState<number | null>(null);
  const [cartDeletingId, setCartDeletingId] = useState<number | null>(null);
  const [productDeletingId, setProductDeletingId] = useState<number | null>(null);
  const [showModalDeleteConfirm, setShowModalDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const adminEmail = session.user_email;
  const adminWpId = session.wpId || 0;

  const fetchProductsList = async (searchVal = '', pageVal = 1, append = false, isSilent = false, filters: Record<string, string> = {}) => {
    if (!isSilent) setProductsLoading(true);
    try {
      let url = `/api/admin?action=products-list&userId=${adminWpId}&email=${adminEmail}&search=${encodeURIComponent(searchVal)}&page=${pageVal}&limit=50`;
      for (const [key, val] of Object.entries(filters)) {
        if (val !== '' && val !== undefined && val !== null) {
          url += `&${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
        }
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        if (list.length < 50) {
          setHasMoreProducts(false);
        } else {
          setHasMoreProducts(true);
        }
        if (append) {
          setProducts(prev => [...prev, ...list]);
        } else {
          setProducts(list);
        }
      }
    } catch (e) {
      console.error('[FETCH PRODUCTS ERROR]:', e);
    } finally {
      if (!isSilent) setProductsLoading(false);
    }
  };

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      // 1. Fetch Dashboard Stats
      const statsRes = await fetch(`/api/admin?action=dashboard-stats&userId=${adminWpId}&email=${adminEmail}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData && !statsData.error ? statsData : null);
      }

      // 2. Fetch Orders List
      const ordersRes = await fetch(`/api/admin?action=orders-list&userId=${adminWpId}&email=${adminEmail}`);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : (ordersData.orders || []));
      }

      // 3. Fetch Users List
      const usersRes = await fetch(`/api/admin?action=users-list&userId=${adminWpId}&email=${adminEmail}`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      }

      // 4. Fetch Carts List
      const cartsRes = await fetch(`/api/admin?action=carts-list&userId=${adminWpId}&email=${adminEmail}`);
      if (cartsRes.ok) {
        const cartsData = await cartsRes.json();
        setCarts(Array.isArray(cartsData) ? cartsData : []);
      }

    } catch (err: any) {
      console.error('[FETCH ADMIN DATA ERROR]:', err);
      if (!isSilent) setError('Error al cargar datos desde el servidor. Comprueba la conexión.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      if (!selectedOrder && !showProductForm && !editingProduct && !showModalDeleteConfirm) {
        fetchData(true);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [adminWpId, adminEmail, selectedOrder, showProductForm, editingProduct, showModalDeleteConfirm]);

  useEffect(() => {
    if (activeTab === 'products') {
      setProductPage(1);
      fetchProductsList(productSearch, 1, false);
    }
  }, [activeTab]);

  // Also load products on initial mount (when stats tab is default, products might not load until user clicks tab)
  useEffect(() => {
    fetchProductsList('', 1, false, true);
  }, []);

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`/api/admin?action=update-order-status&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      });
      if (response.ok) {
        setSelectedOrder(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/admin?action=delete-order&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (response.ok) {
        showToast('¡Pedido eliminado con éxito!', 'success');
        setSelectedOrder(null);
        fetchData();
      } else {
        const errText = await response.text();
        let errMsg = errText;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error || errJson.message || errText;
        } catch {}
        showToast(`Fallo: ${errMsg}`, 'error');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Error de red al borrar pedido', 'error');
    }
  };

  const handleDeleteCart = async (cartId: number) => {
    try {
      const response = await fetch(`/api/admin?action=delete-cart&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId })
      });
      if (response.ok) {
        showToast('¡Carrito archivado en abandonados con éxito!', 'success');
        fetchData(true);
      } else {
        const errText = await response.text();
        let errMsg = errText;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error || errJson.message || errText;
        } catch {}
        showToast(`Fallo: ${errMsg}`, 'error');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Error de red al archivar carrito', 'error');
    }
  };

  const handleSendAbandonedEmail = async (cart: any) => {
    if (!cart.userEmail || cart.userEmail === 'Invitado') {
      showToast('No se puede enviar email: Cliente invitado sin correo registrado.', 'error');
      return;
    }
    setSendingEmailId(cart.id);
    try {
      const res = await fetch(`/api/admin?action=send-abandoned-email&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: cart.id,
          email: cart.userEmail,
          firstName: cart.userFirstName,
          items: cart.items
        })
      });
      if (res.ok) {
        showToast(`¡Email de recuperación enviado con éxito a ${cart.userFirstName || 'cliente'}!`, 'success');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Error al enviar el correo.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error de conexión al enviar el correo.', 'error');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handlePermanentlyDeleteCart = async (cartId: number) => {
    try {
      const res = await fetch(`/api/admin?action=permanently-delete-cart&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId })
      });
      if (res.ok) {
        showToast('¡Carrito eliminado de forma permanente con éxito!', 'success');
        fetchData(true);
      } else {
        showToast('Error al eliminar permanentemente.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error de red al eliminar el carrito.', 'error');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`/api/admin?action=delete-product&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      if (response.ok) {
        showToast('¡Producto eliminado con éxito!', 'success');
        fetchData();
      } else {
        const errText = await response.text();
        let errMsg = errText;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error || errJson.message || errText;
        } catch {}
        showToast(`Fallo: ${errMsg}`, 'error');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Error de red al borrar producto', 'error');
    }
  };

  const handleProductSubmit = async (formData: any) => {
    const isEdit = showProductForm === 'edit';
    const action = isEdit ? 'update-product' : 'create-product';
    try {
      const response = await fetch(`/api/admin?action=${action}&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowProductForm(null);
        setEditingProduct(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !stats) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white font-sans">
        <Icons.Loader2 className="w-12 h-12 text-racing-orange animate-spin mb-4" />
        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest italic animate-pulse">Sincronizando Base de Datos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans">
      {/* Mobile Header Bar */}
      {isMobile && (
        <header className="flex md:hidden bg-zinc-950 border-b border-zinc-900 p-4 justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-racing-orange rounded flex items-center justify-center text-white">
            <Icons.Shield size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-black italic uppercase tracking-tighter text-xs">Escapes <span className="text-racing-orange">Panel</span></span>
            <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">Master Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onLogout}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors"
            title="Salir del Panel"
          >
            <Icons.LogOut size={16} />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-zinc-300 hover:text-white transition-colors"
            aria-label="Abrir Menú"
          >
            {isMobileMenuOpen ? <Icons.X size={18} /> : <Icons.Menu size={18} />}
          </button>
        </div>
      </header>
      )}

      {/* Backdrop for mobile drawer */}
      {isMobile && isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Mobile Sidebar Navigation Drawer */}
      {isMobile && isMobileMenuOpen && (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-900 z-50 flex flex-col h-full md:hidden">
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-racing-orange rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Icons.Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-black italic uppercase tracking-tighter text-sm">Escapes <span className="text-racing-orange">Panel</span></span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Master Admin</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-zinc-500 hover:text-white p-1"
          >
            <Icons.X size={18} />
          </button>
        </div>

        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('stats'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'stats' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.LayoutDashboard size={16} /> Vista General
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'orders' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.ShoppingCart size={16} /> Pedidos
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="ml-auto bg-racing-orange text-white text-[9px] font-black px-2 py-0.5 rounded-full not-italic">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('carts'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'carts' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.ShoppingBag size={16} /> Carritos
            {carts.length > 0 && (
              <span className="ml-auto bg-zinc-850 text-zinc-400 text-[9px] font-black px-2 py-0.5 rounded-full not-italic">
                {carts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'products' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.Package size={16} /> Productos
          </button>

          <button
            onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'users' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.Users size={16} /> Usuarios
          </button>

          <button
            onClick={() => { setActiveTab('coupons'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'coupons' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.Ticket size={16} /> Cupones
          </button>

          <button
            onClick={() => { setActiveTab('seo'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'seo' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.Link2 size={16} /> SEO Manager
          </button>

          <button
            onClick={() => { setActiveTab('sync'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'sync' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.RefreshCw size={16} /> Sincronización
          </button>

          <button
            onClick={() => { setActiveTab('margins'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'margins' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.TrendingUp size={16} /> Precios y Márgenes
          </button>

          <button
            onClick={() => { setActiveTab('accounting'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'accounting' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.Receipt size={16} /> Contabilidad
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-900 flex flex-col gap-2 bg-zinc-950/80">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-800 uppercase">
              {adminEmail.slice(0, 2)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-zinc-300 font-bold truncate">{adminEmail}</span>
              <span className="text-[8px] text-zinc-650 font-black uppercase tracking-wider">Conectado</span>
            </div>
          </div>
          <button
            onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-red-950/20 hover:text-red-500 border border-zinc-800 hover:border-red-900/30 text-zinc-400 py-3 rounded-xl text-[10px] font-black uppercase italic tracking-wider transition-all"
          >
            <Icons.LogOut size={12} /> Salir del Panel
          </button>
        </div>
      </aside>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col h-screen sticky top-0 shrink-0 hidden md:flex">
        <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
          <div className="w-9 h-9 bg-racing-orange rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Icons.Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black italic uppercase tracking-tighter text-sm">Escapes <span className="text-racing-orange">Panel</span></span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Master Admin</span>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'stats' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.LayoutDashboard size={16} /> Vista General
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'orders' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.ShoppingCart size={16} /> Pedidos
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="ml-auto bg-racing-orange text-white text-[9px] font-black px-2 py-0.5 rounded-full not-italic">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('carts')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'carts' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.ShoppingBag size={16} /> Carritos
            {carts.length > 0 && (
              <span className="ml-auto bg-zinc-850 text-zinc-400 text-[9px] font-black px-2 py-0.5 rounded-full not-italic">
                {carts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'products' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.Package size={16} /> Productos
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'users' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.Users size={16} /> Usuarios
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'coupons' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.Ticket size={16} /> Cupones
          </button>

          <button
            onClick={() => setActiveTab('seo')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'seo' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.Link2 size={16} /> SEO Manager
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'sync' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.RefreshCw size={16} /> Sincronización
          </button>

          <button
            onClick={() => setActiveTab('margins')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'margins' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.TrendingUp size={16} /> Precios y Márgenes
          </button>

          <button
            onClick={() => setActiveTab('accounting')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all ${
              activeTab === 'accounting' ? 'bg-zinc-900 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
            }`}
          >
            <Icons.Receipt size={16} /> Contabilidad
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-900 flex flex-col gap-2 bg-zinc-950/80">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-800 uppercase">
              {adminEmail.slice(0, 2)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-zinc-300 font-bold truncate">{adminEmail}</span>
              <span className="text-[8px] text-zinc-650 font-black uppercase tracking-wider">Conectado</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-red-950/20 hover:text-red-500 border border-zinc-800 hover:border-red-900/30 text-zinc-400 py-3 rounded-xl text-[10px] font-black uppercase italic tracking-wider transition-all"
          >
            <Icons.LogOut size={12} /> Salir del Panel
          </button>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {error && (
          <div className="mb-6 p-4 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-center gap-3">
            <Icons.AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Header */}
        <header className="mb-6 md:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter">
              {activeTab === 'stats' && 'Panel de Control'}
              {activeTab === 'orders' && 'Historial de Pedidos'}
              {activeTab === 'products' && 'Catálogo de Productos'}
              {activeTab === 'users' && 'Usuarios Registrados'}
              {activeTab === 'coupons' && 'Cupones de Descuento'}
              {activeTab === 'seo' && 'SEO Auto-Linking'}
              {activeTab === 'sync' && 'Consola de Sincronización (Bihr)'}
              {activeTab === 'margins' && 'Precios y Márgenes'}
              {activeTab === 'accounting' && 'Contabilidad y Facturación'}
            </h1>
            <p className="text-zinc-500 text-xs mt-1 font-medium">
              {activeTab === 'stats' && 'Vista general del rendimiento del e-commerce.'}
              {activeTab === 'orders' && 'Gestiona los estados de los pagos y envíos en PostgreSQL.'}
              {activeTab === 'products' && 'Añade, edita o elimina recambios y su compatibilidad.'}
              {activeTab === 'users' && 'Lista de clientes activos y su rango de fidelización.'}
              {activeTab === 'coupons' && 'Crea, edita o elimina cupones de marketing y campañas.'}
              {activeTab === 'seo' && 'Gestiona el diccionario de palabras clave del enlazado interno dofollow.'}
              {activeTab === 'sync' && 'Monitorea e inicia la sincronización de catálogos e imágenes del distribuidor.'}
              {activeTab === 'margins' && 'Configura márgenes por marca, categoría o globales y ejecuta el recálculo masivo de precios.'}
              {activeTab === 'accounting' && 'Analíticas financieras, libro de ventas, IVA repercutido y descarga de facturas PDF.'}
            </p>
          </div>
          {activeTab === 'products' && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowProductForm('create');
              }}
              className="bg-racing-orange hover:bg-orange-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-orange-950/20"
            >
              <Icons.Plus size={14} /> Añadir Producto
            </button>
          )}
        </header>

        {/* STATS VIEW */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-10">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Ventas Totales" value={`${(stats.sales / 100).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€`} icon={<Icons.DollarSign className="text-green-500" />} />
              <StatCard label="Pedidos Procesados" value={stats.orders} icon={<Icons.ShoppingCart className="text-blue-500" />} />
              <StatCard label="Clientes Totales" value={stats.users} icon={<Icons.Users className="text-purple-500" />} />
              <StatCard label="Temas del Foro" value={stats.posts} icon={<Icons.MessageSquare className="text-yellow-500" />} />
            </div>

            {/* VPS Status */}
            {stats.vps && (
              <div className="w-full">
                {/* VPS Hardware Metrics Card */}
                <div className="bg-zinc-950/40 backdrop-blur border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-black/40">
                  <div>
                    <h2 className="text-lg font-black italic uppercase tracking-wider mb-6 flex items-center gap-2 text-white">
                      <Icons.Cpu className="text-racing-orange w-5 h-5" /> Telemetría del Servidor (VPS)
                    </h2>
                    
                    <div className="space-y-5">
                      {/* CPU Progress */}
                      <div>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-400">
                          <span>Uso de CPU ({stats.vps.cores} Cores)</span>
                          <span className="text-racing-orange">{stats.vps.cpu}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                          <div 
                            className="bg-gradient-to-r from-orange-600 to-racing-orange h-full rounded-full transition-all duration-500" 
                            style={{ width: `${stats.vps.cpu}%` }}
                          />
                        </div>
                      </div>

                      {/* RAM Progress */}
                      <div>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-400">
                          <span>Memoria RAM ({stats.vps.ramUsed} / {stats.vps.ramTotal})</span>
                          <span className="text-racing-orange">{stats.vps.ramPercent}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                          <div 
                            className="bg-gradient-to-r from-orange-600 to-racing-orange h-full rounded-full transition-all duration-500" 
                            style={{ width: `${stats.vps.ramPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Disk Progress */}
                      <div>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-400">
                          <span>Espacio de Almacenamiento SSD ({stats.vps.disk.used} / {stats.vps.disk.total})</span>
                          <span className="text-racing-orange">{stats.vps.disk.percent}</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                          <div 
                            className="bg-gradient-to-r from-orange-600 to-racing-orange h-full rounded-full transition-all duration-500" 
                            style={{ width: stats.vps.disk.percent }}
                          />
                        </div>
                      </div>

                      {/* Image Regeneration Progress */}
                      {stats.vps.imageStats && (
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-zinc-400">
                            <span>📷 Imágenes</span>
                            <span className={stats.vps.imageStats.regenerating ? 'text-green-400' : 'text-zinc-500'}>
                              {stats.vps.imageStats.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="bg-zinc-900/50 p-2 rounded">
                              <span className="text-zinc-500">Procesados</span>
                              <div className="text-green-400 font-bold">{stats.vps.imageStats.regenProcessed}</div>
                            </div>
                            <div className="bg-zinc-900/50 p-2 rounded">
                              <span className="text-zinc-500">Éxitos</span>
                              <div className="text-green-400 font-bold">{stats.vps.imageStats.regenSuccess}</div>
                            </div>
                            <div className="bg-zinc-900/50 p-2 rounded">
                              <span className="text-zinc-500">Optimizadas</span>
                              <div className="text-racing-orange font-bold">{stats.vps.imageStats.optimized}</div>
                            </div>
                            <div className="bg-zinc-900/50 p-2 rounded">
                              <span className="text-zinc-500">Total DB</span>
                              <div className="text-white font-bold">{stats.vps.imageStats.total}</div>
                            </div>
                          </div>
                          {stats.vps.imageStats.regenerating && stats.vps.imageStats.regenCurrentSku && (
                            <div className="mt-2 text-[9px] text-zinc-600 truncate">
                              SKU: {stats.vps.imageStats.regenCurrentSku}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-zinc-900 flex justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                    <span>SO: <strong className="text-zinc-300">{stats.vps.os}</strong></span>
                    <span>Uptime: <strong className="text-zinc-300">{stats.vps.uptime}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Orders inside Dashboard */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
              <h2 className="text-lg font-black italic uppercase tracking-wider mb-6 flex items-center gap-2 text-white">
                <Icons.TrendingUp className="text-racing-orange w-5 h-5" /> Ventas Recientes
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                      <th className="pb-4">Pedido ID</th>
                      <th className="pb-4">Fecha</th>
                      <th className="pb-4">Cliente</th>
                      <th className="pb-4">Total</th>
                      <th className="pb-4">Estado</th>
                      <th className="pb-4 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/50">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.01]">
                        <td className="py-4 font-bold text-white">#{order.id}</td>
                        <td className="py-4 text-xs text-zinc-500">{new Date(order.createdAt).toLocaleDateString('es-ES')}</td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-zinc-300">{order.shippingData?.firstName} {order.shippingData?.lastName}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{order.shippingData?.email}</span>
                          </div>
                        </td>
                        <td className="py-4 font-black italic text-zinc-300 text-sm">{(order.total / 100).toFixed(2)}€</td>
                        <td className="py-4">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-racing-orange hover:text-white text-xs font-bold uppercase"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <OrdersTab
            orders={orders}
            orderSearch={orderSearch}
            orderFilter={orderFilter}
            orderDeletingId={orderDeletingId}
            setOrderSearch={setOrderSearch}
            setOrderFilter={setOrderFilter}
            setOrderDeletingId={setOrderDeletingId}
            setSelectedOrder={setSelectedOrder}
            handleDeleteOrder={handleDeleteOrder}
          />
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <ProductsTab
            products={products}
            productsLoading={productsLoading}
            hasMoreProducts={hasMoreProducts}
            productSearch={productSearch}
            productPage={productPage}
            setProductSearch={setProductSearch}
            setProductPage={setProductPage}
            setEditingProduct={setEditingProduct}
            setShowProductForm={setShowProductForm}
            fetchProductsList={fetchProductsList}
            handleDeleteProduct={handleDeleteProduct}
          />
        )}



        {/* USERS TAB */}
        {activeTab === 'users' && (
          <UsersTab users={users} />
        )}

        {/* CARTS TAB */}
        {activeTab === 'carts' && (() => {
          const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
          const currentCarts = carts.filter(c => c.isDeleted === 0 && new Date(c.updatedAt).getTime() > sixHoursAgo);
          const abandonedCarts = carts.filter(c => c.isDeleted === 1 || new Date(c.updatedAt).getTime() <= sixHoursAgo);
          const displayCarts = cartsSubTab === 'current' ? currentCarts : abandonedCarts;

          return (
            <div className="space-y-6">
              {/* Header/Info */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-black italic uppercase tracking-wider text-white">Seguimiento de Carritos en Tiempo Real</h2>
                  <p className="text-xs text-zinc-500 mt-1">Monitorea los carritos de compra activos de clientes registrados e invitados en tu base de datos.</p>
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-950 border border-zinc-900 px-4 py-3.5 rounded-xl self-stretch md:self-auto text-center md:text-left">
                  Carritos Registrados: <strong className="text-racing-orange font-mono">{carts.length}</strong>
                </div>
              </div>

              {/* Sub-tabs Selector */}
              <div className="flex gap-2 p-1 bg-zinc-950 border border-zinc-900 rounded-xl w-full md:w-fit">
                <button
                  onClick={() => setCartsSubTab('current')}
                  className={`flex-1 md:flex-none px-4 py-2.5 text-[10px] font-black uppercase italic tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                    cartsSubTab === 'current'
                      ? 'bg-zinc-900 text-racing-orange shadow-sm border border-zinc-850'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icons.Activity className="w-3.5 h-3.5" />
                  Actuales ({currentCarts.length})
                </button>
                <button
                  onClick={() => setCartsSubTab('abandoned')}
                  className={`flex-1 md:flex-none px-4 py-2.5 text-[10px] font-black uppercase italic tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                    cartsSubTab === 'abandoned'
                      ? 'bg-zinc-900 text-racing-orange shadow-sm border border-zinc-850'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icons.Inbox className="w-3.5 h-3.5" />
                  Abandonados / Eliminados ({abandonedCarts.length})
                </button>
              </div>

              {/* Carts List */}
              <div className="grid grid-cols-1 gap-4">
                {displayCarts.length === 0 ? (
                  <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-500 italic">
                    <Icons.ShoppingBag className="w-12 h-12 mx-auto text-zinc-800 mb-4 animate-pulse" />
                    {cartsSubTab === 'current' 
                      ? 'No hay carritos activos registrados en este momento.' 
                      : 'No hay carritos abandonados o eliminados registrados.'}
                  </div>
                ) : displayCarts.map((cart) => {
                  const totalCartPrice = cart.items.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                  const totalCartQty = cart.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

                  return (
                    <div key={cart.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Cart Info Header */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase italic tracking-wider ${
                            cart.userId ? 'bg-orange-500/10 text-racing-orange border border-orange-500/20' : 'bg-zinc-900 text-zinc-500 border border-zinc-850'
                          }`}>
                            {cart.userId ? 'Registrado' : 'Invitado'}
                          </span>
                          <span className="font-bold text-white text-xs">
                            {cart.userId ? (
                              <span className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-zinc-200">
                                  {cart.userFirstName || cart.userLastName
                                    ? `${cart.userFirstName || ''} ${cart.userLastName || ''}`.trim()
                                    : cart.userUsername || 'Usuario Registrado'}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono font-medium">({cart.userEmail})</span>
                              </span>
                            ) : (
                              <span className="text-zinc-400">Cliente Invitado</span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Token: {cart.sessionToken.slice(0, 16)}...</span>
                          <span className="text-[10px] text-zinc-500">Última actividad: {new Date(cart.updatedAt).toLocaleString('es-ES')}</span>
                          {cart.isDeleted === 1 && (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase italic tracking-widest">
                              Eliminado
                            </span>
                          )}
                        </div>

                        {/* Items List inside Cart */}
                        <div className="flex flex-wrap gap-2.5">
                          {cart.items.length === 0 ? (
                            <span className="text-zinc-500 text-xs italic">Carrito vacío</span>
                          ) : cart.items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-zinc-900/50 border border-zinc-900 px-3.5 py-2 rounded-xl flex items-center gap-3 text-[11px]">
                              <span className="bg-zinc-950 border border-zinc-850 text-racing-orange font-bold rounded-lg w-5 h-5 flex items-center justify-center text-[10px]">
                                {item.quantity}x
                              </span>
                              <div className="flex flex-col">
                                <span className="text-zinc-300 font-medium">{item.name || 'Producto'}</span>
                                <span className="text-[9px] text-zinc-500 font-black uppercase italic">{(item.price || 0).toFixed(2)}€/u</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total / Actions */}
                      <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto justify-between lg:justify-end border-t border-zinc-900 lg:border-t-0 pt-4 lg:pt-0">
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Total Estimado</span>
                          <span className="text-lg font-black italic text-racing-orange font-mono mt-0.5">{totalCartPrice.toFixed(2)}€</span>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">{totalCartQty} artículos</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Send Email Recovery Button only in Abandoned Tab */}
                          {cartsSubTab === 'abandoned' && (
                            cart.userId && cart.userEmail && cart.userEmail !== 'Invitado' ? (
                              <button
                                onClick={() => handleSendAbandonedEmail(cart)}
                                disabled={sendingEmailId === cart.id}
                                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase italic tracking-wider flex items-center gap-2 transition-all border ${
                                  sendingEmailId === cart.id
                                    ? 'bg-zinc-900 text-zinc-600 border-zinc-850 cursor-not-allowed animate-pulse'
                                    : 'bg-orange-500/10 hover:bg-racing-orange text-racing-orange hover:text-black border-orange-500/20 hover:border-transparent'
                                }`}
                                title="Enviar email de recuperación de carrito"
                              >
                                {sendingEmailId === cart.id ? (
                                  <>
                                    <Icons.RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    Enviando...
                                  </>
                                ) : (
                                  <>
                                    <Icons.Mail className="w-3.5 h-3.5" />
                                    Enviar Email
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-[9px] text-zinc-600 bg-zinc-900/30 px-3.5 py-3 rounded-xl border border-zinc-900/50 font-bold uppercase italic select-none">
                                Sin Email
                              </span>
                            )
                          )}

                          {/* Delete Controls */}
                          {cartDeletingId === cart.id ? (
                            <div className="flex items-center gap-1.5 animate-pulse bg-red-950/20 px-3.5 py-2 rounded-xl border border-red-900/35">
                              <span className="text-[9px] text-red-500 font-black uppercase tracking-wider mr-1">¿Eliminar?</span>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (cartsSubTab === 'current') {
                                    await handleDeleteCart(cart.id);
                                  } else {
                                    await handlePermanentlyDeleteCart(cart.id);
                                  }
                                  setCartDeletingId(null);
                                }}
                                className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-[9px] font-bold uppercase transition-all"
                              >
                                Sí
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCartDeletingId(null);
                                }}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCartDeletingId(cart.id)}
                              className="bg-red-950/10 hover:bg-red-950/20 text-red-500 hover:text-red-400 border border-red-950/20 hover:border-red-900/40 p-3.5 rounded-xl transition-all"
                              title={cartsSubTab === 'current' ? "Archivar Carrito" : "Eliminar Carrito Permanentemente"}
                            >
                              <Icons.Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {activeTab === 'coupons' && (
          <CouponsTab adminWpId={adminWpId} adminEmail={adminEmail} />
        )}

        {activeTab === 'seo' && (
          <SeoTab adminWpId={adminWpId} adminEmail={adminEmail} />
        )}

        {activeTab === 'sync' && (
          <SyncTab />
        )}

        {activeTab === 'margins' && (
          <MarginsTab adminWpId={adminWpId} adminEmail={adminEmail} />
        )}

        {activeTab === 'accounting' && (
          <AccountingTab adminWpId={adminWpId} adminEmail={adminEmail} />
        )}
      </main>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-wider text-white">Gestionar Pedido #{selectedOrder.id}</h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">ID Transacción Pasarela: {selectedOrder.paymentId || 'No asignado'}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModalDeleteConfirm(true)}
                  className="bg-red-950/20 hover:bg-red-950/40 text-red-500 hover:text-red-400 border border-red-950/30 p-2 rounded-xl transition-all flex items-center justify-center"
                  title="Eliminar Pedido Permanentemente"
                >
                  <Icons.Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => { setSelectedOrder(null); setShowModalDeleteConfirm(false); }} className="text-zinc-500 hover:text-white">
                  <Icons.X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {showModalDeleteConfirm && (
              <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <Icons.AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="text-left">
                    <h5 className="text-xs font-black text-red-400 uppercase tracking-wider">¿Eliminar pedido permanentemente?</h5>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Esta acción no se puede deshacer y borrará el pedido en PostgreSQL.</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      await handleDeleteOrder(selectedOrder.id);
                      setShowModalDeleteConfirm(false);
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Sí, Eliminar
                  </button>
                  <button
                    onClick={() => setShowModalDeleteConfirm(false)}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs leading-relaxed">
              <div className="bg-zinc-900/50 p-4 border border-zinc-900 rounded-xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Datos del Cliente</h4>
                <p className="font-bold text-zinc-300">{selectedOrder.shippingData?.firstName} {selectedOrder.shippingData?.lastName}</p>
                <p className="text-zinc-400">{selectedOrder.shippingData?.email}</p>
                <p className="text-zinc-400 mt-1">Teléfono: {selectedOrder.shippingData?.phone || 'No aportado'}</p>
              </div>

              <div className="bg-zinc-900/50 p-4 border border-zinc-900 rounded-xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Dirección de Entrega</h4>
                <p className="text-zinc-300 font-medium">{selectedOrder.shippingData?.address}</p>
                <p className="text-zinc-400">{selectedOrder.shippingData?.zip} - {selectedOrder.shippingData?.city}</p>
                <p className="text-zinc-500 text-[10px] uppercase font-bold mt-1">España (Península / Baleares)</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border border-zinc-900 rounded-xl overflow-hidden mb-8">
              <div className="bg-zinc-900/30 p-3 border-b border-zinc-900 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                Productos Comprados
              </div>
              <div className="divide-y divide-zinc-900/60 bg-zinc-950">
                {selectedOrder.items.map((item: any) => (
                  <div key={item.id} className="p-4 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold">
                        {item.quantity}x
                      </span>
                      <span className="text-zinc-300 font-medium">{item.product_name || 'Producto N/D'}</span>
                    </div>
                    <span className="font-black text-white italic">{(item.price / 100).toFixed(2)}€</span>
                  </div>
                ))}
              </div>
              <div className="bg-zinc-900/40 p-4 border-t border-zinc-900 flex justify-between items-center text-sm">
                <span className="font-bold text-zinc-400">Total Facturado</span>
                <span className="text-xl font-black italic text-racing-orange">{(selectedOrder.total / 100).toFixed(2)}€</span>
              </div>
            </div>

            {/* FACTURA PDF */}
            <div className="bg-zinc-900/50 p-5 border border-zinc-900 rounded-xl mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Factura PDF</h4>
                {selectedOrder.invoiceNumber && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-950/30 text-emerald-400 border border-emerald-900/30">
                    {selectedOrder.invoiceNumber}
                  </span>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                {!selectedOrder.invoiceNumber ? (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin?action=generate-invoice&userId=${adminWpId}&email=${adminEmail}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderId: selectedOrder.id }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Error generando factura');
                        setSelectedOrder({ ...selectedOrder, invoiceNumber: data.invoice.invoice_number });
                        alert(`✅ Factura generada: ${data.invoice.invoice_number}`);
                      } catch (err: any) {
                        alert(`❌ ${err.message}`);
                      }
                    }}
                    className="bg-racing-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-wider transition-all flex items-center gap-2"
                  >
                    <Icons.FilePlus className="w-3.5 h-3.5" />
                    <span>Generar Factura</span>
                  </button>
                ) : (
                  <button
                    onClick={() => window.open(`/api/admin?action=download-invoice&userId=${adminWpId}&email=${adminEmail}&orderId=${selectedOrder.id}`, '_blank')}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-wider transition-all flex items-center gap-2"
                  >
                    <Icons.Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </button>
                )}
              </div>
            </div>

            {/* DROPSHIPPING (BIHR) INTEGRATION */}
            <div className="bg-zinc-900/50 p-5 border border-zinc-900 rounded-xl mb-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Integración Dropshipping (Bihr)</h4>
                <div className="flex gap-2">
                  {selectedOrder.dropshippingStatus === 'not_sent' && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">No Enviado</span>
                  )}
                  {selectedOrder.dropshippingStatus === 'pending_bihr' && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-955/40 text-amber-400 border border-amber-800/40 animate-pulse">Pendiente Distribuidor</span>
                  )}
                  {selectedOrder.dropshippingStatus === 'shipped' && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-955/40 text-emerald-400 border border-emerald-800/40">Enviado</span>
                  )}
                  {selectedOrder.dropshippingStatus === 'cancelled' && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-955/40 text-red-400 border border-red-800/40">Cancelado</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Ticket ID de Bihr</p>
                  <p className="font-mono text-white text-sm font-bold">{selectedOrder.bihrTicketId || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Código de Seguimiento (Tracking)</p>
                  {selectedOrder.trackingNumber ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-racing-orange text-sm font-bold">{selectedOrder.trackingNumber}</span>
                      {selectedOrder.trackingUrl && (
                        <a
                          href={selectedOrder.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-bold hover:underline"
                        >
                          [Ver envío]
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-zinc-500 font-medium">No disponible</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-3 border-t border-zinc-900/60 pt-4">
                {selectedOrder.dropshippingStatus === 'not_sent' && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/admin?action=send-dropshipping-order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderId: selectedOrder.id })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Error desconocido');
                        
                        alert(`Pedido enviado con éxito a Bihr. Ticket ID: ${data.ticketId}`);
                        setSelectedOrder({
                          ...selectedOrder,
                          dropshippingStatus: 'pending_bihr',
                          bihrTicketId: data.ticketId
                        });
                        fetchData(true);
                      } catch (err: any) {
                        alert(`Error al enviar: ${err.message}`);
                      }
                    }}
                    className="bg-racing-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-wider transition-all flex items-center gap-2"
                  >
                    <Icons.Navigation className="w-3.5 h-3.5" />
                    <span>Enviar a Bihr (Dropshipping)</span>
                  </button>
                )}

                {selectedOrder.bihrTicketId && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin?action=query-dropshipping-status&orderId=${selectedOrder.id}`);
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Error de conexión');

                        alert(`Estado de Bihr: ${data.dropshippingStatus.toUpperCase()}${data.trackingNumber ? ` | Tracking: ${data.trackingNumber}` : ''}`);
                        
                        setSelectedOrder({
                          ...selectedOrder,
                          dropshippingStatus: data.dropshippingStatus,
                          trackingNumber: data.trackingNumber,
                          trackingUrl: data.trackingUrl
                        });
                        fetchData(true);
                      } catch (err: any) {
                        alert(`Error al sincronizar: ${err.message}`);
                      }
                    }}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-wider transition-all flex items-center gap-2"
                  >
                    <Icons.RefreshCw className="w-3.5 h-3.5" />
                    <span>Sincronizar Tracking</span>
                  </button>
                )}
              </div>
            </div>

            {/* Update Status Dropdown */}
            <div className="flex items-center gap-4 border-t border-zinc-900 pt-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Cambiar Estado</span>
              <div className="flex gap-2">
                {['pending', 'processing', 'completed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-wider transition-all border ${
                      selectedOrder.status === st
                        ? 'bg-racing-orange text-white border-racing-orange'
                        : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {st === 'pending' && 'Pendiente'}
                    {st === 'processing' && 'Procesando'}
                    {st === 'completed' && 'Completado'}
                    {st === 'cancelled' && 'Cancelado'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT FORM MODAL */}
      {showProductForm && (
        <ProductFormModal
          mode={showProductForm}
          product={editingProduct}
          onClose={() => setShowProductForm(null)}
          onSubmit={handleProductSubmit}
        />
      )}

      {/* Dynamic Toast Notifications (Bypasses standard browser popups) */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl transition-all duration-300 animate-bounce ${
          toast.type === 'success'
            ? 'bg-emerald-950/95 text-emerald-400 border-emerald-900/50'
            : 'bg-red-950/95 text-red-400 border-red-900/50'
        }`}>
          {toast.type === 'success' ? (
            <Icons.CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <Icons.AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

// Subcomponent: StatCard
const StatCard = ({ label, value, icon }: any) => (
  <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:border-zinc-800 transition-all">
    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-inner shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">{label}</span>
      <span className="text-2xl font-black italic tracking-tighter text-white block mt-0.5">{value}</span>
    </div>
  </div>
);

// Subcomponent: OrderStatusBadge
const OrderStatusBadge = ({ status }: any) => {
  const map: any = {
    pending: 'bg-yellow-950/20 text-yellow-500 border-yellow-900/30',
    processing: 'bg-blue-950/20 text-blue-400 border-blue-900/30',
    completed: 'bg-green-950/20 text-green-500 border-green-900/30',
    cancelled: 'bg-red-950/20 text-red-500 border-red-900/30',
  };
  const labels: any = {
    pending: 'Pendiente',
    processing: 'Procesando',
    completed: 'Completado',
    cancelled: 'Cancelado',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase italic border ${map[status] || 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
      {labels[status] || status}
    </span>
  );
};

// Subcomponent: DropshippingStatusBadge
const DropshippingStatusBadge = ({ status, trackingNumber, trackingUrl }: any) => {
  const map: any = {
    not_sent: 'bg-zinc-950 text-zinc-550 border-zinc-900',
    pending_bihr: 'bg-amber-955/20 text-amber-500 border-amber-900/30 animate-pulse',
    shipped: 'bg-emerald-955/20 text-emerald-500 border-emerald-900/30',
    cancelled: 'bg-red-955/20 text-red-500 border-red-900/30',
  };
  const labels: any = {
    not_sent: 'No Enviado',
    pending_bihr: 'Pendiente',
    shipped: 'Enviado',
    cancelled: 'Cancelado',
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase italic border ${map[status] || 'bg-zinc-900 text-zinc-550 border-zinc-800'}`}>
        {labels[status] || 'No Enviado'}
      </span>
      {status === 'shipped' && trackingNumber && (
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[9px] font-mono text-zinc-500">Track:</span>
          {trackingUrl ? (
            <a href={trackingUrl} target="_blank" rel="noreferrer" className="text-[9px] font-mono font-bold text-blue-400 hover:text-blue-300 underline">
              {trackingNumber}
            </a>
          ) : (
            <span className="text-[9px] font-mono font-bold text-zinc-400">{trackingNumber}</span>
          )}
        </div>
      )}
    </div>
  );
};

// Subcomponent: ProductFormModal (Create / Edit Product)
const ProductFormModal = ({ mode, product, onClose, onSubmit }: any) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [compatibility, setCompatibility] = useState<any[]>([]);

  // New fields
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [cost, setCost] = useState('');
  const [weightG, setWeightG] = useState('');
  const [lengthMm, setLengthMm] = useState('');
  const [widthMm, setWidthMm] = useState('');
  const [heightMm, setHeightMm] = useState('');
  const [dropshipping, setDropshipping] = useState(false);
  const [ondemand, setOndemand] = useState(false);
  const [deliveryPlant, setDeliveryPlant] = useState('');
  const [category2Id, setCategory2Id] = useState('');
  const [category3Id, setCategory3Id] = useState('');

  // Compat form temp state
  const [tempBrand, setTempBrand] = useState('');
  const [tempModel, setTempModel] = useState('');
  const [tempYear, setTempYear] = useState('');

  useEffect(() => {
    if (mode === 'edit' && product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setPrice(((product.price || 0) / 100).toString());
      setSalePrice(product.sale_price ? ((product.sale_price || 0) / 100).toString() : '');
      setStock((product.stock || 0).toString());
      setDescription(product.description || '');

      let imgs: any[] = [];
      try { imgs = product.images ? JSON.parse(product.images) : []; } catch { }
      setImage(imgs[0]?.src || imgs[0] || '');

      let compat: any[] = [];
      try { compat = product.compatibility ? JSON.parse(product.compatibility) : []; } catch { }
      setCompatibility(compat);

      // New fields
      setBrand(product.brand || '');
      setBarcode(product.barcode || '');
      setSupplierCode(product.supplier_code || '');
      setCost(product.cost ? (product.cost / 100).toString() : '');
      setWeightG(product.weight_g ? product.weight_g.toString() : '');
      setLengthMm(product.length_mm ? product.length_mm.toString() : '');
      setWidthMm(product.width_mm ? product.width_mm.toString() : '');
      setHeightMm(product.height_mm ? product.height_mm.toString() : '');
      setDropshipping(product.dropshipping === true);
      setOndemand(product.ondemand === true);
      setDeliveryPlant(product.delivery_plant || '');
      setCategory2Id(product.category2_id ? product.category2_id.toString() : '');
      setCategory3Id(product.category3_id ? product.category3_id.toString() : '');
    }
  }, [mode, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: product?.id,
      name,
      sku,
      price,
      salePrice: salePrice || null,
      stock,
      description,
      images: image ? [{ src: image }] : [],
      compatibility,
      status: 'published',
      brand,
      barcode,
      supplierCode,
      cost: cost || null,
      weight_g: weightG || null,
      length_mm: lengthMm || null,
      width_mm: widthMm || null,
      height_mm: heightMm || null,
      dropshipping,
      ondemand,
      deliveryPlant,
      category2Id: category2Id || null,
      category3Id: category3Id || null
    };
    onSubmit(payload);
  };

  const addCompatibility = () => {
    if (!tempBrand || !tempModel) return;
    setCompatibility([
      ...compatibility,
      { brand: tempBrand, model: tempModel, year: tempYear || undefined }
    ]);
    setTempBrand('');
    setTempModel('');
    setTempYear('');
  };

  const removeCompatibility = (idx: number) => {
    setCompatibility(compatibility.filter((_, i) => i !== idx));
  };

  const inputClass = "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-racing-orange transition-all";
  const labelClass = "block text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-2";
  const monoInputClass = inputClass + " font-mono";

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-black italic uppercase tracking-wider text-white">
            {mode === 'edit' ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre Recambio</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Escape Yoshimura R-11" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>SKU de Almacén</label>
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ej. ESC-YOSH-R11" required className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Precio Base (€)</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej. 599.99" required className={monoInputClass} />
            </div>
            <div>
              <label className={labelClass}>Precio Oferta (€)</label>
              <input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Opcional" className={monoInputClass} />
            </div>
            <div>
              <label className={labelClass}>Stock (Uds)</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Ej. 10" required className={monoInputClass} />
            </div>
          </div>

          {/* Fabricante y Códigos */}
          <div className="border border-zinc-900 rounded-xl p-4 bg-zinc-900/10">
            <h4 className={labelClass + " mb-4 flex items-center gap-1.5"}>
              <Icons.Tag size={12} /> Fabricante y Códigos
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Marca</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej. Yoshimura" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Código de Barras</label>
                <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Ej. 843123456789" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Código Proveedor</label>
                <input type="text" value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} placeholder="Ej. BIH-12345" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelClass}>Coste (€)</label>
                <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Ej. 350.00" className={monoInputClass} />
              </div>
              <div>
                <label className={labelClass}>Planta de Entrega</label>
                <input type="text" value={deliveryPlant} onChange={(e) => setDeliveryPlant(e.target.value)} placeholder="Ej. BCN-01" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Dimensiones y Peso */}
          <div className="border border-zinc-900 rounded-xl p-4 bg-zinc-900/10">
            <h4 className={labelClass + " mb-4 flex items-center gap-1.5"}>
              <Icons.Ruler size={12} /> Dimensiones y Peso
            </h4>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>Peso (g)</label>
                <input type="number" value={weightG} onChange={(e) => setWeightG(e.target.value)} placeholder="Ej. 1500" className={monoInputClass} />
              </div>
              <div>
                <label className={labelClass}>Largo (mm)</label>
                <input type="number" value={lengthMm} onChange={(e) => setLengthMm(e.target.value)} placeholder="Ej. 300" className={monoInputClass} />
              </div>
              <div>
                <label className={labelClass}>Ancho (mm)</label>
                <input type="number" value={widthMm} onChange={(e) => setWidthMm(e.target.value)} placeholder="Ej. 200" className={monoInputClass} />
              </div>
              <div>
                <label className={labelClass}>Alto (mm)</label>
                <input type="number" value={heightMm} onChange={(e) => setHeightMm(e.target.value)} placeholder="Ej. 100" className={monoInputClass} />
              </div>
            </div>
          </div>

          {/* Logística */}
          <div className="border border-zinc-900 rounded-xl p-4 bg-zinc-900/10">
            <h4 className={labelClass + " mb-4 flex items-center gap-1.5"}>
              <Icons.Truck size={12} /> Logística y Envío
            </h4>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={dropshipping} onChange={(e) => setDropshipping(e.target.checked)} className="accent-racing-orange" />
                <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Dropshipping</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ondemand} onChange={(e) => setOndemand(e.target.checked)} className="accent-racing-orange" />
                <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Bajo Demanda</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>URL Imagen del Producto</label>
            <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="Ej. https://tu-dominio.com/imagen.jpg" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Descripción del Producto</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles y ficha técnica..." rows={3} className={inputClass} />
          </div>

          {/* Compatibility Engine */}
          <div className="border border-zinc-900 rounded-xl p-4 bg-zinc-900/10">
            <h4 className={labelClass + " mb-4 flex items-center gap-1.5"}>
              <Icons.Wrench size={12} /> Compatibilidad de Motos
            </h4>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <input type="text" value={tempBrand} onChange={(e) => setTempBrand(e.target.value)} placeholder="Marca (Yamaha)" className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] text-white" />
              <input type="text" value={tempModel} onChange={(e) => setTempModel(e.target.value)} placeholder="Modelo (T-Max)" className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] text-white" />
              <div className="flex gap-2">
                <input type="text" value={tempYear} onChange={(e) => setTempYear(e.target.value)} placeholder="Año (2024)" className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] text-white w-full" />
                <button type="button" onClick={addCompatibility} className="bg-zinc-800 hover:bg-racing-orange hover:text-white text-zinc-400 px-3.5 rounded-lg font-bold">+</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {compatibility.length === 0 ? (
                <span className="text-zinc-600 italic text-[10px]">Sin compatibilidades registradas.</span>
              ) : compatibility.map((comp, idx) => (
                <span key={idx} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                  {comp.brand} {comp.model} {comp.year ? `(${comp.year})` : ''}
                  <button type="button" onClick={() => removeCompatibility(idx)} className="text-red-500 hover:text-white">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
            <button type="button" onClick={onClose} className="bg-zinc-900 border border-zinc-800 text-zinc-500 px-5 py-3 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all">
              Cancelar
            </button>
            <button type="submit" className="bg-racing-orange hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black uppercase italic tracking-wider text-[10px] transition-all shadow-lg shadow-orange-950/10">
              {mode === 'edit' ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CouponsTab = ({ adminWpId, adminEmail }: { adminWpId: number; adminEmail: string }) => {
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

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`/api/admin?action=coupons-list&userId=${adminWpId}&email=${adminEmail}`);
      if (res.ok) setCoupons(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async (couponId: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este cupón?')) return;
    try {
      const res = await fetch(`/api/admin?action=delete-coupon&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId })
      });
      if (res.ok) fetchCoupons();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value) return alert('Faltan datos');

    try {
      const valNum = type === 'fixed' ? Math.round(parseFloat(value) * 100) : parseInt(value);
      const res = await fetch(`/api/admin?action=create-coupon&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          type,
          value: valNum,
          active,
          expiresAt: expiresAt || null,
          maxUses: parseInt(maxUses)
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
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="text-zinc-500 italic py-12 text-center animate-pulse flex flex-col items-center justify-center gap-3">
        <Icons.Loader2 className="w-8 h-8 text-racing-orange animate-spin" />
        <span>Sincronizando motor de cupones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-zinc-100 uppercase italic tracking-tighter">Marketing y Cupones</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-racing-orange hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-950/15"
        >
          <Icons.Plus size={14} /> Crear Cupón
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <h4 className="text-lg font-black uppercase tracking-tighter italic text-zinc-200">Nuevo Cupón</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-zinc-500 hover:text-white">
                <Icons.X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Código de Cupón</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="E.g. WELCOME20"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold placeholder-zinc-700 text-white focus:outline-none focus:border-racing-orange uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-racing-orange"
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
                    placeholder={type === 'percent' ? '20' : '15.00'}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold placeholder-zinc-700 text-white focus:outline-none focus:border-racing-orange"
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-racing-orange"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Fecha Expiración</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-racing-orange"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-racing-orange hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg"
            >
              Crear Cupón
            </button>
          </form>
        </div>
      )}

      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                <th className="pb-3">Código</th>
                <th className="pb-3">Tipo Descuento</th>
                <th className="pb-3">Valor Real</th>
                <th className="pb-3">Canjes Totales</th>
                <th className="pb-3">Fecha Vencimiento</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {coupons.map((c: any) => (
                <tr key={c.id} className="hover:bg-white/[0.01]">
                  <td className="py-4 font-black italic text-zinc-200 uppercase tracking-wider">{c.code}</td>
                  <td className="py-4 font-bold text-zinc-400">
                    {c.type === 'percent' ? 'Porcentaje' : c.type === 'fixed' ? 'Importe Fijo' : 'Envío Gratis'}
                  </td>
                  <td className="py-4 font-black text-white italic">
                    {c.type === 'percent' ? `${c.value}%` : c.type === 'fixed' ? `${(c.value / 100).toFixed(2)}€` : 'Coste Cero'}
                  </td>
                  <td className="py-4 text-xs text-zinc-500 font-bold">
                    <span className="text-zinc-300 font-mono font-black">{c.times_used}</span> /{' '}
                    {c.max_uses === 999999 ? '∞' : c.max_uses}
                  </td>
                  <td className="py-4 text-xs text-zinc-500">
                    {c.expires_at ? new Date(c.expires_at).toLocaleString() : 'Sin expiración'}
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-block py-1 px-2.5 rounded text-[9px] font-black uppercase italic border ${
                        c.active
                          ? 'bg-green-950/20 text-green-400 border-green-900/30'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      {c.active ? 'Activo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button onClick={() => handleDelete(c.id)} className="text-zinc-600 hover:text-red-500 p-1.5 transition-all">
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

const SeoTab = ({ adminWpId, adminEmail }: { adminWpId: number; adminEmail: string }) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [keyword, setKeyword] = useState('');
  const [url, setUrl] = useState('');
  const [active, setActive] = useState(1);

  const fetchLinks = async () => {
    try {
      const res = await fetch(`/api/admin?action=seo-autolinks-list&userId=${adminWpId}&email=${adminEmail}`);
      if (res.ok) setLinks(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleDelete = async (linkId: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este enlace SEO automático?')) return;
    try {
      const res = await fetch(`/api/admin?action=seo-autolinks-delete&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId })
      });
      if (res.ok) fetchLinks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword || !url) return alert('Faltan datos obligatorios');

    try {
      const res = await fetch(`/api/admin?action=seo-autolinks-save&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, url, active })
      });
      if (res.ok) {
        setKeyword('');
        setUrl('');
        fetchLinks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="text-zinc-500 italic py-12 text-center animate-pulse flex flex-col items-center justify-center gap-3">
        <Icons.Loader2 className="w-8 h-8 text-racing-orange animate-spin" />
        <span>Sincronizando SEO Manager...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 lg:col-span-1 h-fit space-y-4">
        <h3 className="text-md font-black uppercase tracking-tighter italic text-zinc-200">Añadir Palabra Clave</h3>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Registra una palabra clave. Cuando un rider la emplee en el foro paddock, se inyectará un enlace dofollow a la URL catalogada de forma automática.
        </p>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Palabra Clave</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="E.g. SC-Project"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-racing-orange"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">URL del Catálogo</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/escapes/sc-project"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-racing-orange"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-racing-orange hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg"
          >
            Guardar Término
          </button>
        </form>
      </div>

      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 lg:col-span-2 space-y-4">
        <h3 className="text-md font-bold text-zinc-100">Diccionario Dinámico de Enlazado (SEO)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                <th className="pb-3">Palabra Clave</th>
                <th className="pb-3">URL Asociada</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {links.map((lk: any) => (
                <tr key={lk.id} className="hover:bg-white/[0.01]">
                  <td className="py-3.5 font-bold text-zinc-200">{lk.keyword}</td>
                  <td className="py-3.5 text-zinc-400 font-mono text-xs">{lk.url}</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-block py-1 px-2.5 rounded text-[9px] font-black uppercase italic border ${
                        lk.active
                          ? 'bg-green-950/20 text-green-400 border-green-900/30'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      {lk.active ? 'Activo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button onClick={() => handleDelete(lk.id)} className="text-zinc-600 hover:text-red-500 p-1.5 transition-all">
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
// ================================================================
// SUBCOMPONENT: PRECIOS Y MÁRGENES
// ================================================================
const MarginsTab = ({ adminWpId, adminEmail }: { adminWpId: number; adminEmail: string }) => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [newRule, setNewRule] = useState({
    ruleType: 'global',
    targetId: '',
    marginPercent: ''
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?action=pricing-rules-list&userId=${adminWpId}&email=${adminEmail}`);
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.ruleType || newRule.marginPercent === '') return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin?action=save-pricing-rule&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      if (res.ok) {
        setNewRule({ ruleType: 'global', targetId: '', marginPercent: '' });
        fetchRules();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta regla?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?action=delete-pricing-rule&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchRules();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculatePrices = async () => {
    if (!confirm('⚠️ ¿Estás seguro? Esto recalculará y actualizará de inmediato el precio de venta de TODOS los productos en base a las reglas activas.')) return;
    setRecalculating(true);
    try {
      const res = await fetch(`/api/admin?action=recalculate-all-prices&userId=${adminWpId}&email=${adminEmail}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(`¡Completado! Se han recalculado y modificado con éxito los precios de ${data.updatedCount} productos.`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  const getCategoryName = (idStr: string) => {
    const cats: Record<string, string> = {
      '1': 'Hard Parts',
      '6': 'Oils (Aceites)',
      '7': 'Tyres (Neumáticos)',
      '9': 'Rider Gear',
      '10': 'Accessories (Accesorios)'
    };
    return cats[idStr] || `Categoría #${idStr}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Recalculate Prices Alert Card */}
      <div className="bg-gradient-to-r from-racing-orange/10 via-orange-950/20 to-zinc-950 border border-racing-orange/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-racing-orange/10 border border-racing-orange/35 flex items-center justify-center text-racing-orange shrink-0">
            <Icons.TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider italic text-white">Recálculo Masivo de Tarifas</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Aplica de manera global las reglas de margen sobre el coste de distribuidor y actualiza el precio de venta final de tu catálogo en PostgreSQL al instante.
            </p>
          </div>
        </div>
        <button
          onClick={handleRecalculatePrices}
          disabled={recalculating || loading}
          className="w-full md:w-auto bg-racing-orange hover:bg-orange-600 disabled:bg-zinc-900 border border-racing-orange/20 hover:border-orange-500/30 text-white px-6 py-4 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-950/20 shrink-0"
        >
          {recalculating ? (
            <>
              <Icons.Loader2 className="w-4 h-4 animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <Icons.RefreshCw className="w-4 h-4" />
              <span>Ejecutar Recálculo</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create/Edit Rule Form */}
        <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl">
          <h3 className="text-sm font-black uppercase tracking-wider italic text-white mb-6 border-b border-zinc-900 pb-3 flex items-center gap-2">
            <Icons.PlusCircle className="w-4 h-4 text-racing-orange" />
            <span>Crear Regla de Margen</span>
          </h3>

          <form onSubmit={handleSaveRule} className="space-y-4 text-xs text-left">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Ámbito de la Regla</label>
              <select
                value={newRule.ruleType}
                onChange={(e) => setNewRule({ ...newRule, ruleType: e.target.value, targetId: '' })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-racing-orange font-medium"
              >
                <option value="global">Margen Global (Default)</option>
                <option value="category">Margen por Categoría</option>
                <option value="brand">Margen por Marca</option>
              </select>
            </div>

            {newRule.ruleType === 'category' && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Seleccionar Categoría</label>
                <select
                  value={newRule.targetId}
                  onChange={(e) => setNewRule({ ...newRule, targetId: e.target.value })}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-racing-orange font-medium"
                >
                  <option value="">-- Elige una categoría --</option>
                  <option value="1">Hard Parts (1)</option>
                  <option value="6">Oils (6)</option>
                  <option value="7">Tyres (7)</option>
                  <option value="9">Rider Gear (9)</option>
                  <option value="10">Accessories (10)</option>
                </select>
              </div>
            )}

            {newRule.ruleType === 'brand' && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Nombre de la Marca</label>
                <input
                  type="text"
                  placeholder="Ej: Akrapovic, Bihr, Alpinestars"
                  value={newRule.targetId}
                  onChange={(e) => setNewRule({ ...newRule, targetId: e.target.value })}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-racing-orange font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Margen Comercial (%)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Ej: 25"
                  value={newRule.marginPercent}
                  onChange={(e) => setNewRule({ ...newRule, marginPercent: e.target.value })}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-racing-orange font-medium"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-550 font-bold">%</span>
              </div>
              <p className="text-[9px] text-zinc-550 mt-1">Suma el porcentaje indicado sobre el coste neto.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-white py-3.5 rounded-xl font-black uppercase italic tracking-wider transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.CheckCircle className="w-4 h-4 text-racing-orange" />}
              <span>Guardar Regla</span>
            </button>
          </form>
        </div>

        {/* Rules List */}
        <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl lg:col-span-2 text-left">
          <h3 className="text-sm font-black uppercase tracking-wider italic text-white mb-6 border-b border-zinc-900 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Sliders className="w-4 h-4 text-racing-orange" />
              <span>Reglas de Precios Activas</span>
            </div>
            <button
              onClick={fetchRules}
              className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-all"
            >
              <Icons.RotateCw className="w-4 h-4" />
            </button>
          </h3>

          <div className="overflow-hidden border border-zinc-900 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-zinc-900/40 border-b border-zinc-900 text-zinc-550 text-[9px] font-black uppercase tracking-wider">
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Objetivo</th>
                  <th className="p-4 text-right">Margen</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 bg-zinc-950">
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500 font-medium">
                      No hay reglas de precios configuradas. Se aplicará un margen del +20% por defecto.
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="p-4 font-black italic uppercase tracking-wider text-zinc-300">
                        {rule.rule_type === 'global' && <span className="text-orange-400">Global</span>}
                        {rule.rule_type === 'category' && <span className="text-blue-400">Categoría</span>}
                        {rule.rule_type === 'brand' && <span className="text-purple-400">Marca</span>}
                      </td>
                      <td className="p-4 font-medium text-white">
                        {rule.rule_type === 'global' && 'Catálogo Completo'}
                        {rule.rule_type === 'category' && getCategoryName(rule.target_id)}
                        {rule.rule_type === 'brand' && rule.target_id}
                      </td>
                      <td className="p-4 text-right font-black italic text-racing-orange text-sm">
                        +{rule.margin_percent}%
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 hover:border-red-900/40 text-red-500 p-2 rounded-lg transition-all"
                        >
                          <Icons.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
