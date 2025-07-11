import { appConfig } from '../../config/appConfig';

// Auth-related interfaces
export interface LoginResponse {
  message: string;
  userId: string;
  email: string;
  roles: string[];
  needsPasswordReset?: boolean;
}

export interface User {
  userId: string;
  email: string;
  roles: string[];
}

export interface AuthApiClient {
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  refreshToken(): Promise<void>;
  getCurrentUser(): User | null;
  isAuthenticated(): boolean;
  initializeSession(): Promise<boolean>;
  silentAuthCheck(): Promise<boolean>;
  apiRequest(url: string, options?: RequestInit): Promise<Response>;
  hasAuthenticationIndicators(): boolean;
  getAuthenticationDebugInfo(): Record<string, any>;
  isSessionInitialized(): boolean;
  requestPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(token: string, newPassword: string): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  needsReset(): boolean;
}

/**
 * Generic Auth API Client with built-in cookie-based authentication
 * Framework-agnostic, can be used in any JavaScript environment
 */
export class CookieAuthApiClient implements AuthApiClient {
  private refreshing: Promise<void> | null = null;
  private currentUser: User | null = null;
  private sessionInitialized: boolean = false;
  private refreshInterval: NodeJS.Timeout | null = null;
  private authBaseUrl: string;
  private needsPasswordReset: boolean = false;

