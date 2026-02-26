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
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      maxParallelFileOps: 2,
      output: {
        manualChunks(id) {
          // @uiw/codemirror → 별도 청크 (MDEditor 5MB)
          if (
            id.includes("node_modules/@uiw") ||
            id.includes("node_modules/codemirror") ||
            id.includes("node_modules/@codemirror")
          ) {
            return "md-editor";
          }
          // web3modal만 별도 청크 (원래 정상 작동 방식)
          if (id.includes("node_modules/@web3modal")) {
            return "web3";
          }
          if (id.includes("node_modules/firebase")) {
            return "firebase";
          }
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react-vendor";
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
