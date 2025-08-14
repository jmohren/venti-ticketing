import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authApiClient } from '@/core/api/auth/AuthApiClient';
import { appConfig } from '@/config/appConfig';

export interface AppUserProfile {
  firstName: string | null;
  lastName: string | null;
  isComplete: boolean;
}

export interface AppUser {
  userId: string;
  email: string;
  profile: AppUserProfile;
}

export interface UsersResponse {
  users: AppUser[];
  nextPaginationToken?: string | null;
}

interface UsersContextValue {
  users: AppUser[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  refresh: () => Promise<void>;
}

const UsersContext = createContext<UsersContextValue | undefined>(undefined);

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const res = await authApiClient.apiRequest(`${appConfig.api.baseUrl}/users/?limit=100`, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        signal,
      });

      if (!res.ok) {
        let errorPayload: unknown = null;
        try {
          errorPayload = await res.clone().json();
        } catch (_) {
          try {
            errorPayload = await res.clone().text();
          } catch (_) {
            // ignore
          }
        }
        console.error('❌ [USERS] Failed to fetch users', {
          status: res.status,
          url: `${appConfig.api.baseUrl}/users/?limit=100`,
          body: errorPayload,
        });
        throw new Error(`Failed to fetch users (${res.status})`);
      }

      const data: UsersResponse = await res.json();
      // Log entire data payload and a concise table
      console.log('🔄 [USERS] Loaded users response:', data);
      const count = Array.isArray(data.users) ? data.users.length : 0;
      console.log('📦 [USERS] Count:', count);
      if (Array.isArray(data.users) && data.users.length > 0) {
        try {
          console.table(
            data.users.map(u => ({
              userId: u.userId,
              email: u.email,
              firstName: u.profile?.firstName ?? null,
              lastName: u.profile?.lastName ?? null,
              isComplete: u.profile?.isComplete ?? null,
            }))
          );
        } catch (_) {
          // Fallback pretty-print if console.table is not available
          console.log('📋 [USERS] Users (first 10):', JSON.stringify(data.users.slice(0, 10), null, 2));
        }
      }

      setUsers(data.users || []);
      setLastFetchedAt(Date.now());
    } catch (err) {
      console.error('❌ [USERS] Fetch failed:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Kick off initial load on app start; abort on StrictMode test remounts
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  const value = useMemo<UsersContextValue>(() => ({
    users,
    loading,
    error,
    lastFetchedAt,
    refresh: () => fetchUsers(),
  }), [users, loading, error, lastFetchedAt, fetchUsers]);

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsersContext = (): UsersContextValue => {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsersContext must be used within UsersProvider');
  return ctx;
};


