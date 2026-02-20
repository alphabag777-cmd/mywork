import { createWeb3Modal } from "@web3modal/wagmi/react";
import { createConfig, http, fallback } from "wagmi";
import { bsc } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "@wagmi/connectors";

// Get projectId from environment variable
const projectId = "b1928c59aee629f537800668bbb1ab07";

// Configure metadata
const metadata = {
  name: "AlphaBag Investment",
  description: "Invest your USDT tokens and earn rewards",
  url: typeof window !== "undefined" ? window.location.origin : "https://alphabag.net",
  icons: [typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "https://alphabag.net/logo.png"],
};

// BSC 공개 RPC 다중 fallback (thirdweb CORS 에러 우회)
// wagmi v2의 fallback() 유틸리티로 순서대로 시도
const bscTransport = fallback([
  http("https://bsc-dataseed1.binance.org", { batch: true }),
  http("https://bsc-dataseed2.binance.org", { batch: true }),
  http("https://bsc-dataseed3.binance.org", { batch: true }),
  http("https://bsc-dataseed1.defibit.io",  { batch: true }),
  http("https://bsc-dataseed2.defibit.io",  { batch: true }),
  http("https://bsc-dataseed1.ninicoin.io", { batch: true }),
  http("https://bsc.publicnode.com",         { batch: true }),
], { rank: false });

// Create wagmiConfig
export const config = createConfig({
  chains: [bsc], // BSC Mainnet
  transports: {
    [bsc.id]: bscTransport,
  },
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
    }),
  ],
});

// Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  enableOnramp: false,
});
