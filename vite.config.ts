import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Isso garante que qualquer biblioteca que procure por '_' encontre o objeto global
    "_": "window._",
  },
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
  },
});
