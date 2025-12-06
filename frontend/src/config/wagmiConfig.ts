import { createConfig, http } from "wagmi";
import { arbitrum, mainnet, sepolia, optimism, bsc, avalanche, scroll, zora, base } from "wagmi/chains";

// Create wagmi config for direct wagmi usage (separate from AppKit's WagmiAdapter)
// This is used by WagmiProvider in App.tsx
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, base, arbitrum, optimism, bsc, avalanche, scroll, zora],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [scroll.id]: http(),
    [zora.id]: http(),
  },
});

