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
    chunkSizeWarningLimit: 2500,
    // md-editor(1.7MB)가 초기 HTML modulepreload에 들어가지 않도록 제외
    modulePreload: {
      resolveDependencies(_filename, deps) {
        return deps.filter(dep => !dep.includes("md-editor"));
      },
    },
    rollupOptions: {
      maxParallelFileOps: 2,
      onwarn(warning, defaultHandler) {
        // wagmi@3.x에서 @walletconnect/ethereum-provider가 선택적 의존성
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
          // ── Firebase: 반드시 독립 청크 ────────────────────────────────────────
          // Firestore 내부 `const ze`(FirestoreError 코드)가 wagmi/viem 등과
          // 같은 청크에 묶이면 Rollup 초기화 순서 오류(TDZ) 발생.
          // firebase만 분리하면 ze는 이 청크 안에서만 존재 → 문제 없음.
          if (
            id.includes("node_modules/firebase") ||
            id.includes("node_modules/@firebase")
          ) {
            return "firebase";
          }

          // ── MDEditor: admin 전용 무거운 에디터 ────────────────────────────────
          // @uiw/react-md-editor + codemirror = ~1.7MB
          // lazy(() => import(...))로만 사용되므로 독립 청크 분리 안전.
          if (
            id.includes("node_modules/@uiw") ||
            id.includes("node_modules/codemirror") ||
            id.includes("node_modules/@codemirror")
          ) {
            return "md-editor";
          }

          // ── React 코어: 변경 빈도가 낮아 장기 캐싱에 유리 ───────────────────
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react-vendor";
          }

          // ── wagmi / viem / walletconnect / web3modal ──────────────────────────
          // 이 패키지들은 서로 circular dependency가 있어 하나의 청크로
          // 강제 묶으면 TDZ 발생. Rollup 자동 분리에 맡긴다.
          // (manualChunks에서 지정하지 않으면 Rollup이 안전하게 분산 처리)
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
