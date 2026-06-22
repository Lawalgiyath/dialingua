import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE is set to /dialingua/ by the GitHub Actions deploy workflow.
// Locally and when served by FastAPI it falls back to "./" (relative).
const base = process.env.VITE_BASE ?? "./";

export default defineConfig({
  plugins: [react()],
  base,
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
