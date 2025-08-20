import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { authApiClient, AuthApiClient } from '../auth/AuthApiClient';
import { appConfig } from '../../../config/appConfig';

// Query parameters for flexible PostgREST operations
export type QueryParams = {
  select?: string[];
  order?: string[];
  limit?: number;
  offset?: number;
  or?: string;
  and?: string;
  [key: string]: string | number | boolean | string[] | number[] | undefined;
};

// Generic REST API Client interface
export interface RestApiClient {
  // Generic CRUD operations with QueryParams support
  get<T = any>(table: string, params?: QueryParams): Promise<T[]>;
  getWithCount<T = any>(table: string, params?: QueryParams): Promise<{ data: T[], count: number }>;
  post<T = any>(table: string, data: any): Promise<T>;
  patch<T = any>(table: string, data: any, params?: Omit<QueryParams, 'select' | 'order'>): Promise<T[]>;
  delete(table: string, params?: Omit<QueryParams, 'select' | 'order'>): Promise<void>;
  
  // Convenience methods for common operations
  findOne<T>(table: string, id: string | number): Promise<T | null>;
  create<T>(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  update<T>(table: string, id: string | number, data: Partial<T>): Promise<T>;
  deleteById(table: string, id: string | number): Promise<void>;
  
  // Raw query method for custom endpoints
  query<T>(endpoint: string, options?: AxiosRequestConfig): Promise<T>;
}

/**
 * Axios-based REST API Client with built-in authentication and app name injection
 * 
 * Features:
 * - Automatic authentication handling via AuthApiClient
 * - PostgREST-compatible query parameter processing
 * - App name injection for multi-tenant APIs
 * - Built on industry-standard Axios for reliability
 * 
 * @example
 * ```typescript
 * import { restApiClient } from './RestApiClient';
 * 
 * // Simple query
 * const users = await restApiClient.get('users', { limit: 10 });
 * 
 * // Complex query with PostgREST operators
 * const activeUsers = await restApiClient.get('users', {
 *   select: ['id', 'name', 'email'],
 *   'status': 'eq.active',
 *   'age': 'gte.18',
 *   order: ['created_at.desc'],
 *   limit: 50
 * });
 * ```
 */
class AxiosRestApiClient implements RestApiClient {
  private axios: AxiosInstance;
  private authClient: AuthApiClient;
  private appName: string;

  constructor(authClient?: AuthApiClient, baseUrl?: string, appName?: string) {
    this.authClient = authClient || authApiClient;
    this.appName = appName || appConfig.api.app;
    
    // Create Axios instance with default configuration
    this.axios = axios.create({
      baseURL: (baseUrl || appConfig.api.baseUrl).replace(/\/$/, ''),
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Setup request interceptor for authentication
    this.axios.interceptors.request.use(
      (config) => {
        // Add authentication via cookies (handled by authClient)
        config.withCredentials = true;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Setup response interceptor for auth handling
    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.log('🔄 Session expired, attempting refresh...');
          try {
            // Use authClient to refresh the session
            await this.authClient.refreshToken();
            // Retry the original request
            return this.axios.request(error.config);
          } catch (refreshError) {
            console.error('❌ Refresh failed:', refreshError);
            throw error;
          }
        }
        throw error;
      }
    );
  }

  /**
   * Build table URL with app name injection: /rest/{appName}/{table}
   */
  private getTableUrl(table: string): string {
    return `/rest/${this.appName}/${table}`;
  }

  /**
   * Convert QueryParams to Axios params object following PostgREST conventions
   */
  private buildParams(params: QueryParams = {}): Record<string, any> {
    const axiosParams: Record<string, any> = {};
    
    // Handle special PostgREST parameters
    if (params.select) axiosParams.select = params.select.join(',');
    if (params.order) axiosParams.order = params.order.join(',');
    if (params.limit) axiosParams.limit = params.limit;
    if (params.offset) axiosParams.offset = params.offset;
    if (params.or) axiosParams.or = params.or;
    if (params.and) axiosParams.and = params.and;
    
    // Handle filter parameters with PostgREST operators
    Object.entries(params).forEach(([key, value]) => {
      if (!['select', 'order', 'limit', 'offset', 'or', 'and'].includes(key) && value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          axiosParams[key] = `in.(${value.join(',')})`;
        } else {
          const valueStr = String(value);
          // Check if value already has a PostgREST operator
          if (valueStr.match(/^(eq|neq|gt|gte|lt|lte|like|ilike|in|is|not|or|and)\./)) {
            axiosParams[key] = valueStr;
          } else {
            // Default to equality operator
            axiosParams[key] = `eq.${value}`;
          }
        }
      }
    });

    return axiosParams;
  }

