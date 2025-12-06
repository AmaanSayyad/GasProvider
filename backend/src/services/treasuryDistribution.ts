/**
 * Treasury Distribution Service
 * 
 * Coordinates multi-chain distributions from Treasury contracts.
 * Executes real onchain transactions to distribute gas tokens to users.
 * 
 * Requirements: 3.4, 5.1, 5.2, 7.2, 8.5
 */

import { ethers } from "ethers";
import { TransactionExecutor, Transaction, TransactionReceipt } from "./transactionExecutor";
import { PriceCalculator } from "./priceCalculator";
import * as fs from "fs";
import * as path from "path";
import {
  getErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  withRpcRetry,
} from "../utils/errorHandler";

/**
 * Distribution request for a single chain
 */
export interface ChainDistribution {
  chainId: number;
  recipient: string;
  amount: bigint;
  token?: string; // undefined for native token
}

/**
 * Result of a distribution operation
 */
export interface DistributionResult {
  chainId: number;
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: bigint;
  blockNumber?: number;
  confirmations?: number;
}

/**
 * Treasury balance information for a chain
 */
export interface TreasuryBalance {
  chainId: number;
  chainName: string;
  native: bigint;
  nativeSymbol: string;
  tokens: {
    [tokenAddress: string]: bigint;
  };
}

/**
 * All Treasury balances across chains
 */
export interface TreasuryBalances {
  [chainId: number]: TreasuryBalance;
}

/**
 * Distribution monitoring metrics
 */
export interface DistributionMetrics {
  totalAttempts: number;
  successfulDistributions: number;
  failedDistributions: number;
  totalGasUsed: bigint;
  totalGasCost: bigint;
  averageGasUsed: number;
  lastDistributionTimestamp: number;
  failuresByChain: { [chainId: number]: number };
  successRateByChain: { [chainId: number]: number };
}

/**
 * Distribution alert
 */
export interface DistributionAlert {
  severity: "info" | "warning" | "critical";
  chainId: number;
  message: string;
  timestamp: number;
  metadata?: any;
}

/**
 * Treasury contract ABI (minimal interface)
 */
const TREASURY_ABI = [
  "function distribute(address payable recipient, uint256 amount, bytes32 intentId) external returns (bytes32)",
  "function distributeToken(address token, address recipient, uint256 amount, bytes32 intentId) external returns (bytes32)",
  "function batchDistribute(address payable[] recipients, uint256[] amounts, bytes32 intentId) external",
  "function getBalance(address token) external view returns (uint256)",
  "function getNativeBalance() external view returns (uint256)",
  "function getTokenBalance(address token) external view returns (uint256)",
  "event Distributed(address indexed recipient, uint256 amount, bytes32 indexed intentId)",
  "event TokenDistributed(address indexed token, address indexed recipient, uint256 amount, bytes32 indexed intentId)",
];

/**
 * Treasury Distribution Service
 * Manages distributions across multiple Treasury contracts on different chains
 */
export class TreasuryDistributionService {
  private transactionExecutor: TransactionExecutor;
  private priceCalculator: PriceCalculator;
  private treasuryAddresses: Map<number, string>;
  private treasuryContracts: Map<number, ethers.Contract>;
  private alertCallbacks: Array<(alert: DistributionAlert) => void> = [];
  
  // Metrics tracking
  private metrics = {
    totalAttempts: 0,
    successfulDistributions: 0,
    failedDistributions: 0,
    totalGasUsed: 0n,
    totalGasCost: 0n,
    gasUsedHistory: [] as number[],
    lastDistributionTimestamp: 0,
    failuresByChain: {} as { [chainId: number]: number },
    attemptsByChain: {} as { [chainId: number]: number },
  };

  constructor(
    transactionExecutor: TransactionExecutor,
    priceCalculator: PriceCalculator,
    treasuryAddressesPath?: string
  ) {
    this.transactionExecutor = transactionExecutor;
    this.priceCalculator = priceCalculator;
    this.treasuryAddresses = new Map();
    this.treasuryContracts = new Map();

    // Load Treasury addresses
    this.loadTreasuryAddresses(treasuryAddressesPath);

    console.log("✅ TreasuryDistributionService initialized");
  }

