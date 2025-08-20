// Centralized application configuration
export interface AppConfig {
  auth: {
    appName: string;
  };
  api: {
    baseUrl: string;
    authBaseUrl: string;
    app: string; // App name for PostgREST endpoints
  };
  environment: 'development' | 'production';
}

// Get the current host dynamically (supports both localhost and IP addresses)
const getCurrentBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In browser environment, use current origin
    return window.location.origin;
  }
  // Fallback for SSR or non-browser environments
  return 'http://localhost:5173';
};

// Get configuration from environment variables with sensible defaults
export const getAppConfig = (): AppConfig => {
  const isDevelopment = import.meta.env.DEV;

  const config: AppConfig = {
    auth: {
      appName: import.meta.env.VITE_APP_NAME,
    },
    api: {
      // In development, use current origin so proxy can intercept requests (supports localhost and IP)
      // In production, use the actual backend URL
      authBaseUrl: isDevelopment ? getCurrentBaseUrl() : import.meta.env.VITE_BACKEND_URL,
      baseUrl: isDevelopment ? getCurrentBaseUrl() : import.meta.env.VITE_BACKEND_URL,
      app: import.meta.env.VITE_APP_NAME,
    },
    environment: isDevelopment ? 'development' : 'production'
  };

  return config;
};

// Create singleton instance
export const appConfig = getAppConfig(); 