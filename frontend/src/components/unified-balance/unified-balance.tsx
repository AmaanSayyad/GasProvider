"use client";
import React, { memo, useMemo, useState, useEffect } from "react";
import { useNexus } from "../nexus/NexusProvider";
import { useAccount } from "wagmi";
import { DollarSign, RefreshCw, Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Separator } from "../ui/separator";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const UnifiedBalance = ({ className }: { className?: string }) => {
  const { unifiedBalance, nexusSDK, fetchUnifiedBalance } = useNexus();
  const { chainId, isConnected } = useAccount();
  const [refreshing, setRefreshing] = useState(false);
  const [prevChainId, setPrevChainId] = useState<number | undefined>(chainId);

  // Auto-refresh balances when chain changes
  useEffect(() => {
    if (isConnected && chainId && chainId !== prevChainId && fetchUnifiedBalance) {
      console.log("Chain changed in UnifiedBalance, refreshing balances...", { from: prevChainId, to: chainId });
      setPrevChainId(chainId);
      // Add a small delay to ensure chain switch is complete
      const timeoutId = setTimeout(() => {
        fetchUnifiedBalance().catch((error) => {
          console.error("Error refreshing balances on chain change:", error);
        });
      }, 1000); // Wait 1 second for chain switch to complete
      
      return () => clearTimeout(timeoutId);
    }
  }, [chainId, isConnected, prevChainId, fetchUnifiedBalance]);

  const handleRefresh = async (): Promise<void> => {
    try {
      setRefreshing(true);
      await fetchUnifiedBalance?.();
    } finally {
      setRefreshing(false);
    }
  };

  const totalFiat = useMemo(() => {
    if (!unifiedBalance) return "0.00";
    const total = unifiedBalance.reduce((acc, fiat) => acc + fiat.balanceInFiat, 0);
    return total.toFixed(2);
  }, [unifiedBalance]);

  const tokens = useMemo(() => {
    const filtered = (unifiedBalance ?? []).filter((token) => Number.parseFloat(token.balance) > 0);
    console.log("Filtered tokens for display:", filtered);
    if (filtered.length > 0) {
      filtered.forEach((token) => {
        console.log(`Displaying token ${token.symbol}:`, {
          totalBalance: token.balance,
          breakdownChains: token.breakdown?.map((b: any) => b.chain?.name || b.chain?.id),
        });
      });
    }
    return filtered;
  }, [unifiedBalance]);

  // Debug: Log current chain and balance data
  useEffect(() => {
    if (unifiedBalance) {
      console.log("Current chainId:", chainId);
      console.log("Unified balance data:", unifiedBalance);
      console.log("Number of tokens:", unifiedBalance.length);
      unifiedBalance.forEach((token) => {
        console.log(`Token ${token.symbol} breakdown:`, token.breakdown?.length || 0, "chains");
      });
    }
  }, [unifiedBalance, chainId]);

  return (
    <div className={cn("glass-card rounded-3xl p-6 mb-6 w-full max-w-4xl mx-auto", className)}>
      <div className="flex items-center justify-between w-full mb-3">
        <div className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Balance</div>
        <div className="inline-flex items-center gap-3">
          <div className="inline-flex items-center gap-1 text-theme font-bold text-lg">
            <DollarSign className="w-4 h-4 text-primary" strokeWidth={3} />
            <span>{totalFiat}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-full border border-theme bg-theme-muted hover:bg-muted text-theme transition-colors disabled:opacity-50"
            aria-label="Refresh balances"
            title="Refresh balances"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {!unifiedBalance || unifiedBalance.length === 0 ? (
        <div className="text-center py-8 text-secondary">
          <p>No balances found. Make sure your wallet is connected.</p>
          <p className="text-xs mt-2">Current chain: {chainId}</p>
        </div>
      ) : null}
      <Accordion type="single" collapsible className="w-full space-y-3">
        {tokens.map((token) => {
          const positiveBreakdown = token.breakdown.filter((chain) => Number.parseFloat(chain.balance) > 0);
          const chainsCount = positiveBreakdown.length;
          const chainsLabel = chainsCount > 1 ? `${chainsCount} chains` : `${chainsCount} chain`;
          return (
            <AccordionItem
              key={token.symbol}
              value={token.symbol}
              className="bg-theme-muted border border-theme rounded-2xl"
            >
              <AccordionTrigger
                className="hover:no-underline cursor-pointer items-center px-4 py-3 rounded-2xl hover:bg-muted"
                hideChevron={false}
              >
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-7">
                      {token.icon && (
                        <img
                          src={token.icon}
                          alt={token.symbol}
                          className="rounded-full size-full ring-1 ring-theme"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-theme">{token.symbol}</h3>
                      <p className="text-xs text-secondary">{chainsLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-semibold text-theme">
                        {nexusSDK?.utils?.formatTokenBalance(token.balance, {
                          symbol: token.symbol,
                          decimals: token.decimals,
                        })}
                      </p>
                      <p className="text-xs text-secondary">${token.balanceInFiat.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 px-4 pb-3">
                  {positiveBreakdown.map((chain, index) => (
                    <React.Fragment key={chain.chain.id}>
                      <div className="flex items-center justify-between px-1 py-1.5 rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="relative size-5">
                            <img
                              src={chain?.chain?.logo}
                              alt={chain.chain.name}
                              sizes="100%"
                              className="rounded-full size-full ring-1 ring-theme"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <span className="text-xs text-theme">{chain.chain.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-theme">
                            {nexusSDK?.utils?.formatTokenBalance(chain.balance, {
                              symbol: token.symbol,
                              decimals: token.decimals,
                            })}
                          </p>
                          <p className="text-[11px] text-secondary">${chain.balanceInFiat.toFixed(2)}</p>
                        </div>
                      </div>
                      {index < positiveBreakdown.length - 1 && <Separator className="my-1 opacity-10" />}
                    </React.Fragment>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
UnifiedBalance.displayName = "UnifiedBalance";
export default memo(UnifiedBalance);
