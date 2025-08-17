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
  getDisplayNameFromUserId: (userId?: string | null, fallback?: string, timeoutMs?: number) => Promise<string>;
  getDisplayNameFromUserIdSync: (userId?: string | null, fallback?: string) => string;
}

const UsersContext = createContext<UsersContextValue | undefined>(undefined);

// Cache configuration
const CACHE_KEY = 'venti_users_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface CachedUsersData {
  users: AppUser[];
  timestamp: number;
}

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  // Helper functions for cache management
  const getCachedUsers = useCallback((): CachedUsersData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data: CachedUsersData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid (within 1 hour)
      if (now - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('⚠️ [USERS] Failed to read cache:', error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  const setCachedUsers = useCallback((users: AppUser[]) => {
    try {
      const cacheData: CachedUsersData = {
        users,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 [USERS] Cached users data for 1 hour');
    } catch (error) {
      console.warn('⚠️ [USERS] Failed to cache users:', error);
    }
  }, []);

  // Initialize with cached data if available
  useEffect(() => {
    const cachedData = getCachedUsers();
    if (cachedData) {
      console.log('🚀 [USERS] Initializing with cached data from', new Date(cachedData.timestamp).toLocaleString());
      setUsers(cachedData.users);
      setLastFetchedAt(cachedData.timestamp);
    }
  }, [getCachedUsers]); // Run only once on mount

  const fetchUsers = useCallback(async (signal?: AbortSignal, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first unless force refresh is requested
      if (!forceRefresh) {
        const cachedData = getCachedUsers();
        if (cachedData) {
          console.log('📦 [USERS] Using cached data from', new Date(cachedData.timestamp).toLocaleString());
          setUsers(cachedData.users);
          setLastFetchedAt(cachedData.timestamp);
          setLoading(false);
          return;
        }
      }

      console.log('🔄 [USERS] Fetching fresh data from API');
      const res = await authApiClient.apiRequest(`${appConfig.api.baseUrl}/users/?limit=100`, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        signal,
      });

      if (!res.ok) {
        let errorPayload: unknown = null;
        try {
          errorPayload = await res.clone().json();
        } catch {
          try {
            errorPayload = await res.clone().text();
          } catch {
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
        } catch {
          // Fallback pretty-print if console.table is not available
          console.log('📋 [USERS] Users (first 10):', JSON.stringify(data.users.slice(0, 10), null, 2));
        }
      }

      const usersData = data.users || [];
      setUsers(usersData);
      const timestamp = Date.now();
      setLastFetchedAt(timestamp);
      
      // Cache the data for future use
      setCachedUsers(usersData);
    } catch (err) {
      console.error('❌ [USERS] Fetch failed:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [getCachedUsers, setCachedUsers]);

  useEffect(() => {
    // Kick off initial load on app start; abort on StrictMode test remounts
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  // Build synchronous lookup map from userId to display name
  const userIdToDisplayName = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      const fn = u.profile?.firstName || '';
      const ln = u.profile?.lastName || '';
      const full = [fn, ln].filter(Boolean).join(' ');
      map.set(u.userId, full || u.email || u.userId);
    }
    return map;
  }, [users]);

  // Centralized function to get display name from user ID
  const getDisplayNameFromUserId = useCallback(async (userId?: string | null, fallback: string = '-', timeoutMs: number = 10000): Promise<string> => {
    if (!userId?.trim()) return fallback;
    
    // Check if it looks like a UUID (userId format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (!isUUID) {
      // Legacy data: it's already a display name, return as-is
      return userId;
    }

    // Wait for users data to be available or timeout
    const startTime = Date.now();
    while (users.length === 0 && (Date.now() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before checking again
    }

    // Check if we timed out
    if (users.length === 0 && (Date.now() - startTime) >= timeoutMs) {
      console.warn(`⚠️ [USERS] Timeout waiting for user data (${timeoutMs}ms) for userId: ${userId}`);
      return fallback;
    }

    // It's a userId, try to find the user
    const user = users.find(u => u.userId === userId);
    if (user) {
      const fn = user.profile?.firstName || '';
      const ln = user.profile?.lastName || '';
      const full = [fn, ln].filter(Boolean).join(' ');
      return full || user.email;
    }
    
    // User ID not found in database
    console.warn(`⚠️ [USERS] User ID not found in user database: ${userId}`);
    return fallback;
  }, [users, loading, error]);

  // Synchronous getter for render paths (race-safe via map + fallback)
  const getDisplayNameFromUserIdSync = useCallback((userId?: string | null, fallback: string = '-') => {
    if (!userId?.trim()) return fallback;
    // If legacy display name already passed, return as-is
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) return userId;
    return userIdToDisplayName.get(userId) || fallback || userId;
  }, [userIdToDisplayName]);



  const value = useMemo<UsersContextValue>(() => ({
    users,
    loading,
    error,
    lastFetchedAt,
    refresh: () => fetchUsers(undefined, true), // Force refresh when manually called
    getDisplayNameFromUserId,
    getDisplayNameFromUserIdSync,
  }), [users, loading, error, lastFetchedAt, fetchUsers, getDisplayNameFromUserId, getDisplayNameFromUserIdSync]);

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


