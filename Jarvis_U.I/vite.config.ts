/**
 * Vite Configuration - Jarvis 2.0
 * Configures the build tool and resolve aliases to match TypeScript paths.
 */
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Directs the bundler to resolve the "@" symbol to the "src" directory
      "@": path.resolve(__dirname, "./src"),
    },
  },
})