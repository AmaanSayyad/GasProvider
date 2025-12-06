import {
  mainnet,
  arbitrum,
  base,
  optimism,
  bsc,
  bscTestnet,
  avalanche,
  scroll,
  zora,
  Chain,
} from "viem/chains";
import { ChainData } from "../types";

// Treasury contract addresses for all supported chains
// Requirements: 1.1, 9.1, 13.4
export const TREASURY_ADDRESSES: Record<number, string> = {
  114: "0xc031c437d6b915dbdc946dbd8613a1ac9dd75d63", // Coston2
  11155111: "0x5b402676535a3ba75c851c14e1e249a4257d2265", // Ethereum Sepolia
  80002: "0x5b402676535a3ba75c851c14e1e249a4257d2265", // Polygon Amoy
  421614: "0x5b402676535a3ba75c851c14e1e249a4257d2265", // Arbitrum Sepolia
  11155420: "0x5b402676535a3ba75c851c14e1e249a4257d2265", // Optimism Sepolia
  84532: "0x5b402676535a3ba75c851c14e1e249a4257d2265", // Base Sepolia
  4801: "0x5b402676535a3ba75c851c14e1e249a4257d2265", // World Sepolia
  999999999: "0x5b402676535a3ba75c851c14e1e249a4257d2265", // Zora Sepolia
  534351: "0x5b402676535a3ba75c851c14e1e249a4257d2265", // Scroll Sepolia
  43113: "0x5b402676535a3ba75c851c14e1e249a4257d2265", // Avalanche Fuji
  97: "0x5b402676535a3ba75c851c14e1e249a4257d2265", // BSC Testnet
};

// Define Flare chains (not in viem/chains yet)
const flare: Chain = {
  id: 14,
  name: "Flare",
  nativeCurrency: {
    name: "Flare",
    symbol: "FLR",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://flare-api.flare.network/ext/C/rpc"],
    },
    public: {
      http: ["https://flare-api.flare.network/ext/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Flare Explorer",
      url: "https://flare-explorer.flare.network",
    },
  },
  testnet: false,
};

const coston2: Chain = {
  id: 114,
  name: "Coston2",
  nativeCurrency: {
    name: "Coston2 Flare",
    symbol: "C2FLR",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://coston2-api.flare.network/ext/C/rpc"],
    },
    public: {
      http: ["https://coston2-api.flare.network/ext/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Coston2 Explorer",
      url: "https://coston2-explorer.flare.network",
    },
  },
  testnet: true,
};

// Define testnet chains for Treasury system
// Requirements: 13.4
const sepolia: Chain = {
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia.org"],
    },
    public: {
      http: ["https://rpc.sepolia.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
    },
  },
  testnet: true,
};

const polygonAmoy: Chain = {
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-amoy.polygon.technology"],
    },
    public: {
      http: ["https://rpc-amoy.polygon.technology"],
    },
  },
  blockExplorers: {
    default: {
      name: "PolygonScan",
      url: "https://amoy.polygonscan.com",
    },
  },
  testnet: true,
};

const arbitrumSepolia: Chain = {
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia-rollup.arbitrum.io/rpc"],
    },
    public: {
      http: ["https://sepolia-rollup.arbitrum.io/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arbiscan",
      url: "https://sepolia.arbiscan.io",
    },
  },
  testnet: true,
};

const optimismSepolia: Chain = {
  id: 11155420,
  name: "Optimism Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia.optimism.io"],
    },
    public: {
      http: ["https://sepolia.optimism.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://sepolia-optimism.etherscan.io",
    },
  },
  testnet: true,
};

const baseSepolia: Chain = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia.base.org"],
    },
    public: {
      http: ["https://sepolia.base.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "BaseScan",
      url: "https://sepolia.basescan.org",
    },
  },
  testnet: true,
};

const worldSepolia: Chain = {
  id: 4801,
  name: "World Sepolia",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://worldchain-sepolia.g.alchemy.com/public"],
    },
    public: {
      http: ["https://worldchain-sepolia.g.alchemy.com/public"],
    },
  },
  blockExplorers: {
    default: {
      name: "World Explorer",
      url: "https://worldchain-sepolia.explorer.alchemy.com",
    },
  },
  testnet: true,
};

