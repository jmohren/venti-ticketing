import React, { createContext, useEffect, useState } from 'react';
import { authApiClient, User, LoginResponse } from '../api/auth/AuthApiClient';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authApiClient.getCurrentUser());

  useEffect(() => {
    // Subscribe to authApiClient changes
    const unsubscribe = authApiClient.subscribe(setUser);
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    const loggedInUser = await authApiClient.login(email, password);
    // authApiClient will emit change; setUser will run automatically
    return {
      message: 'Login successful',
      userId: loggedInUser.userId,
      email: loggedInUser.email,
      roles: loggedInUser.roles,
    };
  };

  const logout = async (): Promise<void> => {
    await authApiClient.logout();
  };

  const refreshAccessToken = async (): Promise<void> => {
    await authApiClient.refreshToken();
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Note: useAuth hook is now defined in src/hooks/useAuth.ts for unified access. 