'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface User {
  email: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname?: string;
  userId: string;
  role: 'contratante' | 'portador';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<any>;
  loginWithOtp: (email: string, otp: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<any>;
  resendOtp: (email: string) => Promise<any>;
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

  useEffect(() => {
    // Solo acceder a localStorage en el cliente
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      // Decodificar JWT para obtener información del usuario
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({
            email: payload.upn,
            firstName: payload.firstName,
            paternalSurname: payload.paternalSurname,
            maternalSurname: payload.maternalSurname,
            userId: payload.contratanteId.toString(),
            role: payload.groups[0] // El primer grupo es el rol
          });
        } else {
          // Token expirado
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          setToken(null);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        setToken(null);
      }
    }
    setLoading(false);
  }, [token]);

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
      setUser({
        email: payload.upn,
        firstName: payload.firstName,
        paternalSurname: payload.paternalSurname,
        maternalSurname: payload.maternalSurname,
        userId: payload.contratanteId.toString(),
        role: payload.groups[0] // El primer grupo es el rol
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
      setUser({
        email: payload.upn,
        firstName: payload.firstName,
        paternalSurname: payload.paternalSurname,
        maternalSurname: payload.maternalSurname,
        userId: payload.contratanteId.toString(),
        role: payload.groups[0] // El primer grupo es el rol
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authApi.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const response = await authApi.verifyOtp(email, otp);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const resendOtp = async (email: string) => {
    try {
      const response = await authApi.resendOtp(email);
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
    register,
    verifyOtp,
    resendOtp,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};