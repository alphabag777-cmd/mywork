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
    // 프로덕션 빌드에서 console.log/debugger 자동 제거
    minify: "esbuild",
    // md-editor(1.7MB)는 admin 페이지에서만 필요하므로 초기 preload 제외
    modulePreload: {
      resolveDependencies(_filename, deps) {
        return deps.filter(dep => !dep.includes("md-editor"));
      },
    },
    rollupOptions: {
      maxParallelFileOps: 2,
      onwarn(warning, defaultHandler) {
        if (
          warning.code === "UNRESOLVED_IMPORT" &&
          (warning.message?.includes("@walletconnect") ||
           warning.message?.includes("@web3modal") ||
           warning.message?.includes("isTypeTwoEnvelope") ||
           warning.message?.includes("getBundleId"))
        ) {
          return;
        }
        defaultHandler(warning);
      },
      output: {
        manualChunks(id) {
          // Firebase만 분리: Firestore `ze` TDZ 방지 (검증된 안전한 분리)
          if (
            id.includes("node_modules/firebase") ||
            id.includes("node_modules/@firebase")
          ) {
            return "firebase";
          }
          // MDEditor: admin 전용 에디터, lazy import 사용 (1.7MB)
          if (
            id.includes("node_modules/@uiw") ||
            id.includes("node_modules/codemirror") ||
            id.includes("node_modules/@codemirror")
          ) {
            return "md-editor";
          }
          // wagmi/viem/walletconnect/web3modal: circular dep 때문에 Rollup 자동 처리
        },
      },
    },
  },
  esbuild: {
    // 프로덕션 빌드에서만 console 및 debugger 제거
    drop: process.env.NODE_ENV === 'production' ? ["console", "debugger"] : [],
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
