import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  // CRITICAL: Ensure required env vars are present - NO SILENT FAILURES!
  if (mode === 'development' && !env.VITE_PROXY_TARGET) {
    console.error('💥 FATAL ERROR: VITE_PROXY_TARGET environment variable is not set!');
    console.error('💥 Set it in your .env.local file: VITE_PROXY_TARGET=https://venti.api.get-morpheus-ai.com');
    console.error('💥 Or export it: export VITE_PROXY_TARGET=https://venti.api.get-morpheus-ai.com');
    process.exit(1);
  }

  // Debug: Proxy configuration (only in development)
  if (mode === 'development') {
    console.log('🔧 [VITE CONFIG] Setting up proxy for paths: /auth, /admin, /rest, /storage, /users');
    console.log('🔧 [VITE CONFIG] VITE_PROXY_TARGET:', env.VITE_PROXY_TARGET);
    console.log('🔧 [VITE CONFIG] All requests to these paths will be forwarded to:', env.VITE_PROXY_TARGET);
  }

  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Optimize for Azure Static Web Apps file limits
    rollupOptions: {
      output: {
        manualChunks: {
          // Bundle all vendor dependencies into a single chunk
          vendor: ['react', 'react-dom', '@mui/material', '@mui/x-date-pickers'],
          // Bundle UI components together
          ui: ['@mui/icons-material', 'date-fns', 'dayjs'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Minimize the number of CSS files
    cssCodeSplit: false,
  },
  server: {
    proxy: {
      '/auth': {
        target: env.VITE_PROXY_TARGET,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        },
        configure: (proxy, _options) => {
          console.log('🔧 [AUTH PROXY] Target:', env.VITE_PROXY_TARGET);
          
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('🔄 [AUTH] Request:', req.method, req.url);
            // Log cookies being sent
            if (req.headers.cookie) {
              console.log('🍪 [AUTH] Cookies sent:', req.headers.cookie);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📡 [AUTH] Response:', proxyRes.statusCode, req.url);
            // Log cookies being received
            if (proxyRes.headers['set-cookie']) {
              console.log('🍪 [AUTH] Cookies received:', proxyRes.headers['set-cookie']);
            }
            
            // Handle cookies for localhost
            if (proxyRes.headers['set-cookie']) {
              const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                let modifiedCookie = cookie;
                modifiedCookie = modifiedCookie.replace(/domain=[^;]+;?\s*/gi, '');
                modifiedCookie = modifiedCookie + '; Domain=localhost';
                if (!modifiedCookie.includes('Path=')) {
                  modifiedCookie = modifiedCookie + '; Path=/';
                }
                if (process.env.NODE_ENV === 'development') {
                  modifiedCookie = modifiedCookie.replace(/;\s*Secure/gi, '');
                }
                return modifiedCookie;
              });
              proxyRes.headers['set-cookie'] = cookies;
              console.log('🍪 [AUTH] Modified cookies:', cookies);
            }
          });
          
          proxy.on('error', (err, req, _res) => {
            console.error('❌ [AUTH] Proxy error:', err.message, 'for:', req?.url || 'unknown');
          });
        }
      },
      '/admin': {
        target: env.VITE_PROXY_TARGET,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        },
        configure: (proxy, _options) => {
          console.log('🔧 [ADMIN PROXY] Target:', env.VITE_PROXY_TARGET);
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('🔄 [ADMIN] Request:', req.method, req.url);
          });
          proxy.on('error', (err, req, _res) => {
            console.error('❌ [ADMIN] Proxy error:', err.message, 'for:', req?.url || 'unknown');
          });
        }
      },
      '/rest': {
        target: env.VITE_PROXY_TARGET,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        },
        configure: (proxy, _options) => {
          console.log('🔧 [REST PROXY] Target:', env.VITE_PROXY_TARGET);
          
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('🔄 [REST] Request:', req.method, req.url);
            // Log cookies being sent
            if (req.headers.cookie) {
              console.log('🍪 [REST] Cookies sent:', req.headers.cookie);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📡 [REST] Response:', proxyRes.statusCode, req.url);
            // Log cookies being received
            if (proxyRes.headers['set-cookie']) {
              console.log('🍪 [REST] Cookies received:', proxyRes.headers['set-cookie']);
            }
            
            // Handle cookies for localhost
            if (proxyRes.headers['set-cookie']) {
              const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                let modifiedCookie = cookie;
                modifiedCookie = modifiedCookie.replace(/domain=[^;]+;?\s*/gi, '');
                modifiedCookie = modifiedCookie + '; Domain=localhost';
                if (!modifiedCookie.includes('Path=')) {
                  modifiedCookie = modifiedCookie + '; Path=/';
                }
                if (process.env.NODE_ENV === 'development') {
                  modifiedCookie = modifiedCookie.replace(/;\s*Secure/gi, '');
                }
                return modifiedCookie;
              });
              proxyRes.headers['set-cookie'] = cookies;
              console.log('🍪 [REST] Modified cookies:', cookies);
            }
          });
          
          proxy.on('error', (err, req, _res) => {
            console.error('❌ [REST] Proxy error:', err.message, 'for:', req?.url || 'unknown');
          });
        }
      },
      '/storage': {
        target: env.VITE_PROXY_TARGET,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        },
        configure: (proxy, _options) => {
          console.log('🔧 [STORAGE PROXY] Target:', env.VITE_PROXY_TARGET);
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('🔄 [STORAGE] Request:', req.method, req.url);
          });
          proxy.on('error', (err, req, _res) => {
            console.error('❌ [STORAGE] Proxy error:', err.message, 'for:', req?.url || 'unknown');
          });
        }
      },
      '/users': {
        target: env.VITE_PROXY_TARGET,
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        },
        configure: (proxy, _options) => {
          console.log('🔧 [USERS PROXY] Target:', env.VITE_PROXY_TARGET);
          
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('🔄 [USERS] Request:', req.method, req.url);
            // Log cookies being sent
            if (req.headers.cookie) {
              console.log('🍪 [USERS] Cookies sent:', req.headers.cookie);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📡 [USERS] Response:', proxyRes.statusCode, req.url);
            // Log cookies being received
            if (proxyRes.headers['set-cookie']) {
              console.log('🍪 [USERS] Cookies received:', proxyRes.headers['set-cookie']);
            }
            
            // Handle cookies for localhost
            if (proxyRes.headers['set-cookie']) {
              const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                let modifiedCookie = cookie;
                modifiedCookie = modifiedCookie.replace(/domain=[^;]+;?\s*/gi, '');
                modifiedCookie = modifiedCookie + '; Domain=localhost';
                if (!modifiedCookie.includes('Path=')) {
                  modifiedCookie = modifiedCookie + '; Path=/';
                }
                if (process.env.NODE_ENV === 'development') {
                  modifiedCookie = modifiedCookie.replace(/;\s*Secure/gi, '');
                }
                return modifiedCookie;
              });
              proxyRes.headers['set-cookie'] = cookies;
              console.log('🍪 [USERS] Modified cookies:', cookies);
            }
          });
          
          proxy.on('error', (err, req, _res) => {
            console.error('❌ [USERS] Proxy error:', err.message, 'for:', req?.url || 'unknown');
          });
        }
      }
    }
  }
  }
})
