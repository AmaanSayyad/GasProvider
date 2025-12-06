/**
 * Token configuration for Treasury system
 * Requirements: 9.2, 13.3
 */

export interface TokenInfo {
  symbol: string;
  name: string;
  address?: string; // undefined for native tokens
  decimals: number;
  logo?: string;
  isNative?: boolean;
}

// Supported tokens per chain for Treasury system
export const SUPPORTED_TOKENS: Record<number, TokenInfo[]> = {
  // Coston2
  114: [
    {
      symbol: "C2FLR",
      name: "Coston2 Flare",
      decimals: 18,
      isNative: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x...", // TODO: Add actual USDC address on Coston2
      decimals: 6,
    },
  ],
  // Ethereum Sepolia
  11155111: [
    {
      symbol: "ETH",
      name: "Ether",
      decimals: 18,
      isNative: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x...", // TODO: Add actual USDC address on Sepolia
      decimals: 6,
    },
  ],
  // Polygon Amoy
  80002: [
    {
      symbol: "MATIC",
      name: "MATIC",
      decimals: 18,
      isNative: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x...", // TODO: Add actual USDC address on Amoy
      decimals: 6,
    },
  ],
  // Arbitrum Sepolia
  421614: [
    {
      symbol: "ETH",
      name: "Ether",
      decimals: 18,
      isNative: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x...", // TODO: Add actual USDC address on Arbitrum Sepolia
      decimals: 6,
    },
  ],
  // Optimism Sepolia
  11155420: [
    {
      symbol: "ETH",
      name: "Ether",
      decimals: 18,
      isNative: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x...", // TODO: Add actual USDC address on Optimism Sepolia
      decimals: 6,
    },
  ],
  // Base Sepolia
  84532: [
    {
      symbol: "ETH",
      name: "Ether",
      decimals: 18,
      isNative: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x...", // TODO: Add actual USDC address on Base Sepolia
      decimals: 6,
    },
  ],
  // World Sepolia
  4801: [
    {
      symbol: "ETH",
      name: "Ether",
      decimals: 18,
      isNative: true,
    },
  ],
  // Zora Sepolia
  999999999: [
    {
      symbol: "ETH",
      name: "Ether",
      decimals: 18,
      isNative: true,
    },
  ],
  // Scroll Sepolia
  534351: [
    {
      symbol: "ETH",
      name: "Ether",
      decimals: 18,
      isNative: true,
    },
  ],
  // Avalanche Fuji
  43113: [
    {
      symbol: "AVAX",
      name: "Avalanche",
      decimals: 18,
      isNative: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x...", // TODO: Add actual USDC address on Fuji
      decimals: 6,
    },
  ],
  // BSC Testnet
  97: [
    {
      symbol: "tBNB",
      name: "Test BNB",
      decimals: 18,
      isNative: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x...", // TODO: Add actual USDC address on BSC Testnet
      decimals: 6,
    },
  ],
};

// Get supported tokens for a chain
export const getSupportedTokens = (chainId: number): TokenInfo[] => {
  return SUPPORTED_TOKENS[chainId] || [];
};

// Get token info by symbol and chain
export const getTokenInfo = (chainId: number, symbol: string): TokenInfo | undefined => {
  const tokens = getSupportedTokens(chainId);
  return tokens.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
};

// Get native token for a chain
export const getNativeToken = (chainId: number): TokenInfo | undefined => {
  const tokens = getSupportedTokens(chainId);
  return tokens.find((t) => t.isNative);
};

// Common stablecoins
export const STABLECOINS = ["USDC", "USDT", "DAI", "USDC.e"];

// Check if token is a stablecoin
export const isStablecoin = (symbol: string): boolean => {
  return STABLECOINS.includes(symbol.toUpperCase());
};

// Import Token type and chain utilities
import { Token } from "../types";
import { getNumericChainId } from "./chains";

