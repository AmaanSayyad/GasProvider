import { ethers } from "ethers";
import { getRpcConfig, RpcEndpoint } from "../config/rpcEndpoints";
import {
  getErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  withRpcRetry,
  withTransactionTimeout,
} from "../utils/errorHandler";

/**
 * Transaction to be executed
 */
export interface Transaction {
  to: string;
  data: string;
  value?: bigint;
  gasLimit?: bigint;
}

/**
 * Transaction receipt with confirmation details
 */
export interface TransactionReceipt {
  txHash: string;
  blockNumber: number;
  status: "success" | "failed";
  gasUsed: bigint;
  confirmations: number;
}

/**
 * Transaction status information
 */
export interface TransactionStatus {
  pending: boolean;
  confirmed: boolean;
  confirmations: number;
  blockNumber?: number;
}

/**
 * RPC health status
 */
interface RpcHealthStatus {
  url: string;
  healthy: boolean;
  lastCheck: number;
  latency?: number;
}

/**
 * TransactionExecutor Service
 * Handles transaction execution across multiple chains with automatic failover
 */
export class TransactionExecutor {
  private providers: Map<number, ethers.JsonRpcProvider>;
  private signers: Map<number, ethers.Wallet>;
  private nonces: Map<number, number>;
  private rpcHealth: Map<string, RpcHealthStatus>;
  private healthCheckInterval: NodeJS.Timeout | null;

  constructor(privateKey?: string) {
    this.providers = new Map();
    this.signers = new Map();
    this.nonces = new Map();
    this.rpcHealth = new Map();
    this.healthCheckInterval = null;

    // Initialize providers for all configured chains
    this.initializeProviders(privateKey);

    // Start RPC health checking
    this.startHealthChecking();
  }

  /**
   * Initialize Web3 providers for all chains
   */
  private initializeProviders(privateKey?: string): void {
    // Get all configured chain IDs from RPC config
    const chainIds = [
      114,       // Coston2 Testnet
      14,        // Flare Mainnet
      11155111,  // Ethereum Sepolia
      80002,     // Polygon Amoy
      421614,    // Arbitrum Sepolia
      11155420,  // Optimism Sepolia
      97,        // BSC Testnet
      56,        // BSC Mainnet
      43114,     // Avalanche Mainnet
      43113,     // Avalanche Fuji Testnet
      84532,     // Base Sepolia
      4801,      // World Sepolia
      999999999, // Zora Sepolia
      534351,    // Scroll Sepolia
    ];

    for (const chainId of chainIds) {
      const rpcConfig = getRpcConfig(chainId);
      if (!rpcConfig) {
        console.warn(`No RPC configuration found for chain ${chainId}`);
        continue;
      }

      // Get the highest priority (lowest number) endpoint
      const primaryEndpoint = rpcConfig.endpoints.sort(
        (a, b) => a.priority - b.priority
      )[0];

      try {
        const provider = new ethers.JsonRpcProvider(primaryEndpoint.url, chainId);
        this.providers.set(chainId, provider);

        // Initialize signer if private key provided
        if (privateKey) {
          const signer = new ethers.Wallet(privateKey, provider);
          this.signers.set(chainId, signer);
        }

        // Initialize health status for all endpoints
        for (const endpoint of rpcConfig.endpoints) {
          this.rpcHealth.set(`${chainId}-${endpoint.url}`, {
            url: endpoint.url,
            healthy: true,
            lastCheck: Date.now(),
          });
        }

        console.log(`Initialized provider for chain ${chainId}`);
      } catch (error) {
        console.error(`Failed to initialize provider for chain ${chainId}:`, error);
      }
    }
  }

