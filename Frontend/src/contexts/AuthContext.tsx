import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Calls the @router.get("/me") endpoint in your Python auth.py
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (err) {
      console.error("Session expired or invalid");
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // 1. Use URLSearchParams for application/x-www-form-urlencoded format
      const params = new URLSearchParams();
      params.append('username', email); // OAuth2 spec uses 'username'
      params.append('password', password);

      // 2. Send the request
      const response = await api.post('/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      localStorage.setItem('token', response.data.access_token);
      
      await loadUser();
      return { error: null };
    } catch (error: any) {
      console.error("Login error:", error.response?.data);
      const msg = error.response?.data?.detail || 'Login failed';
      return { error: msg };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      await api.post('/auth/signup', { 
        email, 
        password, 
        full_name: fullName 
      });
      return { error: null };
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Signup failed';
      return { error: msg };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}