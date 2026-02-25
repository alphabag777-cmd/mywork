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

// BSC 공개 RPC 다중 fallback - 가장 빠른 노드 우선 배치
const bscTransport = fallback([
  http("https://bsc.publicnode.com",          { batch: true, timeout: 3000 }),
  http("https://bsc-dataseed1.binance.org",   { batch: true, timeout: 3000 }),
  http("https://bsc-dataseed2.binance.org",   { batch: true, timeout: 3000 }),
  http("https://bsc-dataseed1.defibit.io",    { batch: true, timeout: 3000 }),
  http("https://bsc-dataseed1.ninicoin.io",   { batch: true, timeout: 3000 }),
  http("https://bsc-dataseed3.binance.org",   { batch: true, timeout: 3000 }),
  http("https://bsc-dataseed2.defibit.io",    { batch: true, timeout: 3000 }),
], { rank: true });

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
  featuredWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
    "20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66", // TokenPocket
  ],
  allWallets: "HIDE",
});
