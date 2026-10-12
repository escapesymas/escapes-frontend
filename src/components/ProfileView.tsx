'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { User, LogOut, Trophy, ShoppingBag, Bike, Edit3, Save, X, Trash2, ShieldCheck, Download, Camera, Loader2, MapPin, Key, Plus, Package, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiChangePassword, apiGetMyOrders, apiCancelEmailChange, apiExportMyData, OrderDetail } from '../lib/api';
import { formatOrderNumber, apiRequest } from '../lib/constants';
import ProfileSkeleton from './ProfileSkeleton';
import RefundRequestPanel from './RefundRequestPanel';
import ProfileUnauthenticated from './ProfileUnauthenticated';
import AvatarCropModal from './AvatarCropModal';

// Lista de emojis predeterminados para avatares rápidos
const PRESET_EMOJIS = ['🏍️', '🏁', '🛠️', '🏆', '⚡', '😎', '🔥', '🚥'];

/** Mínimo de una contraseña nueva: el servidor exige lo mismo. */
const PASSWORD_MIN = 8;
/** Foto original: se recorta a 512 px en el navegador antes de subirla. */
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_SOURCE_MAX_MB = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
type AddressDraft = Omit<Address, 'id' | 'nif'> & { nif: string };
const EMPTY_ADDRESS: AddressDraft = { alias: '', type: 'envio', address_1: '', city: '', postcode: '', phone: '', nif: '' };

/** Estado del pedido en español y su color. */
const ORDER_STATUS: Record<string, { label: string; tone: 'ok' | 'warn' | 'bad' | 'info' }> = {
  pending: { label: 'Pendiente de pago', tone: 'warn' },
  pending_payment: { label: 'Pendiente de pago', tone: 'warn' },
  payment_failed: { label: 'Pago fallido', tone: 'bad' },
  payment_amount_mismatch: { label: 'En revisión', tone: 'warn' },
  paid: { label: 'Pagado', tone: 'ok' },
  processing: { label: 'En preparación', tone: 'ok' },
  shipped: { label: 'Enviado', tone: 'ok' },
  delivered: { label: 'Entregado', tone: 'ok' },
  completed: { label: 'Completado', tone: 'ok' },
  cancelled: { label: 'Cancelado', tone: 'bad' },
  refunded: { label: 'Reembolsado', tone: 'info' },
  partially_refunded: { label: 'Reembolso parcial', tone: 'info' },
};
const TONE_CLASS = { ok: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', bad: 'bg-red-500/10 text-red-600 dark:text-red-400', info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' };
const statusLabel = (st: string) => ORDER_STATUS[st]?.label || st;
const statusClass = (st: string) => TONE_CLASS[ORDER_STATUS[st]?.tone || 'warn'];
const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

// Clases comunes de las tarjetas y formularios
const CARD = 'p-5 md:p-6 bg-card border border-card-border rounded-2xl shadow-md flex flex-col gap-4 min-w-0';
const CARD_HEAD = 'flex justify-between items-center gap-3 pb-3 border-b border-card-border/60';
const CARD_TITLE = 'font-mono text-xs font-bold uppercase text-foreground tracking-wider flex items-center gap-2 min-w-0';
const HEAD_BUTTON = 'shrink-0 whitespace-nowrap text-[10px] font-mono font-bold uppercase text-accent-text hover:text-accent-hover transition-colors flex items-center gap-1 cursor-pointer';
const LABEL = 'text-[9px] font-mono uppercase text-text-muted block mb-1';
const INPUT = 'w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent';
const PRIMARY = 'w-full py-2.5 bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-accent-hover transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-60';
const SECONDARY = 'w-full py-2 bg-background border border-card-border text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl text-foreground hover:bg-select-bg transition-colors cursor-pointer';

/** Error junto al bloque que lo produce, legible en tema claro y oscuro. */
function InlineError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 text-[11px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
      <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
      <span>{message}</span>
    </p>
  );
}

/** Campo de texto con su etiqueta enlazada (lectores de pantalla y clic en la etiqueta). */
function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL}>{label}</label>
      <input id={id} className={INPUT} {...props} />
    </div>
  );
}

