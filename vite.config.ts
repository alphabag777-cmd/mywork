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
    // 청크 경고 임계값 (개별 청크 500KB 초과 시 경고)
    chunkSizeWarningLimit: 600,
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
        // ── 수동 청크 분리 전략 ────────────────────────────────────────────────
        // 규칙: 더 구체적인 조건을 앞에 배치 (위에서 아래로 첫 매칭 적용)
        manualChunks(id) {
          // 1. Firebase — 반드시 독립 청크
          //    이유: Firestore 내부의 `const ze` (FirestoreError 코드)가
          //    다른 청크와 함께 번들링되면 circular dependency → TDZ 오류 발생
          if (
            id.includes("node_modules/firebase") ||
            id.includes("node_modules/@firebase")
          ) {
            return "firebase";
          }

          // 2. MDEditor & CodeMirror — 무거운 에디터 (admin에서만 사용)
          //    @uiw: ~500KB, codemirror: ~200KB → 별도 청크로 캐싱 극대화
          if (
            id.includes("node_modules/@uiw") ||
            id.includes("node_modules/codemirror") ||
            id.includes("node_modules/@codemirror")
          ) {
            return "md-editor";
          }

          // 3. Web3 스택 — wagmi / viem / walletconnect / web3modal
          //    peer deps가 서로 얽혀 있으므로 하나의 청크에 묶어 순환 의존 방지
          if (
            id.includes("node_modules/@wagmi") ||
            id.includes("node_modules/wagmi") ||
            id.includes("node_modules/viem") ||
            id.includes("node_modules/@walletconnect") ||
            id.includes("node_modules/@web3modal")
          ) {
            return "web3";
          }

          // 4. React 코어 — 가장 변경이 적은 라이브러리 → 장기 캐싱
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react-vendor";
          }

          // 5. Radix UI — shadcn/ui 기반 컴포넌트 (자주 바뀌지 않음)
          if (id.includes("node_modules/@radix-ui")) {
            return "radix-ui";
          }

          // 6. 차트 / 리차트 — 무거운 시각화 라이브러리
          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3-") ||
            id.includes("node_modules/victory-")
          ) {
            return "charts";
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
