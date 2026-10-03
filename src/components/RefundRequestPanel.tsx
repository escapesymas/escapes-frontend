'use client';

import React, { useState } from 'react';
import { RotateCcw, Loader2, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { apiRequestRefund, OrderDetail, RefundRequestView } from '../lib/api';

/** Motivos de reembolso (los mismos códigos que valida el backend). */
const REASONS: Array<{ code: string; label: string }> = [
  { code: 'desistimiento', label: 'Ya no lo quiero (desistimiento)' },
  { code: 'no_compatible', label: 'No es compatible con mi moto' },
  { code: 'defectuoso', label: 'Ha llegado defectuoso o dañado' },
  { code: 'equivocado', label: 'He recibido un producto equivocado' },
  { code: 'no_recibido', label: 'No me ha llegado' },
  { code: 'otro', label: 'Otro motivo' },
];
const REASON_MIN = 10;

const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

function RequestStatus({ r }: { r: RefundRequestView }) {
  const badge = r.status === 'pending'
    ? { icon: <Clock className="w-3.5 h-3.5" />, text: 'En revisión', cls: 'bg-amber-500/10 text-amber-600' }
    : r.status === 'refunded'
      ? { icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: `Reembolsado ${eur(r.refunded)}`, cls: 'bg-emerald-500/10 text-emerald-600' }
      : { icon: <XCircle className="w-3.5 h-3.5" />, text: 'Rechazada', cls: 'bg-red-500/10 text-red-500' };
  return (
    <div className="p-3 bg-background/60 border border-card-border rounded-xl space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-text-muted">
          {new Date(r.createdAt).toLocaleDateString('es-ES')} · {r.scope === 'full' ? 'Pedido completo' : 'Algunos productos'}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${badge.cls}`}>
          {badge.icon} {badge.text}
        </span>
      </div>
      {r.scope === 'partial' && (
        <p className="text-[11px] font-mono text-foreground">{r.items.map((i) => `${i.quantity} × ${i.name}`).join(' · ')}</p>
      )}
      <p className="text-[11px] font-mono text-text-muted"><span className="text-foreground font-bold">{r.reasonLabel}:</span> {r.reason}</p>
      {r.status === 'pending' && (
        <p className="text-[10px] font-mono text-text-muted">Importe estimado {eur(r.amount)}. Te responderemos por correo en un máximo de 3 días laborables.</p>
      )}
      {r.adminNote && (
        <p className="text-[11px] font-mono text-foreground border-l-2 border-accent pl-2">{r.adminNote}</p>
      )}
    </div>
  );
}

/**
 * Reembolsos dentro del detalle de un pedido en "Mi cuenta": estado de las
 * solicitudes y formulario para pedir el reembolso del pedido completo o de
 * algunos productos, con el motivo obligatorio.
 */
export default function RefundRequestPanel({ order, onUpdated }: { order: OrderDetail; onUpdated: (o: OrderDetail) => void }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<'full' | 'partial'>('full');
  const [qty, setQty] = useState<Record<number, number>>({});
  const [reasonCode, setReasonCode] = useState('');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requests = order.refundRequests || [];
  if (!order.canRequestRefund && requests.length === 0) return null;

  const selected = order.items.filter((i) => (qty[i.id] || 0) > 0);
  const selectedSum = scope === 'full'
    ? Math.max(0, order.total - (order.refunded || 0))
    : selected.reduce((acc, i) => acc + i.price * (qty[i.id] || 0), 0);
  const reasonOk = reason.trim().length >= REASON_MIN;
  const canSend = !!reasonCode && reasonOk && (scope === 'full' || selected.length > 0) && !sending;

  const toggleItem = (id: number, max: number) => {
    setQty((q) => ({ ...q, [id]: q[id] ? 0 : max }));
  };

  const submit = async () => {
    setError(null);
    if (!canSend) return;
    setSending(true);
    const { request, error: err } = await apiRequestRefund(order.id, {
      scope,
      items: scope === 'partial' ? selected.map((i) => ({ itemId: i.id, quantity: qty[i.id] })) : undefined,
      reasonCode,
      reason: reason.trim(),
    });
    setSending(false);
    if (err || !request) { setError(err || 'No hemos podido enviar la solicitud.'); return; }
    onUpdated({ ...order, canRequestRefund: false, refundRequests: [request, ...requests] });
    setOpen(false);
    setReason(''); setReasonCode(''); setQty({});
  };

  return (
    <div className="mb-5 space-y-2">
      <h4 className="font-mono text-[10px] font-bold uppercase text-text-muted tracking-wider">Reembolsos</h4>
      {requests.map((r) => <RequestStatus key={r.id} r={r} />)}

      {order.canRequestRefund && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 border border-card-border hover:border-accent/60 text-foreground font-mono font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Solicitar reembolso
        </button>
      )}

      {order.canRequestRefund && open && (
        <div className="p-3.5 bg-background/60 border border-card-border rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(['full', 'partial'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`py-2 rounded-lg text-[11px] font-mono font-bold uppercase border cursor-pointer transition-colors ${scope === s ? 'border-accent bg-accent/10 text-foreground' : 'border-card-border text-text-muted'}`}
              >
                {s === 'full' ? 'Pedido completo' : 'Algunos productos'}
              </button>
            ))}
          </div>

          {scope === 'partial' && (
            <div className="space-y-1.5">
              {order.items.map((i) => {
                const on = (qty[i.id] || 0) > 0;
                return (
                  <div key={i.id} className={`flex items-center gap-2 p-2 rounded-lg border ${on ? 'border-accent/60' : 'border-card-border'}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleItem(i.id, i.quantity)}
                      aria-label={`Incluir ${i.productName}`}
                      className="w-4 h-4 accent-yellow-500 cursor-pointer shrink-0"
                    />
                    <span className="flex-1 min-w-0 text-[11px] font-mono text-foreground truncate">{i.productName}</span>
                    {i.quantity > 1 && on ? (
                      <select
                        value={qty[i.id]}
                        onChange={(e) => setQty((q) => ({ ...q, [i.id]: parseInt(e.target.value) }))}
                        aria-label="Unidades"
                        className="bg-card border border-card-border rounded px-1 py-0.5 text-[11px] font-mono"
                      >
                        {Array.from({ length: i.quantity }, (_, k) => k + 1).map((n) => <option key={n} value={n}>{n} ud.</option>)}
                      </select>
                    ) : (
                      <span className="text-[10px] font-mono text-text-muted shrink-0">{i.quantity} ud.</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-text-muted mb-1">Motivo</label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-xs font-mono text-foreground"
            >
              <option value="">Elige un motivo…</option>
              {REASONS.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-text-muted mb-1">Explícanos qué ha pasado</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Cuéntanos el motivo con detalle (por ejemplo, qué falla o qué moto tienes)."
              className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-xs font-mono text-foreground resize-y"
            />
            {!reasonOk && reason.length > 0 && (
              <p className="text-[10px] font-mono text-amber-600 mt-1">Escribe al menos {REASON_MIN} caracteres.</p>
            )}
          </div>

          <p className="text-[11px] font-mono text-text-muted">
            {scope === 'full' ? 'Importe del pedido' : 'Importe de los productos seleccionados'}: <span className="text-foreground font-bold">{eur(selectedSum)}</span>.
            {' '}El importe final lo confirmamos al revisar la solicitud{scope === 'partial' ? ' (se descuentan los descuentos aplicados al pedido)' : ''}.
          </p>

          {error && (
            <p className="text-[11px] font-mono font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="flex-1 border border-card-border text-text-muted font-mono font-bold text-[11px] uppercase py-2.5 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              className="flex-[2] bg-accent text-slate-950 font-mono font-bold text-[11px] uppercase py-2.5 rounded-xl hover:bg-accent-hover disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {sending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando…</> : 'Enviar solicitud'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
