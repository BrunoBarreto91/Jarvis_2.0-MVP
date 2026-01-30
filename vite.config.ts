import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Importações Universais (Plugins)
import * as ManusPlugin from 'vite-plugin-manus-runtime';
import * as JsxLocPlugin from '@builder.io/vite-plugin-jsx-loc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função Adaptadora de Plugins
const extractPlugin = (module: any, fallbackName?: string) => {
  if (typeof module === 'function') return module;
  if (module.default && typeof module.default === 'function') return module.default;
  if (fallbackName && module[fallbackName] && typeof module[fallbackName] === 'function') return module[fallbackName];
  return () => ({ name: 'placeholder-plugin' });
};

export default defineConfig({
  plugins: [
    react(),
    extractPlugin(ManusPlugin, 'manusRuntime')(),
    extractPlugin(JsxLocPlugin, 'jsxLoc')(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      // REMOVIDO: O alias que causava o erro. Agora usamos o padrão.
    }
  },
  define: {
    // Mantemos apenas o global básico
    global: 'window',
  },
  // Otimização Crítica para bibliotecas legadas (Lodash/Recharts)
  optimizeDeps: {
    include: ['lodash', 'recharts'],
  },
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      // Força o Vite a processar o lodash como CommonJS
      include: [/lodash/, /node_modules/],
    },
  },
});