  /**
   * Start periodic RPC health checking
   */
  private startHealthChecking(): void {
    // Check health every 60 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkAllRpcHealth();
    }, 60000);
  }

  /**
   * Stop health checking
   */
  public stopHealthChecking(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Check health of all RPC endpoints
   */
  private async checkAllRpcHealth(): Promise<void> {
    const chainIds = Array.from(this.providers.keys());

    for (const chainId of chainIds) {
      const rpcConfig = getRpcConfig(chainId);
      if (!rpcConfig) continue;

      for (const endpoint of rpcConfig.endpoints) {
        await this.checkRpcHealth(chainId, endpoint);
      }
    }
  }

  /**
   * Check health of a specific RPC endpoint
   */
  private async checkRpcHealth(
    chainId: number,
    endpoint: RpcEndpoint
  ): Promise<boolean> {
    const key = `${chainId}-${endpoint.url}`;
    const startTime = Date.now();

    try {
      const provider = new ethers.JsonRpcProvider(endpoint.url, chainId);
      await provider.getBlockNumber();

      const latency = Date.now() - startTime;

      this.rpcHealth.set(key, {
        url: endpoint.url,
        healthy: true,
        lastCheck: Date.now(),
        latency,
      });

      return true;
    } catch (error) {
      this.rpcHealth.set(key, {
        url: endpoint.url,
        healthy: false,
        lastCheck: Date.now(),
      });

      // Only log health check failures once per hour to reduce spam
      const lastLogKey = `health-log-${endpoint.url}`;
      const lastLog = (this as any)[lastLogKey] || 0;
      const now = Date.now();
      if (now - lastLog > 3600000) { // 1 hour
        console.warn(`RPC health check failed for ${endpoint.url}`);
        (this as any)[lastLogKey] = now;
      }
      return false;
    }
  }

  /**
   * Get provider for a chain with automatic failover
   */
  private async getProvider(chainId: number): Promise<ethers.JsonRpcProvider> {
    const currentProvider = this.providers.get(chainId);
    if (!currentProvider) {
      throw new Error(`No provider configured for chain ${chainId}`);
    }

    // Try current provider first
    try {
      await currentProvider.getBlockNumber();
      return currentProvider;
    } catch (error) {
      console.warn(`Primary provider failed for chain ${chainId}, trying fallback`);
    }

    // Try fallback endpoints
    const rpcConfig = getRpcConfig(chainId);
    if (!rpcConfig) {
      throw new Error(`No RPC configuration for chain ${chainId}`);
    }

    // Sort endpoints by priority and health
    const sortedEndpoints = rpcConfig.endpoints
      .map((endpoint) => ({
        endpoint,
        health: this.rpcHealth.get(`${chainId}-${endpoint.url}`),
      }))
      .filter((e) => e.health?.healthy !== false)
      .sort((a, b) => a.endpoint.priority - b.endpoint.priority);

    for (const { endpoint } of sortedEndpoints) {
      try {
        const provider = new ethers.JsonRpcProvider(endpoint.url, chainId);
        await provider.getBlockNumber();

        // Update provider
        this.providers.set(chainId, provider);

        // Update signer if exists
        const currentSigner = this.signers.get(chainId);
        if (currentSigner) {
          const newSigner = new ethers.Wallet(currentSigner.privateKey, provider);
          this.signers.set(chainId, newSigner);
        }

        console.log(`Switched to fallback RPC for chain ${chainId}: ${endpoint.url}`);
        return provider;
      } catch (error) {
        console.warn(`Fallback RPC failed for ${endpoint.url}:`, error);
      }
    }

    throw new Error(`All RPC endpoints failed for chain ${chainId}`);
  }

  /**
   * Get signer for a chain
   */
  private getSigner(chainId: number): ethers.Wallet {
    const signer = this.signers.get(chainId);
    if (!signer) {
      throw new Error(`No signer configured for chain ${chainId}`);
    }
    return signer;
  }

  /**
   * Get next nonce for a chain with conflict resolution
   */
  private async getNextNonce(chainId: number): Promise<number> {
    return withRpcRetry(
      async () => {
        const signer = this.getSigner(chainId);
        const provider = await this.getProvider(chainId);

        // Get pending nonce from network
        const pendingNonce = await provider.getTransactionCount(
          signer.address,
          "pending"
        );

        // Get cached nonce
        const cachedNonce = this.nonces.get(chainId) || 0;

        // Use the higher of the two
        const nonce = Math.max(pendingNonce, cachedNonce);

        // Update cache
        this.nonces.set(chainId, nonce + 1);

        return nonce;
      },
      "getNextNonce",
      3,
      { chainId, signerAddress: this.getSigner(chainId).address }
    );
  }

  /**
   * Reset nonce cache for a chain (for nonce conflict resolution)
   */
  private resetNonce(chainId: number): void {
    this.nonces.delete(chainId);
    console.log(`🔄 Reset nonce cache for chain ${chainId}`);
  }

  /**
   * Execute transaction on specific chain with comprehensive error handling
   */
  public async executeTransaction(
    chainId: number,
    transaction: Transaction,
    maxRetries: number = 3
  ): Promise<TransactionReceipt> {
    const errorHandler = getErrorHandler();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const signer = this.getSigner(chainId);
        const provider = await this.getProvider(chainId);

        // Get nonce with retry logic
        const nonce = await this.getNextNonce(chainId);

        // Estimate gas if not provided (with 20% buffer)
        let gasLimit = transaction.gasLimit;
        if (!gasLimit) {
          gasLimit = await this.estimateGas(chainId, transaction);
        }

        // Get gas price with retry
        const feeData = await withRpcRetry(
          () => provider.getFeeData(),
          "getFeeData",
          3,
          { chainId }
        );

        // Prepare transaction with EIP-1559 support
        let tx: any;
        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
          // EIP-1559 transaction (Arbitrum, Optimism, Base, etc.)
          
          // For Arbitrum, use fixed higher gas prices due to unreliable RPC fee estimates
          let maxFeePerGas: bigint;
          let maxPriorityFeePerGas: bigint;
          
          if (chainId === 421614 || chainId === 42161) {
            // Arbitrum: Use fixed 1 gwei to avoid underpriced transactions
            maxFeePerGas = ethers.parseUnits("1", "gwei");
            maxPriorityFeePerGas = ethers.parseUnits("0.1", "gwei");
            console.log(`⛽ Using fixed Arbitrum gas prices: maxFee=1 gwei, priorityFee=0.1 gwei`);
          } else {
            // Other chains: Use RPC fee data with buffer
            const bufferMultiplier = 120n;
            maxFeePerGas = (feeData.maxFeePerGas * bufferMultiplier) / 100n;
            maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
            
            // Ensure minimum gas price
            const minGasPrice = ethers.parseUnits("0.1", "gwei");
            if (maxFeePerGas < minGasPrice) {
              console.warn(`⚠️ maxFeePerGas too low (${ethers.formatUnits(maxFeePerGas, "gwei")} gwei), using minimum ${ethers.formatUnits(minGasPrice, "gwei")} gwei`);
              maxFeePerGas = minGasPrice;
            }
            if (maxPriorityFeePerGas < minGasPrice / 10n) {
              maxPriorityFeePerGas = minGasPrice / 10n;
            }
            
            console.log(`⛽ Gas prices for chain ${chainId}: maxFee=${ethers.formatUnits(maxFeePerGas, "gwei")} gwei, priorityFee=${ethers.formatUnits(maxPriorityFeePerGas, "gwei")} gwei`);
          }
          
          tx = {
            to: transaction.to,
            data: transaction.data,
            value: transaction.value || 0n,
            gasLimit,
            maxFeePerGas,
            maxPriorityFeePerGas,
            nonce,
            chainId,
            type: 2, // EIP-1559
          };
        } else {
          // Legacy transaction
          const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei");
          
          tx = {
            to: transaction.to,
            data: transaction.data,
            value: transaction.value || 0n,
            gasLimit,
            gasPrice,
            nonce,
            chainId,
          };
        }

        // Send transaction with timeout
        const txResponse = await withTransactionTimeout(
          () => signer.sendTransaction(tx),
          "sendTransaction",
          60000, // 1 minute timeout for sending
          { chainId, nonce, to: transaction.to }
        );

        console.log(`✅ Transaction sent on chain ${chainId}: ${txResponse.hash}`);

        // Wait for confirmation with timeout
        const receipt = await this.waitForConfirmation(
          chainId,
          txResponse.hash,
          1
        );

        return receipt;
      } catch (error: any) {
        lastError = error;

        // Handle nonce conflicts
        if (
          error.message?.includes("nonce") ||
          error.message?.includes("already known") ||
          error.code === "NONCE_EXPIRED" ||
          error.code === "REPLACEMENT_UNDERPRICED"
        ) {
          console.warn(`⚠️ Nonce conflict detected on chain ${chainId}, resetting nonce cache`);
          this.resetNonce(chainId);

          // Log nonce conflict
          await errorHandler.handleError(
            error,
            ErrorCategory.TRANSACTION,
            ErrorSeverity.WARNING,
            {
              chainId,
              attempt: attempt + 1,
              maxRetries,
              errorType: "nonce_conflict",
            }
          );
        } else {
          // Log other transaction errors
          await errorHandler.handleError(
            error,
            ErrorCategory.TRANSACTION,
            attempt === maxRetries - 1 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING,
            {
              chainId,
              attempt: attempt + 1,
              maxRetries,
              to: transaction.to,
            }
          );
        }

        // Wait before retry with exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    const finalError = new Error(
      `Transaction failed after ${maxRetries} attempts: ${lastError?.message}`
    );

    await errorHandler.handleError(
      finalError,
      ErrorCategory.TRANSACTION,
      ErrorSeverity.CRITICAL,
      {
        chainId,
        attempts: maxRetries,
        lastError: lastError?.message,
      }
    );

    throw finalError;
  }

  /**
   * Wait for transaction confirmation
   */
  public async waitForConfirmation(
    chainId: number,
    txHash: string,
    confirmations: number = 1,
    timeout: number = 300000 // 5 minutes
  ): Promise<TransactionReceipt> {
    const provider = await this.getProvider(chainId);
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash);

        if (receipt) {
          const currentBlock = await provider.getBlockNumber();
          const txConfirmations = currentBlock - receipt.blockNumber + 1;

          if (txConfirmations >= confirmations) {
            return {
              txHash: receipt.hash,
              blockNumber: receipt.blockNumber,
              status: receipt.status === 1 ? "success" : "failed",
              gasUsed: receipt.gasUsed,
              confirmations: txConfirmations,
            };
          }
        }

        // Wait 2 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn(`Error checking transaction ${txHash}:`, error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    throw new Error(`Transaction ${txHash} confirmation timeout after ${timeout}ms`);
  }

  /**
   * Get transaction status
   */
  public async getTransactionStatus(
    chainId: number,
    txHash: string
  ): Promise<TransactionStatus> {
    const provider = await this.getProvider(chainId);

    try {
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return {
          pending: true,
          confirmed: false,
          confirmations: 0,
        };
      }

      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber + 1;

      return {
        pending: false,
        confirmed: true,
        confirmations,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error(`Error getting transaction status for ${txHash}:`, error);
      throw error;
    }
  }

  /**
   * Estimate gas for transaction with 20% buffer
   */
  public async estimateGas(
    chainId: number,
    transaction: Transaction
  ): Promise<bigint> {
    try {
      const provider = await this.getProvider(chainId);
      const signer = this.getSigner(chainId);

      const estimate = await withRpcRetry(
        () =>
          provider.estimateGas({
            from: signer.address, // Include sender address for accurate estimation
            to: transaction.to,
            data: transaction.data,
            value: transaction.value || 0n,
          }),
        "estimateGas",
        3,
        { chainId, to: transaction.to }
      );

      // Add 20% buffer to prevent out-of-gas errors
      const bufferedEstimate = (estimate * 120n) / 100n;
      console.log(
        `⛽ Gas estimate for chain ${chainId}: ${estimate} (buffered: ${bufferedEstimate})`
      );

      return bufferedEstimate;
    } catch (error: any) {
      console.warn(
        `⚠️ Gas estimation failed for chain ${chainId}, using default: ${error.message}`
      );

      // Log warning but don't fail
      await getErrorHandler().handleError(
        error,
        ErrorCategory.RPC,
        ErrorSeverity.WARNING,
        {
          chainId,
          to: transaction.to,
          fallbackGas: "200000",
        }
      );

      // Return a reasonable default
      return 200000n;
    }
  }

  /**
   * Get current gas price
   */
  public async getGasPrice(chainId: number): Promise<bigint> {
    const provider = await this.getProvider(chainId);

    try {
      const feeData = await provider.getFeeData();
      return feeData.gasPrice || ethers.parseUnits("20", "gwei");
    } catch (error) {
      console.error(`Failed to get gas price for chain ${chainId}:`, error);
      return ethers.parseUnits("20", "gwei");
    }
  }

  /**
   * Get RPC health status for a chain
   */
  public getRpcHealthStatus(chainId: number): RpcHealthStatus[] {
    const rpcConfig = getRpcConfig(chainId);
    if (!rpcConfig) return [];

    return rpcConfig.endpoints.map((endpoint) => {
      const key = `${chainId}-${endpoint.url}`;
      return (
        this.rpcHealth.get(key) || {
          url: endpoint.url,
          healthy: true,
          lastCheck: 0,
        }
      );
    });
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopHealthChecking();
    this.providers.clear();
    this.signers.clear();
    this.nonces.clear();
    this.rpcHealth.clear();
  }
}