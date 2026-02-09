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

// Create wagmiConfig
export const config = createConfig({
  chains: [bsc], // BSC Mainnet
  transports: {
    [bsc.id]: http(),
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

