import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for VehicleRent frontend.
 *
 * ── Development (local) ──────────────────────────────────────────────
 *   VITE_API_BASE_URL is NOT set  →  baseURL = '/api'
 *   Requests go through the Vite dev-server proxy to localhost:8080.
 *   Browser never talks directly to Spring Boot — no CORS needed locally.
 *
 * ── Production (Vercel) ─────────────────────────────────────────────
 *   VITE_API_BASE_URL = https://your-backend.com
 *   Axios baseURL becomes https://your-backend.com/api
 *   Spring Boot CORS must allow the Vercel frontend origin.
 *
 * Set in Vercel dashboard → Project → Settings → Environment Variables:
 *   VITE_API_BASE_URL = https://your-backend.com
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = (env.VITE_API_BASE_URL || 'http://localhost:8080')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

  return {
    plugins: [react()],

    // Make all VITE_ env vars available via import.meta.env
    define: {},

    server: {
      port: 3000,
      strictPort: false,
      // Dev proxy — only active during `vite dev`, never in production build
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('[vite proxy error]', err.message);
            });
          },
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => '/api' + path,
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          // Code-split large vendor bundles for faster Vercel deploys
          manualChunks: {
            'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
            'vendor-query':    ['react-query'],
            'vendor-motion':   ['framer-motion'],
            'vendor-forms':    ['react-hook-form', '@hookform/resolvers', 'yup'],
            'vendor-charts':   ['recharts'],
            'vendor-leaflet':  ['leaflet', 'react-leaflet'],
            'vendor-icons':    ['react-icons'],
            'vendor-misc':     ['axios', 'date-fns', 'react-toastify', 'qrcode.react'],
          },
        },
      },
    },
  };
});
