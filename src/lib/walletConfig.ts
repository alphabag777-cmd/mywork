import { createWeb3Modal } from "@web3modal/wagmi/react";
import { createConfig, http } from "wagmi";
import { bsc } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "@wagmi/connectors";

// Get projectId from environment variable
// For now, we'll use a placeholder. In production, get this from https://cloud.reown.com
const projectId = "b1928c59aee629f537800668bbb1ab07";

// Configure metadata
const metadata = {
  name: "AlphaBag Investment",
  description: "Invest your USDT tokens and earn rewards",
  url: typeof window !== "undefined" ? window.location.origin : "https://alphabag-investment.com",
  icons: [typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "https://alphabag-investment.com/logo.png"],
};

// BSC 공개 RPC URL 목록 (thirdweb CORS 에러 우회)
const BSC_RPC_URLS = [
  "https://bsc-dataseed1.binance.org",
  "https://bsc-dataseed2.binance.org",
  "https://bsc-dataseed3.binance.org",
  "https://bsc-dataseed4.binance.org",
  "https://bsc-dataseed1.defibit.io",
  "https://bsc-dataseed2.defibit.io",
];

// Create wagmiConfig
export const config = createConfig({
  chains: [bsc], // BSC Mainnet
  transports: {
    [bsc.id]: http(BSC_RPC_URLS[0], {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
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

