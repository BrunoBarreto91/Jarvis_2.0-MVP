import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// Alterado de { manusRuntime } para o import padrão (default)
import manusRuntime from "vite-plugin-manus-runtime";
import jsxLoc from "@builder.io/vite-plugin-jsx-loc";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    manusRuntime(),
    jsxLoc()
  ],
  resolve: {
    alias: {
      // Sincronizado com o seu tsconfig.json
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    // Injeção para o lodash-es e bibliotecas que buscam o '_' global
    "_": "window._",
  },
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
  },
});