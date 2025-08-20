import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApiClient, User } from '../api/auth/AuthApiClient';

interface UserContextValue {
  user: User | null;
  roles: string[];
  isAdmin: boolean;
  needsPasswordReset: boolean;
  profile: {
    firstName?: string;
    lastName?: string;
    fullName: string;
    isComplete: boolean;
  } | null;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authApiClient.getCurrentUser());

  useEffect(() => {
    const unsubscribe = authApiClient.subscribe((u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('admin');
  const needsPasswordReset = authApiClient.needsReset();
  
  const profile = user?.profile ? {
    firstName: user.profile.firstName,
    lastName: user.profile.lastName,
    fullName: [user.profile.firstName, user.profile.lastName].filter(Boolean).join(' ') || user.email.split('@')[0],
    isComplete: user.profile.isComplete
  } : null;

  const value = useMemo(() => ({ 
    user, 
    roles, 
    isAdmin, 
    needsPasswordReset,
    profile 
  }), [user, roles, isAdmin, needsPasswordReset, profile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}; 