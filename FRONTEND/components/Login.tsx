import React, { useState } from 'react';
import { User, Lock, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { loginUser, socialLoginUser } from "../services/auth";
import { User as UserType } from '../types';
import { fetchCustomerByEmail } from '../services/apiService';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import AppleSignin from 'react-apple-signin-auth';

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

  const handleSocialSuccess = async (provider: 'google' | 'facebook' | 'apple', response: any) => {
    setIsLoading(true);
    setError(null);
    try {
      let token = '';
      if (provider === 'google') {
        token = response.access_token;
      } else if (provider === 'facebook') {
        token = response.accessToken;
      } else if (provider === 'apple') {
        token = response.authorization.id_token;
      }
      
      const session = await socialLoginUser(provider, token);
      
      if (session && session.token) {
        let userProfile: UserType = {
          id: 0,
          username: session.user_display_name || '',
          email: session.user_email,
          firstName: session.user_display_name,
          lastName: '',
          token: session.token,
          avatarUrl: session.avatarUrl,
        };

        try {
          const customer = await fetchCustomerByEmail(session.user_email);
          if (customer) {
            userProfile = {
              ...userProfile,
              id: customer.id,
              firstName: customer.firstName || userProfile.firstName,
              lastName: customer.lastName,
              avatarUrl: userProfile.avatarUrl || customer.avatarUrl,
              billing: customer.billing
            };
          }
        } catch (err) {
          console.error("Error fetching customer details:", err);
        }

        onLoginSuccess(userProfile);
      } else {
        setError(`Error al iniciar sesión con ${provider}`);
      }
    } catch (e: any) {
       setError(e.message || `Error de conexión con ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => handleSocialSuccess('google', tokenResponse),
    onError: () => setError('Acceso con Google cancelado o fallido'),
  });

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

        <div className="mt-8 flex items-center justify-between">
          <span className="border-b border-zinc-800 w-1/5"></span>
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">O entrar con</span>
          <span className="border-b border-zinc-800 w-1/5"></span>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <button 
            type="button" 
            onClick={() => googleLogin()}
            disabled={isLoading}
            className="flex items-center justify-center p-3 border border-zinc-800 rounded-sm bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-50 text-white"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </button>

          <AppleSignin
            authOptions={{
              clientId: 'com.escapesymas.web', // Reemplazar con real
              scope: 'email name',
              redirectURI: 'https://backendescapes.com/wp-json/escapes/v1/apple-callback', // Reemplazar
              state: 'state',
              nonce: 'nonce',
              usePopup: true
            }}
            uiType="dark"
            className="w-full flex"
            render={(props: ReturnType<any>) => (
              <button
                {...props}
                type="button"
                disabled={isLoading}
                className="flex items-center justify-center p-3 border border-zinc-800 rounded-sm bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-50 text-white"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.8 2.05.06 3.35.86 4.09 2.02-3.88 2.37-3.06 7.42.74 8.78-.96 2.38-2.52 4.41-3.49 5.17M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.02 4.5-3.74 4.25z"/>
                </svg>
              </button>
            )}
            onSuccess={(response: any) => handleSocialSuccess('apple', response)}
            onError={(error: any) => setError('Acceso con Apple fallido')}
          />

          <FacebookLogin
            appId="TU_FACEBOOK_APP_ID" // Reemplazar con real
            autoLoad={false}
            fields="name,email,picture"
            callback={(response: any) => handleSocialSuccess('facebook', response)}
            render={(renderProps: any) => (
              <button 
                type="button" 
                onClick={renderProps.onClick}
                disabled={isLoading}
                className="flex items-center justify-center p-3 border border-zinc-800 rounded-sm bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-50 text-white"
              >
                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            )}
          />
        </div>

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
