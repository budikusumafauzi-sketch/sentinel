import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { apiClient, ApiError } from '../api/client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email: string; name: string | null } | null;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.login(email, password);
      apiClient.setToken(response.data.accessToken);
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: response.data.user,
        error: null,
      });
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed. Please try again.';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      return false;
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await apiClient.register(email, password, name);
        apiClient.setToken(response.data.accessToken);
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: response.data.user,
          error: null,
        });
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        return false;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    apiClient.setToken(null);
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      clearError,
    }),
    [state, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
