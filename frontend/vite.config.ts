import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Single-port deployment: FastAPI serves the built dist, so base must be relative.
// Dev: Vite on 5173 proxies /api to the FastAPI backend on 8000.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1200,
  },
});