/** Formulario de dirección: el mismo para añadir una nueva y para editar una guardada. */
function AddressForm({ draft, onChange, onSubmit, isSubmitting, submitLabel }: {
  draft: AddressDraft;
  onChange: (d: AddressDraft) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const typeId = useId();
  const set = (k: keyof AddressDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...draft, [k]: e.target.value });
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Alias (ej. Casa, Taller) *" required placeholder="Mi casa" value={draft.alias} onChange={set('alias')} />
      <div>
        <label htmlFor={typeId} className={LABEL}>Tipo *</label>
        <select id={typeId} value={draft.type} onChange={set('type')} className={INPUT}>
          <option value="envio">Envío</option>
          <option value="fiscal">Facturación/Fiscal</option>
        </select>
      </div>
      <Field label="Dirección *" required placeholder="Calle, número, piso..." autoComplete="street-address" value={draft.address_1} onChange={set('address_1')} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Ciudad *" required placeholder="Madrid" autoComplete="address-level2" value={draft.city} onChange={set('city')} />
        <Field label="C.P. *" required placeholder="28001" inputMode="numeric" autoComplete="postal-code" value={draft.postcode} onChange={set('postcode')} />
      </div>
      <Field label="Teléfono *" type="tel" required placeholder="600000000" autoComplete="tel" value={draft.phone} onChange={set('phone')} />
      {draft.type === 'fiscal' && (
        <Field label="NIF/CIF *" required placeholder="12345678A" value={draft.nif} onChange={set('nif')} />
      )}
      <button type="submit" disabled={isSubmitting} className={`${PRIMARY} mt-1`}>
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {submitLabel}
      </button>
    </form>
  );
}

/** Cierra un modal con la tecla Escape mientras está abierto. */
function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}

