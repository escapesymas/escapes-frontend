'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Trophy, ShoppingBag, Bike, Edit3, Save, X, Trash2, ShieldCheck, Download, Camera, Loader2, MapPin, Key, Plus, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiChangePassword, apiGetMyOrders, OrderSummary, OrderDetail } from '../lib/api';
import ProfileSkeleton from './ProfileSkeleton';
import ProfileUnauthenticated from './ProfileUnauthenticated';

// Lista de emojis predeterminados para avatares rápidos
const PRESET_EMOJIS = ['🏍️', '🏁', '🛠️', '🏆', '⚡', '😎', '🔥', '🚥'];

interface Address {
  id: string;
  alias: string;
  type: 'envio' | 'fiscal';
  address_1: string;
  city: string;
  postcode: string;
  phone: string;
  nif?: string; // Solo para fiscal
}

export default function ProfileView() {
  const { user, isAuthenticated, isLoading, logout, updateProfile, deleteAccount } = useAuth();
  
  // Estados de edición de datos personales
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Estados de cambio de contraseña
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Estados de libreta de direcciones
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddrAlias, setEditAddrAlias] = useState('');
  const [editAddrType, setEditAddrType] = useState<'envio' | 'fiscal'>('envio');
  const [editAddrAddress1, setEditAddrAddress1] = useState('');
  const [editAddrCity, setEditAddrCity] = useState('');
  const [editAddrPostcode, setEditAddrPostcode] = useState('');
  const [editAddrPhone, setEditAddrPhone] = useState('');
  const [editAddrNif, setEditAddrNif] = useState('');
  const [addrAlias, setAddrAlias] = useState('');
  const [addrType, setAddrType] = useState<'envio' | 'fiscal'>('envio');
  const [addrAddress1, setAddrAddress1] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPostcode, setAddrPostcode] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrNif, setAddrNif] = useState('');

  // Estados de avatar panel
  const [isAvatarPanelOpen, setIsAvatarPanelOpen] = useState(false);
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [addressError, setAddressError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Orders state
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) return;
      setOrdersLoading(true);
      try {
        const ordersData = await apiGetMyOrders(user.email);
        setOrders(ordersData);
      } catch (e) {
        // handle error silently
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Iniciar modo edición
  const handleStartEdit = () => {
    if (user) {
      setEditFirstName(user.firstName || '');
      setEditLastName(user.lastName || '');
      setEditEmail(user.email || '');
      setEditPhone(user.billing?.phone || '');
      setIsEditing(true);
      setError('');
      setSuccess('');
    }
  };

  // Guardar datos editados
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFirstName.trim() || !editLastName.trim() || !editEmail.trim() || !editPhone.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const updatedBilling = {
        ...(user?.billing || {}),
        phone: editPhone.trim()
      };
      await updateProfile({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        billing: updatedBilling
      });
      setSuccess('¡Perfil actualizado con éxito!');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cambiar contraseña
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Completa todos los campos obligatorios.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Las nuevas contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (user) {
        await apiChangePassword(user.id, currentPassword, newPassword);
        setPasswordSuccess('Contraseña cambiada con éxito.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setIsChangingPassword(false);
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Agregar Dirección
  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');
    if (!addrAlias.trim() || !addrAddress1.trim() || !addrCity.trim() || !addrPostcode.trim() || !addrPhone.trim()) {
      setAddressError('Completa todos los campos obligatorios.');
      return;
    }
    if (addrType === 'fiscal' && !addrNif.trim()) {
      setAddressError('El NIF/CIF es obligatorio para direcciones fiscales.');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentAddresses = Array.isArray(user?.billing?.addresses) ? (user.billing.addresses as Address[]) : [];
      const newAddr: Address = {
        id: `addr-${Date.now()}`,
        alias: addrAlias.trim(),
        type: addrType,
        address_1: addrAddress1.trim(),
        city: addrCity.trim(),
        postcode: addrPostcode.trim(),
        phone: addrPhone.trim(),
        nif: addrType === 'fiscal' ? addrNif.trim() : undefined
      };

      const updatedBilling = {
        ...(user?.billing || {}),
        addresses: [...currentAddresses, newAddr]
      };

      await updateProfile({ billing: updatedBilling });
      setSuccess('Dirección agregada.');
      setIsAddingAddress(false);
      // Reset form
      setAddrAlias('');
      setAddrAddress1('');
      setAddrCity('');
      setAddrPostcode('');
      setAddrPhone('');
      setAddrNif('');
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Error al agregar la dirección.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar Dirección
  const handleRemoveAddress = async (addrId: string) => {
    if (!user) return;
    const confirmRemove = window.confirm('¿Seguro que quieres eliminar esta dirección?');
    if (!confirmRemove) return;

    setIsSubmitting(true);
    try {
      const currentAddresses = Array.isArray(user.billing?.addresses) ? (user.billing.addresses as Address[]) : [];
      const updatedBilling = {
        ...user.billing,
        addresses: currentAddresses.filter(a => a.id !== addrId)
      };
      await updateProfile({ billing: updatedBilling });
      setSuccess('Dirección eliminada.');
    } catch (err) {
      setError('Error al eliminar la dirección.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editar Dirección
  const handleStartEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setEditAddrAlias(addr.alias);
    setEditAddrType(addr.type);
    setEditAddrAddress1(addr.address_1);
    setEditAddrCity(addr.city);
    setEditAddrPostcode(addr.postcode);
    setEditAddrPhone(addr.phone);
    setEditAddrNif(addr.nif || '');
  };

  const handleSaveAddress = async (addrId: string) => {
    if (!user) return;
    if (!editAddrAlias.trim() || !editAddrAddress1.trim() || !editAddrCity.trim() || !editAddrPostcode.trim() || !editAddrPhone.trim()) return;

    setIsSubmitting(true);
    try {
      const currentAddresses = Array.isArray(user.billing?.addresses) ? (user.billing.addresses as Address[]) : [];
      const updatedBilling = {
        ...user.billing,
        addresses: currentAddresses.map(a => a.id === addrId ? {
          ...a,
          alias: editAddrAlias.trim(),
          type: editAddrType,
          address_1: editAddrAddress1.trim(),
          city: editAddrCity.trim(),
          postcode: editAddrPostcode.trim(),
          phone: editAddrPhone.trim(),
          nif: editAddrType === 'fiscal' ? editAddrNif.trim() : undefined,
        } : a)
      };
      await updateProfile({ billing: updatedBilling });
      setSuccess('Dirección actualizada.');
      setEditingAddressId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la dirección.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seleccionar preset de emoji
  const handleSelectPresetEmoji = async (emoji: string) => {
    setIsSubmitting(true);
    setError('');
    try {
      await updateProfile({ avatarUrl: `emoji:${emoji}` });
      setSuccess('Avatar actualizado.');
      setIsAvatarPanelOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el avatar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Subir imagen personalizada
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsSubmitting(true);
    setError('');
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', String(user.id));

    try {
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');
      
      await updateProfile({ avatarUrl: data.url });
      setSuccess('Avatar personalizado subido con éxito.');
      setIsAvatarPanelOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el avatar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Descargar datos personales (GDPR/LOPD Derecho de Acceso/Portabilidad)
  const handleDownloadGDPRData = () => {
    if (!user) return;
    const cleanData = {
      nombre_usuario: user.username,
      email: user.email,
      nombre: user.firstName,
      apellidos: user.lastName,
      telefono: user.billing?.phone || '',
      rol: user.role,
      rango_paddock: user.rank,
      experiencia_xp: user.xp,
      motos_garaje: user.garage || [],
      direcciones_guardadas: user.billing?.addresses || [],
      detalles_facturacion: user.billing || {},
      ley_aplicable: "Reglamento General de Protección de Datos (RGPD) - España LOPDGDD"
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mis_datos_escapesymas_${user.username}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Eliminar/Anonimizar cuenta (GDPR/LOPD Derecho al Olvido)
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "¿Deseas eliminar permanentemente tu cuenta? Esta acción anonimizará tus datos personales de acuerdo con la LOPDGDD (España) y el RGPD de la UE. Si tienes facturas pendientes o históricas, se conservarán desvinculadas de tu identidad por motivos fiscales."
    );
    if (!confirmDelete) return;

    setIsSubmitting(true);
    setError('');
    try {
      await deleteAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la cuenta.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return <ProfileUnauthenticated />;
  }

  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user.username;

  const initials = (user.firstName ? user.firstName[0] : user.username[0]).toUpperCase();

  const renderAvatarContent = () => {
    if (user.avatarUrl) {
      if (user.avatarUrl.startsWith('emoji:')) {
        return (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-accent/10">
            {user.avatarUrl.substring(6)}
          </div>
        );
      }
      return <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />;
    }
    return initials;
  };

  const savedAddresses = Array.isArray(user?.billing?.addresses) ? (user.billing.addresses as Address[]) : [];

  return (
    <div className="max-w-md mx-auto flex flex-col gap-4 animate-fade-in pb-20">
      
      {/* Feedback global */}
      {error && (
        <div className="flex items-start gap-2 text-red-400 bg-red-950/30 border border-red-800/40 rounded px-3 py-2">
          <Trash2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-mono">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded px-3 py-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-mono">{success}</p>
        </div>
      )}

      {/* Tarjeta de perfil principal */}
      <div className="p-6 bg-card border border-card-border rounded-md shadow-sm flex flex-col items-center text-center">
        <div className="relative group mb-4">
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-slate-950 font-mono font-bold text-2xl overflow-hidden border-2 border-accent shadow-md">
            {renderAvatarContent()}
          </div>
          <button
            onClick={() => setIsAvatarPanelOpen(v => !v)}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-accent hover:bg-accent-hover text-slate-950 flex items-center justify-center border border-card border-card-border cursor-pointer transition-all shadow group-hover:scale-105"
            title="Cambiar avatar"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {isAvatarPanelOpen && (
          <div className="w-full border border-card-border bg-background/50 rounded-md p-4 mb-4 animate-fade-in flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold uppercase text-text-muted">Elige tu Avatar</span>
              <button onClick={() => setIsAvatarPanelOpen(false)} className="text-text-muted hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_EMOJIS.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectPresetEmoji(emoji)}
                  className="w-10 h-10 border border-card-border hover:border-accent hover:bg-accent/5 rounded-md text-xl flex items-center justify-center cursor-pointer transition-all active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="border-t border-card-border pt-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                disabled={isSubmitting}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-card border border-card-border text-[10px] font-mono font-bold rounded-sm uppercase tracking-wider text-foreground hover:bg-select-bg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                Subir Imagen Propia
              </button>
              <p className="text-[8px] text-text-muted/60 mt-1 font-mono text-center">Los avatares subidos no son indexables por motores de búsqueda.</p>
            </div>
          </div>
        )}

        <h2 className="font-mono text-base font-bold uppercase text-foreground">{displayName}</h2>
        <p className="text-[10px] text-text-muted font-mono mt-0.5">@{user.username}</p>
        <p className="text-[10px] font-mono text-accent-text font-bold uppercase tracking-wider mt-1">
          {user.rank || 'Novato'}
        </p>

        <div className="mt-4 flex gap-4">
          <div className="px-4 py-2 bg-background border border-card-border rounded text-center">
            <Trophy className="w-3 h-3 text-accent mx-auto mb-1" />
            <span className="text-sm font-mono font-bold text-foreground block">{user.xp || 0}</span>
            <span className="text-[8px] font-mono text-text-muted uppercase">XP</span>
          </div>
          <button onClick={() => setShowOrders(!showOrders)} className="px-4 py-2 bg-background border border-card-border rounded text-center hover:border-accent/50 transition-colors cursor-pointer w-full">
            <ShoppingBag className="w-3 h-3 text-text-muted mx-auto mb-1" />
            <span className="text-sm font-mono font-bold text-foreground block">
              {ordersLoading ? '...' : orders.length}
            </span>
            <span className="text-[8px] font-mono text-text-muted uppercase">Pedidos</span>
          </button>
          <div className="px-4 py-2 bg-background border border-card-border rounded text-center">
            <Bike className="w-3 h-3 text-text-muted mx-auto mb-1" />
            <span className="text-sm font-mono font-bold text-foreground block">{user.garage?.length || 0}</span>
            <span className="text-[8px] font-mono text-text-muted uppercase">Motos</span>
          </div>
        </div>
        </div>

        {/* Order History */}
        {showOrders && (
          <div className="mt-3 animate-fade-in">
            <div className="bg-card border border-card-border rounded-md shadow-sm p-4">
              <h3 className="font-mono text-[10px] font-bold uppercase text-text-muted tracking-wider mb-3">Historial de Pedidos</h3>
              {orders.length === 0 ? (
                <p className="text-[10px] text-text-muted font-mono text-center py-4">No hay pedidos aún.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center justify-between p-2.5 bg-background border border-card-border rounded text-[11px] font-mono w-full text-left hover:border-accent/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-3.5 h-3.5 text-accent shrink-0" />
                        <div>
                          <span className="text-foreground font-bold">#{order.id}</span>
                          <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            order.status === 'completed' || order.status === 'processing'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : order.status === 'cancelled'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {order.status}
                          </span>
                          <span className="ml-2 text-[9px] text-text-muted">
                            {new Date(order.createdAt).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                      <span className="text-foreground font-bold">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(order.total)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs" onClick={() => setSelectedOrder(null)}>
            <div className="bg-card border border-card-border rounded shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono font-bold text-foreground uppercase text-sm">Pedido #{selectedOrder.id}</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-text-muted hover:text-foreground cursor-pointer text-lg">&times;</button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-muted">Estado</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                    selectedOrder.status === 'completed' || selectedOrder.status === 'processing'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : selectedOrder.status === 'cancelled'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>{selectedOrder.status}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-muted">Fecha</span>
                  <span className="text-foreground">{new Date(selectedOrder.createdAt).toLocaleString('es-ES')}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-muted">Total</span>
                  <span className="text-foreground font-bold">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-muted">Pago</span>
                  <span className="text-foreground">{selectedOrder.paymentId ? `ID: ${selectedOrder.paymentId.slice(0, 12)}...` : 'Pendiente'}</span>
                </div>
              </div>

              {selectedOrder.items.length > 0 && (
                <>
                  <h4 className="font-mono text-[10px] font-bold uppercase text-text-muted tracking-wider mb-2">Artículos</h4>
                  <div className="space-y-2 mb-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 bg-background border border-card-border rounded">
                        {item.image && (
                          <img src={item.image} alt={item.productName} className="w-10 h-10 object-contain rounded bg-slate-950" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-foreground truncate">{item.productName}</p>
                          <p className="text-[10px] text-text-muted font-mono">x{item.quantity}</p>
                        </div>
                        <span className="text-xs font-mono text-foreground font-bold">
                          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {selectedOrder.shippingData && Object.keys(selectedOrder.shippingData).length > 0 && (
                <>
                  <h4 className="font-mono text-[10px] font-bold uppercase text-text-muted tracking-wider mb-2">Envío</h4>
                  <div className="p-2 bg-background border border-card-border rounded text-[10px] font-mono text-foreground space-y-1">
                    {(selectedOrder.shippingData as Record<string, string>).address1 && (
                      <p>{selectedOrder.shippingData.address1 as string}</p>
                    )}
                    {(selectedOrder.shippingData as Record<string, string>).city && (
                      <p>{(selectedOrder.shippingData as Record<string, string>).city}, {(selectedOrder.shippingData as Record<string, string>).postcode}</p>
                    )}
                  </div>
                </>
              )}

              <button
                onClick={() => setSelectedOrder(null)}
                className="mt-4 w-full bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider py-2.5 rounded hover:bg-accent-hover transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

      {/* Datos Personales */}
      <div className="p-4 bg-card border border-card-border rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-mono text-[10px] font-bold uppercase text-text-muted tracking-wider">Datos Personales</h3>
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="text-[10px] font-mono font-bold uppercase text-accent hover:text-accent-hover transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              Editar
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="text-[10px] font-mono font-bold uppercase text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text-muted">Nombre</span>
              <span className="text-foreground">{user.firstName || '—'}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text-muted">Apellidos</span>
              <span className="text-foreground">{user.lastName || '—'}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text-muted">Teléfono</span>
              <span className="text-foreground">{user.billing?.phone || '—'}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text-muted">Email</span>
              <span className="text-foreground">{user.email}</span>
            </div>
            {user.role === 'admin' && (
              <div className="flex justify-between items-center text-xs font-mono border-t border-card-border/50 pt-2 mt-1">
                <span className="text-text-muted">Rol de Sistema</span>
                <span className="text-foreground uppercase text-[10px] font-bold bg-accent/10 px-1.5 py-0.5 rounded text-accent border border-accent/20">{user.role}</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase text-text-muted">Nombre *</label>
                <input
                  type="text"
                  required
                  value={editFirstName}
                  onChange={e => setEditFirstName(e.target.value)}
                  className="w-full bg-background border border-card-border rounded px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono uppercase text-text-muted">Apellidos *</label>
                <input
                  type="text"
                  required
                  value={editLastName}
                  onChange={e => setEditLastName(e.target.value)}
                  className="w-full bg-background border border-card-border rounded px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono uppercase text-text-muted">Teléfono *</label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                className="w-full bg-background border border-card-border rounded px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono uppercase text-text-muted">Email *</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className="w-full bg-background border border-card-border rounded px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-2 bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded hover:bg-accent-hover transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Guardar Cambios
            </button>
          </form>
        )}
      </div>

      {/* Libreta de Direcciones */}
      <div className="p-4 bg-card border border-card-border rounded-md shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-card-border/50 pb-2">
          <h3 className="font-mono text-[10px] font-bold uppercase text-text-muted tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            Mis Direcciones
          </h3>
          <button
            onClick={() => setIsAddingAddress(v => !v)}
            className="text-[10px] font-mono font-bold uppercase text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
          >
            {isAddingAddress ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {isAddingAddress ? 'Cancelar' : 'Añadir'}
          </button>
        </div>

        {addressError && (
          <p className="text-[10px] font-mono text-red-400">{addressError}</p>
        )}

        {isAddingAddress ? (
          <form onSubmit={handleAddAddressSubmit} className="flex flex-col gap-3 border border-card-border/70 p-3 rounded bg-background/20">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-mono uppercase text-text-muted">Alias (ej. Casa, Taller) *</label>
                <input
                  type="text"
                  required
                  placeholder="Mi casa"
                  value={addrAlias}
                  onChange={e => setAddrAlias(e.target.value)}
                  className="w-full bg-background border border-card-border rounded px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-mono uppercase text-text-muted">Tipo *</label>
                <select
                  value={addrType}
                  onChange={e => setAddrType(e.target.value as 'envio' | 'fiscal')}
                  className="w-full bg-background border border-card-border rounded px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="envio">Envío</option>
                  <option value="fiscal">Facturación/Fiscal</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-mono uppercase text-text-muted">Dirección *</label>
              <input
                type="text"
                required
                placeholder="Calle, número, piso..."
                value={addrAddress1}
                onChange={e => setAddrAddress1(e.target.value)}
                className="w-full bg-background border border-card-border rounded px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-mono uppercase text-text-muted">Ciudad *</label>
                <input
                  type="text"
                  required
                  placeholder="Madrid"
                  value={addrCity}
                  onChange={e => setAddrCity(e.target.value)}
                  className="w-full bg-background border border-card-border rounded px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-mono uppercase text-text-muted">Código Postal *</label>
                <input
                  type="text"
                  required
                  placeholder="28001"
                  value={addrPostcode}
                  onChange={e => setAddrPostcode(e.target.value)}
                  className="w-full bg-background border border-card-border rounded px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-mono uppercase text-text-muted">Teléfono de Contacto *</label>
                <input
                  type="tel"
                  required
                  placeholder="600000000"
                  value={addrPhone}
                  onChange={e => setAddrPhone(e.target.value)}
                  className="w-full bg-background border border-card-border rounded px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              {addrType === 'fiscal' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-mono uppercase text-text-muted">NIF/CIF *</label>
                  <input
                    type="text"
                    required
                    placeholder="12345678A"
                    value={addrNif}
                    onChange={e => setAddrNif(e.target.value)}
                    className="w-full bg-background border border-card-border rounded px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 bg-accent text-slate-950 font-mono font-bold text-[10px] uppercase tracking-wider rounded hover:bg-accent-hover transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Agregar Dirección
            </button>
          </form>
        ) : null}

        {/* Listado de direcciones */}
        {savedAddresses.length > 0 ? (
          <div className="flex flex-col gap-3 mt-1">
            {savedAddresses.map((addr) => (
              editingAddressId === addr.id ? (
                <div key={addr.id} className="p-3 border border-accent/40 rounded bg-background">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[8px] font-mono uppercase text-text-muted">Alias *</label>
                      <input value={editAddrAlias} onChange={e => setEditAddrAlias(e.target.value)} className="w-full bg-background border border-card-border rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-accent" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-mono uppercase text-text-muted">Tipo</label>
                      <select value={editAddrType} onChange={e => setEditAddrType(e.target.value as 'envio' | 'fiscal')} className="w-full bg-background border border-card-border rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-accent">
                        <option value="envio">Envío</option>
                        <option value="fiscal">Facturación</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[8px] font-mono uppercase text-text-muted">Dirección *</label>
                      <input value={editAddrAddress1} onChange={e => setEditAddrAddress1(e.target.value)} className="w-full bg-background border border-card-border rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-accent" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-mono uppercase text-text-muted">Ciudad *</label>
                      <input value={editAddrCity} onChange={e => setEditAddrCity(e.target.value)} className="w-full bg-background border border-card-border rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-accent" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-mono uppercase text-text-muted">C.P. *</label>
                      <input value={editAddrPostcode} onChange={e => setEditAddrPostcode(e.target.value)} className="w-full bg-background border border-card-border rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-accent" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-mono uppercase text-text-muted">Teléfono *</label>
                      <input value={editAddrPhone} onChange={e => setEditAddrPhone(e.target.value)} className="w-full bg-background border border-card-border rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-accent" />
                    </div>
                    {editAddrType === 'fiscal' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-mono uppercase text-text-muted">NIF/CIF</label>
                        <input value={editAddrNif} onChange={e => setEditAddrNif(e.target.value)} className="w-full bg-background border border-card-border rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-accent" />
                      </div>
                    )}
                    <div className="col-span-2 flex gap-2 mt-1">
                      <button onClick={() => handleSaveAddress(addr.id)} disabled={isSubmitting} className="flex-1 py-1.5 bg-accent text-slate-950 font-mono font-bold text-[10px] uppercase tracking-wider rounded hover:bg-accent-hover transition-all flex items-center justify-center gap-1 cursor-pointer">
                        {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Guardar
                      </button>
                      <button onClick={() => setEditingAddressId(null)} className="py-1.5 px-3 border border-card-border text-text-muted font-mono font-bold text-[10px] uppercase rounded hover:bg-card-border/25 transition-colors cursor-pointer">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={addr.id} className="p-3 border border-card-border/80 rounded bg-background/10 flex justify-between items-start gap-4 hover:border-card-border transition-colors">
                  <div className="flex flex-col gap-1 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground uppercase">{addr.alias}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                        addr.type === 'fiscal'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-accent/10 text-accent-text border-accent/20'
                      }`}>
                        {addr.type === 'fiscal' ? 'Fiscal' : 'Envío'}
                      </span>
                    </div>
                    <span className="text-text-muted leading-tight mt-1">{addr.address_1}</span>
                    <span className="text-text-muted leading-tight">{addr.postcode} - {addr.city}</span>
                    <span className="text-text-muted leading-tight">Tel: {addr.phone}</span>
                    {addr.nif && <span className="text-accent-text text-[9px] font-bold">NIF/CIF: {addr.nif}</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleStartEditAddress(addr)} className="p-1 text-text-muted hover:text-accent transition-colors cursor-pointer" title="Editar dirección">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleRemoveAddress(addr.id)} className="p-1 text-text-muted hover:text-red-400 transition-colors cursor-pointer" title="Eliminar dirección">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : !isAddingAddress ? (
          <p className="text-[10px] text-text-muted font-mono text-center py-2">No tienes direcciones guardadas en tu libreta.</p>
        ) : null}
      </div>

      {/* Cambio de Contraseña */}
      <div className="p-4 bg-card border border-card-border rounded-md shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-center pb-1">
          <h3 className="font-mono text-[10px] font-bold uppercase text-text-muted tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-accent" />
            Cambiar Contraseña
          </h3>
          <button
            onClick={() => setIsChangingPassword(v => !v)}
            className="text-[10px] font-mono font-bold uppercase text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
          >
            {isChangingPassword ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {isChangingPassword ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {passwordError && (
          <p className="text-[10px] font-mono text-red-400">{passwordError}</p>
        )}
        {passwordSuccess && (
          <p className="text-[10px] font-mono text-emerald-400">{passwordSuccess}</p>
        )}

        {isChangingPassword && (
          <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-3 border border-card-border/70 p-3 rounded bg-background/20">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-mono uppercase text-text-muted">Contraseña Actual *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full bg-background border border-card-border rounded px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-mono uppercase text-text-muted">Nueva Contraseña *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-background border border-card-border rounded px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-mono uppercase text-text-muted">Confirmar Nueva Contraseña *</label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                className="w-full bg-background border border-card-border rounded px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 bg-accent text-slate-950 font-mono font-bold text-[10px] uppercase tracking-wider rounded hover:bg-accent-hover transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Cambiar Contraseña
            </button>
          </form>
        )}
      </div>

      {/* Sección LOPD / GDPR */}
      <div className="p-4 bg-card border border-card-border rounded-md shadow-sm">
        <h3 className="font-mono text-[10px] font-bold uppercase text-text-muted tracking-wider mb-3">
          Privacidad y Derechos (LOPD / GDPR)
        </h3>
        <p className="text-[9px] text-text-muted font-mono leading-relaxed mb-4">
          De acuerdo con el RGPD y la LOPDGDD, tienes derecho a la portabilidad de tus datos y a solicitar la eliminación (derecho al olvido) de tu información personal.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownloadGDPRData}
            className="py-2.5 bg-background border border-card-border text-[10px] font-mono font-bold rounded-sm uppercase tracking-wider text-foreground hover:bg-select-bg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            Descargar Datos
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={isSubmitting}
            className="py-2.5 bg-background border border-red-950 text-[10px] font-mono font-bold rounded-sm uppercase tracking-wider text-red-500 hover:bg-red-500/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            Eliminar Cuenta
          </button>
        </div>
      </div>

      {/* Cerrar sesión */}
      <button
        id="btn-logout"
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-card-border text-text-muted hover:text-foreground hover:border-foreground font-mono font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Cerrar sesión
      </button>
    </div>
  );
}
