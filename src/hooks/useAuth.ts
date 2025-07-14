import { useCallback } from 'react';
import { authApiClient } from '@/core/api/auth/AuthApiClient';
import type { LoginResponse, User, ProfileData } from '@/core/api/auth/AuthApiClient';

export interface AuthenticatedApiOptions extends RequestInit {
  requiresAuth?: boolean;
}

// Re-export types for convenience
export type { LoginResponse, User, ProfileData };

/**
 * Comprehensive auth hook – still delegates network logic to authApiClient.
 * For global reactive `user` value, components can also use `state/AuthProvider`.
 */
export const useAuth = () => {
  const login = useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    const user = await authApiClient.login(email, password);
    return {
      message: 'Login successful',
      userId: user.userId,
      email: user.email,
      roles: user.roles
    };
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authApiClient.logout();
  }, []);

  const authenticatedFetch = useCallback(async (
    url: string,
    options: AuthenticatedApiOptions = {}
  ): Promise<Response> => {
    const { requiresAuth = true, ...fetchOptions } = options;

    if (!requiresAuth) {
      return fetch(url, {
        ...fetchOptions,
        credentials: 'include',
      });
    }

    return authApiClient.apiRequest(url, fetchOptions);
  }, []);

  const isAuthenticated = useCallback((): boolean => {
    return authApiClient.isAuthenticated();
  }, []);

  const getCurrentUser = useCallback((): User | null => {
    return authApiClient.getCurrentUser();
  }, []);

  const initializeSession = useCallback(async (): Promise<boolean> => {
    return authApiClient.initializeSession();
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<void> => {
    await authApiClient.refreshToken();
  }, []);

  const isSessionInitialized = useCallback((): boolean => {
    return authApiClient.isSessionInitialized();
  }, []);

  const getAuthenticationDebugInfo = useCallback((): Record<string, any> => {
    return authApiClient.getAuthenticationDebugInfo();
  }, []);

  const hasAuthenticationIndicators = useCallback((): boolean => {
    return authApiClient.hasAuthenticationIndicators();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                               Password Reset                               */
  /* -------------------------------------------------------------------------- */

  const requestPasswordReset = useCallback(async (email: string): Promise<void> => {
    await authApiClient.requestPasswordReset(email);
  }, []);

  const confirmPasswordReset = useCallback(async (
    token: string,
    newPassword: string
  ): Promise<void> => {
    await authApiClient.confirmPasswordReset(token, newPassword);
  }, []);

  // Direct access to authApiClient for advanced usage
  const withAuth = useCallback(async <T>(
    fetchFn: (apiRequest: typeof authApiClient.apiRequest) => Promise<T>
  ): Promise<T> => {
    return fetchFn(authApiClient.apiRequest.bind(authApiClient));
  }, []);

  const changePassword = useCallback(async (currentPwd: string, newPwd: string): Promise<void> => {
    await authApiClient.changePassword(currentPwd, newPwd);
  }, []);

  const needsPasswordReset = useCallback((): boolean => {
    return authApiClient.needsReset();
  }, []);

  const updateProfile = useCallback(async (firstName: string, lastName: string) => {
    return await authApiClient.updateProfile(firstName, lastName);
  }, []);

  return {
    login,
    logout,
    authenticatedFetch,
    refreshAccessToken,
    isAuthenticated,
    getCurrentUser,
    initializeSession,
    isSessionInitialized,
    getAuthenticationDebugInfo,
    hasAuthenticationIndicators,
    withAuth,
    requestPasswordReset,
    confirmPasswordReset,
    changePassword,
    needsPasswordReset,
    updateProfile,
  };
};