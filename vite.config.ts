import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { manusRuntime } from "vite-plugin-manus-runtime";
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
      // Sincronizado com tsconfig.json
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    // Injeção para compatibilidade de bibliotecas antigas que buscam o '_' global
    "_": "window._",
  },
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
  },
});