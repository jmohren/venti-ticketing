import { useCallback } from 'react';
import { adminApiClient, AdminUser, CreateUserResponse, ListUsersResponse, DeleteUserResponse, CreateRoleResponse, AssignRoleResponse, UserRolesResponse, RevokeRoleResponse } from 'core/api';

/**
 * Pure admin hook to consume the AdminApiClient easily from React components.
 */
export const useAdmin = () => {

  /* ------------------------------ User actions ------------------------------ */

  const createUser = useCallback((email: string, password: string): Promise<CreateUserResponse> => {
    return adminApiClient.createUser(email, password);
  }, []);

  const listUsers = useCallback((limit = 10): Promise<ListUsersResponse> => {
    return adminApiClient.listUsers(limit);
  }, []);

  const getUserByEmail = useCallback((email: string): Promise<AdminUser> => {
    return adminApiClient.getUserByEmail(email);
  }, []);

  const deleteUser = useCallback((userId: string): Promise<DeleteUserResponse> => {
    return adminApiClient.deleteUser(userId);
  }, []);

  /* ------------------------------ Role actions ------------------------------ */

  const createRole = useCallback((role: string, permissions: string[]): Promise<CreateRoleResponse> => {
    return adminApiClient.createRole(role, permissions);
  }, []);

  const assignRole = useCallback((userId: string, role: string): Promise<AssignRoleResponse> => {
    return adminApiClient.assignRole(userId, role);
  }, []);

  const getUserRoles = useCallback((userId: string): Promise<UserRolesResponse> => {
    return adminApiClient.getUserRoles(userId);
  }, []);

  const revokeRole = useCallback((userId: string, role: string): Promise<RevokeRoleResponse> => {
    return adminApiClient.revokeRole(userId, role);
  }, []);

  return {
    createUser,
    listUsers,
    getUserByEmail,
    deleteUser,
    createRole,
    assignRole,
    getUserRoles,
    revokeRole,
  };
}; 