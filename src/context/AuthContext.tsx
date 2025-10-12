'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface User {
  email: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname?: string;
  userId: string;
  role: 'contratante' | 'portador' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<any>;
  loginWithOtp: (email: string, otp: string) => Promise<any>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Solo acceder a localStorage en el cliente
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;

    if (token) {
      // Decodificar JWT para obtener información del usuario
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        if (payload.exp * 1000 > Date.now()) {
          const role = (payload.groups && payload.groups[0]) || 'contratante';
          let userId;

          if (role === 'admin') {
            userId = payload.adminId;
          } else if (role === 'contratante') {
            userId = payload.contratanteId;
          } else {
            userId = payload.userId;
          }

          setUser({
            email: payload.upn || payload.email,
            firstName: payload.firstName || 'Usuario',
            paternalSurname: payload.paternalSurname || payload.lastName || '',
            maternalSurname: payload.maternalSurname || '',
            userId: userId?.toString() || '',
            role: role as 'contratante' | 'portador' | 'admin'
          });
        } else {
          // Token expirado
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        setToken(null);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token, initialized]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const { token } = response.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      setToken(token);
      
      // Decodificar el token para obtener la información del usuario
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = (payload.groups && payload.groups[0]) || 'contratante';
      let userId;

      if (role === 'admin') {
        userId = payload.adminId;
      } else if (role === 'contratante') {
        userId = payload.contratanteId;
      } else {
        userId = payload.userId;
      }

      setUser({
        email: payload.upn,
        firstName: payload.firstName,
        paternalSurname: payload.paternalSurname || payload.lastName || '',
        maternalSurname: payload.maternalSurname,
        userId: userId.toString(),
        role: role as 'contratante' | 'portador' | 'admin'
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const loginWithOtp = async (email: string, otp: string) => {
    try {
      const response = await authApi.loginVerifyOtp(email, otp);
      const { token } = response.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      setToken(token);
      
      // Decodificar el token para obtener la información del usuario
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = (payload.groups && payload.groups[0]) || 'contratante';
      let userId;

      if (role === 'admin') {
        userId = payload.adminId;
      } else if (role === 'contratante') {
        userId = payload.contratanteId;
      } else {
        userId = payload.userId;
      }

      setUser({
        email: payload.upn,
        firstName: payload.firstName,
        paternalSurname: payload.paternalSurname || payload.lastName || '',
        maternalSurname: payload.maternalSurname,
        userId: userId.toString(),
        role: role as 'contratante' | 'portador' | 'admin'
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    loginWithOtp,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};