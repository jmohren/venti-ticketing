import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';
import { adminApiClient } from '../api/admin/AdminApiClient';

// Module-level cache: persisted for lifetime of page.
let cachedIsAdmin: boolean | null = null;
let cachedUserId: string | null = null;
let rolesRequestedForUser: string | null = null;

/**
 * Simple hook that returns `true` if the currently signed-in user has the 'admin' role.
 * Returns `false` when not authenticated or role missing. Updates when the auth
 * client changes its current user reference.
 */
export const useIsAdmin = (): boolean => {
  const { getCurrentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();

    // If user is null (logged out), clear caches and state
    if (!user) {
      cachedIsAdmin = null;
      cachedUserId = null;
      rolesRequestedForUser = null;
      setIsAdmin(false);
      return;
    }

    // If we switched user accounts, reset caches
    if (cachedUserId !== user.userId) {
      cachedIsAdmin = null;
      rolesRequestedForUser = null;
      cachedUserId = user.userId;
    }

    // Use cache if available
    if (cachedIsAdmin !== null) {
      setIsAdmin(cachedIsAdmin);
      return;
    }

    // If roles present in auth object, compute from there
    if (user.roles && user.roles.length > 0) {
      const admin = user.roles.includes('admin');
      cachedIsAdmin = admin;
      setIsAdmin(admin);
      return;
    }

    // Avoid refetching for same user
    if (rolesRequestedForUser === user.userId) return;
    rolesRequestedForUser = user.userId;

    adminApiClient.getUserRoles(user.userId)
      .then(res => {
        const admin = res.roles.includes('admin');
        cachedIsAdmin = admin;
        setIsAdmin(admin);
      })
      .catch(() => {/* swallow errors */});
  }, [getCurrentUser]);

  return isAdmin;
};

/**
 * Clears all cached admin-role related variables. Should be invoked on logout
 * to ensure subsequent logins re-evaluate roles correctly.
 */
export const resetIsAdminCache = (): void => {
  cachedIsAdmin = null;
  cachedUserId = null;
  rolesRequestedForUser = null;
}; 