  /**
   * Load Treasury contract addresses from configuration
   */
  private loadTreasuryAddresses(configPath?: string): void {
    const defaultPath = path.join(__dirname, "../../contracts/deployments/treasury-addresses.json");
    const filePath = configPath || defaultPath;

    try {
      const configData = fs.readFileSync(filePath, "utf-8");
      const addresses = JSON.parse(configData);

      for (const [network, config] of Object.entries(addresses)) {
        const chainConfig = config as any;
        // Support both 'address' and 'treasuryAddress' keys for backward compatibility
        const treasuryAddr = chainConfig.treasuryAddress || chainConfig.address;
        if (chainConfig.chainId && treasuryAddr) {
          this.treasuryAddresses.set(chainConfig.chainId, treasuryAddr);
          console.log(`Loaded Treasury address for chain ${chainConfig.chainId}: ${treasuryAddr}`);
        }
      }
    } catch (error) {
      console.error("Failed to load Treasury addresses:", error);
      throw new Error(`Failed to load Treasury addresses from ${filePath}`);
    }
  }

  /**
   * Get Treasury contract for a chain
   */
  private getTreasuryContract(chainId: number): ethers.Contract {
    // Check cache
    let contract = this.treasuryContracts.get(chainId);
    if (contract) {
      return contract;
    }

    // Get Treasury address
    const treasuryAddress = this.treasuryAddresses.get(chainId);
    if (!treasuryAddress) {
      throw new Error(`No Treasury address configured for chain ${chainId}`);
    }

    // Create contract instance (interface only, no signer needed for encoding)
    contract = new ethers.Contract(treasuryAddress, TREASURY_ABI);
    this.treasuryContracts.set(chainId, contract);

    return contract;
  }

  /**
   * Register a callback for distribution alerts
   */
  onAlert(callback: (alert: DistributionAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Emit a distribution alert
   */
  private emitAlert(alert: DistributionAlert): void {
    const emoji = alert.severity === "critical" ? "🚨" : alert.severity === "warning" ? "⚠️" : "ℹ️";
    console.log(`${emoji} [TREASURY-${alert.chainId}] ${alert.message}`, alert.metadata || "");

    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        console.error("Error in alert callback:", error);
      }
    }
  }

