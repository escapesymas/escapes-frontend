import { useState, useEffect, useCallback } from 'react';
import * as Icons from 'lucide-react';

interface FinancialSummary {
  totalOrders: number;
  grossRevenue: number;
  totalShipping: number;
  totalDiscounts: number;
  avgOrderValue: number;
  cogs: number;
  grossProfit: number;
  vatCollected: number;
  taxBase: number;
}

interface DayRevenue {
  date: string;
  revenue: number;
  shipping: number;
  discounts: number;
  orderCount: number;
}

interface TopProduct {
  name: string;
  sku: string;
  revenue: number;
  unitsSold: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  revenue: number;
}

interface Invoice {
  id: number;
  orderId: number;
  invoiceNumber: string;
  total: number;
  taxAmount: number;
  issuedAt: string;
  customerName: string;
  customerEmail: string;
}

interface AnalyticsData {
  period: string;
  summary: FinancialSummary;
  prevPeriod: { grossRevenue: number; totalOrders: number };
  revenueByDay: DayRevenue[];
  topProducts: TopProduct[];
  statusBreakdown: StatusBreakdown[];
}

const EUR = (cents: number) => `${(cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;

const KpiCard = ({ icon: Icon, label, value, sub, trend, color = 'orange' }: any) => {
  const colors: any = {
    orange: 'bg-racing-orange/10 text-racing-orange border-racing-orange/20',
    green: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30',
    blue: 'bg-blue-950/30 text-blue-400 border-blue-900/30',
    red: 'bg-red-950/30 text-red-400 border-red-900/30',
    purple: 'bg-purple-950/30 text-purple-400 border-purple-900/30',
  };
  return (
    <div className={`bg-zinc-950 border rounded-2xl p-5 flex gap-4 items-start ${colors[color]}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
        <p className="text-2xl font-black italic tracking-tighter text-white">{value}</p>
        {sub && <p className="text-[10px] text-zinc-500 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <Icons.TrendingUp size={10} /> : <Icons.TrendingDown size={10} />}
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% vs período anterior
          </p>
        )}
      </div>
    </div>
  );
};

