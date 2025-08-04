import { appConfig } from '../../../config/appConfig';
import { authApiClient } from '../auth/AuthApiClient';

// ----------------------------------- Types -----------------------------------

export interface AdminUser {
  email: string;
  userId: string;
  timeJoined?: number;
}

export interface CreateUserResponse {
  status: 'OK';
  user: AdminUser;
}

export interface ListUsersResponse {
  users: AdminUser[];
}

export interface DeleteUserResponse {
  message: string;
  userId: string;
}

export interface CreateRoleResponse {
  createdNewRole: boolean;
  message: string;
  permissions: string[];
  role: string;
}

export interface AssignRoleResponse {
  didUserAlreadyHaveRole: boolean;
  message: string;
  role: string;
  userId: string;
}

export interface UserRolesResponse {
  userId: string;
  roles: string[];
}

export interface RevokeRoleResponse {
  didUserHaveRole: boolean;
  message: string;
  role: string;
  userId: string;
}

/**
 * Admin API client that reuses the authApiClient's cookie-based session handling.
 * All requests are sent with `credentials: include` and, when possible, routed
 * through authApiClient.apiRequest so token-refresh logic is preserved.
 */
export class AdminApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    // Re-use general API base URL if no dedicated admin one is provided
    this.baseUrl = baseUrl || appConfig.api.baseUrl;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Users                                     */
  /* -------------------------------------------------------------------------- */

  async createUser(email: string, password: string): Promise<CreateUserResponse> {
    const res = await authApiClient.apiRequest(
      `${this.baseUrl}/admin/users/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appname: appConfig.auth.appName,
          email, 
          password,
          roles: [appConfig.auth.appName]
        }),
      },
    );
    if (!res.ok) throw await this.extractError(res);
    return res.json();
  }

  async listUsers(limit: number = 10): Promise<ListUsersResponse> {
    const url = new URL(`${this.baseUrl}/admin/users/list`);
    url.searchParams.set('limit', String(limit));

    const res = await authApiClient.apiRequest(url.toString(), { method: 'GET' });
    if (!res.ok) throw await this.extractError(res);
    return res.json();
  }

  async getUserByEmail(email: string): Promise<AdminUser> {
    const res = await authApiClient.apiRequest(
      `${this.baseUrl}/admin/users/get/${encodeURIComponent(email)}`,
      { method: 'GET' },
    );
    if (!res.ok) throw await this.extractError(res);
    return res.json();
  }

  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    const res = await authApiClient.apiRequest(
      `${this.baseUrl}/admin/users/delete/${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    );
    if (!res.ok) throw await this.extractError(res);
    return res.json();
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Roles                                    */
  /* -------------------------------------------------------------------------- */

  async createRole(role: string, permissions: string[]): Promise<CreateRoleResponse> {
    const res = await authApiClient.apiRequest(
      `${this.baseUrl}/admin/roles/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissions }),
      },
    );
    if (!res.ok) throw await this.extractError(res);
    return res.json();
  }

  async assignRole(userId: string, role: string): Promise<AssignRoleResponse> {
    const res = await authApiClient.apiRequest(
      `${this.baseUrl}/admin/roles/assign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      },
    );
    if (!res.ok) throw await this.extractError(res);
    return res.json();
  }

  /* -------------------------------------------------------------------------- */
  /*                               Error Helper                                 */
  /* -------------------------------------------------------------------------- */

  private async extractError(res: Response): Promise<Error> {
    try {
      const data = await res.clone().json();
      const message = data?.error || data?.message || `Request failed with status ${res.status}`;
      return new Error(message);
    } catch (_) {
      return new Error(`Request failed with status ${res.status}`);
    }
  }

  /* ------------------------- Roles get & revoke ------------------------- */

  async getUserRoles(userId: string): Promise<UserRolesResponse> {
    const res = await authApiClient.apiRequest(`${this.baseUrl}/admin/users/${encodeURIComponent(userId)}/roles`, { method: 'GET' });
    if (!res.ok) throw await this.extractError(res);
    return res.json();
  }

  async revokeRole(userId: string, role: string): Promise<RevokeRoleResponse> {
    const res = await authApiClient.apiRequest(`${this.baseUrl}/admin/roles/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
    if (!res.ok) throw await this.extractError(res);
    return res.json();
  }
}

// Singleton export
export const adminApiClient = new AdminApiClient(); 