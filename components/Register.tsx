import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { registerUser } from '../services/auth';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onBack: () => void;
  onGoToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onBack, onGoToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        setSuccess(true);
        // Delay redirect to allow user to see success message
        setTimeout(() => {
          onRegisterSuccess();
        }, 2000);
      } else {
        setError(result.error || "Error al registrarse");
      }
    } catch (e) {
      setError("Error de conexión al servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in bg-[url('https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        <div className="relative z-10 w-full max-w-md bg-zinc-950 border border-zinc-800 p-8 rounded-sm shadow-2xl text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white uppercase italic mb-2">¡Cuenta Creada!</h2>
          <p className="text-zinc-400">Te estamos redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in bg-[url('https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-lg bg-zinc-950 border border-zinc-800 p-8 rounded-sm shadow-2xl">
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white uppercase italic">Nuevo Piloto</h2>
          <p className="text-zinc-500 text-sm mt-2">Únete a la comunidad de Escapes y Más</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-200 p-3 rounded-sm mb-6 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Nombre</label>
              <input 
                required
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 rounded-sm focus:border-racing-orange focus:outline-none"
                placeholder="Jorge"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Apellidos</label>
              <input 
                required
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 rounded-sm focus:border-racing-orange focus:outline-none"
                placeholder="Martín"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Usuario (Nick)</label>
            <div className="relative">
              <input 
                required
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 pl-10 rounded-sm focus:border-racing-orange focus:outline-none"
                placeholder="jmartin89"
              />
              <User className="w-5 h-5 text-zinc-600 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Email</label>
            <div className="relative">
              <input 
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 pl-10 rounded-sm focus:border-racing-orange focus:outline-none"
                placeholder="piloto@ejemplo.com"
              />
              <Mail className="w-5 h-5 text-zinc-600 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Contraseña</label>
              <div className="relative">
                <input 
                  required
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 pl-10 rounded-sm focus:border-racing-orange focus:outline-none"
                  placeholder="••••••••"
                />
                <Lock className="w-5 h-5 text-zinc-600 absolute left-3 top-3.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Confirmar</label>
              <div className="relative">
                <input 
                  required
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 pl-10 rounded-sm focus:border-racing-orange focus:outline-none"
                  placeholder="••••••••"
                />
                <Lock className="w-5 h-5 text-zinc-600 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-orange-900/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cuenta'}
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center border-t border-zinc-800 pt-6">
          <p className="text-zinc-500 text-sm">
            ¿Ya tienes cuenta? 
            <button 
              onClick={onGoToLogin}
              className="ml-2 text-white font-bold hover:text-racing-orange transition-colors uppercase text-xs"
            >
              Iniciar Sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};