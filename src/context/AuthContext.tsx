'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiLogin, apiRegister, apiGetProfile, apiUpdateProfile, apiDeleteAccount, SessionData, UserProfile, UserBilling } from '../lib/api';

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
  ) => Promise<void>;
  logout: () => void;
  syncGarage: (newGarage: string[]) => Promise<void>;
  updateProfile: (params: {
    firstName?: string;
    lastName?: string;
    email?: string;
    billing?: UserBilling;
    avatarUrl?: string;
  }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const login = async (username: string, password: string) => {
    const s = await apiLogin(username, password);
    persistSession(s);
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
    const s = await apiRegister(username, email, password, firstName, lastName, phone);
    persistSession(s);
    await loadProfile(s);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setSession(null);
    setUser(null);
  };

  const syncGarage = async (newGarage: string[]) => {
    if (user) {
      await apiUpdateProfile(user.id, { garage: newGarage });
      setUser(prev => prev ? { ...prev, garage: newGarage } : null);
    }
  };

  const updateProfile = async (
    params: {
      username?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      billing?: UserBilling;
      avatarUrl?: string;
    },
    skipRemote: boolean = false
  ) => {
    if (user) {
      if (!skipRemote) {
        try {
          await apiUpdateProfile(user.id, params);
        } catch (err) {
          console.warn('[AuthContext] Remote API update-profile warning (backend will update fully after git push):', err);
        }
      }
      setUser(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          username: params.username !== undefined ? params.username : prev.username,
          firstName: params.firstName !== undefined ? params.firstName : prev.firstName,
          lastName: params.lastName !== undefined ? params.lastName : prev.lastName,
          email: params.email !== undefined ? params.email : prev.email,
          billing: params.billing !== undefined ? params.billing : prev.billing,
          avatarUrl: params.avatarUrl !== undefined ? params.avatarUrl : prev.avatarUrl,
        };
        try {
          const s = localStorage.getItem('escapes_session');
          if (s) {
            const parsed = JSON.parse(s);
            if (parsed.user) {
              parsed.user = { ...parsed.user, ...updated };
            }
            parsed.user_nicename = updated.username;
            parsed.user_display_name = `${updated.firstName} ${updated.lastName}`.trim();
            parsed.user_email = updated.email;
            localStorage.setItem('escapes_session', JSON.stringify(parsed));
          }
        } catch {}
        return updated;
      });
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
        logout,
        syncGarage,
        updateProfile,
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