const zoraSepolia: Chain = {
  id: 999999999,
  name: "Zora Sepolia",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia.rpc.zora.energy"],
    },
    public: {
      http: ["https://sepolia.rpc.zora.energy"],
    },
  },
  blockExplorers: {
    default: {
      name: "Zora Explorer",
      url: "https://sepolia.explorer.zora.energy",
    },
  },
  testnet: true,
};

const scrollSepolia: Chain = {
  id: 534351,
  name: "Scroll Sepolia",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia-rpc.scroll.io"],
    },
    public: {
      http: ["https://sepolia-rpc.scroll.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Scrollscan",
      url: "https://sepolia.scrollscan.com",
    },
  },
  testnet: true,
};

const avalancheFuji: Chain = {
  id: 43113,
  name: "Avalanche Fuji",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
    public: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "SnowTrace",
      url: "https://testnet.snowtrace.io",
    },
  },
  testnet: true,
};

// Map chain IDs to viem chain objects
const chainIdMap: Record<string, Chain> = {
  eth: mainnet,
  arb: arbitrum,
  base: base,
  op: optimism,
  bsc: bsc,
  bscTestnet: bscTestnet,
  avax: avalanche,
  scroll: scroll,
  zora: zora,
  flare: flare,
  coston2: coston2,
  // Testnet chains for Treasury
  sepolia: sepolia,
  polygonAmoy: polygonAmoy,
  arbitrumSepolia: arbitrumSepolia,
  optimismSepolia: optimismSepolia,
  baseSepolia: baseSepolia,
  worldSepolia: worldSepolia,
  zoraSepolia: zoraSepolia,
  scrollSepolia: scrollSepolia,
  avalancheFuji: avalancheFuji,
};

// All available chains (for reference)
const allChains: ChainData[] = [
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=026",
    avgTxCost: 2.5,
    nativePrice: 3000,
    viemChain: mainnet,
  },
  {
    id: "base",
    name: "Base",
    symbol: "ETH",
    logo: "https://avatars.githubusercontent.com/u/108554348?s=200&v=4",
    avgTxCost: 0.05,
    nativePrice: 3000,
    viemChain: base,
  },
  {
    id: "arb",
    name: "Arbitrum",
    symbol: "ETH",
    logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.svg?v=026",
    avgTxCost: 0.1,
    nativePrice: 3000,
    viemChain: arbitrum,
  },
  {
    id: "op",
    name: "Optimism",
    symbol: "OP",
    logo: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg?v=026",
    avgTxCost: 0.08,
    nativePrice: 3.5,
    viemChain: optimism,
  },
  {
    id: "bsc",
    name: "BNB Chain",
    symbol: "BNB",
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=026",
    avgTxCost: 0.15,
    nativePrice: 600,
    viemChain: bsc,
  },
  {
    id: "avax",
    name: "Avalanche",
    symbol: "AVAX",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=026",
    avgTxCost: 0.25,
    nativePrice: 35,
    viemChain: avalanche,
  },
  {
    id: "scroll",
    name: "Scroll",
    symbol: "ETH",
    logo: "/scrolllogo.png",
    avgTxCost: 0.12,
    nativePrice: 3000,
    viemChain: scroll,
  },
  {
    id: "zora",
    name: "Zora",
    symbol: "ETH",
    logo: "https://zora.co/favicon.ico",
    avgTxCost: 0.06,
    nativePrice: 3000,
    viemChain: zora,
  },
  {
    id: "world",
    name: "World",
    symbol: "WLD",
    logo: "https://cryptologos.cc/logos/worldcoin-wld-logo.svg?v=026",
    avgTxCost: 0.05,
    nativePrice: 5.0,
    viemChain: base, // TODO: Replace with actual World chain when available
  },
  {
    id: "flare",
    name: "Flare",
    symbol: "FLR",
    logo: "/flarelogo.png",
    avgTxCost: 0.01,
    nativePrice: 0.02,
    viemChain: flare,
  },
  {
    id: "coston2",
    name: "Coston2",
    symbol: "C2FLR",
    logo: "/flarelogo.png",
    avgTxCost: 0.001,
    nativePrice: 0.0,
    viemChain: coston2,
  },
  // Testnet chains for Treasury system
  {
    id: "sepolia",
    name: "Ethereum Sepolia",
    symbol: "ETH",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=026",
    avgTxCost: 0.5,
    nativePrice: 3000,
    viemChain: sepolia,
  },
  {
    id: "polygonAmoy",
    name: "Polygon Amoy",
    symbol: "MATIC",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=026",
    avgTxCost: 0.01,
    nativePrice: 0.8,
    viemChain: polygonAmoy,
  },
  {
    id: "arbitrumSepolia",
    name: "Arbitrum Sepolia",
    symbol: "ETH",
    logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.svg?v=026",
    avgTxCost: 0.05,
    nativePrice: 3000,
    viemChain: arbitrumSepolia,
  },
  {
    id: "optimismSepolia",
    name: "Optimism Sepolia",
    symbol: "ETH",
    logo: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg?v=026",
    avgTxCost: 0.04,
    nativePrice: 3000,
    viemChain: optimismSepolia,
  },
  {
    id: "baseSepolia",
    name: "Base Sepolia",
    symbol: "ETH",
    logo: "https://avatars.githubusercontent.com/u/108554348?s=200&v=4",
    avgTxCost: 0.02,
    nativePrice: 3000,
    viemChain: baseSepolia,
  },
  {
    id: "worldSepolia",
    name: "World Sepolia",
    symbol: "ETH",
    logo: "https://cryptologos.cc/logos/worldcoin-wld-logo.svg?v=026",
    avgTxCost: 0.02,
    nativePrice: 3000,
    viemChain: worldSepolia,
  },
  {
    id: "zoraSepolia",
    name: "Zora Sepolia",
    symbol: "ETH",
    logo: "https://zora.co/favicon.ico",
    avgTxCost: 0.03,
    nativePrice: 3000,
    viemChain: zoraSepolia,
  },
  {
    id: "scrollSepolia",
    name: "Scroll Sepolia",
    symbol: "ETH",
    logo: "/scrolllogo.png",
    avgTxCost: 0.06,
    nativePrice: 3000,
    viemChain: scrollSepolia,
  },
  {
    id: "avalancheFuji",
    name: "Avalanche Fuji",
    symbol: "AVAX",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=026",
    avgTxCost: 0.1,
    nativePrice: 35,
    viemChain: avalancheFuji,
  },
];

