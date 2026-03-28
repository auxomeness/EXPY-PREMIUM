import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('@radix-ui') || id.includes('vaul')) {
            return 'radix-vendor';
          }

          if (id.includes('recharts')) {
            return 'charts';
          }

          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'mui-vendor';
          }

          if (id.includes('motion') || id.includes('framer-motion')) {
            return 'motion-vendor';
          }

          if (id.includes('lucide-react')) {
            return 'icons';
          }

          return 'vendor';
        },
      },
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