  constructor(authBaseUrl?: string) {
    this.authBaseUrl = authBaseUrl || appConfig.api.authBaseUrl;
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${this.authBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data: any = await response.json();

      // Support both legacy flat schema and new { user: { id, email, roles } } schema
      const dataUserId: string = data.userId || data.user?.id || '';
      const dataEmail: string = data.email || data.user?.email || '';

      // Extract roles if present in body
      let initialRoles: string[] = Array.isArray(data.roles)
        ? data.roles
        : Array.isArray(data.user?.roles)
          ? data.user.roles
          : [];

      this.currentUser = {
        userId: dataUserId,
        email: dataEmail,
        roles: initialRoles
      };
      
      this.sessionInitialized = true;
      if (data.metadata && typeof data.metadata.needsPasswordReset !== 'undefined') {
        this.needsPasswordReset = !!data.metadata.needsPasswordReset;
      }

      // If roles are missing, fetch them immediately via /auth/me endpoint
      if (this.currentUser && this.currentUser.roles.length === 0) {
        try {
          const meRes = await fetch(`${this.authBaseUrl}/auth/me`, { method: 'GET', credentials: 'include' });
          if (meRes.ok) {
            const me = await meRes.json();
            if (Array.isArray(me.roles)) {
              this.currentUser.roles = me.roles;
            }
          }
        } catch (e) {
          console.warn('[AuthApiClient] Could not fetch roles via /auth/me', e);
        }
      }

      this.startAutoRefresh();
      
      return this.currentUser;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      this.stopAutoRefresh();
      
      await fetch(`${this.authBaseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      this.currentUser = null;
      this.sessionInitialized = false;
    }
  }

  async refreshToken(): Promise<void> {
    if (this.refreshing) {
      return this.refreshing;
    }

    this.refreshing = (async () => {
      try {
        const response = await fetch(`${this.authBaseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });

        if (!response.ok) {
          console.log('❌ Session expired - refresh failed');
          this.logout();
          throw new Error('Session expired');
        }

        const data: any = await response.json();
        // decoded front-token can be large; avoid logging unless debugging is needed

        const dataUserId: string = data.userId || data.user?.id || '';
        const dataEmail: string = data.email || data.user?.email || '';
        const rolesFromBody: string[] = Array.isArray(data.roles)
          ? data.roles
          : Array.isArray(data.user?.roles)
            ? data.user.roles
            : [];

        if (dataUserId && dataEmail) {
          const roles = rolesFromBody.length ? rolesFromBody : this.extractRolesFromFrontToken(response.headers);
          this.currentUser = {
            userId: dataUserId,
            email: dataEmail,
            roles
          };
        }
        
        this.sessionInitialized = true;
        if (data.metadata && typeof data.metadata.needsPasswordReset !== 'undefined') {
          this.needsPasswordReset = !!data.metadata.needsPasswordReset;
        }
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        this.logout();
        throw error;
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }

  async apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });

      if (response.status === 401) {
        console.log('🔄 Session expired, attempting refresh...');
        
        try {
          await this.refreshToken();
          
          return fetch(url, { 
            ...options, 
            headers, 
            credentials: 'include' 
          });
        } catch (refreshError) {
          console.error('❌ Refresh failed during API request:', refreshError);
          return response;
        }
      }

      if (response.status === 403) {
        console.log('🚫 Access denied (403) - insufficient permissions');
        return response;
      }

      return response;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  async silentAuthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.authBaseUrl}/auth/me`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        try {
          const data = await response.json();
          
          if (data.userId && data.email) {
            this.currentUser = {
              userId: data.userId,
              email: data.email,
              roles: data.roles || []
            };
          }
        } catch (jsonError) {
          console.log('ℹ️ Response has no JSON body - verification only');
        }
        
        this.sessionInitialized = true;
        return true;
      }
      
      if (response.status === 401) {
        console.log('🔄 Access token expired (401), attempting refresh...');
        try {
          await this.refreshToken();
          return true;
        } catch (refreshError) {
          console.error('❌ Refresh failed:', refreshError);
          return false;
        }
      }
      
      if (response.status === 404) {
        console.log('⚠️ /auth/me endpoint not found (404) - falling back to refresh method');
        try {
          await this.refreshToken();
          return true;
        } catch (refreshError) {
          console.error('❌ Fallback refresh failed:', refreshError);
          return false;
        }
      }
      
      console.log('❌ Silent auth check failed with status:', response.status);
      return false;
      
    } catch (error) {
      console.error('❌ Silent auth check error:', error);
      
      console.log('⚠️ Falling back to refresh method due to error');
      try {
        await this.refreshToken();
        return true;
      } catch (refreshError) {
        console.error('❌ Error fallback refresh failed:', refreshError);
        return false;
      }
    }
  }

  async initializeSession(): Promise<boolean> {
    if (this.sessionInitialized) {
      return true;
    }

    try {
      const silentSuccess = await this.silentAuthCheck();
      
      if (silentSuccess) {
        this.startAutoRefresh();
        return true;
      }
      
      console.log('❌ Session initialization failed - user needs to login');
      return false;
      
    } catch (error) {
      console.error('❌ Session initialization error:', error);
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.sessionInitialized && !!this.currentUser;
  }

  isSessionInitialized(): boolean {
    return this.sessionInitialized;
  }

  hasAuthenticationIndicators(): boolean {
    if (this.sessionInitialized && this.currentUser) {
      return true;
    }
    
    return this.hasAuthCookies();
  }

  getAuthenticationDebugInfo(): Record<string, any> {
    return {
      sessionInitialized: this.sessionInitialized,
      hasCurrentUser: !!this.currentUser,
      currentUserEmail: this.currentUser?.email || null,
      hasAuthCookies: this.hasAuthCookies(),
      isAuthenticated: this.isAuthenticated(),
      autoRefreshActive: !!this.refreshInterval,
      authBaseUrl: this.authBaseUrl,
      needsPasswordReset: this.needsPasswordReset
    };
  }

  private hasAuthCookies(): boolean {
    if (typeof document === 'undefined') return false;
    
    const authCookieNames = [
      'sAccessToken', 
      'sRefreshToken', 
      'sIdRefreshToken', 
      'sFrontToken',
      'st-access-token',
      'st-refresh-token'
    ];
    
    const cookies = document.cookie;
    return authCookieNames.some(name => cookies.includes(name));
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    
    this.refreshInterval = setInterval(async () => {
      if (this.isAuthenticated()) {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('❌ Auto-refresh failed:', error);
        }
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Password Reset                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Send a request to the backend to dispatch a password-reset email.
   * The backend is assumed to comply with the SuperTokens password-reset recipe
   * and expose the endpoint POST /auth/password-reset/request.
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.authBaseUrl}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const error = await this.extractErrorMessage(response);
        throw new Error(error || 'Password reset request failed');
      }
    } catch (error) {
      console.error('❌ Password reset request failed:', error);
      throw error;
    }
  }

  /**
   * Confirm a password-reset by providing the reset token and the new password.
   * The backend is assumed to expose POST /auth/password-reset/confirm.
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${this.authBaseUrl}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      if (!response.ok) {
        const error = await this.extractErrorMessage(response);
        throw new Error(error || 'Password reset confirmation failed');
      }
    } catch (error) {
      console.error('❌ Password reset confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Extracts the `error` field from a JSON-encoded error response if present.
   * Always returns a string (may be empty) so that the caller can decide what
   * to do with it.
   */
  private async extractErrorMessage(response: Response): Promise<string> {
    try {
      const data = await response.clone().json();
      return data?.error || data?.message || '';
    } catch (_) {
      return '';
    }
  }

  /** Change password with current password and new one */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch(`${this.authBaseUrl}/auth/password/change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!res.ok) {
      const err = await this.extractErrorMessage(res);
      throw new Error(err || 'Password change failed');
    }

    // clear flag
    this.needsPasswordReset = false;
  }

  needsReset(): boolean {
    return this.needsPasswordReset;
  }

  // Helper: parse SuperTokens front-token header to extract roles array
  private extractRolesFromFrontToken(headers: Headers): string[] {
    const token = headers.get('front-token');
    if (!token) return [];

    // decoded front-token can be large; avoid logging unless debugging is needed

    try {
      // The entire token is base64-encoded JSON per SuperTokens spec
      const decoded = atob(token);
      const json = JSON.parse(decoded);
      // roles can be under json.up['st-role'].v or json['st-role'].v depending on SuperTokens version
      let roles: unknown = undefined;
      if (json?.up && json.up['st-role']) {
        roles = json.up['st-role'].v;
      } else if (json?.['st-role']) {
        roles = json['st-role'].v;
      }
      if (Array.isArray(roles)) {
        return roles as string[];
      }
    } catch (e) {
      console.warn('[AuthApiClient] Unable to parse front-token', e);
    }
    return [];
  }
}

// Create singleton instance
export const authApiClient = new CookieAuthApiClient(); 