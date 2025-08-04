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

  // Helper function to get current host for cookie domain
  const getCurrentHost = (req: any) => {
    const host = req.headers.host || 'localhost';
    return host.split(':')[0]; // Remove port if present
  };

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
    host: '0.0.0.0', // Bind to all interfaces
    port: 5173,
    cors: {
      origin: true, // Allow all origins in development
      credentials: true, // Allow cookies to be sent
      optionsSuccessStatus: 200
    },
    proxy: {
      '/auth': {
        target: env.VITE_PROXY_TARGET,
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          console.log('🔧 [AUTH PROXY] Target:', env.VITE_PROXY_TARGET);
          
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔄 [AUTH] Request:', req.method, req.url);
            // Log cookies being sent
            if (req.headers.cookie) {
              console.log('🍪 [AUTH] Cookies sent:', req.headers.cookie);
            }
            
            // Add CORS headers to the proxy request
            proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
            const origin = req.headers.origin || `http://${req.headers.host}`;
            proxyReq.setHeader('Access-Control-Allow-Origin', origin);
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📡 [AUTH] Response:', proxyRes.statusCode, req.url);
            
            // Add CORS headers to response
            const origin = req.headers.origin || `http://${req.headers.host}`;
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
            
            // Log cookies being received
            if (proxyRes.headers['set-cookie']) {
              console.log('🍪 [AUTH] Cookies received:', proxyRes.headers['set-cookie']);
            }
            
            // Handle cookies for current host (localhost or IP)
            if (proxyRes.headers['set-cookie']) {
              const currentHost = getCurrentHost(req);
              const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                let modifiedCookie = cookie;
                // Remove any existing domain
                modifiedCookie = modifiedCookie.replace(/domain=[^;]+;?\s*/gi, '');
                // Set domain to current host
                modifiedCookie = modifiedCookie + `; Domain=${currentHost}`;
                if (!modifiedCookie.includes('Path=')) {
                  modifiedCookie = modifiedCookie + '; Path=/';
                }
                if (process.env.NODE_ENV === 'development') {
                  modifiedCookie = modifiedCookie.replace(/;\s*Secure/gi, '');
                }
                return modifiedCookie;
              });
              proxyRes.headers['set-cookie'] = cookies;
              console.log('🍪 [AUTH] Modified cookies for host:', currentHost, cookies);
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
        configure: (proxy, _options) => {
          console.log('🔧 [ADMIN PROXY] Target:', env.VITE_PROXY_TARGET);
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔄 [ADMIN] Request:', req.method, req.url);
            const origin = req.headers.origin || `http://${req.headers.host}`;
            proxyReq.setHeader('Access-Control-Allow-Origin', origin);
            proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
          });
          proxy.on('proxyRes', (_proxyRes, req, res) => {
            const origin = req.headers.origin || `http://${req.headers.host}`;
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
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
        configure: (proxy, _options) => {
          console.log('🔧 [REST PROXY] Target:', env.VITE_PROXY_TARGET);
          
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔄 [REST] Request:', req.method, req.url);
            // Log cookies being sent
            if (req.headers.cookie) {
              console.log('🍪 [REST] Cookies sent:', req.headers.cookie);
            }
            const origin = req.headers.origin || `http://${req.headers.host}`;
            proxyReq.setHeader('Access-Control-Allow-Origin', origin);
            proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📡 [REST] Response:', proxyRes.statusCode, req.url);
            
            const origin = req.headers.origin || `http://${req.headers.host}`;
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            
            // Log cookies being received
            if (proxyRes.headers['set-cookie']) {
              console.log('🍪 [REST] Cookies received:', proxyRes.headers['set-cookie']);
            }
            
            // Handle cookies for current host (localhost or IP)
            if (proxyRes.headers['set-cookie']) {
              const currentHost = getCurrentHost(req);
              const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                let modifiedCookie = cookie;
                // Remove any existing domain
                modifiedCookie = modifiedCookie.replace(/domain=[^;]+;?\s*/gi, '');
                // Set domain to current host
                modifiedCookie = modifiedCookie + `; Domain=${currentHost}`;
                if (!modifiedCookie.includes('Path=')) {
                  modifiedCookie = modifiedCookie + '; Path=/';
                }
                if (process.env.NODE_ENV === 'development') {
                  modifiedCookie = modifiedCookie.replace(/;\s*Secure/gi, '');
                }
                return modifiedCookie;
              });
              proxyRes.headers['set-cookie'] = cookies;
              console.log('🍪 [REST] Modified cookies for host:', currentHost, cookies);
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
        configure: (proxy, _options) => {
          console.log('🔧 [STORAGE PROXY] Target:', env.VITE_PROXY_TARGET);
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔄 [STORAGE] Request:', req.method, req.url);
            const origin = req.headers.origin || `http://${req.headers.host}`;
            proxyReq.setHeader('Access-Control-Allow-Origin', origin);
            proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
          });
          proxy.on('proxyRes', (_proxyRes, req, res) => {
            const origin = req.headers.origin || `http://${req.headers.host}`;
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
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
        configure: (proxy, _options) => {
          console.log('🔧 [USERS PROXY] Target:', env.VITE_PROXY_TARGET);
          
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔄 [USERS] Request:', req.method, req.url);
            // Log cookies being sent
            if (req.headers.cookie) {
              console.log('🍪 [USERS] Cookies sent:', req.headers.cookie);
            }
            const origin = req.headers.origin || `http://${req.headers.host}`;
            proxyReq.setHeader('Access-Control-Allow-Origin', origin);
            proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📡 [USERS] Response:', proxyRes.statusCode, req.url);
            
            const origin = req.headers.origin || `http://${req.headers.host}`;
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            
            // Log cookies being received
            if (proxyRes.headers['set-cookie']) {
              console.log('🍪 [USERS] Cookies received:', proxyRes.headers['set-cookie']);
            }
            
            // Handle cookies for current host (localhost or IP)
            if (proxyRes.headers['set-cookie']) {
              const currentHost = getCurrentHost(req);
              const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                let modifiedCookie = cookie;
                // Remove any existing domain
                modifiedCookie = modifiedCookie.replace(/domain=[^;]+;?\s*/gi, '');
                // Set domain to current host
                modifiedCookie = modifiedCookie + `; Domain=${currentHost}`;
                if (!modifiedCookie.includes('Path=')) {
                  modifiedCookie = modifiedCookie + '; Path=/';
                }
                if (process.env.NODE_ENV === 'development') {
                  modifiedCookie = modifiedCookie.replace(/;\s*Secure/gi, '');
                }
                return modifiedCookie;
              });
              proxyRes.headers['set-cookie'] = cookies;
              console.log('🍪 [USERS] Modified cookies for host:', currentHost, cookies);
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