// Source and destination chains: OP, World, Base, Arbitrum, Flare, Coston2 (in this order)
const supportedChainIds = ["op", "world", "base", "arb", "flare", "coston2"] as const;
export const SOURCE_CHAINS = supportedChainIds
  .map((id) => allChains.find((chain) => chain.id === id))
  .filter((chain): chain is ChainData => chain !== undefined);
export const DESTINATION_CHAINS = supportedChainIds
  .map((id) => allChains.find((chain) => chain.id === id))
  .filter((chain): chain is ChainData => chain !== undefined);

// Export all chains for backward compatibility
export const chains = allChains;

export const getViemChain = (chainId: string): Chain | undefined => {
  return chainIdMap[chainId];
};

// Map numeric chain IDs to string chain IDs
export const getChainIdFromNumeric = (
  numericChainId: number
): string | undefined => {
  const chain = chains.find((c) => c.viemChain.id === numericChainId);
  return chain?.id;
};

// Map string chain IDs to numeric chain IDs
export const getNumericChainId = (chainId: string): number | undefined => {
  const chain = chains.find((c) => c.id === chainId);
  return chain?.viemChain.id;
};

// Get explorer URL for a chain
export const getExplorerUrl = (chainId: string): string => {
  const chain = chains.find((c) => c.id === chainId);
  if (!chain) return "https://basescan.org";

  // Use blockExplorer from viem chain if available
  const explorer = chain.viemChain.blockExplorers?.default;
  if (explorer?.url) {
    return explorer.url;
  }

  // Fallback to known explorers
  const explorerMap: Record<string, string> = {
    base: "https://basescan.org",
    arb: "https://arbiscan.io",
    op: "https://optimistic.etherscan.io",
    eth: "https://etherscan.io",
  };

  return explorerMap[chainId] || "https://basescan.org";
};

// Get Treasury contract address for a chain
export const getTreasuryAddress = (chainId: number): string | undefined => {
  return TREASURY_ADDRESSES[chainId];
};

// Get Treasury contract address by string chain ID
export const getTreasuryAddressByStringId = (chainId: string): string | undefined => {
  const numericId = getNumericChainId(chainId);
  return numericId ? TREASURY_ADDRESSES[numericId] : undefined;
};

export { chainIdMap };
