import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('eb_user');
      const token  = localStorage.getItem('eb_token');
      if (stored && token) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) {
          setUser(parsed);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch {
      localStorage.removeItem('eb_token');
      localStorage.removeItem('eb_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((authResponse) => {
    const { accessToken, refreshToken, user: info } = authResponse;
    localStorage.setItem('eb_token', accessToken);
    localStorage.setItem('eb_user', JSON.stringify(info));
    if (refreshToken) localStorage.setItem('eb_refresh_token', refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setUser(info);
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('eb_refresh_token');
    if (refreshToken) authAPI.logout({ refreshToken }).catch(() => {});
    localStorage.removeItem('eb_token');
    localStorage.removeItem('eb_user');
    localStorage.removeItem('eb_refresh_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.info('Signed out successfully.');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('eb_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
