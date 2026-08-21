'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Trophy, ShoppingBag, Bike, Edit3, Save, X, Trash2, ShieldCheck, Download, Camera, Loader2, MapPin, Key, Plus, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiChangePassword, apiGetMyOrders, OrderSummary, OrderDetail } from '../lib/api';
import { getApiUrl, formatOrderNumber } from '../lib/constants';
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
  const [editUsername, setEditUsername] = useState('');
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

  // Estados de avatar panel y modal de ampliación
  const [isAvatarPanelOpen, setIsAvatarPanelOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
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
      setEditUsername(user.username || '');
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
    const cleanUser = editUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/gi, '');
    if (!cleanUser || cleanUser.length < 3) {
      setError('El nombre de usuario (@username) debe tener al menos 3 caracteres.');
      return;
    }
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
        username: cleanUser,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        billing: updatedBilling
      });
      setSuccess('¡Perfil y nombre de usuario actualizados!');
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
      const res = await fetch(getApiUrl('/upload/avatar'), {
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
      return <img src={user.avatarUrl} alt={user.username} loading="lazy" decoding="async" className="w-full h-full object-cover" />;
    }
    return initials;
  };

  const savedAddresses = Array.isArray(user?.billing?.addresses) ? (user.billing.addresses as Address[]) : [];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20 px-4 font-sans">
      
      {/* Feedback global */}
      {error && (
        <div className="mb-6 flex items-start gap-2.5 text-red-400 bg-red-950/40 border border-red-800/50 rounded-xl p-4 shadow-sm">
          <Trash2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-mono">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-start gap-2.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-4 shadow-sm">
          <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-mono">{success}</p>
        </div>
      )}

      {/* Header Banner Superior (Estilo Vercel / Apple Settings) */}
      <div className="mb-8 p-6 md:p-8 bg-card border border-card-border rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full md:w-auto">
          <div className="relative group shrink-0">
            <div
              onClick={() => setIsImageModalOpen(true)}
              className="w-24 h-24 rounded-2xl bg-accent flex items-center justify-center text-slate-950 font-mono font-bold text-3xl overflow-hidden border-2 border-accent shadow-lg cursor-pointer hover:opacity-90 transition-all group-hover:scale-[1.02]"
              title="Haz clic para ampliar la foto de perfil"
            >
              {renderAvatarContent()}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAvatarPanelOpen(v => !v);
              }}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 flex items-center justify-center border-2 border-card cursor-pointer transition-all shadow-md group-hover:scale-105"
              title="Cambiar avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="font-mono text-xl md:text-2xl font-black uppercase tracking-tight text-foreground">{displayName}</h1>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent/15 text-accent-text border border-accent/30">
                {user.rank || 'Novato'}
              </span>
            </div>
            <p className="text-xs text-text-muted font-mono">@{user.username} • {user.email}</p>
          </div>
        </div>

        {/* Contadores Estadísticas & Logout */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end border-t md:border-t-0 border-card-border/60 pt-4 md:pt-0">
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-background/60 border border-card-border rounded-xl text-center min-w-[70px]">
              <Trophy className="w-3.5 h-3.5 text-accent mx-auto mb-0.5" />
              <span className="text-sm font-mono font-black text-foreground block">{user.xp || 0}</span>
              <span className="text-[8px] font-mono text-text-muted uppercase font-bold">XP</span>
            </div>
            <button onClick={() => setShowOrders(!showOrders)} className="px-4 py-2 bg-background/60 border border-card-border hover:border-accent/50 rounded-xl text-center transition-all cursor-pointer min-w-[70px]">
              <ShoppingBag className="w-3.5 h-3.5 text-text-muted mx-auto mb-0.5" />
              <span className="text-sm font-mono font-black text-foreground block">
                {ordersLoading ? '...' : orders.length}
              </span>
              <span className="text-[8px] font-mono text-text-muted uppercase font-bold">Pedidos</span>
            </button>
            <div className="px-4 py-2 bg-background/60 border border-card-border rounded-xl text-center min-w-[70px]">
              <Bike className="w-3.5 h-3.5 text-text-muted mx-auto mb-0.5" />
              <span className="text-sm font-mono font-black text-foreground block">{user.garage?.length || 0}</span>
              <span className="text-[8px] font-mono text-text-muted uppercase font-bold">Motos</span>
            </div>
          </div>

          <button
            id="btn-logout"
            onClick={logout}
            className="px-4 py-3 border border-card-border hover:border-red-500/50 hover:bg-red-500/10 text-text-muted hover:text-red-400 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Selector de Avatar Desplegable */}
      {isAvatarPanelOpen && (
        <div className="mb-8 w-full border border-card-border bg-card/80 backdrop-blur-xs rounded-2xl p-6 animate-fade-in flex flex-col gap-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-card-border/60 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">Personaliza tu Avatar</span>
            <button onClick={() => setIsAvatarPanelOpen(false)} className="text-text-muted hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {PRESET_EMOJIS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleSelectPresetEmoji(emoji)}
                className="w-12 h-12 border border-card-border hover:border-accent hover:bg-accent/10 rounded-xl text-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="border-t border-card-border/60 pt-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
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
              className="w-full sm:w-auto px-5 py-2.5 bg-accent text-slate-950 font-mono font-bold text-xs rounded-xl uppercase tracking-wider hover:bg-accent-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              Subir Imagen Propia
            </button>
            <p className="text-[10px] text-text-muted font-mono">Formata recomendada: PNG o JPG cuadrado. Máx 5MB.</p>
          </div>
        </div>
      )}

      {/* REJILLA DE TARJETAS MODULAR POR BLOQUES (3 Columnas Desktop / 2 Tablet / 1 Móvil) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">

        {/* BLOQUE 1: DATOS PERSONALES */}
        <div className="p-6 bg-card border border-card-border hover:border-card-border/80 rounded-2xl shadow-md transition-all flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-card-border/60">
            <h3 className="font-mono text-xs font-bold uppercase text-foreground tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-accent" />
              Datos Personales
            </h3>
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="text-[10px] font-mono font-bold uppercase text-accent hover:text-accent-hover transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
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
            <div className="space-y-3">
              <div className="p-3 bg-background/50 border border-card-border/50 rounded-xl">
                <span className="text-[9px] font-mono uppercase text-text-muted block mb-0.5">Nombre de Usuario (@username - Único)</span>
                <span className="text-xs font-mono font-bold text-accent">@{user.username}</span>
              </div>
              <div className="p-3 bg-background/50 border border-card-border/50 rounded-xl">
                <span className="text-[9px] font-mono uppercase text-text-muted block mb-0.5">Nombre Completo</span>
                <span className="text-xs font-mono font-bold text-foreground">{displayName}</span>
              </div>
              <div className="p-3 bg-background/50 border border-card-border/50 rounded-xl">
                <span className="text-[9px] font-mono uppercase text-text-muted block mb-0.5">Teléfono</span>
                <span className="text-xs font-mono text-foreground">{user.billing?.phone || 'Sin registrar'}</span>
              </div>
              <div className="p-3 bg-background/50 border border-card-border/50 rounded-xl">
                <span className="text-[9px] font-mono uppercase text-text-muted block mb-0.5">Correo Electrónico</span>
                <span className="text-xs font-mono text-foreground truncate block">{user.email}</span>
              </div>
              {user.role === 'admin' && (
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold uppercase text-accent-text">Permisos de Sistema</span>
                  <span className="text-[10px] font-mono font-bold uppercase text-accent bg-accent/20 px-2 py-0.5 rounded">{user.role}</span>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-xl">
                <label className="text-[9px] font-mono uppercase font-bold text-accent block mb-1">
                  Nombre de Usuario (@username - ÚNICO) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono text-xs text-accent font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/gi, ''))}
                    placeholder="piloto_rapido"
                    className="w-full bg-background border border-card-border rounded-lg pl-7 pr-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <p className="text-[9px] text-text-muted font-mono mt-1">Identificador único. No se puede repetir con otro usuario.</p>
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase text-text-muted block mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={editFirstName}
                  onChange={e => setEditFirstName(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase text-text-muted block mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  value={editLastName}
                  onChange={e => setEditLastName(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase text-text-muted block mb-1">Teléfono *</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase text-text-muted block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-accent-hover transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Cambios
              </button>
            </form>
          )}
        </div>

        {/* BLOQUE 2: HISTORIAL DE PEDIDOS */}
        <div className="p-6 bg-card border border-card-border hover:border-card-border/80 rounded-2xl shadow-md transition-all flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-card-border/60">
            <h3 className="font-mono text-xs font-bold uppercase text-foreground tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-accent" />
              Historial de Pedidos ({orders.length})
            </h3>
            <button
              onClick={() => setShowOrders(!showOrders)}
              className="text-[10px] font-mono font-bold uppercase text-accent hover:text-accent-hover transition-colors cursor-pointer"
            >
              {showOrders ? 'Ocultar' : 'Ver Todos'}
            </button>
          </div>

          {showOrders ? (
            <div className="animate-fade-in space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <p className="text-[10px] text-text-muted font-mono text-center py-6 border border-dashed border-card-border/60 rounded-xl">No tienes pedidos registrados.</p>
              ) : (
                orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center justify-between p-3 bg-background/50 border border-card-border rounded-xl text-xs font-mono w-full text-left hover:border-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-3.5 h-3.5 text-accent shrink-0" />
                      <div>
                        <span className="text-foreground font-bold">#{formatOrderNumber(order.id, order.createdAt)}</span>
                        <span className={`ml-2 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          order.status === 'completed' || order.status === 'processing'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : order.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-foreground font-bold">
                      {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(order.total)}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {orders.length > 0 ? (
                <div className="p-3.5 bg-background/50 border border-card-border/50 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-text-muted">Último Pedido</span>
                    <span className="text-foreground font-bold">#{formatOrderNumber(orders[0].id, orders[0].createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-text-muted">Fecha</span>
                    <span className="text-foreground">{new Date(orders[0].createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-text-muted">Total</span>
                    <span className="text-accent-text font-bold">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(orders[0].total)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-text-muted font-mono py-2">No has realizado compras aún en Escapes y Más.</p>
              )}
              <button
                onClick={() => setShowOrders(true)}
                className="w-full py-2 bg-background border border-card-border text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl text-foreground hover:bg-select-bg transition-colors"
              >
                Ver Todo el Historial
              </button>
            </div>
          )}
        </div>

        {/* BLOQUE 3: LIBRETA DE DIRECCIONES */}
        <div className="p-6 bg-card border border-card-border hover:border-card-border/80 rounded-2xl shadow-md transition-all flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-card-border/60">
            <h3 className="font-mono text-xs font-bold uppercase text-foreground tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              Mis Direcciones ({savedAddresses.length})
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
            <form onSubmit={handleAddAddressSubmit} className="space-y-3">
              <div>
                <label className="text-[8px] font-mono uppercase text-text-muted block mb-1">Alias (ej. Casa, Taller) *</label>
                <input
                  type="text"
                  required
                  placeholder="Mi casa"
                  value={addrAlias}
                  onChange={e => setAddrAlias(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono uppercase text-text-muted block mb-1">Tipo *</label>
                <select
                  value={addrType}
                  onChange={e => setAddrType(e.target.value as 'envio' | 'fiscal')}
                  className="w-full bg-background border border-card-border rounded-xl px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="envio">Envío</option>
                  <option value="fiscal">Facturación/Fiscal</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] font-mono uppercase text-text-muted block mb-1">Dirección *</label>
                <input
                  type="text"
                  required
                  placeholder="Calle, número, piso..."
                  value={addrAddress1}
                  onChange={e => setAddrAddress1(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-mono uppercase text-text-muted block mb-1">Ciudad *</label>
                  <input
                    type="text"
                    required
                    placeholder="Madrid"
                    value={addrCity}
                    onChange={e => setAddrCity(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono uppercase text-text-muted block mb-1">C.P. *</label>
                  <input
                    type="text"
                    required
                    placeholder="28001"
                    value={addrPostcode}
                    onChange={e => setAddrPostcode(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label className="text-[8px] font-mono uppercase text-text-muted block mb-1">Teléfono *</label>
                <input
                  type="tel"
                  required
                  placeholder="600000000"
                  value={addrPhone}
                  onChange={e => setAddrPhone(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              {addrType === 'fiscal' && (
                <div>
                  <label className="text-[8px] font-mono uppercase text-text-muted block mb-1">NIF/CIF *</label>
                  <input
                    type="text"
                    required
                    placeholder="12345678A"
                    value={addrNif}
                    onChange={e => setAddrNif(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-accent-hover transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-1"
              >
                Agregar Dirección
              </button>
            </form>
          ) : savedAddresses.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {savedAddresses.map((addr) => (
                <div key={addr.id} className="p-3.5 border border-card-border/80 rounded-xl bg-background/30 flex justify-between items-start gap-3 hover:border-accent/40 transition-all">
                  <div className="space-y-1 text-xs font-mono">
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
                    <p className="text-text-muted leading-tight text-[11px]">{addr.address_1}</p>
                    <p className="text-text-muted leading-tight text-[11px]">{addr.postcode} - {addr.city}</p>
                    <p className="text-text-muted leading-tight text-[10px]">Tel: {addr.phone}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleRemoveAddress(addr.id)} className="p-1 text-text-muted hover:text-red-400 transition-colors cursor-pointer" title="Eliminar dirección">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-text-muted font-mono text-center py-4 border border-dashed border-card-border/60 rounded-xl">No tienes direcciones guardadas.</p>
          )}
        </div>

        {/* BLOQUE 4: CAMBIAR CONTRASEÑA */}
        <div className="p-6 bg-card border border-card-border hover:border-card-border/80 rounded-2xl shadow-md transition-all flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-card-border/60">
            <h3 className="font-mono text-xs font-bold uppercase text-foreground tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-accent" />
              Seguridad & Contraseña
            </h3>
            <button
              onClick={() => setIsChangingPassword(v => !v)}
              className="text-[10px] font-mono font-bold uppercase text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
            >
              {isChangingPassword ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isChangingPassword ? 'Cancelar' : 'Cambiar'}
            </button>
          </div>

          {passwordError && (
            <p className="text-[10px] font-mono text-red-400">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-[10px] font-mono text-emerald-400">{passwordSuccess}</p>
          )}

          {isChangingPassword ? (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <div>
                <label className="text-[8px] font-mono uppercase text-text-muted block mb-1">Contraseña Actual *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono uppercase text-text-muted block mb-1">Nueva Contraseña *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono uppercase text-text-muted block mb-1">Confirmar Nueva *</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-accent-hover transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-1"
              >
                Guardar Contraseña
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] text-text-muted font-mono leading-relaxed">
                Tu contraseña está protegida con cifrado bcrypt. Te recomendamos utilizar una contraseña segura de al menos 8 caracteres.
              </p>              <button
                onClick={() => setIsChangingPassword(true)}
                className="w-full py-2 bg-background border border-card-border text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl text-foreground hover:bg-select-bg transition-colors"
              >
                Actualizar Contraseña
              </button>
            </div>
          )}
        </div>

        {/* BLOQUE 5: PRIVACIDAD Y DERECHOS (LOPD/GDPR) */}
        <div className="p-6 bg-card border border-card-border hover:border-card-border/80 rounded-2xl shadow-md transition-all flex flex-col gap-4 md:col-span-2 lg:col-span-2">
          <div className="pb-3 border-b border-card-border/60">
            <h3 className="font-mono text-xs font-bold uppercase text-foreground tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Privacidad y Protección de Datos (LOPDGDD / RGPD)
            </h3>
          </div>
          <p className="text-[10px] text-text-muted font-mono leading-relaxed">
            De acuerdo con el Reglamento General de Protección de Datos (RGPD) y la LOPDGDD (España), tienes pleno derecho a descargar un expediente con toda tu información registrada o solicitar la baja permanente de tu cuenta.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <button
              onClick={handleDownloadGDPRData}
              className="w-full sm:w-auto px-5 py-2.5 bg-background border border-card-border text-[10px] font-mono font-bold rounded-xl uppercase tracking-wider text-foreground hover:bg-select-bg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              Descargar Datos Personales (.JSON)
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-background border border-red-900/60 text-[10px] font-mono font-bold rounded-xl uppercase tracking-wider text-red-400 hover:bg-red-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              Solicitar Eliminación de Cuenta
            </button>
          </div>
        </div>

      </div>

      {/* Modal Detalle de Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs" onClick={() => setSelectedOrder(null)}>
          <div className="bg-card border border-card-border rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-card-border/60 pb-3">
              <h3 className="font-mono font-bold text-foreground uppercase text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-accent" />
                Detalle del Pedido #{selectedOrder.id}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-text-muted hover:text-foreground cursor-pointer text-lg p-1">&times;</button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-xs font-mono p-2.5 bg-background/50 rounded-xl">
                <span className="text-text-muted">Estado del Pedido</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                  selectedOrder.status === 'completed' || selectedOrder.status === 'processing'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : selectedOrder.status === 'cancelled'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>{selectedOrder.status}</span>
              </div>
              <div className="flex justify-between text-xs font-mono p-2.5 bg-background/50 rounded-xl">
                <span className="text-text-muted">Fecha de Realización</span>
                <span className="text-foreground">{new Date(selectedOrder.createdAt).toLocaleString('es-ES')}</span>
              </div>
              <div className="flex justify-between text-xs font-mono p-2.5 bg-background/50 rounded-xl">
                <span className="text-text-muted">Importe Total</span>
                <span className="text-accent-text font-bold text-sm">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(selectedOrder.total)}</span>
              </div>
            </div>

            {selectedOrder.items.length > 0 && (
              <>
                <h4 className="font-mono text-[10px] font-bold uppercase text-text-muted tracking-wider mb-2">Productos ({selectedOrder.items.length})</h4>
                <div className="space-y-2 mb-5">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-background/60 border border-card-border rounded-xl">
                      {item.image && (
                        <img src={item.image} alt={item.productName} loading="lazy" decoding="async" className="w-12 h-12 object-contain rounded-lg bg-slate-950 p-1 shrink-0 border border-card-border/50" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-foreground font-bold truncate">{item.productName}</p>
                        <p className="text-[10px] text-text-muted font-mono">Cantidad: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-mono text-foreground font-bold shrink-0">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider py-3 rounded-xl hover:bg-accent-hover transition-colors cursor-pointer shadow-sm"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}

      {/* Modal de Imagen de Avatar Ampliada */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative max-w-sm sm:max-w-md w-full bg-card border border-card-border rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-background/80 hover:bg-background text-text-muted hover:text-foreground transition-all cursor-pointer border border-card-border shadow-sm"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-2 border-accent/40 shadow-2xl bg-slate-950 flex items-center justify-center">
              {user.avatarUrl && user.avatarUrl.startsWith('emoji:') ? (
                <span className="text-8xl">{user.avatarUrl.substring(6)}</span>
              ) : user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-7xl font-mono font-bold text-accent">{initials}</span>
              )}
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-mono font-bold text-base text-foreground">{displayName}</h3>
              <p className="text-xs text-text-muted font-mono">@{user.username} • {user.rank || 'Novato'}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
