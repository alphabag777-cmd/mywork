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
    chunkSizeWarningLimit: 600,
    // lazy chunk들을 초기 HTML modulepreload에서 제외
    // (md-editor 1.7MB 등이 페이지 첫 로드 시 다운로드되는 것 방지)
    modulePreload: {
      resolveDependencies(filename, deps) {
        // md-editor, firebase, viem chunk는 preload 목록에서 제외
        return deps.filter(dep =>
          !dep.includes("md-editor") &&
          !dep.includes("firebase") &&
          !dep.includes("viem")
        );
      },
    },
    rollupOptions: {
      maxParallelFileOps: 2,
      // walletconnect / web3modal 내부 unresolved import 경고를 무시
      // (wagmi@3.x에서 @walletconnect/ethereum-provider가 선택적 의존성)
      onwarn(warning, defaultHandler) {
        if (
          warning.code === "UNRESOLVED_IMPORT" &&
          (warning.message?.includes("@walletconnect") ||
           warning.message?.includes("@web3modal") ||
           warning.message?.includes("isTypeTwoEnvelope") ||
           warning.message?.includes("getBundleId"))
        ) {
          return; // 무시
        }
        defaultHandler(warning);
      },
      output: {
        // lazy chunk들이 초기 HTML에 modulepreload로 추가되지 않도록 설정
        // (md-editor 1.7MB 등이 초기 로드에 포함되는 것을 방지)
        experimentalMinChunkSize: 10_000,
        manualChunks(id) {
          // 1. Firebase — 반드시 독립 청크
          //    Firestore 내부 `const ze` (FirestoreError 코드)가
          //    다른 청크와 함께 번들링되면 circular dep → TDZ 오류 발생
          if (
            id.includes("node_modules/firebase") ||
            id.includes("node_modules/@firebase")
          ) {
            return "firebase";
          }

          // 2. MDEditor & CodeMirror — admin에서만 사용하는 무거운 에디터
          //    lazy import이므로 독립 청크로 분리해도 circular dep 위험 없음
          if (
            id.includes("node_modules/@uiw") ||
            id.includes("node_modules/codemirror") ||
            id.includes("node_modules/@codemirror")
          ) {
            return "md-editor";
          }

          // 3. React 코어 — 가장 변경이 적어 장기 캐싱에 유리
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react-vendor";
          }

          // 4. viem — web3 유틸 (wagmi의 peer dep, 독립적으로 분리 가능)
          if (id.includes("node_modules/viem")) {
            return "viem";
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
