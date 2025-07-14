import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApiClient, User } from '../api/auth/AuthApiClient';

interface UserContextValue {
  user: User | null;
  roles: string[];
  isAdmin: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authApiClient.getCurrentUser());

  useEffect(() => {
    const unsubscribe = authApiClient.subscribe((u) => setUser(u));
    return unsubscribe;
  }, []);

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('admin');

  const value = useMemo(() => ({ user, roles, isAdmin }), [user, roles, isAdmin]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}; 