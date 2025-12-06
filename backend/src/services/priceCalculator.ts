/**
 * Price Calculator Service
 * 
 * Provides hardcoded exchange rate calculations for the Treasury demo system.
 * Uses predefined rates from configuration file instead of live oracle feeds.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ExchangeRates {
  version: number;
  lastUpdated: string;
  tokens: {
    [symbol: string]: number;
  };
  chains: {
    [chainId: string]: {
      chainId: number;
      name: string;
      nativeSymbol: string;
      usdPrice: number;
    };
  };
}

export interface ChainDistribution {
  chainId: number;
  recipient: string;
  amount: bigint;
  token?: string; // undefined for native token
}

/**
 * PriceCalculator service for hardcoded exchange rate calculations
 */
export class PriceCalculator {
  private exchangeRates: ExchangeRates;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(__dirname, '../config/exchangeRates.json');
    this.exchangeRates = this.loadExchangeRates();
  }

  /**
   * Load exchange rates from configuration file
   */
  private loadExchangeRates(): ExchangeRates {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      const rates = JSON.parse(configData) as ExchangeRates;
      
      // Validate required fields
      if (!rates.version || !rates.tokens || !rates.chains) {
        throw new Error('Invalid exchange rates configuration: missing required fields');
      }

      return rates;
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
      throw new Error(`Failed to load exchange rates from ${this.configPath}`);
    }
  }

  /**
   * Reload exchange rates from configuration file
   * Supports hot-reloading without service restart
   */
  public reloadExchangeRates(): void {
    this.exchangeRates = this.loadExchangeRates();
  }

  /**
   * Get USD value of a token amount
   * 
   * @param token - Token symbol (e.g., "USDC", "FLR")
   * @param amount - Token amount in base units (wei for 18 decimals)
   * @returns USD value as a number
   * 
   * Requirements: 4.1, 4.2
   */
  public getUsdValue(token: string, amount: bigint): number {
    const tokenUpper = token.toUpperCase();
    const rate = this.exchangeRates.tokens[tokenUpper];
    
    if (rate === undefined) {
      throw new Error(`Exchange rate not found for token: ${token}`);
    }

    // Convert from wei (18 decimals) to token units
    const tokenAmount = Number(amount) / 1e18;
    return tokenAmount * rate;
  }

  /**
   * Get native token amount for a USD value on a specific chain
   * 
   * @param chainId - Chain ID
   * @param usdValue - USD value to convert
   * @returns Native token amount in base units (wei)
   * 
   * Requirements: 4.3
   */
  public getNativeAmount(chainId: number, usdValue: number): bigint {
    const chainConfig = this.exchangeRates.chains[chainId.toString()];
    
    if (!chainConfig) {
      throw new Error(`Exchange rate not found for chain: ${chainId}`);
    }

    const nativePrice = chainConfig.usdPrice;
    if (nativePrice <= 0) {
      throw new Error(`Invalid price for chain ${chainId}: ${nativePrice}`);
    }

    // Calculate native token amount
    const nativeAmount = usdValue / nativePrice;
    
    // Convert to wei (18 decimals)
    return BigInt(Math.floor(nativeAmount * 1e18));
  }

  /**
   * Calculate distribution amounts for multiple destination chains
   * 
   * @param sourceToken - Source token symbol
   * @param sourceAmount - Source token amount in base units
   * @param destinationChains - Array of destination chain IDs
   * @param allocationPercentages - Percentage allocation for each chain (must sum to 100)
   * @returns Array of ChainDistribution objects
   * 
   * Requirements: 4.1, 4.3
   */
  public calculateDistributions(
    sourceToken: string,
    sourceAmount: bigint,
    destinationChains: number[],
    allocationPercentages: number[]
  ): ChainDistribution[] {
    // Validate inputs
    if (destinationChains.length !== allocationPercentages.length) {
      throw new Error('Destination chains and allocation percentages must have same length');
    }

    const totalPercentage = allocationPercentages.reduce((sum, pct) => sum + pct, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Allocation percentages must sum to 100, got ${totalPercentage}`);
    }

    // Calculate total USD value
    const totalUsdValue = this.getUsdValue(sourceToken, sourceAmount);

    // Calculate distribution for each chain
    const distributions: ChainDistribution[] = [];
    
    for (let i = 0; i < destinationChains.length; i++) {
      const chainId = destinationChains[i];
      const percentage = allocationPercentages[i];
      
      // Calculate USD value for this chain
      const chainUsdValue = (totalUsdValue * percentage) / 100;
      
      // Convert to native token amount
      const nativeAmount = this.getNativeAmount(chainId, chainUsdValue);
      
      distributions.push({
        chainId,
        recipient: '', // Will be filled in by caller
        amount: nativeAmount,
      });
    }

    return distributions;
  }

  /**
   * Get exchange rate for a token
   * 
   * @param token - Token symbol
   * @returns USD price per token
   * 
   * Requirements: 4.1
   */
  public getExchangeRate(token: string): number {
    const tokenUpper = token.toUpperCase();
    const rate = this.exchangeRates.tokens[tokenUpper];
    
    if (rate === undefined) {
      throw new Error(`Exchange rate not found for token: ${token}`);
    }

    return rate;
  }

  /**
   * Get exchange rate for a chain's native token
   * 
   * @param chainId - Chain ID
   * @returns USD price per native token
   */
  public getChainExchangeRate(chainId: number): number {
    const chainConfig = this.exchangeRates.chains[chainId.toString()];
    
    if (!chainConfig) {
      throw new Error(`Exchange rate not found for chain: ${chainId}`);
    }

    return chainConfig.usdPrice;
  }

  /**
   * Update exchange rates (admin only)
   * 
   * @param rates - New exchange rates configuration
   * 
   * Requirements: 4.5
   */
  public updateExchangeRates(rates: ExchangeRates): void {
    // Validate the new rates
    if (!rates.version || !rates.tokens || !rates.chains) {
      throw new Error('Invalid exchange rates: missing required fields');
    }

    // Increment version
    rates.version = this.exchangeRates.version + 1;
    rates.lastUpdated = new Date().toISOString();

    // Write to file
    try {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(rates, null, 2),
        'utf-8'
      );
      
      // Reload from file
      this.exchangeRates = rates;
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
      throw new Error('Failed to write exchange rates to configuration file');
    }
  }

  /**
   * Get all current exchange rates
   * 
   * @returns Current exchange rates configuration
   */
  public getAllExchangeRates(): ExchangeRates {
    return { ...this.exchangeRates };
  }

  /**
   * Get supported tokens
   * 
   * @returns Array of supported token symbols
   */
  public getSupportedTokens(): string[] {
    return Object.keys(this.exchangeRates.tokens);
  }

  /**
   * Get supported chains
   * 
   * @returns Array of supported chain IDs
   */
  public getSupportedChains(): number[] {
    return Object.keys(this.exchangeRates.chains).map(id => parseInt(id));
  }

  /**
   * Check if a token is supported
   * 
   * @param token - Token symbol
   * @returns True if token is supported
   */
  public isTokenSupported(token: string): boolean {
    return this.exchangeRates.tokens[token.toUpperCase()] !== undefined;
  }

  /**
   * Check if a chain is supported
   * 
   * @param chainId - Chain ID
   * @returns True if chain is supported
   */
  public isChainSupported(chainId: number): boolean {
    return this.exchangeRates.chains[chainId.toString()] !== undefined;
  }
}

// Export singleton instance
let priceCalculatorInstance: PriceCalculator | null = null;

/**
 * Get singleton instance of PriceCalculator
 */
export function getPriceCalculator(): PriceCalculator {
  if (!priceCalculatorInstance) {
    priceCalculatorInstance = new PriceCalculator();
  }
  return priceCalculatorInstance;
}

/**
 * Reset singleton instance (for testing)
 */
export function resetPriceCalculator(): void {
  priceCalculatorInstance = null;
}
