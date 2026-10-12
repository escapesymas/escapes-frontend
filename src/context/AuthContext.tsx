'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiLogin, apiRegister, apiVerifyEmail, apiGetProfile, apiUpdateProfile, apiDeleteAccount, SessionData, UserProfile, UserBilling, RegisterResult } from '../lib/api';
import { apiRequest } from '../lib/constants';
import { trackEvent as trackUmami } from '../lib/umami';

const SESSION_KEY = 'tg_session';

interface AuthState {
  session: SessionData | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    phone?: string
  ) => Promise<RegisterResult>;
  /** Confirma el email con el token del enlace e inicia sesión. */
  verifyEmail: (token: string) => Promise<void>;
  logout: () => void;
  syncGarage: (newGarage: string[]) => Promise<void>;
  /**
   * Guarda el perfil en el servidor (lanza el error si lo rechaza) y lo
   * actualiza en pantalla. Un email nuevo queda en `pendingEmail` hasta que
   * se confirma. `skipRemote`: el servidor ya lo tiene (p. ej. el avatar subido).
   */
  updateProfile: (params: ProfileUpdate, skipRemote?: boolean) => Promise<{ pendingEmail?: string }>;
  /** Vuelve a leer el perfil del servidor (p. ej. tras confirmar el email nuevo). */
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

type ProfileUpdate = {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  billing?: UserBilling;
  avatarUrl?: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** El token (JWT) ya ha caducado: la sesión guardada no sirve aunque tenga los datos del usuario. */
function tokenExpired(token?: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carga el perfil completo a partir de un token de sesión guardado
  const loadProfile = useCallback(async (s: SessionData) => {
    try {
      const email = s?.user_email || s?.user?.email;
      const userId = s?.user_id || s?.user?.id;
      if (s?.user) {
        setUser(s.user);
      }
      if (!email && !userId) {
        if (!s?.user) setUser(null);
        return;
      }
      const profile = await apiGetProfile(email, userId);
      if (profile) {
        setUser(profile);
      } else if (s?.user) {
        setUser(s.user);
      } else {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
        setUser(null);
      }
    } catch {
      if (s?.user) {
        setUser(s.user);
      } else {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
        setUser(null);
      }
    }
  }, []);

  // Al montar: intentar restaurar sesión desde localStorage
  useEffect(() => {
    let cancelled = false;
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const saved: SessionData = JSON.parse(raw);
        // Sesión caducada: se cierra en vez de mostrar al usuario como conectado
        // (el servidor rechazaría el chat, el perfil y los pedidos a su nombre).
        if (tokenExpired(saved.token)) {
          localStorage.removeItem(SESSION_KEY);
          setIsLoading(false);
          return () => { cancelled = true; };
        }
        setSession(saved);
        if (saved.user) {
          setUser(saved.user);
        }
        loadProfile(saved).then(() => {
          if (!cancelled) setIsLoading(false);
        }).catch(() => {
          if (!cancelled) setIsLoading(false);
        });
      } catch {
        localStorage.removeItem(SESSION_KEY);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
    return () => { cancelled = true; };
  }, [loadProfile]);

  // Escuchar 'session-expired' para forzar logout cuando el backend rechace JWT
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(SESSION_KEY);
      setSession(null);
      setUser(null);
    };
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

  const persistSession = (s: SessionData) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  };

  // Las visitas del equipo (administradores y asesores) no cuentan en Umami:
  // el script no envía nada si existe «umami.disabled». Se queda en el
  // dispositivo aunque se cierre la sesión.
  useEffect(() => {
    if (session?.role === 'admin' || session?.role === 'asesor') {
      try { localStorage.setItem('umami.disabled', '1'); } catch { /* sin storage */ }
    }
  }, [session?.role]);

  const login = async (username: string, password: string) => {
    const s = await apiLogin(username, password);
    persistSession(s);
    trackUmami('login');
    await loadProfile(s);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    phone?: string
  ) => {
    // La cuenta queda pendiente de confirmar el email: sin sesión todavía.
    const result = await apiRegister(username, email, password, firstName, lastName, phone);
    trackUmami('sign_up');
    return result;
  };

  const verifyEmail = async (token: string) => {
    const s = await apiVerifyEmail(token);
    persistSession(s);
    trackUmami('email_verified');
    await loadProfile(s);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    apiRequest('/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setSession(null);
    setUser(null);
    // Notify CartContext (and any other listener) that they must drop their
    // state — without this the next user on a shared device inherits the
    // previous session's cart. See audit 2026-08-15, finding #12.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('escapes:user-changed'));
      localStorage.removeItem('escapesymas_cart');
    }
  };

  const syncGarage = async (newGarage: string[]) => {
    if (user) {
      await apiUpdateProfile(user.id, { garage: newGarage });
      setUser(prev => prev ? { ...prev, garage: newGarage } : null);
    }
  };

  // Copia del perfil en la sesión guardada: al recargar se pinta ya al día.
  const persistUser = (updated: UserProfile) => {
    if (!session) return;
    persistSession({
      ...session,
      user: updated,
      user_email: updated.email,
      user_nicename: updated.username,
      user_display_name: updated.firstName || updated.username,
      avatarUrl: updated.avatarUrl,
    });
  };

  const updateProfile = async (params: ProfileUpdate, skipRemote: boolean = false) => {
    if (!user) return {};
    // Si el servidor lo rechaza (usuario o email ya usados…) el error llega a la
    // pantalla: antes se ignoraba y el perfil parecía guardado sin estarlo.
    const result: { pendingEmail?: string } = skipRemote ? {} : await apiUpdateProfile(user.id, params);
    const updated: UserProfile = {
      ...user,
      username: params.username ?? user.username,
      firstName: params.firstName ?? user.firstName,
      lastName: params.lastName ?? user.lastName,
      // El email nuevo no cuenta hasta que se confirma desde el enlace.
      email: params.email !== undefined && !result.pendingEmail ? params.email : user.email,
      pendingEmail: result.pendingEmail ?? user.pendingEmail,
      billing: params.billing ?? user.billing,
      avatarUrl: params.avatarUrl ?? user.avatarUrl,
    };
    setUser(updated);
    persistUser(updated);
    return { pendingEmail: result.pendingEmail };
  };

  const refreshProfile = async () => {
    if (!session) return;
    const profile = await apiGetProfile(session.user_email, session.user_id);
    if (profile) {
      setUser(profile);
      persistUser(profile);
    }
  };

  const deleteAccount = async () => {
    if (user) {
      await apiDeleteAccount(user.id);
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isAuthenticated: !!session,
        login,
        register,
        verifyEmail,
        logout,
        syncGarage,
        updateProfile,
        refreshProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
