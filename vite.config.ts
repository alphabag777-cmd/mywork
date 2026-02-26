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
      treeshake: {
        // ox/porto 패키지의 /*#__PURE__*/ 위치 오류로 인한 Rollup 파싱 실패 방지
        annotations: false,
      },
      onwarn(warning, warn) {
        // walletconnect / web3 관련 경고 무시
        if (warning.message?.includes('@walletconnect')) return;
        if (warning.message?.includes('isTypeTwoEnvelope')) return;
        if (warning.message?.includes('getBundleId')) return;
        if (warning.message?.includes('TRANSPORT_TYPES')) return;
        if (warning.message?.includes('ox/_esm') || warning.message?.includes('porto')) return;
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        if (warning.code === 'MISSING_EXPORT') {
          if (
            warning.message?.includes('walletconnect') ||
            warning.message?.includes('wagmi') ||
            warning.message?.includes('web3modal')
          ) return;
        }
        // circular dependency 경고는 표시만 하고 빌드 중단하지 않음
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      },
      output: {
        manualChunks(id) {
          // ⚠️ web3 라이브러리들을 하나의 청크로 묶으면
          //    circular dependency로 인해 'Cannot access X before initialization' 오류가 발생함.
          //    wagmi/viem/walletconnect는 Rollup이 자동으로 분리하도록 맡긴다.

          // MDEditor는 별도 청크로 분리 (번들 크기 절감)
          if (
            id.includes('node_modules/@uiw') ||
            id.includes('node_modules/codemirror') ||
            id.includes('node_modules/@codemirror')
          ) {
            return 'md-editor';
          }
          // Firebase 별도 청크
          if (id.includes('node_modules/firebase')) {
            return 'firebase';
          }
          // React 코어 별도 청크
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/')
          ) {
            return 'react-vendor';
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
