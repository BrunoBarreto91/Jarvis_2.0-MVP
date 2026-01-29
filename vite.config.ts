import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path"; // Precisamos disso para localizar as pastas

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Isso ensina ao Vite que "@" significa a pasta "client/src"
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  define: {
    "_": "window._",
  },
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
  },
});