  /**
   * Execute distribution to a single chain
   * 
   * @param chainId - Destination chain ID
   * @param recipient - Recipient address
   * @param amount - Amount to distribute (in wei)
   * @param intentId - Intent ID for tracking
   * @returns Distribution result
   * 
   * Requirements: 5.1, 5.2
   */
  async distributeToChain(
    chainId: number,
    recipient: string,
    amount: bigint,
    intentId: string
  ): Promise<DistributionResult> {
    const startTime = Date.now();
    
    // Update metrics
    this.metrics.totalAttempts++;
    this.metrics.attemptsByChain[chainId] = (this.metrics.attemptsByChain[chainId] || 0) + 1;

    try {
      console.log(`📤 Distributing ${ethers.formatEther(amount)} to ${recipient} on chain ${chainId}`);

      // Get Treasury contract
      const treasury = this.getTreasuryContract(chainId);

      // Encode distribute function call
      const intentIdBytes32 = ethers.id(intentId); // Convert string to bytes32
      const data = treasury.interface.encodeFunctionData("distribute", [
        recipient,
        amount,
        intentIdBytes32,
      ]);

      // Execute transaction
      const transaction: Transaction = {
        to: treasury.target as string,
        data,
        value: 0n, // No value sent, Treasury already has funds
      };

      const receipt = await this.transactionExecutor.executeTransaction(
        chainId,
        transaction
      );

      // Check if transaction was successful
      if (receipt.status === "failed") {
        throw new Error("Transaction reverted");
      }

      // Update metrics
      this.metrics.successfulDistributions++;
      this.metrics.totalGasUsed += receipt.gasUsed;
      this.metrics.gasUsedHistory.push(Number(receipt.gasUsed));
      this.metrics.lastDistributionTimestamp = Date.now();

      // Keep only last 100 gas measurements
      if (this.metrics.gasUsedHistory.length > 100) {
        this.metrics.gasUsedHistory.shift();
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Distribution successful on chain ${chainId} in ${duration}ms - TX: ${receipt.txHash}`);

      this.emitAlert({
        severity: "info",
        chainId,
        message: `Distribution successful: ${ethers.formatEther(amount)} to ${recipient}`,
        timestamp: Date.now(),
        metadata: { txHash: receipt.txHash, gasUsed: receipt.gasUsed.toString(), duration },
      });

      return {
        chainId,
        success: true,
        txHash: receipt.txHash,
        gasUsed: receipt.gasUsed,
        blockNumber: receipt.blockNumber,
        confirmations: receipt.confirmations,
      };
    } catch (error: any) {
      // Update failure metrics
      this.metrics.failedDistributions++;
      this.metrics.failuresByChain[chainId] = (this.metrics.failuresByChain[chainId] || 0) + 1;

      const duration = Date.now() - startTime;
      console.error(`❌ Distribution failed on chain ${chainId} after ${duration}ms:`, error.message);

      this.emitAlert({
        severity: "critical",
        chainId,
        message: `Distribution failed: ${error.message}`,
        timestamp: Date.now(),
        metadata: { recipient, amount: amount.toString(), error: error.message, duration },
      });

      return {
        chainId,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute distributions to multiple chains in parallel
   * 
   * @param distributions - Array of distribution requests
   * @param intentId - Intent ID for tracking
   * @returns Array of distribution results
   * 
   * Requirements: 5.1, 5.3
   */
  async distributeMultiChain(
    distributions: ChainDistribution[],
    intentId: string
  ): Promise<DistributionResult[]> {
    console.log(`🚀 Starting multi-chain distribution for intent ${intentId} to ${distributions.length} chains`);

    // Execute all distributions in parallel
    const promises = distributions.map((dist) =>
      this.distributeToChain(dist.chainId, dist.recipient, dist.amount, intentId)
    );

    const results = await Promise.all(promises);

    // Log summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`📊 Multi-chain distribution complete: ${successful} successful, ${failed} failed`);

    // Alert on repeated failures
    if (failed > 0) {
      this.checkForRepeatedFailures();
    }

    return results;
  }

  /**
   * Get Treasury balance for a specific chain with retry logic
   * 
   * @param chainId - Chain ID
   * @param token - Token address (undefined for native token)
   * @returns Balance in wei
   * 
   * Requirements: 7.2
   */
  async getTreasuryBalance(chainId: number, token?: string): Promise<bigint> {
    return withRpcRetry(
      async () => {
        const treasury = this.getTreasuryContract(chainId);
        const treasuryAddress = treasury.target as string;

        // Encode balance query
        let data: string;
        if (token) {
          data = treasury.interface.encodeFunctionData("getTokenBalance", [token]);
        } else {
          data = treasury.interface.encodeFunctionData("getNativeBalance", []);
        }

        // Get the provider from transaction executor
        const provider = await (this.transactionExecutor as any).getProvider(chainId);
        
        const result = await provider.call({
          to: treasuryAddress,
          data,
        });

        // Decode result
        const balance = treasury.interface.decodeFunctionResult(
          token ? "getTokenBalance" : "getNativeBalance",
          result
        )[0];

        return balance;
      },
      "getTreasuryBalance",
      3,
      { chainId, token: token || "native" }
    );
  }

  /**
   * Get all Treasury balances across all configured chains
   * 
   * @returns Treasury balances for all chains
   * 
   * Requirements: 7.2
   */
  async getAllTreasuryBalances(): Promise<TreasuryBalances> {
    const balances: TreasuryBalances = {};

    const chainIds = Array.from(this.treasuryAddresses.keys());

    // Query all chains in parallel
    const promises = chainIds.map(async (chainId) => {
      try {
        const nativeBalance = await this.getTreasuryBalance(chainId);
        
        // Get chain info from price calculator
        const chainConfig = this.priceCalculator.getAllExchangeRates().chains[chainId.toString()];
        
        balances[chainId] = {
          chainId,
          chainName: chainConfig?.name || `Chain ${chainId}`,
          native: nativeBalance,
          nativeSymbol: chainConfig?.nativeSymbol || "ETH",
          tokens: {}, // TODO: Add token balance queries if needed
        };
      } catch (error: any) {
        console.error(`Failed to get balance for chain ${chainId}:`, error.message);
        // Set zero balance on error
        balances[chainId] = {
          chainId,
          chainName: `Chain ${chainId}`,
          native: 0n,
          nativeSymbol: "ETH",
          tokens: {},
        };
      }
    });

    await Promise.all(promises);

    return balances;
  }

  /**
   * Validate that Treasury has sufficient liquidity for distributions
   * 
   * @param distributions - Array of distribution requests
   * @returns True if sufficient liquidity exists
   * 
   * Requirements: 8.2
   */
  async validateLiquidity(distributions: ChainDistribution[]): Promise<boolean> {
    console.log(`🔍 Validating liquidity for ${distributions.length} distributions`);

    // Group distributions by chain
    const distributionsByChain = new Map<number, bigint>();
    for (const dist of distributions) {
      const current = distributionsByChain.get(dist.chainId) || 0n;
      distributionsByChain.set(dist.chainId, current + dist.amount);
    }

    // Check each chain
    const checks = Array.from(distributionsByChain.entries()).map(async ([chainId, requiredAmount]) => {
      try {
        const balance = await this.getTreasuryBalance(chainId);
        
        if (balance < requiredAmount) {
          this.emitAlert({
            severity: "critical",
            chainId,
            message: `Insufficient Treasury balance: required ${ethers.formatEther(requiredAmount)}, available ${ethers.formatEther(balance)}`,
            timestamp: Date.now(),
            metadata: { required: requiredAmount.toString(), available: balance.toString() },
          });
          return false;
        }

        // Warn if balance is getting low (less than 2x required)
        if (balance < requiredAmount * 2n) {
          this.emitAlert({
            severity: "warning",
            chainId,
            message: `Treasury balance running low: ${ethers.formatEther(balance)} available`,
            timestamp: Date.now(),
            metadata: { balance: balance.toString(), required: requiredAmount.toString() },
          });
        }

        return true;
      } catch (error: any) {
        console.error(`Failed to validate liquidity for chain ${chainId}:`, error.message);
        return false;
      }
    });

    const results = await Promise.all(checks);
    const allValid = results.every((r) => r);

    if (allValid) {
      console.log("✅ Liquidity validation passed");
    } else {
      console.error("❌ Liquidity validation failed");
    }

    return allValid;
  }

  /**
   * Check for repeated failures and emit alerts
   * 
   * Requirements: 8.5
   */
  private checkForRepeatedFailures(): void {
    for (const [chainIdStr, failures] of Object.entries(this.metrics.failuresByChain)) {
      const chainId = parseInt(chainIdStr, 10);
      const attempts = this.metrics.attemptsByChain[chainId] || 0;
      
      if (attempts >= 5) {
        const failureRate = failures / attempts;
        
        if (failureRate > 0.5) {
          this.emitAlert({
            severity: "critical",
            chainId,
            message: `High failure rate on chain ${chainId}: ${(failureRate * 100).toFixed(1)}% (${failures}/${attempts})`,
            timestamp: Date.now(),
            metadata: { failures, attempts, failureRate },
          });
        } else if (failureRate > 0.2) {
          this.emitAlert({
            severity: "warning",
            chainId,
            message: `Elevated failure rate on chain ${chainId}: ${(failureRate * 100).toFixed(1)}% (${failures}/${attempts})`,
            timestamp: Date.now(),
            metadata: { failures, attempts, failureRate },
          });
        }
      }
    }
  }

  /**
   * Get distribution metrics
   * 
   * @returns Current distribution metrics
   * 
   * Requirements: 8.5
   */
  getMetrics(): DistributionMetrics {
    const averageGasUsed =
      this.metrics.gasUsedHistory.length > 0
        ? this.metrics.gasUsedHistory.reduce((a, b) => a + b, 0) / this.metrics.gasUsedHistory.length
        : 0;

    const successRateByChain: { [chainId: number]: number } = {};
    for (const chainId of Object.keys(this.metrics.attemptsByChain).map(Number)) {
      const attempts = this.metrics.attemptsByChain[chainId] || 0;
      const failures = this.metrics.failuresByChain[chainId] || 0;
      const successes = attempts - failures;
      successRateByChain[chainId] = attempts > 0 ? successes / attempts : 0;
    }

    return {
      totalAttempts: this.metrics.totalAttempts,
      successfulDistributions: this.metrics.successfulDistributions,
      failedDistributions: this.metrics.failedDistributions,
      totalGasUsed: this.metrics.totalGasUsed,
      totalGasCost: this.metrics.totalGasCost,
      averageGasUsed,
      lastDistributionTimestamp: this.metrics.lastDistributionTimestamp,
      failuresByChain: { ...this.metrics.failuresByChain },
      successRateByChain,
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      totalAttempts: 0,
      successfulDistributions: 0,
      failedDistributions: 0,
      totalGasUsed: 0n,
      totalGasCost: 0n,
      gasUsedHistory: [],
      lastDistributionTimestamp: 0,
      failuresByChain: {},
      attemptsByChain: {},
    };
  }

  /**
   * Get configured Treasury addresses
   */
  getTreasuryAddresses(): Map<number, string> {
    return new Map(this.treasuryAddresses);
  }
}

// Export singleton instance
let treasuryDistributionServiceInstance: TreasuryDistributionService | null = null;

/**
 * Get singleton instance of TreasuryDistributionService
 */
export function getTreasuryDistributionService(
  transactionExecutor?: TransactionExecutor,
  priceCalculator?: PriceCalculator
): TreasuryDistributionService {
  if (!treasuryDistributionServiceInstance) {
    if (!transactionExecutor || !priceCalculator) {
      throw new Error("TransactionExecutor and PriceCalculator required for first initialization");
    }
    treasuryDistributionServiceInstance = new TreasuryDistributionService(
      transactionExecutor,
      priceCalculator
    );
  }
  return treasuryDistributionServiceInstance;
}

/**
 * Reset singleton instance (for testing)
 */
export function resetTreasuryDistributionService(): void {
  treasuryDistributionServiceInstance = null;
}
