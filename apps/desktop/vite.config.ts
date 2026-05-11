import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/lib/suno-api": path.resolve(__dirname, "src/lib/api.ts"),
      "@": path.resolve(__dirname, "../web"),
      "@shared": path.resolve(__dirname, "../../packages/shared"),
    },
    dedupe: [
      "react",
      "react-dom",
      "lucide-react",
      "zustand",
      "@tanstack/react-query",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
    ],
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    fs: {
      allow: ["../web", "../../packages/shared"],
    },
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
});
