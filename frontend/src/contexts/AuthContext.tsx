import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterCandidateRequest, RegisterHRRequest } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  registerCandidate: (data: RegisterCandidateRequest) => Promise<void>;
  registerHR: (data: RegisterHRRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isHR: boolean;
  isCandidate: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on app load
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const authResponse = await apiService.login(credentials);
      localStorage.setItem('access_token', authResponse.access_token);
      
      // Note: The current backend doesn't return user info in login response
      // We'll need to either modify the backend or make a separate call to get user info
      // For now, we'll extract user info from the JWT token or make assumptions
      const mockUser: User = {
        id: 1,
        username: credentials.username_or_email,
        first_name: 'User',
        last_name: '',
        email: credentials.username_or_email.includes('@') ? credentials.username_or_email : '',
        role: credentials.username_or_email.includes('hr') ? 'HR' : 'Candidate',
        email_verified: true,
        created_at: new Date().toISOString(),
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      throw error;
    }
  };

  const registerCandidate = async (data: RegisterCandidateRequest) => {
    try {
      const user = await apiService.registerCandidate(data);
      // Auto-login after registration
      await login({ username_or_email: data.email, password: data.password });
    } catch (error) {
      throw error;
    }
  };

  const registerHR = async (data: RegisterHRRequest) => {
    try {
      const user = await apiService.registerHR(data);
      // Auto-login after registration
      await login({ username_or_email: data.email, password: data.password });
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isHR = user?.role === 'HR';
  const isCandidate = user?.role === 'Candidate';

  const value: AuthContextType = {
    user,
    loading,
    login,
    registerCandidate,
    registerHR,
    logout,
    isAuthenticated,
    isHR,
    isCandidate,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};