import React from 'react';
import * as Icons from 'lucide-react';
import { OrderStatusBadge, DropshippingStatusBadge } from '../Badges';

interface OrdersTabProps {
  orders: any[];
  orderSearch: string;
  orderFilter: string;
  orderDeletingId: number | null;
  setOrderSearch: (v: string) => void;
  setOrderFilter: (v: string) => void;
  setOrderDeletingId: (id: number | null) => void;
  setSelectedOrder: (order: any) => void;
  handleDeleteOrder: (id: number) => Promise<void>;
}

/**
 * OrdersTab — Historial de Pedidos en PostgreSQL
 *
 * Tabla de pedidos con filtros de estado, búsqueda y controles inline de eliminación.
 * Muestra la integración con Bihr Dropshipping.
 */
const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  orderSearch,
  orderFilter,
  orderDeletingId,
  setOrderSearch,
  setOrderFilter,
  setOrderDeletingId,
  setSelectedOrder,
  handleDeleteOrder,
}) => {
  const filteredOrders = orders.filter(order => {
    if (orderFilter !== 'all') {
      if (order.status !== orderFilter) return false;
    }
    if (orderSearch) {
      const query = orderSearch.toLowerCase();
      const orderIdStr = `#${order.id}`;
      const clientName = `${order.shippingData?.firstName || ''} ${order.shippingData?.lastName || ''}`.toLowerCase();
      const clientEmail = (order.shippingData?.email || '').toLowerCase();
      const paymentId = (order.paymentId || '').toLowerCase();
      return (
        orderIdStr.includes(query) ||
        order.id.toString().includes(query) ||
        clientName.includes(query) ||
        clientEmail.includes(query) ||
        paymentId.includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filter controls and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Icons.Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="Buscar pedidos por ID, cliente o email..."
            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-racing-orange transition-all shadow-inner"
          />
        </div>
        
        {/* Status Chips */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: 'Pendiente' },
            { id: 'processing', label: 'Procesando' },
            { id: 'completed', label: 'Completado' },
            { id: 'cancelled', label: 'Cancelado' }
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setOrderFilter(chip.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
                orderFilter === chip.id
                  ? 'bg-racing-orange/15 text-racing-orange border-racing-orange/30'
                  : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:text-zinc-300'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                <th className="pb-4">Pedido ID</th>
                <th className="pb-4">Fecha</th>
                <th className="pb-4">Cliente</th>
                <th className="pb-4">Método Envío</th>
                <th className="pb-4">Total</th>
                <th className="pb-4">Estado</th>
                <th className="pb-4">Dropshipping (Bihr)</th>
                <th className="pb-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500 italic">
                    No se encontraron pedidos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.01]">
                  <td className="py-4 font-bold text-white">#{order.id}</td>
                  <td className="py-4 text-xs text-zinc-500">{new Date(order.createdAt).toLocaleDateString('es-ES')}</td>
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-300">
                        {order.shippingData?.firstName} {order.shippingData?.lastName}
                      </span>
                      <span className="text-[10px] text-zinc-550 font-mono">{order.shippingData?.email}</span>
                    </div>
                  </td>
                  <td className="py-4 text-xs text-zinc-500 font-medium">
                    {order.shippingData?.address ? 'A domicilio' : 'General'}
                  </td>
                  <td className="py-4 font-black italic text-zinc-300 text-sm">{(order.total / 100).toFixed(2)}€</td>
                  <td className="py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="py-4">
                    <DropshippingStatusBadge 
                      status={order.dropshippingStatus} 
                      trackingNumber={order.trackingNumber} 
                      trackingUrl={order.trackingUrl} 
                    />
                  </td>
                  <td className="py-4 text-right">
                    {orderDeletingId === order.id ? (
                      <div className="flex items-center justify-end gap-1.5 animate-pulse bg-red-950/20 px-2.5 py-1 rounded-lg border border-red-900/35">
                        <span className="text-[9px] text-red-500 font-black uppercase tracking-wider mr-1">¿Eliminar?</span>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDeleteOrder(order.id);
                            setOrderDeletingId(null);
                          }}
                          className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-[9px] font-bold uppercase transition-all"
                        >
                          Sí
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderDeletingId(null);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all"
                        >
                          Gestionar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderDeletingId(order.id);
                          }}
                          className="bg-red-950/20 hover:bg-red-950/40 text-red-500 hover:text-red-400 border border-red-950/30 p-2 rounded-lg transition-all flex items-center justify-center"
                          title="Eliminar Pedido Permanentemente"
                        >
                          <Icons.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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

export default OrdersTab;
