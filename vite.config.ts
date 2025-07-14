import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/auth': {
        target: process.env.VITE_PROXY_TARGET || 'https://venti-reverse-proxy-prod.calmdune-db5c9992.germanywestcentral.azurecontainerapps.io',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        },
        configure: (proxy, _options) => {
          // Removed verbose AUTH proxy request logging

          proxy.on('proxyRes', (proxyRes, _req, _res) => {
            // Ensure cookies are set for localhost
            if (proxyRes.headers['set-cookie']) {
              const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                // Force all cookies to be set for localhost domain
                let modifiedCookie = cookie;
                
                // Remove any existing domain settings
                modifiedCookie = modifiedCookie.replace(/domain=[^;]+;?\s*/gi, '');
                
                // Set domain to localhost
                modifiedCookie = modifiedCookie + '; Domain=localhost';
                
                // Ensure path is set to root
                if (!modifiedCookie.includes('Path=')) {
                  modifiedCookie = modifiedCookie + '; Path=/';
                }
                
                // For development, remove Secure flag if present
                if (process.env.NODE_ENV === 'development') {
                  modifiedCookie = modifiedCookie.replace(/;\s*Secure/gi, '');
                }
                
                return modifiedCookie;
              });
              
              proxyRes.headers['set-cookie'] = cookies;
            }
          });

          // Removed AUTH-specific error logging to reduce log noise
        }
      },
      '/admin': {
        target: process.env.VITE_PROXY_TARGET || 'https://venti-reverse-proxy-prod.calmdune-db5c9992.germanywestcentral.azurecontainerapps.io',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        },
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('🔄 [ADMIN] Request:', req.method, req.url);
          });

          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📡 [ADMIN] Response:', proxyRes.statusCode, req.url);
          });

          proxy.on('error', (err, req, _res) => {
            console.error('❌ [ADMIN] Proxy error:', err.message, req.url);
          });
        }
      },
      '/rest': {
        target: process.env.VITE_PROXY_TARGET || 'https://venti-reverse-proxy-prod.calmdune-db5c9992.germanywestcentral.azurecontainerapps.io',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        },
        configure: (proxy, _options) => {
          // Only log errors for REST proxy
          proxy.on('error', (err, req, _res) => {
            console.error('❌ [REST] Proxy error:', err.message, req.url);
          });
        }
      },
      '/storage': {
        target: process.env.VITE_PROXY_TARGET || 'https://venti-reverse-proxy-prod.calmdune-db5c9992.germanywestcentral.azurecontainerapps.io',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        },
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('🔄 [STORAGE] Request:', req.method, req.url);
          });
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📡 [STORAGE] Response:', proxyRes.statusCode, req.url);
          });
          
          proxy.on('error', (err, req, _res) => {
            console.error('❌ [STORAGE] Proxy error:', err.message, req.url);
          });
        }
      }
    }
  }
})