const MiniBarChart = ({ data }: { data: DayRevenue[] }) => {
  if (!data || data.length === 0) return (
    <div className="h-32 flex items-center justify-center text-zinc-600 text-xs italic">Sin datos para el período</div>
  );
  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-0.5 h-32 w-full">
      {data.map((d, i) => {
        const barH = Math.max(2, Math.round((d.revenue / maxRev) * 128));
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className="absolute bottom-full mb-2 hidden group-hover:flex bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] text-white whitespace-nowrap z-10 flex-col items-center shadow-xl">
              <span className="font-bold">{EUR(d.revenue)}</span>
              <span className="text-zinc-400">{new Date(d.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
              <span className="text-zinc-500">{d.orderCount} pedido{d.orderCount !== 1 ? 's' : ''}</span>
            </div>
            <div
              className="w-full rounded-t-sm transition-all bg-racing-orange/60 hover:bg-racing-orange"
              style={{ height: `${barH}px` }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default function AccountingTab({ adminWpId, adminEmail }: { adminWpId: number; adminEmail: string }) {
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'analytics' | 'invoices'>('analytics');
  const [csvExporting, setCsvExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BASE = `/api/admin?userId=${adminWpId}&email=${adminEmail}`;

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, invRes] = await Promise.all([
        fetch(`${BASE}&action=financial-analytics&period=${period}`),
        fetch(`${BASE}&action=invoices-list`),
      ]);
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
    } catch {
      setError('Error al cargar datos financieros.');
    } finally {
      setLoading(false);
    }
  }, [period, adminWpId, adminEmail]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const generateInvoice = async (orderId: number) => {
    setInvoiceLoading(orderId);
    try {
      const res = await fetch(`${BASE}&action=generate-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generando factura');
      alert(`✅ Factura generada: ${data.invoice.invoice_number}`);
      loadAnalytics();
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setInvoiceLoading(null);
    }
  };

  const downloadInvoice = (orderId: number) => {
    window.open(`${BASE}&action=download-invoice&orderId=${orderId}`, '_blank');
  };

  const exportCsv = async () => {
    setCsvExporting(true);
    window.open(`${BASE}&action=export-accounting-csv&period=${period}`, '_blank');
    setTimeout(() => setCsvExporting(false), 2000);
  };

  const pct = (cur: number, prev: number) => prev > 0 ? ((cur - prev) / prev) * 100 : 0;

  const statusLabel: any = {
    pending: 'Pendiente', processing: 'Procesando',
    completed: 'Completado', cancelled: 'Cancelado', refunded: 'Reembolsado',
  };
  const statusColor: any = {
    pending: 'text-yellow-400', processing: 'text-blue-400',
    completed: 'text-emerald-400', cancelled: 'text-red-400', refunded: 'text-purple-400',
  };

  const periods = [
    { id: '7d', label: '7 días' }, { id: '30d', label: '30 días' },
    { id: '90d', label: '90 días' }, { id: '365d', label: '12 meses' },
  ];

  const s = analytics?.summary;
  const prev = analytics?.prevPeriod;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex bg-zinc-950 border border-zinc-900 rounded-xl p-1 gap-1">
            <button onClick={() => setActiveView('analytics')} className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeView === 'analytics' ? 'bg-racing-orange/15 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <Icons.BarChart2 size={12} className="inline mr-1.5" />Analíticas
            </button>
            <button onClick={() => setActiveView('invoices')} className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeView === 'invoices' ? 'bg-racing-orange/15 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <Icons.FileText size={12} className="inline mr-1.5" />Facturas ({invoices.length})
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Period Selector */}
          <div className="flex bg-zinc-950 border border-zinc-900 rounded-xl p-1 gap-1">
            {periods.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)} className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${period === p.id ? 'bg-racing-orange/15 text-racing-orange' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {/* Export CSV */}
          <button
            onClick={exportCsv}
            disabled={csvExporting}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {csvExporting ? <Icons.Loader2 size={14} className="animate-spin" /> : <Icons.Download size={14} />}
            Exportar CSV
          </button>
          <button onClick={loadAnalytics} disabled={loading} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2 rounded-xl transition-all disabled:opacity-50">
            <Icons.RefreshCw size={14} className={`text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-center gap-3">
          <Icons.AlertTriangle size={16} />{error}
        </div>
      )}

      {loading && !analytics ? (
        <div className="flex items-center justify-center h-64 text-zinc-500">
          <Icons.Loader2 size={24} className="animate-spin mr-3" /> Cargando datos financieros...
        </div>
      ) : activeView === 'analytics' && s ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard icon={Icons.ShoppingBag} label="Pedidos" color="blue"
              value={s.totalOrders}
              trend={pct(s.totalOrders, prev?.totalOrders || 0)}
            />
            <KpiCard icon={Icons.TrendingUp} label="Facturación Bruta" color="orange"
              value={EUR(s.grossRevenue)}
              trend={pct(s.grossRevenue, prev?.grossRevenue || 0)}
            />
            <KpiCard icon={Icons.BadgePercent} label="IVA Repercutido" color="purple"
              value={EUR(s.vatCollected)}
              sub={`Base: ${EUR(s.taxBase)}`}
            />
            <KpiCard icon={Icons.Landmark} label="Beneficio Bruto" color="green"
              value={EUR(s.grossProfit)}
              sub={`COGS: ${EUR(s.cogs)}`}
            />
            <KpiCard icon={Icons.Receipt} label="Ticket Medio" color="blue"
              value={EUR(s.avgOrderValue)}
              sub={`Envío medio: ${EUR(Math.round(s.totalShipping / (s.totalOrders || 1)))}`}
            />
          </div>

          {/* Revenue Chart + Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Facturación Diaria</h3>
                  <p className="text-lg font-black italic text-white mt-0.5">{EUR(s.grossRevenue)}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-bold uppercase">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-racing-orange/60 inline-block" />Ingresos</span>
                </div>
              </div>
              <MiniBarChart data={analytics?.revenueByDay || []} />
              {analytics?.revenueByDay && analytics.revenueByDay.length > 0 && (
                <div className="flex justify-between text-[9px] text-zinc-600 mt-2">
                  <span>{new Date(analytics.revenueByDay[0].date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                  <span>{new Date(analytics.revenueByDay[analytics.revenueByDay.length - 1].date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                </div>
              )}
            </div>

            {/* Status Breakdown */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Estado de Pedidos</h3>
              <div className="space-y-3">
                {analytics?.statusBreakdown.map(sb => (
                  <div key={sb.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${statusColor[sb.status] || 'text-zinc-400'} bg-zinc-900 border-zinc-800`}>
                        {statusLabel[sb.status] || sb.status}
                      </span>
                      <span className="text-xs text-zinc-400 font-bold">{sb.count}</span>
                    </div>
                    <span className="text-xs font-black italic text-zinc-300">{EUR(sb.revenue)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-zinc-900 pt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Total descuentos aplicados</span>
                  <span className="font-bold text-red-400">-{EUR(s.totalDiscounts)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Total gastos de envío</span>
                  <span className="font-bold text-zinc-300">{EUR(s.totalShipping)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          {analytics?.topProducts && analytics.topProducts.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Top 10 Productos por Facturación</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                      <th className="pb-3">#</th>
                      <th className="pb-3">Producto</th>
                      <th className="pb-3">SKU</th>
                      <th className="pb-3 text-right">Unidades</th>
                      <th className="pb-3 text-right">Facturación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/50">
                    {analytics.topProducts.map((p, i) => {
                      const maxRev = analytics.topProducts[0].revenue;
                      const barPct = Math.round((p.revenue / maxRev) * 100);
                      return (
                        <tr key={i} className="hover:bg-white/[0.01]">
                          <td className="py-3 text-zinc-600 font-black text-xs">#{i + 1}</td>
                          <td className="py-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-zinc-300">{p.name}</span>
                              <div className="h-1 rounded-full bg-zinc-900 w-full max-w-[200px]">
                                <div className="h-1 rounded-full bg-racing-orange/60" style={{ width: `${barPct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-mono text-[10px] text-zinc-500">{p.sku || '—'}</td>
                          <td className="py-3 text-right text-xs text-zinc-400 font-bold">{p.unitsSold}</td>
                          <td className="py-3 text-right font-black italic text-zinc-300 text-sm">{EUR(p.revenue)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeView === 'invoices' ? (
        /* INVOICES VIEW */
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Facturas Emitidas</h3>
            <span className="text-xs text-zinc-500">{invoices.length} facturas</span>
          </div>
          {invoices.length === 0 ? (
            <div className="py-16 text-center">
              <Icons.FileText size={40} className="text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm italic">No hay facturas emitidas aún.</p>
              <p className="text-zinc-600 text-xs mt-1">Las facturas se generan desde la ficha de cada pedido.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                    <th className="pb-3">Nº Factura</th>
                    <th className="pb-3">Pedido</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3 text-right">IVA</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-white/[0.01]">
                      <td className="py-3 font-mono text-xs font-bold text-racing-orange">{inv.invoiceNumber}</td>
                      <td className="py-3 text-xs font-bold text-white">#{inv.orderId}</td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-300">{inv.customerName || '—'}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{inv.customerEmail}</span>
                        </div>
                      </td>
                      <td className="py-3 text-xs text-zinc-500">{new Date(inv.issuedAt).toLocaleDateString('es-ES')}</td>
                      <td className="py-3 text-right text-xs text-zinc-500 font-bold">{EUR(inv.taxAmount)}</td>
                      <td className="py-3 text-right font-black italic text-zinc-300 text-sm">{EUR(inv.total)}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => downloadInvoice(inv.orderId)}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <Icons.Download size={11} /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* Generate Invoice from Orders hint */}
      {activeView === 'invoices' && (
        <div className="bg-zinc-950/60 border border-zinc-900/50 rounded-xl p-4 flex items-start gap-3 text-xs text-zinc-500">
          <Icons.Info size={14} className="text-racing-orange shrink-0 mt-0.5" />
          <span>Para generar una factura, ve a <strong className="text-zinc-300">Historial de Pedidos</strong>, abre un pedido y usa el botón <strong className="text-zinc-300">"Generar Factura"</strong> en la sección de facturación de la ficha.</span>
        </div>
      )}
    </div>
  );
}
