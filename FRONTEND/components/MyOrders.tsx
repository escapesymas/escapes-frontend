import React, { useEffect, useState } from 'react';
import { Package, Calendar, DollarSign, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Order, User } from '../types';
import { fetchCustomerOrders } from '../services/apiService';

interface MyOrdersProps {
  user: User;
  onBack: () => void;
}

export const MyOrders: React.FC<MyOrdersProps> = ({ user, onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[MyOrders] User ID:', user.id);
        const data = await fetchCustomerOrders(user.id);
        setOrders(data);
      } catch (err: any) {
        console.error('[MyOrders] Error:', err);
        setError(err.message || 'Error al cargar tus pedidos');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [user.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-900/20 border-green-800';
      case 'processing': return 'text-blue-500 bg-blue-900/20 border-blue-800';
      case 'on-hold': return 'text-yellow-500 bg-yellow-900/20 border-yellow-800';
      case 'cancelled': return 'text-red-500 bg-red-900/20 border-red-800';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      'completed': 'Completado',
      'processing': 'Procesando',
      'on-hold': 'En espera',
      'pending': 'Pendiente',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado'
    };
    return map[status] || status;
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in min-h-screen">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase italic flex items-center gap-3">
          Mis Pedidos <Package className="w-6 h-6 text-racing-orange" />
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 text-racing-orange animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 border border-red-800 rounded-sm bg-red-900/10">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Error al cargar pedidos</h3>
          <p className="text-zinc-400 mb-4">{error}</p>
          <p className="text-zinc-500 text-sm mb-6">Por favor, verifica la consola del navegador (F12) para más detalles.</p>
          <button onClick={() => window.location.reload()} className="text-racing-orange hover:text-white font-bold uppercase text-sm">
            Reintentar
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 border border-zinc-800 border-dashed rounded-sm bg-zinc-900/50">
          <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No tienes pedidos aún</h3>
          <p className="text-zinc-500">¿A qué esperas para mejorar tu moto?</p>
          <button onClick={onBack} className="mt-6 text-racing-orange hover:text-white font-bold uppercase text-sm">
            Ir al catálogo
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-racing-carbon border border-zinc-800 rounded-sm overflow-hidden hover:border-zinc-700 transition-all">
              {/* Order Header */}
              <div className="p-4 md:p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-white font-bold text-lg">#{order.id}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-sm border ${getStatusColor(order.status)}`}>
                      {translateStatus(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.date_created).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-sm">Total:</span>
                  <span className="text-xl font-bold text-racing-orange">{parseFloat(order.total).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4 bg-zinc-900/50">
                <div className="space-y-3">
                  {order.line_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-zinc-800/50 last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-zinc-400">
                          {item.quantity}x
                        </div>
                        <span className="text-zinc-300">{item.name}</span>
                      </div>
                      <span className="text-white font-medium">
                        {parseFloat(item.total).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};