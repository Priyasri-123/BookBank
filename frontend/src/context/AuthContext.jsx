import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { getErrorMessage } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('bookbank_user');
    const token = localStorage.getItem('bookbank_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
      return;
    }

    const autoLogin = async () => {
      try {
        const { data } = await authApi.login({ email: 'admin@bookbank.com', password: 'Admin@123' });
        persistSession(data);
      } catch (err) {
        console.error('Auto-login failed:', err);
      } finally {
        setLoading(false);
      }
    };

    autoLogin();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await authApi.login({ email, password });
      persistSession(data);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await authApi.register(payload);
      persistSession(data);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  };

  const persistSession = (data) => {
    const sessionUser = { id: data.userId, name: data.name, email: data.email, role: data.role };
    localStorage.setItem('bookbank_token', data.token);
    localStorage.setItem('bookbank_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
  };

  const logout = () => {
    localStorage.removeItem('bookbank_token');
    localStorage.removeItem('bookbank_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
