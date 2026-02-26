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
        // walletconnect 관련 경고/오류 무시 (구버전 패키지 중첩 문제)
        if (warning.message?.includes('@walletconnect')) return;
        if (warning.message?.includes('isTypeTwoEnvelope')) return;
        if (warning.message?.includes('getBundleId')) return;
        if (warning.message?.includes('TRANSPORT_TYPES')) return;
        if (warning.message?.includes('ox/_esm') || warning.message?.includes('porto')) return;
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        if (warning.code === 'MISSING_EXPORT') {
          // walletconnect 패키지의 누락된 export는 무시
          if (warning.message?.includes('walletconnect') || warning.message?.includes('wagmi') || warning.message?.includes('web3modal')) return;
        }
        warn(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@uiw') || id.includes('node_modules/codemirror') || id.includes('node_modules/@codemirror')) {
            return 'md-editor';
          }
          if (id.includes('node_modules/@walletconnect') || id.includes('node_modules/@web3modal') || id.includes('node_modules/wagmi') || id.includes('node_modules/viem')) {
            return 'web3';
          }
          if (id.includes('node_modules/firebase')) {
            return 'firebase';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
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
