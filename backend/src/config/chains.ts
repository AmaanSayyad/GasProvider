/**
 * Chain configuration with RPC URLs and contract addresses
 * TODO: Move RPC URLs to environment variables for production
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  contractAddress?: string; // Escrow contract address on this chain
  explorerUrl: string;
  nativeSymbol: string;
}

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  // Coston2 Testnet
  114: {
    chainId: 114,
    name: "Coston2",
    rpcUrl:
      process.env.COSTON2_RPC_URL ||
      "https://coston2-api.flare.network/ext/C/rpc",
    explorerUrl: "https://coston2-explorer.flare.network",
    nativeSymbol: "C2FLR",
    contractAddress: process.env.CONTRACT_ADDRESS_114,
  },
  // BSC Testnet
  97: {
    chainId: 97,
    name: "BSC Testnet",
    rpcUrl: process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet-rpc.publicnode.com",
    explorerUrl: "https://testnet.bscscan.com",
    nativeSymbol: "tBNB",
    contractAddress: process.env.TREASURY_BSC_TESTNET_ADDRESS || "0x5b402676535a3ba75c851c14e1e249a4257d2265",
  },
  // Treasury Demo System - Testnets
  // Ethereum Sepolia
  11155111: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    explorerUrl: "https://sepolia.etherscan.io",
    nativeSymbol: "ETH",
    contractAddress: process.env.TREASURY_SEPOLIA_ADDRESS,
  },
  // Polygon Amoy (Mumbai replacement)
  80002: {
    chainId: 80002,
    name: "Polygon Amoy",
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
    explorerUrl: "https://amoy.polygonscan.com",
    nativeSymbol: "MATIC",
    contractAddress: process.env.TREASURY_POLYGON_AMOY_ADDRESS,
  },
  // Arbitrum Sepolia
  421614: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUrl: "https://sepolia.arbiscan.io",
    nativeSymbol: "ETH",
    contractAddress: process.env.TREASURY_ARBITRUM_SEPOLIA_ADDRESS,
  },
  // Optimism Sepolia
  11155420: {
    chainId: 11155420,
    name: "Optimism Sepolia",
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    nativeSymbol: "ETH",
    contractAddress: process.env.TREASURY_OPTIMISM_SEPOLIA_ADDRESS,
  },
  // Avalanche Fuji Testnet
  43113: {
    chainId: 43113,
    name: "Avalanche Fuji",
    rpcUrl: process.env.AVALANCHE_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
    explorerUrl: "https://testnet.snowtrace.io",
    nativeSymbol: "AVAX",
    contractAddress: process.env.TREASURY_AVALANCHE_FUJI_ADDRESS,
  },
  // Base Sepolia
  84532: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    nativeSymbol: "ETH",
    contractAddress: process.env.TREASURY_BASE_SEPOLIA_ADDRESS,
  },
  // World Sepolia
  4801: {
    chainId: 4801,
    name: "World Sepolia",
    rpcUrl: process.env.WORLD_SEPOLIA_RPC_URL || "https://worldchain-sepolia.g.alchemy.com/public",
    explorerUrl: "https://worldchain-sepolia.explorer.alchemy.com",
    nativeSymbol: "ETH",
    contractAddress: process.env.TREASURY_WORLD_SEPOLIA_ADDRESS,
  },
  // Zora Sepolia
  999999999: {
    chainId: 999999999,
    name: "Zora Sepolia",
    rpcUrl: process.env.ZORA_SEPOLIA_RPC_URL || "https://sepolia.rpc.zora.energy",
    explorerUrl: "https://sepolia.explorer.zora.energy",
    nativeSymbol: "ETH",
    contractAddress: process.env.TREASURY_ZORA_SEPOLIA_ADDRESS,
  },
  // Scroll Sepolia
  534351: {
    chainId: 534351,
    name: "Scroll Sepolia",
    rpcUrl: process.env.SCROLL_SEPOLIA_RPC_URL || "https://sepolia-rpc.scroll.io",
    explorerUrl: "https://sepolia.scrollscan.com",
    nativeSymbol: "ETH",
    contractAddress: process.env.TREASURY_SCROLL_SEPOLIA_ADDRESS,
  },
};

/**
 * Get chain configuration by chain ID
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return CHAIN_CONFIGS[chainId];
}

/**
 * Get contract address for a chain
 * TODO: Load from environment variables or a registry
 */
export function getContractAddress(chainId: number): string | undefined {
  const config = getChainConfig(chainId);
  return config?.contractAddress || process.env[`CONTRACT_ADDRESS_${chainId}`];
}
