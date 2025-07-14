import { AuthApiClient, authApiClient } from '../auth/AuthApiClient';
import { appConfig } from '../../../config/appConfig';

// Storage API response interfaces
export interface StorageUploadResponse {
  container: string;
  blob_name: string;
  size: number;
  content_type: string;
  url: string;
  etag: string;
}

export interface StorageDeleteResponse {
  container: string;
  blob_name: string;
  status: string;
}

export interface StorageFileInfo {
  container: string;
  blob_name: string;
  size: number;
  content_type: string;
  last_modified: string;
  etag: string;
}

// Storage API Client Interface
export interface StorageApiClient {
  uploadFile(file: File, filePath: string, overwrite?: boolean): Promise<StorageUploadResponse>;
  getFileUrl(filePath: string): string;
  deleteFile(filePath: string): Promise<StorageDeleteResponse>;
  getFileInfo(filePath: string): Promise<StorageFileInfo>;
}

/**
 * Generic Storage API Client with built-in authentication and app name injection
 * Framework-agnostic, works with storage backends that support file operations
 * Supports file upload, download, deletion, and metadata retrieval
 */
export class GenericStorageApiClient implements StorageApiClient {
  private authClient: AuthApiClient;
  private baseUrl: string;
  private appName: string;

  constructor(authClient?: AuthApiClient, baseUrl?: string, appName: string = appConfig.api.app) {
    this.authClient = authClient || authApiClient;
    this.baseUrl = (baseUrl || appConfig.api.baseUrl).replace(/\/$/, '');
    this.appName = appName;
  }

  /**
   * Upload a file to the storage backend
   */
  async uploadFile(file: File, filePath: string, overwrite: boolean = true): Promise<StorageUploadResponse> {
    // URL encode the file path to handle slashes and special characters
    const encodedFilePath = encodeURIComponent(filePath);
    const url = `${this.baseUrl}/storage/${this.appName}/${encodedFilePath}${overwrite ? '?overwrite=true' : '?overwrite=false'}`;

    const formData = new FormData();
    formData.append('file', file);

    try {
      // For file uploads, we need to handle the request differently
      // The authClient.apiRequest might set JSON headers which interfere with FormData
      // So we'll use a more direct approach while still handling authentication
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Ensure cookies are sent for authentication
        // DO NOT set Content-Type header - let browser set it with proper boundary for FormData
      });

      // Handle authentication errors by retrying through the auth client
      if (response.status === 401) {
        console.log('🔄 File upload session expired, attempting refresh...');
        
        try {
          // Trigger auth refresh by making a dummy authenticated request
          await this.authClient.apiRequest(`${this.baseUrl}/rest/${appConfig.api.app}/work_lines?limit=1`, {
            method: 'GET',
          });
          
          // Retry the file upload after auth refresh
          const retryResponse = await fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text().catch(() => 'Unknown error');
            throw new Error(`File upload failed after retry: ${retryResponse.status} ${errorText}`);
          }
          
          return await retryResponse.json();
        } catch (refreshError) {
          console.error('❌ Refresh failed during file upload:', refreshError);
          throw new Error('Session expired and refresh failed');
        }
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`File upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`❌ File upload failed for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get a URL for accessing a file
   */
  getFileUrl(filePath: string): string {
    // URL encode the file path to handle slashes and special characters
    const encodedFilePath = encodeURIComponent(filePath);
    return `${this.baseUrl}/storage/${this.appName}/${encodedFilePath}`;
  }

  /**
   * Delete a file from the storage backend
   */
  async deleteFile(filePath: string): Promise<StorageDeleteResponse> {
    // URL encode the file path to handle slashes and special characters
    const encodedFilePath = encodeURIComponent(filePath);
    const url = `${this.baseUrl}/storage/${this.appName}/${encodedFilePath}`;

    try {
      const response = await this.authClient.apiRequest(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`File deletion failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`❌ File deletion failed for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get file metadata/information
   */
  async getFileInfo(filePath: string): Promise<StorageFileInfo> {
    // URL encode the file path to handle slashes and special characters
    const encodedFilePath = encodeURIComponent(filePath);
    const url = `${this.baseUrl}/storage/${this.appName}/${encodedFilePath}/info`;

    try {
      const response = await this.authClient.apiRequest(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`File info request failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`❌ File info request failed for ${filePath}:`, error);
      throw error;
    }
  }
}

// Export a default instance for convenience
export const storageApiClient = new GenericStorageApiClient(); 