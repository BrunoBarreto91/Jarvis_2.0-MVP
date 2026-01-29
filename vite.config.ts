import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Importações Universais (Capturam todos os formatos de exportação)
import * as ManusPlugin from 'vite-plugin-manus-runtime';
import * as JsxLocPlugin from '@builder.io/vite-plugin-jsx-loc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Função Utilitária para extrair plugins de módulos mal formatados (ESM/CJS Mix)
 * @param module O módulo importado via * as
 * @param fallbackName O nome provável da função caso não seja default
 */
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
    }
  },
  define: {
    global: 'window',
  },
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
  }
});