// Token addresses for mainnet chains (Base, Arbitrum, Optimism, etc.)
// These are the actual USDC addresses on mainnet chains
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  // Base Mainnet
  "8453": {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  // Base Sepolia
  "84532": {
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  // Arbitrum Mainnet
  "42161": {
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  // Arbitrum Sepolia
  "421614": {
    USDC: "0x75faf114eafb1BDbe2F0316DF893fd58cE45AF0F",
  },
  // Optimism Mainnet
  "10": {
    USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  },
  // Optimism Sepolia
  "11155420": {
    USDC: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
  },
  // Ethereum Mainnet
  "1": {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  // Ethereum Sepolia
  "11155111": {
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
  // BSC Mainnet
  "56": {
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  },
  // BSC Testnet
  "97": {
    USDC: "0x64544969ed7EBf5f083679AA3252b7A6a4D4b77E",
  },
  // Avalanche Mainnet
  "43114": {
    USDC: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  // Avalanche Fuji
  "43113": {
    USDC: "0x5425890298aed601595a70AB815c96711a31Bc65",
  },
  // Scroll Mainnet
  "534352": {
    USDC: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4",
  },
  // Scroll Sepolia
  "534351": {
    USDC: "0x02a3e7E0480B668bD46b42852C58363F93e3bE5a",
  },
  // Zora Mainnet
  "7777777": {
    USDC: "0x...", // TODO: Add actual USDC address on Zora
  },
  // Zora Sepolia
  "999999999": {
    USDC: "0x...", // TODO: Add actual USDC address on Zora Sepolia
  },
};

// Get token address for a chain and symbol
export const getTokenAddress = (
  chainId: string | number,
  symbol: string
): string | null => {
  const numericId = typeof chainId === "string" ? getNumericChainId(chainId) : chainId;
  if (!numericId) return null;

  const chainIdStr = String(numericId);
  const addresses = TOKEN_ADDRESSES[chainIdStr];
  if (!addresses) return null;

  const address = addresses[symbol.toUpperCase()];
  return address && address !== "0x..." ? address : null;
};

// Get tokens for a specific chain (returns Token[] format)
export const getTokensForChain = (chainId: string | number): Token[] => {
  const numericId = typeof chainId === "string" ? getNumericChainId(chainId) : chainId;
  if (!numericId) return [];

  const tokenInfos = getSupportedTokens(numericId);
  return tokenInfos.map((tokenInfo) => ({
    symbol: tokenInfo.symbol,
    name: tokenInfo.name,
    balance: 0, // Balance will be fetched separately
    logo: tokenInfo.logo || "",
    isNative: tokenInfo.isNative || false,
    address: tokenInfo.address || getTokenAddress(numericId, tokenInfo.symbol),
    isLoading: false,
  }));
};

// All available tokens across all chains (flattened)
// This is used by components that need a list of all possible tokens
export const tokens: Token[] = [
  // Native tokens
  {
    symbol: "ETH",
    name: "Ether",
    balance: 0,
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=026",
    isNative: true,
    address: null,
    isLoading: false,
  },
  {
    symbol: "C2FLR",
    name: "Coston2 Flare",
    balance: 0,
    logo: "/flarelogo.png",
    isNative: true,
    address: null,
    isLoading: false,
  },
  {
    symbol: "FLR",
    name: "Flare",
    balance: 0,
    logo: "/flarelogo.png",
    isNative: true,
    address: null,
    isLoading: false,
  },
  {
    symbol: "MATIC",
    name: "MATIC",
    balance: 0,
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=026",
    isNative: true,
    address: null,
    isLoading: false,
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    balance: 0,
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=026",
    isNative: true,
    address: null,
    isLoading: false,
  },
  {
    symbol: "tBNB",
    name: "Test BNB",
    balance: 0,
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=026",
    isNative: true,
    address: null,
    isLoading: false,
  },
  // Stablecoins
  {
    symbol: "USDC",
    name: "USD Coin",
    balance: 0,
    logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=026",
    isNative: false,
    address: null, // Address will be resolved per chain
    isLoading: false,
  },
];
