import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  demoAccounts: User[];
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoUser: (userId: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached =
      localStorage.getItem('supportpro_user') || sessionStorage.getItem('supportpro_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('supportpro_token') || sessionStorage.getItem('supportpro_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoAccounts, setDemoAccounts] = useState<User[]>([]);

  useEffect(() => {
    loadDemoAccounts();
    checkAuth();
  }, []);

  const loadDemoAccounts = async () => {
    try {
      const res = await authApi.getDemoAccounts();
      if (res.data.success) {
        setDemoAccounts(res.data.accounts);
      }
    } catch (err) {
      console.error('Failed to load demo accounts', err);
    }
  };

  const checkAuth = async () => {
    const savedToken =
      localStorage.getItem('supportpro_token') || sessionStorage.getItem('supportpro_token');
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.data.success) {
        setUser(res.data.user);
        if (localStorage.getItem('supportpro_token')) {
          localStorage.setItem('supportpro_user', JSON.stringify(res.data.user));
        } else {
          sessionStorage.setItem('supportpro_user', JSON.stringify(res.data.user));
        }
      }
    } catch (err) {
      localStorage.removeItem('supportpro_token');
      localStorage.removeItem('supportpro_user');
      localStorage.removeItem('supportpro_remember_me');
      sessionStorage.removeItem('supportpro_token');
      sessionStorage.removeItem('supportpro_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string = 'password123',
    rememberMe: boolean = false
  ) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        if (rememberMe) {
          localStorage.setItem('supportpro_token', res.data.token);
          localStorage.setItem('supportpro_user', JSON.stringify(res.data.user));
          localStorage.setItem('supportpro_remember_me', 'true');
          sessionStorage.removeItem('supportpro_token');
          sessionStorage.removeItem('supportpro_user');
        } else {
          sessionStorage.setItem('supportpro_token', res.data.token);
          sessionStorage.setItem('supportpro_user', JSON.stringify(res.data.user));
          localStorage.removeItem('supportpro_token');
          localStorage.removeItem('supportpro_user');
          localStorage.removeItem('supportpro_remember_me');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('supportpro_token', res.data.token);
        localStorage.setItem('supportpro_user', JSON.stringify(res.data.user));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('supportpro_token');
    localStorage.removeItem('supportpro_user');
    localStorage.removeItem('supportpro_remember_me');
    sessionStorage.removeItem('supportpro_token');
    sessionStorage.removeItem('supportpro_user');
    setUser(null);
    setToken(null);
  };

  const switchDemoUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.switchDemo(userId);
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('supportpro_token', res.data.token);
        localStorage.setItem('supportpro_user', JSON.stringify(res.data.user));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    const target = demoAccounts.find((a) => a.role === role);
    if (target) {
      await switchDemoUser(target.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        demoAccounts,
        login,
        register,
        logout,
        switchDemoUser,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
