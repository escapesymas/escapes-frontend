import React, { useState } from 'react';
import { User, Lock, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { loginUser } from "../services/auth";
import { User as UserType } from '../types';

interface LoginProps {
  onLoginSuccess: (user: UserType) => void;
  onBack: () => void;
  onRegisterClick: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack, onRegisterClick }) => {
  // CORRECCIÓN: Se eliminaron las credenciales por defecto para evitar exposición.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const session = await loginUser(username, password);
      // loginUser devuelve Session directamente o lanza error
      if (session && session.token) {

        // Fetch full customer details to get the correct ID
        // The auth session doesn't provide the WC Customer ID, only the WP User ID (maybe) or just email/display name
        let userProfile: UserType = {
          id: 0, // Temporary
          username: username,
          email: session.user_email,
          firstName: session.user_display_name,
          lastName: '',
          token: session.token,
          avatarUrl: session.avatarUrl || undefined, // Use avatar from login response
        };

        try {
          // Import dynamically to avoid circular dependencies if any, or just use the imported function
          const { fetchCustomerByEmail } = await import('../services/woocommerce');
          const customer = await fetchCustomerByEmail(session.user_email);

          if (customer) {
            userProfile = {
              ...userProfile,
              id: customer.id,
              firstName: customer.firstName || userProfile.firstName,
              lastName: customer.lastName,
              avatarUrl: userProfile.avatarUrl || customer.avatarUrl, // Prefer login avatar, fallback to customer
              billing: customer.billing
            };
            console.log("Logged in with Customer ID:", customer.id, "Avatar:", userProfile.avatarUrl);
          } else {
            console.warn("Could not find WooCommerce customer for email:", session.user_email);
          }
        } catch (err) {
          console.error("Error fetching customer details:", err);
        }

        onLoginSuccess(userProfile);
      } else if (session.warning) {
        // Usuario creado pero sin token - pedir login manual
        setError(session.warning);
      } else {
        setError('Error al iniciar sesión');
      }
    } catch (e: any) {
      setError(e.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in bg-[url('https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-md bg-zinc-950 border border-zinc-800 p-8 rounded-sm shadow-2xl">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-racing-orange rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-900/50">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white uppercase italic">Acceso Pilotos</h2>
          <p className="text-zinc-500 text-sm mt-2">Gestiona tus pedidos y configuraciones</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-200 p-3 rounded-sm mb-6 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Usuario / Email</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 pl-10 rounded-sm focus:border-racing-orange focus:outline-none transition-colors"
                placeholder="usuario"
                required
              />
              <User className="w-5 h-5 text-zinc-600 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Contraseña</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white p-3 pl-10 rounded-sm focus:border-racing-orange focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
              <Lock className="w-5 h-5 text-zinc-600 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-zinc-400 cursor-pointer hover:text-white">
              <input type="checkbox" className="rounded-sm bg-zinc-800 border-zinc-700 text-racing-orange focus:ring-0" />
              Recordarme
            </label>
            <a href="#" className="text-racing-orange hover:text-orange-400 font-bold">¿Olvidaste la clave?</a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? 'Iniciando Motor...' : 'Entrar'}
            {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-zinc-800 pt-6">
          <p className="text-zinc-500 text-sm">
            ¿No tienes cuenta?
            <button
              onClick={onRegisterClick}
              className="ml-2 text-white font-bold hover:text-racing-orange transition-colors uppercase text-xs"
            >
              Regístrate Gratis
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
