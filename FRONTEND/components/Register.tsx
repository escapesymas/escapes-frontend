import { useState } from "react";
import { registerUser, saveSession, socialLoginUser } from "../services/auth";
import { fetchCustomerByEmail } from '../services/woocommerce';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import AppleSignin from 'react-apple-signin-auth';
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";

interface RegisterProps {
  onRegisterSuccess: () => void;
  onBack: () => void;
  onGoToLogin: () => void;
}

export function Register({ onRegisterSuccess, onBack, onGoToLogin }: RegisterProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username || !email || !password) {
      setError("Por favor, completa todos los campos obligatorios");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);

      const res = await registerUser({
        username,
        email,
        password,
      });

      // Si hay warning (cliente creado pero JWT falló), ir al login
      if (res.warning || !res.token) {
        alert("¡Cuenta creada correctamente! Por favor, inicia sesión.");
        onGoToLogin();
        return;
      }

      saveSession(res);
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  const handleSocialSuccess = async (provider: 'google' | 'facebook' | 'apple', response: any) => {
    setLoading(true);
    setError("");
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
        // If it returns a token, it means login/registration was successful on the WP side.
        saveSession(session);
        onRegisterSuccess();
      } else {
        setError(`Error al registrarse con ${provider}`);
      }
    } catch (e: any) {
       setError(e.message || `Error de conexión con ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => handleSocialSuccess('google', tokenResponse),
    onError: () => setError('Registro con Google cancelado o fallido'),
  });

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold uppercase text-xs tracking-widest">Volver</span>
        </button>

        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <UserPlus className="w-8 h-8 text-racing-orange" />
            <h1 className="text-2xl font-bold text-white uppercase italic">Crear Cuenta</h1>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-sm mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
              />
              <input
                type="text"
                placeholder="Apellidos"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
              />
            </div>

            <input
              type="text"
              placeholder="Usuario *"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
            />

            <input
              type="email"
              placeholder="Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
            />

            <input
              type="password"
              placeholder="Contraseña *"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
            />

            <input
              type="password"
              placeholder="Confirmar contraseña *"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between">
            <span className="border-b border-zinc-800 w-1/5"></span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">O regístrate con</span>
            <span className="border-b border-zinc-800 w-1/5"></span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => googleLogin()}
              disabled={loading}
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
                  disabled={loading}
                  className="flex items-center justify-center p-3 border border-zinc-800 rounded-sm bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-50 text-white"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.8 2.05.06 3.35.86 4.09 2.02-3.88 2.37-3.06 7.42.74 8.78-.96 2.38-2.52 4.41-3.49 5.17M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.02 4.5-3.74 4.25z"/>
                  </svg>
                </button>
              )}
              onSuccess={(response: any) => handleSocialSuccess('apple', response)}
              onError={(error: any) => setError('Registro con Apple fallido')}
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
                  disabled={loading}
                  className="flex items-center justify-center p-3 border border-zinc-800 rounded-sm bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-50 text-white"
                >
                  <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
              )}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
            <p className="text-zinc-500 text-sm">
              ¿Ya tienes una cuenta?{" "}
              <button
                onClick={onGoToLogin}
                className="text-racing-orange hover:text-white font-bold transition-colors"
              >
                Iniciar sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
