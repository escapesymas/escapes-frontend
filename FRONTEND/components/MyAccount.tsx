import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, MapPin, Save, ArrowLeft, Mail, Phone, Loader2, CheckCircle, Camera, X, Lock, Upload } from 'lucide-react';
import { User, UserRank } from '../types';
import { updateCustomer, fetchAvatars, updateCustomerAvatar, uploadCustomerPhoto, AvatarOption, fetchUserRank } from '../services/woocommerce';

import { RankBadge } from './RankBadge';
import { MyGarage } from './MyGarage';

interface MyAccountProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
}

export const MyAccount: React.FC<MyAccountProps> = ({ user, onBack, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Avatar state
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    address: user.billing?.address_1 || '',
    city: user.billing?.city || '',
    zip: user.billing?.postcode || '',
    phone: user.billing?.phone || ''
  });

  // Rank state
  const [userRank, setUserRank] = useState<UserRank | null>(null);

  // Load user rank
  useEffect(() => {
    if (user.id) {
      fetchUserRank(user.id).then(rank => {
        if (rank) setUserRank(rank);
      });
    }
  }, [user.id]);

  // Cargar avatares disponibles al abrir el picker
  useEffect(() => {
    if (showAvatarPicker && avatarOptions.length === 0) {
      loadAvatars();
    }
  }, [showAvatarPicker]);

  const loadAvatars = async () => {
    setAvatarLoading(true);
    const avatars = await fetchAvatars();
    setAvatarOptions(avatars);
    setAvatarLoading(false);
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    setAvatarLoading(true);

    // Guardar el avatar en WooCommerce
    const success = await updateCustomerAvatar(user.id, avatarUrl);

    if (success) {
      onUpdateUser({ ...user, avatarUrl });
      setShowAvatarPicker(false);
      setSuccessMsg('Avatar actualizado');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setAvatarLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen no debe superar 10MB');
      return;
    }

    setUploadingPhoto(true);

    setUploadingPhoto(true);

    // Subir a WP Media Library real
    const result = await uploadCustomerPhoto(user.id, file, user.token);

    if (result.success && result.url) {
      setSelectedAvatar(result.url);
      onUpdateUser({ ...user, avatarUrl: result.url });
      setShowAvatarPicker(false);
      setSuccessMsg('Foto actualizada');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      alert(result.error || 'Error al subir la foto. Intenta con un avatar predefinido.');
    }
    setUploadingPhoto(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setPasswordLoading(true);

    // Note: WooCommerce REST API doesn't support password changes directly
    // This would need custom endpoint or WordPress user API
    // For now, we'll show a message to contact support
    setTimeout(() => {
      setPasswordLoading(false);
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Para cambiar tu contraseña, utiliza la opción "¿Olvidaste tu contraseña?" en la pantalla de login.');
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    // Build billing object only with non-empty values
    const billing: any = {};
    if (formData.address) billing.address_1 = formData.address;
    if (formData.city) billing.city = formData.city;
    if (formData.zip) billing.postcode = formData.zip;
    if (formData.phone) billing.phone = formData.phone;
    // WooCommerce requires first_name and email in billing too
    billing.first_name = formData.firstName;
    if (formData.lastName) billing.last_name = formData.lastName;
    billing.email = formData.email;

    const updatedData: Partial<User> = {
      firstName: formData.firstName,
      lastName: formData.lastName || '',
      email: formData.email,
      billing
    };

    const success = await updateCustomer(user.id, updatedData);

    if (success) {
      // Update local state
      onUpdateUser({
        ...user,
        ...updatedData
      });
      setSuccessMsg('Perfil actualizado correctamente');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      alert("Error al actualizar el perfil");
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in min-h-screen">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase italic flex items-center gap-3">
          Mi Cuenta <UserIcon className="w-6 h-6 text-racing-orange" />
        </h1>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-sm p-6 max-w-lg w-full animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold uppercase">Elige tu Avatar</h3>
              <button onClick={() => setShowAvatarPicker(false)} className="text-zinc-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {avatarLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-racing-orange animate-spin" />
              </div>
            ) : avatarOptions.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No hay avatares disponibles. Sube imágenes con "AVATAR" en el título a WordPress.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectAvatar(avatar.url)}
                    className={`aspect-square rounded-sm overflow-hidden border-2 transition-all hover:scale-105 ${selectedAvatar === avatar.url ? 'border-racing-orange' : 'border-zinc-700 hover:border-zinc-500'}`}
                  >
                    <img
                      src={avatar.url.startsWith('data:') ? avatar.url : `https://wsrv.nl/?url=${encodeURIComponent(avatar.url)}&w=150&h=150&fit=cover&output=webp`}
                      alt={avatar.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Option to upload custom photo */}
            <div className="mt-6 pt-4 border-t border-zinc-700">
              <p className="text-zinc-400 text-sm mb-3">¿Prefieres subir tu propia foto?</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Subir mi foto
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <p className="text-zinc-600 text-xs mt-2">Máximo 10MB. Formatos: JPG, PNG, GIF</p>
            </div>
          </div>
        </div>
      )
      }

      {/* Password Change Modal */}
      {
        showPasswordModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-sm p-6 max-w-md w-full animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold uppercase">Cambiar Contraseña</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1 uppercase font-bold">Contraseña Actual</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1 uppercase font-bold">Nueva Contraseña</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1 uppercase font-bold">Confirmar Contraseña</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none"
                  />
                </div>

                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  Cambiar Contraseña
                </button>
              </form>
            </div>
          </div>
        )
      }

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1">
          <div className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-zinc-800 rounded-full mx-auto mb-4 overflow-hidden border-2 border-racing-orange">
                {(selectedAvatar || user.avatarUrl) ? (
                  <img
                    src={(selectedAvatar || user.avatarUrl).startsWith('data:') ? (selectedAvatar || user.avatarUrl) : `https://wsrv.nl/?url=${encodeURIComponent(selectedAvatar || user.avatarUrl)}&w=200&h=200&fit=cover&output=webp`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-zinc-600" />
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="absolute bottom-3 right-0 bg-racing-orange hover:bg-orange-600 text-white p-2 rounded-full shadow-lg transition-colors"
                title="Cambiar avatar o subir foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{user.username}</h2>
            <p className="text-zinc-500 text-sm mb-4">Piloto Oficial</p>
            <div className="bg-zinc-900/50 p-2 rounded text-xs text-zinc-400 font-mono">
              ID: RACER-{user.id}
            </div>
          </div>
        </div>

        {/* XP & Rank Section */}
        {userRank && (
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm mb-6">
            <h2 className="text-xl font-bold text-white uppercase italic mb-4 flex items-center gap-2">
              <span className="text-racing-orange">🏆</span> Rango del Paddock
            </h2>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{userRank.icon}</div>
                <div>
                  <p className="text-lg font-bold text-white">{userRank.title}</p>
                  <p className="text-sm text-zinc-400">Nivel {userRank.level}</p>
                </div>
              </div>
              <RankBadge rank={userRank} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 font-bold">
                <span className="text-zinc-400">Total: <span className="text-white">{userRank.xp} XP</span></span>
                {userRank.xpToNext > userRank.xp ? (
                  <span className="text-zinc-500">Siguiente Rango: {userRank.xpToNext} XP</span>
                ) : (
                  <span className="text-racing-orange">¡Nivel Máximo!</span>
                )}
              </div>

              <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 relative"
                  style={{
                    width: `${Math.min((userRank.xp / (userRank.xpToNext || 1)) * 100, 100)}%`,
                    backgroundColor: userRank.color
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
              <p>💡 Gana XP publicando temas (+10), respondiendo (+5) y recibiendo likes (+2/+3)</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="lg:col-span-2">
          
          {/* Mi Garaje */}
          <MyGarage user={user} onUpdateUser={onUpdateUser} />

          <form onSubmit={handleSubmit} className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm space-y-8">

            {/* Personal Info */}
            <div>
              <h3 className="text-white font-bold uppercase mb-4 tracking-wide border-b border-zinc-800 pb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-racing-orange" /> Datos Personales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1 uppercase font-bold">Nombre *</label>
                  <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1 uppercase font-bold">Apellidos <span className="text-zinc-600 font-normal">(opcional)</span></label>
                  <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1 uppercase font-bold">Email *</label>
                  <div className="relative">
                    <input required name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 pl-10 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1 uppercase font-bold">Teléfono <span className="text-zinc-600 font-normal">(opcional)</span></label>
                  <div className="relative">
                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 pl-10 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-white font-bold uppercase mb-4 tracking-wide border-b border-zinc-800 pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-racing-orange" /> Dirección de Envío <span className="text-zinc-600 text-xs font-normal">(opcional)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1 uppercase font-bold">Dirección</label>
                  <input name="address" value={formData.address} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1 uppercase font-bold">Ciudad</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1 uppercase font-bold">Código Postal</label>
                  <input name="zip" value={formData.zip} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <h3 className="text-white font-bold uppercase mb-4 tracking-wide border-b border-zinc-800 pb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-racing-orange" /> Seguridad
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-3 rounded-sm flex items-center gap-2 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Cambiar Contraseña
              </button>
            </div>

            {/* Action */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              {successMsg ? (
                <div className="text-green-500 flex items-center gap-2 text-sm font-bold animate-pulse">
                  <CheckCircle className="w-5 h-5" /> {successMsg}
                </div>
              ) : <span></span>}

              <button
                type="submit"
                disabled={loading}
                className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase px-6 py-3 rounded-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div >
  );
};