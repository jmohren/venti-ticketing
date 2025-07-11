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

// Get configuration from environment variables with sensible defaults
export const getAppConfig = (): AppConfig => {
  const isDevelopment = import.meta.env.DEV;

  const config: AppConfig = {
    auth: {
      appName: import.meta.env.VITE_APP_NAME || 'SQDCI Board',
    },
    api: {
      // Development: Always use proxy (like before when it worked)
      // Production: Use environment variable
      authBaseUrl: import.meta.env.VITE_BACKEND_URL || "https://morpheus.api.get-morpheus-ai.com",
      // isDevelopment 
      //   ? 'http://localhost:5173'  // Proxy routes to backend (env var or fallback)
      //   : import.meta.env.VITE_BACKEND_URL,
      
      baseUrl: import.meta.env.VITE_BACKEND_URL || "https://morpheus.api.get-morpheus-ai.com",
      // isDevelopment 
      //   ? 'http://localhost:5173'  // Proxy routes to backend (env var or fallback)
      //   : import.meta.env.VITE_BACKEND_URL,
      
      // App name for PostgREST endpoints (/rest/{app}/table)
      app: import.meta.env.VITE_APP_NAME || 'morning_routine',
    },
    environment: isDevelopment ? 'development' : 'production'
  };

  // Debug: log env variables and derived baseUrl (remove or guard when not needed)
  console.log('[appConfig] env values', {
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE,
    VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
  }, '→ baseUrl used:', config.api.baseUrl);

  return config;
};

// Create singleton instance
export const appConfig = getAppConfig(); 