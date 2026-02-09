import { WagmiProvider } from "wagmi";
import { config } from "@/lib/walletConfig";

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
};

