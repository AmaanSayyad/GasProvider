import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { SOURCE_CHAINS, DESTINATION_CHAINS } from "../data/chains";
import { useAccount, useSwitchChain } from "wagmi";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { getViemChain } from "../data/chains";
import { useNexus } from "../components/nexus/NexusProvider";
import { tokens, getTokenAddress } from "../data/tokens";
import {
  GasFountainContextType,
  GasFountainProviderProps,
  ChainData,
  HistoryItem,
  Token,
} from "../types";

const GasFountainContext = createContext<GasFountainContextType | undefined>(
  undefined
);

export const useGasFountain = (): GasFountainContextType => {
  const context = useContext(GasFountainContext);
  if (!context) {
    throw new Error("useGasFountain must be used within a GasFountainProvider");
  }
  return context;
};

export const GasFountainProvider: React.FC<GasFountainProviderProps> = ({
  children,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedChains, setSelectedChains] = useState<ChainData[]>([]);
  const [transactionCounts, setTransactionCounts] = useState<
    Record<string, number>
  >({});
  const [sourceChain, setSourceChainState] = useState<ChainData | null>(null);
  const [sourceToken, setSourceToken] = useState<
    import("../types").Token | null
  >(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  // History is now fetched from backend via ActivityLog component
  // Keeping this for backward compatibility with Step2Execution
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [depositTxHash, setDepositTxHash] = useState<string | undefined>(
    undefined
  );

  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const sourceChainId = sourceChain?.id || "base";
  
  // Try to use unified balances from Nexus SDK first, fallback to wagmi balances
  const { unifiedBalance } = useNexus();
  const { balances: wagmiBalances, isLoading: wagmiLoading } = useTokenBalances(sourceChainId);
  
  // Extract balances for the selected source chain from unified balance
  const tokenBalances = useMemo(() => {
    // If we have unified balance, try to extract balances for the selected chain
    if (unifiedBalance && Array.isArray(unifiedBalance) && unifiedBalance.length > 0 && sourceChain) {
      const viemChain = getViemChain(sourceChain.id);
      if (viemChain) {
        const chainBalances: Token[] = tokens.map((token) => {
          try {
            // Find this token in unified balance
            const unifiedToken = unifiedBalance.find((ut: any) => 
              ut.symbol?.toUpperCase() === token.symbol.toUpperCase()
            );
            
            if (unifiedToken && unifiedToken.breakdown && Array.isArray(unifiedToken.breakdown)) {
              // Find the balance for this specific chain
              const chainBalance = unifiedToken.breakdown.find((bd: any) => {
                const chainIdMatch = bd.chain?.id === viemChain.id;
                const chainNameMatch = bd.chain?.name?.toLowerCase() === sourceChain.name.toLowerCase();
                // Also check numeric chain ID as string
                const chainIdStringMatch = String(bd.chain?.id) === String(viemChain.id);
                return chainIdMatch || chainNameMatch || chainIdStringMatch;
              });
              
              if (chainBalance && chainBalance.balance) {
                const balanceValue = typeof chainBalance.balance === 'string' 
                  ? parseFloat(chainBalance.balance) 
                  : (typeof chainBalance.balance === 'number' ? chainBalance.balance : 0);
                
                return {
                  ...token,
                  balance: balanceValue || 0,
                  address: getTokenAddress(sourceChain.id, token.symbol) || null,
                  isLoading: false,
                };
              }
            }
          } catch (error) {
            console.warn(`Error extracting balance for token ${token.symbol}:`, error);
          }
          
          // Fallback to wagmi balance if not found in unified balance
          const wagmiToken = wagmiBalances.find((wt) => wt.symbol === token.symbol);
          return wagmiToken || { ...token, balance: 0, address: null, isLoading: false };
        });
        
        return chainBalances;
      }
    }
    
    // Fallback to wagmi balances if unified balance not available
    return wagmiBalances;
  }, [unifiedBalance, sourceChain, wagmiBalances]);
  
  const balancesLoading = wagmiLoading;

  // Initialize with destination chains selected and default 10 txs
  useEffect(() => {
    if (selectedChains.length === 0) {
      setSelectedChains(DESTINATION_CHAINS);
      const initialCounts: Record<string, number> = {};
      DESTINATION_CHAINS.forEach((c) => (initialCounts[c.id] = 10));
      setTransactionCounts(initialCounts);
    }
  }, [selectedChains.length]);

  // Initialize source chain to Base
  useEffect(() => {
    if (!sourceChain && SOURCE_CHAINS.length > 0) {
      // Find Base chain, or default to first available chain
      const baseChain = SOURCE_CHAINS.find((chain) => chain.id === "base");
      setSourceChainState(baseChain || SOURCE_CHAINS[0]);
    }
  }, [sourceChain]);

  // Handle chain switching
  const handleSwitchChain = useCallback(
    async (chain: ChainData): Promise<void> => {
      if (!isConnected || !address) {
        // If not connected, just set the chain (will prompt on connect)
        setSourceChainState(chain);
        return;
      }

      const viemChain = getViemChain(chain.id);
      if (!viemChain) return;

      // If already on the correct chain, just update state
      if (chainId === viemChain.id) {
        setSourceChainState(chain);
        return;
      }

      // Switch to the new chain
      try {
        await switchChain({ chainId: viemChain.id });
        setSourceChainState(chain);
      } catch (error) {
        console.error("Failed to switch chain:", error);
      }
    },
    [isConnected, address, chainId, switchChain]
  );

  // Update token balances when chain or connection changes
  useEffect(() => {
    if (isConnected && tokenBalances.length > 0) {
      // Update token balances in context
      // This will be used by components to display real balances
    }
  }, [isConnected, tokenBalances, sourceChainId]);

  const value: GasFountainContextType = {
    currentStep,
    setCurrentStep,
    selectedChains,
    setSelectedChains,
    transactionCounts,
    setTransactionCounts,
    sourceChain,
    setSourceChain: handleSwitchChain,
    sourceToken,
    setSourceToken,
    depositAmount,
    setDepositAmount,
    history,
    setHistory,
    // Wallet state
    isConnected,
    address,
    chainId,
    // Token balances
    tokenBalances,
    balancesLoading,
    // Deposit transaction
    depositTxHash,
    setDepositTxHash,
  };

  return (
    <GasFountainContext.Provider value={value}>
      {children}
    </GasFountainContext.Provider>
  );
};