  // Generic CRUD operations
  async get<T = any>(table: string, params: QueryParams = {}): Promise<T[]> {
    try {
      const response: AxiosResponse<T[]> = await this.axios.get(this.getTableUrl(table), {
        params: this.buildParams(params)
      });
      return response.data;
    } catch (error) {
      console.error(`❌ GET ${table} failed:`, error);
      throw error;
    }
  }

  // Get with count - returns data and total count
  async getWithCount<T = any>(table: string, params: QueryParams = {}): Promise<{ data: T[], count: number }> {
    try {
      const response: AxiosResponse<T[]> = await this.axios.get(this.getTableUrl(table), {
        params: this.buildParams(params),
        headers: {
          'Prefer': 'count=exact'
        }
      });
      
      // PostgREST returns count in Content-Range header: "0-99/1000" or "*/0"
      // Try different header case variations (some proxies change case)
      const contentRange = response.headers['content-range'] || 
                          response.headers['Content-Range'] ||
                          response.headers['CONTENT-RANGE'];
      let count = 0;
      
      // Debug logging for deployed environment
      console.log('🔍 getWithCount debug:', {
        table,
        contentRange,
        allHeaders: response.headers,
        dataLength: response.data.length
      });
      
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match) {
          count = parseInt(match[1], 10);
        }
      } else {
        console.error('❌ Content-Range header missing! Check PostgREST configuration and proxy settings.');
      }
      
      return {
        data: response.data,
        count
      };
    } catch (error) {
      console.error(`❌ GET with count ${table} failed:`, error);
      throw error;
    }
  }

  async post<T = any>(table: string, data: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axios.post(this.getTableUrl(table), data, {
        headers: {
          'Prefer': 'return=representation'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ POST ${table} failed:`, error);
      throw error;
    }
  }

  async patch<T = any>(table: string, data: any, params: Omit<QueryParams, 'select' | 'order'> = {}): Promise<T[]> {
    try {
      const response: AxiosResponse<T[]> = await this.axios.patch(this.getTableUrl(table), data, {
        params: this.buildParams(params),
        headers: {
          'Prefer': 'return=representation'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ PATCH ${table} failed:`, error);
      throw error;
    }
  }

  async delete(table: string, params: Omit<QueryParams, 'select' | 'order'> = {}): Promise<void> {
    try {
      await this.axios.delete(this.getTableUrl(table), {
        params: this.buildParams(params)
      });
    } catch (error) {
      console.error(`❌ DELETE ${table} failed:`, error);
      throw error;
    }
  }

  // Convenience methods for common operations
  async findOne<T>(table: string, id: string | number): Promise<T | null> {
    const results = await this.get<T>(table, { id: `eq.${id}`, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async create<T>(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const result = await this.post<T>(table, data);
    
    // Handle case where PostgREST returns array vs single object
    return Array.isArray(result) ? result[0] : result;
  }

  async update<T>(table: string, id: string | number, data: Partial<T>): Promise<T> {
    const results = await this.patch<T>(table, data, { id: `eq.${id}` });
    if (results.length === 0) {
      throw new Error(`No record found with id ${id} in table ${table}`);
    }
    return Array.isArray(results) ? results[0] : results;
  }

  async deleteById(table: string, id: string | number): Promise<void> {
    await this.delete(table, { id: `eq.${id}` });
  }

  /**
   * Raw query method for custom endpoints
   * @param endpoint - API endpoint (with or without leading slash)
   * @param options - Axios request configuration
   */
  async query<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
    try {
      const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response: AxiosResponse<T> = await this.axios.request({
        url,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Custom query ${endpoint} failed:`, error);
      throw error;
    }
  }
}

// SINGLE EXPORT: Only one way to access the API client
export const restApiClient: RestApiClient = new AxiosRestApiClient(); 