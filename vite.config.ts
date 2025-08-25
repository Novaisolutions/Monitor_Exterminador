import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Marketing - Mayo Dental',
        short_name: 'Marketing',
        description: 'Plataforma de gestión de conversaciones para Marketing - Mayo Dental',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'date-fns']
        }
      },
      plugins: [
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
        })
      ]
    }
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/kommo': {
        target: 'https://bizmakermx.kommo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kommo/, '/api/v4'),
        secure: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  }
});
