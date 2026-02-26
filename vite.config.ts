import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      maxParallelFileOps: 2,
      output: {
        manualChunks(id) {
          // Firebase를 완전히 독립된 청크로 분리
          // (Firestore의 const ze가 다른 청크와 circular dep 유발)
          if (id.includes("node_modules/firebase") ||
              id.includes("node_modules/@firebase")) {
            return "firebase";
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["@web3modal/wagmi"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
