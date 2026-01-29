import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Plugins devem vir primeiro para evitar conflitos de sintaxe
  plugins: [react(), tailwindcss()],

  define: {
    // Injeção global do Lodash para compatibilidade
    "_": "window._",
  },

  build: {
    // Garante que o build vá para a pasta que o S3 espera
    outDir: "dist/public",
    emptyOutDir: true,
  },
});