export default function ProfileView() {
  const { user, isAuthenticated, isLoading, logout, updateProfile, refreshProfile, deleteAccount } = useAuth();
  const { showToast } = useToast();

  // Estados de edición de datos personales
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileError, setProfileError] = useState('');
  const usernameId = useId();

  // Estados de cambio de contraseña
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Libreta de direcciones: null = lista, 'new' = añadiendo, id = editando esa dirección
  const [addressMode, setAddressMode] = useState<string | null>(null);
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(EMPTY_ADDRESS);
  const [addressError, setAddressError] = useState('');

  // Avatar: panel de opciones, foto ampliada y recorte de la foto elegida
  const [isAvatarPanelOpen, setIsAvatarPanelOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [brokenAvatarUrl, setBrokenAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Privacidad
  const [isExporting, setIsExporting] = useState(false);
  const [privacyError, setPrivacyError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pedidos
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [showOrders, setShowOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const ordersRef = useRef<HTMLDivElement>(null);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      setOrders(await apiGetMyOrders());
    } catch (err) {
      setOrdersError(errorText(err, 'No hemos podido cargar tus pedidos.'));
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Solo al cambiar de usuario: guardar el perfil no vuelve a pedir los pedidos.
  const userId = user?.id;
  useEffect(() => {
    if (userId) loadOrders();
  }, [userId, loadOrders]);

  useEscape(Boolean(selectedOrder), () => setSelectedOrder(null));
  useEscape(isImageModalOpen, () => setIsImageModalOpen(false));

  // Iniciar modo edición
  const handleStartEdit = () => {
    if (user) {
      setEditUsername(user.username || '');
      setEditFirstName(user.firstName || '');
      setEditLastName(user.lastName || '');
      setEditEmail(user.email || '');
      setEditPhone(user.billing?.phone || '');
      setIsEditing(true);
      setProfileError('');
    }
  };

  // Guardar datos editados
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = editUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/gi, '');
    if (!cleanUser || cleanUser.length < 3) {
      setProfileError('El nombre de usuario (@username) debe tener al menos 3 caracteres.');
      return;
    }
    if (!editFirstName.trim() || !editLastName.trim() || !editEmail.trim() || !editPhone.trim()) {
      setProfileError('Por favor, completa todos los campos.');
      return;
    }
    if (!EMAIL_RE.test(editEmail.trim())) {
      setProfileError('El email no es válido.');
      return;
    }
    setIsSubmitting(true);
    setProfileError('');
    try {
      const { pendingEmail } = await updateProfile({
        username: cleanUser,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        billing: { ...(user?.billing || {}), phone: editPhone.trim() },
      });
      setIsEditing(false);
      showToast(pendingEmail
        ? { type: 'success', message: 'Datos guardados. Confirma el email nuevo con el enlace que te hemos enviado.', duration: 7000 }
        : { type: 'success', message: 'Datos guardados.' });
    } catch (err) {
      setProfileError(errorText(err, 'Error al actualizar el perfil.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cambio de email pendiente: reenviar el enlace o anularlo
  const handleResendEmailChange = async () => {
    if (!user?.pendingEmail) return;
    setProfileError('');
    setIsSubmitting(true);
    try {
      await updateProfile({ email: user.pendingEmail });
      showToast({ type: 'success', message: `Enlace reenviado a ${user.pendingEmail}.` });
    } catch (err) {
      setProfileError(errorText(err, 'No se pudo reenviar el enlace.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEmailChange = async () => {
    setProfileError('');
    setIsSubmitting(true);
    try {
      await apiCancelEmailChange();
      await refreshProfile();
      showToast({ type: 'info', message: 'Cambio de email cancelado.' });
    } catch (err) {
      setProfileError(errorText(err, 'No se pudo cancelar el cambio de email.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cambiar contraseña
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Completa todos los campos obligatorios.');
      return;
    }
    if (newPassword.length < PASSWORD_MIN) {
      setPasswordError(`La nueva contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
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
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setIsChangingPassword(false);
        showToast({ type: 'success', message: 'Contraseña cambiada.' });
      }
    } catch (err) {
      setPasswordError(errorText(err, 'Error al cambiar la contraseña.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direcciones: abrir el formulario vacío o con los datos de la guardada
  const savedAddresses = Array.isArray(user?.billing?.addresses) ? (user.billing.addresses as Address[]) : [];

  const handleNewAddress = () => {
    setAddressDraft(EMPTY_ADDRESS);
    setAddressMode('new');
    setAddressError('');
  };

  const handleStartEditAddress = (addr: Address) => {
    setAddressDraft({
      alias: addr.alias,
      type: addr.type,
      address_1: addr.address_1,
      city: addr.city,
      postcode: addr.postcode,
      phone: addr.phone,
      nif: addr.nif || '',
    });
    setAddressMode(addr.id);
    setAddressError('');
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addressMode) return;
    const d = addressDraft;
    setAddressError('');
    if (!d.alias.trim() || !d.address_1.trim() || !d.city.trim() || !d.postcode.trim() || !d.phone.trim()) {
      setAddressError('Completa todos los campos obligatorios.');
      return;
    }
    if (d.type === 'fiscal' && !d.nif.trim()) {
      setAddressError('El NIF/CIF es obligatorio para direcciones fiscales.');
      return;
    }

    const isNew = addressMode === 'new';
    const addr: Address = {
      id: isNew ? `addr-${Date.now()}` : addressMode,
      alias: d.alias.trim(),
      type: d.type,
      address_1: d.address_1.trim(),
      city: d.city.trim(),
      postcode: d.postcode.trim(),
      phone: d.phone.trim(),
      nif: d.type === 'fiscal' ? d.nif.trim() : undefined,
    };
    const addresses = isNew ? [...savedAddresses, addr] : savedAddresses.map((a) => (a.id === addr.id ? addr : a));

    setIsSubmitting(true);
    try {
      await updateProfile({ billing: { ...(user.billing || {}), addresses } });
      setAddressMode(null);
      showToast({ type: 'success', message: isNew ? 'Dirección añadida.' : 'Dirección actualizada.' });
    } catch (err) {
      setAddressError(errorText(err, 'Error al guardar la dirección.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar Dirección
  const handleRemoveAddress = async (addrId: string) => {
    if (!user) return;
    if (!window.confirm('¿Seguro que quieres eliminar esta dirección?')) return;

    setAddressError('');
    setIsSubmitting(true);
    try {
      await updateProfile({ billing: { ...(user.billing || {}), addresses: savedAddresses.filter((a) => a.id !== addrId) } });
      if (addressMode === addrId) setAddressMode(null);
      showToast({ type: 'success', message: 'Dirección eliminada.' });
    } catch (err) {
      setAddressError(errorText(err, 'Error al eliminar la dirección.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seleccionar preset de emoji
  const handleSelectPresetEmoji = async (emoji: string) => {
    setIsSubmitting(true);
    setAvatarError('');
    try {
      await updateProfile({ avatarUrl: `emoji:${emoji}` });
      setIsAvatarPanelOpen(false);
      showToast({ type: 'success', message: 'Avatar actualizado.' });
    } catch (err) {
      setAvatarError(errorText(err, 'Error al actualizar el avatar.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Foto propia: primero se recorta en cuadrado y luego se sube
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Vaciar el campo: elegir otra vez la misma foto vuelve a abrir el recorte.
    e.target.value = '';
    if (!file) return;
    setAvatarError('');
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Elige una imagen JPG, PNG o WebP.');
      return;
    }
    if (file.size > AVATAR_SOURCE_MAX_MB * 1024 * 1024) {
      setAvatarError(`La imagen pesa demasiado (máximo ${AVATAR_SOURCE_MAX_MB} MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result));
    reader.onerror = () => setAvatarError('No hemos podido leer la imagen.');
    reader.readAsDataURL(file);
  };

  const handleCroppedAvatar = async (blob: Blob) => {
    setIsUploadingAvatar(true);
    setAvatarError('');
    try {
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      const res = await apiRequest('/upload/avatar', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');
      // El servidor ya la ha guardado en el perfil: solo se actualiza la pantalla.
      await updateProfile({ avatarUrl: data.url }, true);
      setIsAvatarPanelOpen(false);
      showToast({ type: 'success', message: 'Foto de perfil actualizada.' });
    } catch (err) {
      setAvatarError(errorText(err, 'Error al subir la foto.'));
    } finally {
      setCropSrc(null);
      setIsUploadingAvatar(false);
    }
  };

  // Descargar datos personales (RGPD: derecho de acceso y portabilidad)
  const handleDownloadData = async () => {
    if (!user) return;
    setPrivacyError('');
    setIsExporting(true);
    try {
      const data = await apiExportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mis_datos_escapesymas_${user.username}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setPrivacyError(errorText(err, 'No se pudieron descargar tus datos.'));
    } finally {
      setIsExporting(false);
    }
  };

  // Eliminar/Anonimizar cuenta (GDPR/LOPD Derecho al Olvido)
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "¿Deseas eliminar permanentemente tu cuenta? Esta acción anonimizará tus datos personales de acuerdo con la LOPDGDD (España) y el RGPD de la UE. Si tienes facturas pendientes o históricas, se conservarán desvinculadas de tu identidad por motivos fiscales."
    );
    if (!confirmDelete) return;

    setIsSubmitting(true);
    setPrivacyError('');
    try {
      await deleteAccount();
    } catch (err) {
      setPrivacyError(errorText(err, 'Error al eliminar la cuenta.'));
      setIsSubmitting(false);
    }
  };

  const handleShowOrders = () => {
    setShowOrders(true);
    ordersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const initials = ((user.firstName || user.username || '?')[0]).toUpperCase();
  const hasPhoto = Boolean(user.avatarUrl) && !user.avatarUrl.startsWith('emoji:') && brokenAvatarUrl !== user.avatarUrl;
  const avatarEmoji = user.avatarUrl?.startsWith('emoji:') ? user.avatarUrl.substring(6) : '';

  const renderAvatarContent = () => {
    if (avatarEmoji) {
      return (
        <div className="w-full h-full flex items-center justify-center text-3xl bg-accent/10">
          {avatarEmoji}
        </div>
      );
    }
    if (hasPhoto) {
      return <img src={user.avatarUrl} alt="" decoding="async" onError={() => setBrokenAvatarUrl(user.avatarUrl)} className="w-full h-full object-cover" />;
    }
    return initials;
  };

  const editingAddress = addressMode !== null && addressMode !== 'new';

  return (
    <div className="max-w-6xl mx-auto animate-fade-in font-sans">

      {/* Cabecera: avatar, nombre, contadores y cerrar sesión */}
      <div className="mb-6 md:mb-8 p-5 md:p-8 bg-card border border-card-border rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full md:w-auto min-w-0">
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              className="w-24 h-24 rounded-2xl bg-accent flex items-center justify-center text-slate-950 font-mono font-bold text-3xl overflow-hidden border-2 border-accent shadow-lg cursor-pointer hover:opacity-90 transition-all group-hover:scale-[1.02]"
              aria-label="Ver foto de perfil ampliada"
            >
              {renderAvatarContent()}
            </button>
            <button
              type="button"
              onClick={() => setIsAvatarPanelOpen(v => !v)}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 flex items-center justify-center border-2 border-card cursor-pointer transition-all shadow-md group-hover:scale-105"
              aria-label="Cambiar avatar"
              aria-expanded={isAvatarPanelOpen}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 min-w-0 max-w-full">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="font-mono text-xl md:text-2xl font-black uppercase tracking-tight text-foreground break-words">{displayName}</h1>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent/15 text-accent-text border border-accent/30">
                {user.rank || 'Novato'}
              </span>
            </div>
            <p className="text-xs text-text-muted font-mono break-all">@{user.username} • {user.email}</p>
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
            <button type="button" onClick={handleShowOrders} className="px-4 py-2 bg-background/60 border border-card-border hover:border-accent/50 rounded-xl text-center transition-all cursor-pointer min-w-[70px]">
              <ShoppingBag className="w-3.5 h-3.5 text-text-muted mx-auto mb-0.5" />
              <span className="text-sm font-mono font-black text-foreground block">
                {ordersLoading ? '...' : ordersError ? '–' : orders.length}
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
            type="button"
            onClick={logout}
            className="px-4 py-3 border border-card-border hover:border-red-500/50 hover:bg-red-500/10 text-text-muted hover:text-red-500 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Selector de Avatar Desplegable */}
      {isAvatarPanelOpen && (
        <div className="mb-6 md:mb-8 w-full border border-card-border bg-card/80 backdrop-blur-xs rounded-2xl p-5 md:p-6 animate-fade-in flex flex-col gap-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-card-border/60 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">Personaliza tu Avatar</span>
            <button type="button" onClick={() => setIsAvatarPanelOpen(false)} className="text-text-muted hover:text-foreground p-1 cursor-pointer" aria-label="Cerrar">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {PRESET_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                disabled={isSubmitting || isUploadingAvatar}
                onClick={() => handleSelectPresetEmoji(emoji)}
                className="w-12 h-12 border border-card-border hover:border-accent hover:bg-accent/10 rounded-xl text-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs disabled:opacity-60"
                aria-label={`Usar ${emoji} como avatar`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <InlineError message={avatarError} />
          <div className="border-t border-card-border/60 pt-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFile}
              accept={AVATAR_TYPES.join(',')}
              className="hidden"
            />
            <button
              type="button"
              disabled={isSubmitting || isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-2.5 bg-accent text-slate-950 font-mono font-bold text-xs rounded-xl uppercase tracking-wider hover:bg-accent-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
            >
              {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              Subir Imagen Propia
            </button>
            <p className="text-[10px] text-text-muted font-mono text-center sm:text-right">Podrás recortarla antes de guardarla. JPG, PNG o WebP.</p>
          </div>
        </div>
      )}

      {/* REJILLA DE TARJETAS MODULAR POR BLOQUES (3 Columnas Desktop / 2 Tablet / 1 Móvil) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">

        {/* BLOQUE 1: DATOS PERSONALES */}
        <div className={CARD}>
          <div className={CARD_HEAD}>
            <h3 className={CARD_TITLE}>
              <User className="w-4 h-4 text-accent shrink-0" />
              Datos Personales
            </h3>
            {!isEditing ? (
              <button type="button" onClick={handleStartEdit} className={HEAD_BUTTON}>
                <Edit3 className="w-3.5 h-3.5" />
                Editar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setIsEditing(false); setProfileError(''); }}
                className="shrink-0 text-[10px] font-mono font-bold uppercase text-red-600 dark:text-red-400 hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            )}
          </div>

          <InlineError message={profileError} />

          {user.pendingEmail && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <p className="text-[11px] font-mono text-foreground flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 mt-px shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Email nuevo pendiente de confirmar: <strong className="break-all">{user.pendingEmail}</strong></span>
              </p>
              <p className="text-[10px] font-mono text-text-muted leading-relaxed">
                Abre el enlace que te hemos enviado a esa dirección. Hasta entonces sigues usando <span className="break-all">{user.email}</span>.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <button type="button" disabled={isSubmitting} onClick={handleResendEmailChange} className={HEAD_BUTTON}>
                  <RefreshCw className="w-3 h-3" />
                  Reenviar enlace
                </button>
                <button type="button" disabled={isSubmitting} onClick={handleCancelEmailChange} className="text-[10px] font-mono font-bold uppercase text-text-muted hover:text-foreground cursor-pointer">
                  Cancelar cambio
                </button>
              </div>
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-3">
              <div className="p-3 bg-background/50 border border-card-border/50 rounded-xl">
                <span className="text-[9px] font-mono uppercase text-text-muted block mb-0.5">Nombre de Usuario (@username - Único)</span>
                <span className="text-xs font-mono font-bold text-accent-text break-all">@{user.username}</span>
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
                <span className="text-xs font-mono text-foreground break-all block">{user.email}</span>
              </div>
              {user.role === 'admin' && (
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold uppercase text-accent-text">Permisos de Sistema</span>
                  <span className="text-[10px] font-mono font-bold uppercase text-accent-text bg-accent/20 px-2 py-0.5 rounded">{user.role}</span>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-xl">
                <label htmlFor={usernameId} className="text-[9px] font-mono uppercase font-bold text-accent-text block mb-1">
                  Nombre de Usuario (@username - ÚNICO) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono text-xs text-accent-text font-bold">@</span>
                  <input
                    id={usernameId}
                    type="text"
                    required
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/gi, ''))}
                    placeholder="piloto_rapido"
                    autoComplete="username"
                    className="w-full bg-background border border-card-border rounded-lg pl-7 pr-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <p className="text-[9px] text-text-muted font-mono mt-1">Identificador único. No se puede repetir con otro usuario.</p>
              </div>

              <Field label="Nombre *" required autoComplete="given-name" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
              <Field label="Apellidos *" required autoComplete="family-name" value={editLastName} onChange={e => setEditLastName(e.target.value)} />
              <Field label="Teléfono *" type="tel" required autoComplete="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
              <div>
                <Field label="Email *" type="email" required autoComplete="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                {editEmail.trim().toLowerCase() !== user.email.toLowerCase() && (
                  <p className="text-[9px] text-text-muted font-mono mt-1">Te enviaremos un enlace al email nuevo para confirmarlo. Hasta entonces seguirás usando el actual.</p>
                )}
              </div>
              <button type="submit" disabled={isSubmitting} className={PRIMARY}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Cambios
              </button>
            </form>
          )}
        </div>

        {/* BLOQUE 2: PEDIDOS */}
        <div ref={ordersRef} className={`${CARD} scroll-mt-20`}>
          <div className={CARD_HEAD}>
            <h3 className={CARD_TITLE}>
              <Package className="w-4 h-4 text-accent shrink-0" />
              Mis Pedidos{!ordersLoading && !ordersError ? ` (${orders.length})` : ''}
            </h3>
            {orders.length > 0 && (
              <button type="button" onClick={() => setShowOrders(!showOrders)} className={HEAD_BUTTON}>
                {showOrders ? 'Ocultar' : 'Ver todos'}
              </button>
            )}
          </div>

          {ordersLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
            </div>
          ) : ordersError ? (
            <div className="space-y-3">
              <InlineError message={ordersError} />
              <button type="button" onClick={loadOrders} className={`${SECONDARY} flex items-center justify-center gap-1.5`}>
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar
              </button>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-[10px] text-text-muted font-mono text-center py-6 border border-dashed border-card-border/60 rounded-xl">No has realizado compras aún en Escapes y Más.</p>
          ) : showOrders ? (
            <div className="animate-fade-in space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center justify-between gap-2 p-3 bg-background/50 border border-card-border rounded-xl text-xs font-mono w-full text-left hover:border-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Package className="w-3.5 h-3.5 text-accent shrink-0" />
                    <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-foreground font-bold">#{formatOrderNumber(order.id, order.createdAt)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${statusClass(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                  <span className="text-foreground font-bold shrink-0">{eur(order.total)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSelectedOrder(orders[0])}
                className="w-full text-left p-3.5 bg-background/50 border border-card-border/50 hover:border-accent/50 rounded-xl space-y-2 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-center gap-2 text-xs font-mono">
                  <span className="text-text-muted">Último Pedido</span>
                  <span className="text-foreground font-bold">#{formatOrderNumber(orders[0].id, orders[0].createdAt)}</span>
                </div>
                <div className="flex justify-between items-center gap-2 text-xs font-mono">
                  <span className="text-text-muted">Fecha</span>
                  <span className="text-foreground">{new Date(orders[0].createdAt).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex justify-between items-center gap-2 text-xs font-mono">
                  <span className="text-text-muted">Estado</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${statusClass(orders[0].status)}`}>{statusLabel(orders[0].status)}</span>
                </div>
                <div className="flex justify-between items-center gap-2 text-xs font-mono">
                  <span className="text-text-muted">Total</span>
                  <span className="text-accent-text font-bold">{eur(orders[0].total)}</span>
                </div>
              </button>
              <button type="button" onClick={() => setShowOrders(true)} className={SECONDARY}>
                Ver Todo el Historial
              </button>
            </div>
          )}
        </div>

        {/* BLOQUE 3: LIBRETA DE DIRECCIONES */}
        <div className={CARD}>
          <div className={CARD_HEAD}>
            <h3 className={CARD_TITLE}>
              <MapPin className="w-4 h-4 text-accent shrink-0" />
              Mis Direcciones ({savedAddresses.length})
            </h3>
            {addressMode === null ? (
              <button type="button" onClick={handleNewAddress} className={HEAD_BUTTON}>
                <Plus className="w-3.5 h-3.5" />
                Añadir
              </button>
            ) : (
              <button type="button" onClick={() => { setAddressMode(null); setAddressError(''); }} className={HEAD_BUTTON}>
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            )}
          </div>

          <InlineError message={addressError} />

          {addressMode !== null ? (
            <>
              {editingAddress && (
                <p className="text-[10px] font-mono text-text-muted -mt-1">Editando «{savedAddresses.find((a) => a.id === addressMode)?.alias}»</p>
              )}
              <AddressForm
                draft={addressDraft}
                onChange={setAddressDraft}
                onSubmit={handleSaveAddress}
                isSubmitting={isSubmitting}
                submitLabel={editingAddress ? 'Guardar Dirección' : 'Agregar Dirección'}
              />
            </>
          ) : savedAddresses.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {savedAddresses.map((addr) => (
                <div key={addr.id} className="p-3.5 border border-card-border/80 rounded-xl bg-background/30 flex justify-between items-start gap-3 hover:border-accent/40 transition-all">
                  <div className="space-y-1 text-xs font-mono min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground uppercase break-words">{addr.alias}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                        addr.type === 'fiscal'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                          : 'bg-accent/10 text-accent-text border-accent/20'
                      }`}>
                        {addr.type === 'fiscal' ? 'Fiscal' : 'Envío'}
                      </span>
                    </div>
                    <p className="text-text-muted leading-tight text-[11px] break-words">{addr.address_1}</p>
                    <p className="text-text-muted leading-tight text-[11px]">{addr.postcode} - {addr.city}</p>
                    <p className="text-text-muted leading-tight text-[10px]">Tel: {addr.phone}</p>
                    {addr.type === 'fiscal' && addr.nif && (
                      <p className="text-text-muted leading-tight text-[10px]">NIF: {addr.nif}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => handleStartEditAddress(addr)} className="p-1.5 text-text-muted hover:text-accent-text transition-colors cursor-pointer" aria-label={`Editar la dirección ${addr.alias}`} title="Editar dirección">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" disabled={isSubmitting} onClick={() => handleRemoveAddress(addr.id)} className="p-1.5 text-text-muted hover:text-red-500 transition-colors cursor-pointer" aria-label={`Eliminar la dirección ${addr.alias}`} title="Eliminar dirección">
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
        <div className={CARD}>
          <div className={CARD_HEAD}>
            <h3 className={CARD_TITLE}>
              <Key className="w-4 h-4 text-accent shrink-0" />
              Contraseña
            </h3>
            <button
              type="button"
              onClick={() => { setIsChangingPassword(v => !v); setPasswordError(''); }}
              className={HEAD_BUTTON}
            >
              {isChangingPassword ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isChangingPassword ? 'Cancelar' : 'Cambiar'}
            </button>
          </div>

          <InlineError message={passwordError} />

          {isChangingPassword ? (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <Field label="Contraseña Actual *" type="password" required autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              <Field label="Nueva Contraseña *" type="password" required autoComplete="new-password" minLength={PASSWORD_MIN} placeholder={`Mínimo ${PASSWORD_MIN} caracteres`} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <Field label="Confirmar Nueva *" type="password" required autoComplete="new-password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />

              <button type="submit" disabled={isSubmitting} className={`${PRIMARY} mt-1`}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Contraseña
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] text-text-muted font-mono leading-relaxed">
                Usa al menos {PASSWORD_MIN} caracteres. Mejor si mezclas letras, números y algún símbolo, y no la repites en otras webs.
              </p>
              <button type="button" onClick={() => setIsChangingPassword(true)} className={SECONDARY}>
                Actualizar Contraseña
              </button>
            </div>
          )}
        </div>

        {/* BLOQUE 5: PRIVACIDAD Y DERECHOS (LOPD/GDPR) */}
        <div className={`${CARD} md:col-span-2 lg:col-span-2`}>
          <div className="pb-3 border-b border-card-border/60">
            <h3 className={CARD_TITLE}>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              Privacidad y Protección de Datos
            </h3>
          </div>
          <p className="text-[10px] text-text-muted font-mono leading-relaxed">
            De acuerdo con el Reglamento General de Protección de Datos (RGPD) y la LOPDGDD (España), puedes descargar una copia con toda tu información (perfil, direcciones, pedidos, reseñas y conversaciones) o solicitar la baja permanente de tu cuenta.
          </p>
          <InlineError message={privacyError} />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownloadData}
              disabled={isExporting}
              className="w-full sm:w-auto px-5 py-2.5 bg-background border border-card-border text-[10px] font-mono font-bold rounded-xl uppercase tracking-wider text-foreground hover:bg-select-bg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-accent-text" />}
              Descargar mis datos (.JSON)
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-background border border-red-500/40 text-[10px] font-mono font-bold rounded-xl uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar mi cuenta
            </button>
          </div>
        </div>

      </div>

      {/* Modal Detalle de Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs" onClick={() => setSelectedOrder(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="bg-card border border-card-border rounded-2xl shadow-2xl max-w-lg w-full p-5 md:p-6 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-4 border-b border-card-border/60 pb-3">
              <h3 id="order-detail-title" className="font-mono font-bold text-foreground uppercase text-sm flex items-center gap-2 min-w-0 break-all">
                <Package className="w-4 h-4 text-accent shrink-0" />
                Pedido #{formatOrderNumber(selectedOrder.id, selectedOrder.createdAt)}
              </h3>
              <button type="button" onClick={() => setSelectedOrder(null)} className="text-text-muted hover:text-foreground cursor-pointer p-1 shrink-0" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between gap-2 text-xs font-mono p-2.5 bg-background/50 rounded-xl">
                <span className="text-text-muted">Estado del Pedido</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${statusClass(selectedOrder.status)}`}>{statusLabel(selectedOrder.status)}</span>
              </div>
              <div className="flex justify-between gap-2 text-xs font-mono p-2.5 bg-background/50 rounded-xl">
                <span className="text-text-muted">Fecha de Realización</span>
                <span className="text-foreground text-right">{new Date(selectedOrder.createdAt).toLocaleString('es-ES')}</span>
              </div>
              <div className="flex justify-between gap-2 text-xs font-mono p-2.5 bg-background/50 rounded-xl">
                <span className="text-text-muted">Importe Total</span>
                <span className="text-accent-text font-bold text-sm">{eur(selectedOrder.total)}</span>
              </div>
              {(selectedOrder.refunded || 0) > 0 && (
                <div className="flex justify-between gap-2 text-xs font-mono p-2.5 bg-background/50 rounded-xl">
                  <span className="text-text-muted">Reembolsado</span>
                  <span className="text-sky-700 dark:text-sky-400 font-bold">{eur(selectedOrder.refunded || 0)}</span>
                </div>
              )}
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
                      <span className="text-xs font-mono text-foreground font-bold shrink-0">{eur(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <RefundRequestPanel
              key={selectedOrder.id}
              order={selectedOrder}
              onUpdated={(o) => {
                setSelectedOrder(o);
                setOrders((list) => list.map((x) => (x.id === o.id ? o : x)));
              }}
            />

            <button
              type="button"
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
            role="dialog"
            aria-modal="true"
            aria-label="Foto de perfil"
            className="relative max-w-sm sm:max-w-md w-full bg-card border border-card-border rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-background/80 hover:bg-background text-text-muted hover:text-foreground transition-all cursor-pointer border border-card-border shadow-sm"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-64 h-64 sm:w-72 sm:h-72 max-w-full aspect-square rounded-2xl overflow-hidden border-2 border-accent/40 shadow-2xl bg-slate-950 flex items-center justify-center">
              {avatarEmoji ? (
                <span className="text-8xl">{avatarEmoji}</span>
              ) : hasPhoto ? (
                <img src={user.avatarUrl} alt={`Foto de perfil de ${displayName}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-7xl font-mono font-bold text-accent">{initials}</span>
              )}
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-mono font-bold text-base text-foreground">{displayName}</h3>
              <p className="text-xs text-text-muted font-mono">@{user.username} • {user.rank || 'Novato'}</p>
            </div>
            <button
              type="button"
              onClick={() => { setIsImageModalOpen(false); setIsAvatarPanelOpen(true); }}
              className="text-[10px] font-mono font-bold uppercase text-accent-text hover:text-accent-hover flex items-center gap-1 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              Cambiar foto
            </button>
          </div>
        </div>
      )}

      {/* Recorte de la foto elegida: todos los avatares quedan cuadrados */}
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          isSaving={isUploadingAvatar}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCroppedAvatar}
        />
      )}

    </div>
  );
}
