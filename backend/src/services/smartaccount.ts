import { ethers } from "ethers";
import {
  Call,
  GaslessTransaction,
  SmartAccountRecord,
  SmartAccountDeployment,
} from "../types/smartaccount";

/**
 * Service for managing Smart Accounts
 * Handles Smart Account creation, gasless transaction preparation, and automatic routing
 */
export class SmartAccountManager {
  private provider: ethers.JsonRpcProvider;
  private factoryContract: ethers.Contract;
  private smartAccountCache: Map<string, string> = new Map(); // eoaAddress -> smartAccountAddress
  private loggingEnabled: boolean;

  // Smart Account Factory ABI (minimal interface)
  private readonly factoryAbi = [
    "function getSmartAccount(address eoaAddress) external view returns (address)",
    "function deployAccount(address eoaAddress) external returns (address)",
    "function predictSmartAccountAddress(address eoaAddress) external view returns (address)",
    "event SmartAccountDeployed(address indexed eoaAddress, address indexed smartAccountAddress)",
  ];

  // Smart Account ABI (minimal interface)
  private readonly smartAccountAbi = [
    "function execute(address to, uint256 value, bytes calldata data) external",
    "function executeBatch(address[] calldata to, uint256[] calldata value, bytes[] calldata data) external",
    "function getNonce() external view returns (uint256)",
  ];

  constructor(
    rpcUrl: string,
    factoryAddress: string,
    private storageAdapter?: SmartAccountStorageAdapter
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.factoryContract = new ethers.Contract(
      factoryAddress,
      this.factoryAbi,
      this.provider
    );
    this.loggingEnabled = process.env.SMART_ACCOUNT_ENABLE_LOGGING === "true";

    this.log("✅ SmartAccountManager initialized", {
      rpcUrl,
      factoryAddress,
      hasStorageAdapter: !!storageAdapter,
    });
  }

  /**
   * Check if a Smart Account exists for an EOA
   * @param eoaAddress EOA address to check
   * @returns Smart Account address or null if not deployed
   */
  async getSmartAccount(eoaAddress: string): Promise<string | null> {
    try {
      const normalized = ethers.getAddress(eoaAddress);

      // Check cache first
      const cached = this.smartAccountCache.get(normalized);
      if (cached) {
        this.log(`📦 Cache hit for EOA ${normalized}: ${cached}`);
        return cached;
      }

      this.log(`🔍 Checking Smart Account for EOA ${normalized}`);

      // Query factory contract
      const smartAccountAddress = await this.factoryContract.getSmartAccount(normalized);

      // Check if Smart Account is deployed (non-zero address)
      if (smartAccountAddress === ethers.ZeroAddress) {
        this.log(`❌ No Smart Account found for EOA ${normalized}`);
        return null;
      }

      // Verify the Smart Account has code (is actually deployed)
      const code = await this.provider.getCode(smartAccountAddress);
      if (code === "0x") {
        this.log(`❌ Smart Account address ${smartAccountAddress} has no code`);
        return null;
      }

      // Cache the result
      this.smartAccountCache.set(normalized, smartAccountAddress);

      this.log(`✅ Found Smart Account for EOA ${normalized}: ${smartAccountAddress}`);

      return smartAccountAddress;
    } catch (error: any) {
      console.error(`❌ Error checking Smart Account for ${eoaAddress}:`, error);
      throw new Error(`Failed to check Smart Account: ${error.message}`);
    }
  }

  /**
   * Deploy a new Smart Account for an EOA
   * @param eoaAddress EOA address that will own the Smart Account
   * @returns Smart Account deployment details
   */
  async createSmartAccount(eoaAddress: string): Promise<SmartAccountDeployment> {
    try {
      const normalized = ethers.getAddress(eoaAddress);

      this.log(`🚀 Deploying Smart Account for EOA ${normalized}`);

      // Check if Smart Account already exists
      const existing = await this.getSmartAccount(normalized);
      if (existing) {
        this.log(`⚠️ Smart Account already exists for EOA ${normalized}: ${existing}`);
        
        // If we have storage adapter, try to get the deployment tx hash
        let deploymentTxHash = "0x0"; // Placeholder if we can't find it
        if (this.storageAdapter) {
          const chainId = (await this.provider.getNetwork()).chainId;
          const record = await this.storageAdapter.getSmartAccount(normalized, Number(chainId));
          if (record) {
            deploymentTxHash = record.deploymentTxHash;
          }
        }

        return {
          smartAccountAddress: existing,
          deploymentTxHash,
          eoaAddress: normalized,
          chainId: Number((await this.provider.getNetwork()).chainId),
        };
      }

      // Get signer (relayer will deploy the Smart Account)
      const privateKey = process.env.RELAYER_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("RELAYER_PRIVATE_KEY not configured");
      }

      const wallet = new ethers.Wallet(privateKey, this.provider);
      const factoryWithSigner = this.factoryContract.connect(wallet);

      // Deploy Smart Account
      const tx = await factoryWithSigner.deployAccount(normalized);

      this.log(`⏳ Waiting for Smart Account deployment transaction confirmation...`);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction receipt is null");
      }

      // Parse SmartAccountDeployed event to get the Smart Account address
      let smartAccountAddress: string | null = null;

      for (const log of receipt.logs) {
        try {
          const parsed = this.factoryContract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });

          if (parsed && parsed.name === "SmartAccountDeployed") {
            smartAccountAddress = parsed.args.smartAccountAddress;
            break;
          }
        } catch (e) {
          // Not our event, continue
        }
      }

      if (!smartAccountAddress) {
        throw new Error("Failed to parse SmartAccountDeployed event");
      }

      // Cache the Smart Account address
      this.smartAccountCache.set(normalized, smartAccountAddress);

      const chainId = Number((await this.provider.getNetwork()).chainId);

      const deployment: SmartAccountDeployment = {
        smartAccountAddress,
        deploymentTxHash: receipt.hash,
        eoaAddress: normalized,
        chainId,
      };

      this.log(`✅ Smart Account deployed successfully`, {
        eoaAddress: normalized,
        smartAccountAddress,
        txHash: receipt.hash,
        chainId,
      });

      // Store in database if storage adapter is available
      if (this.storageAdapter) {
        await this.storageAdapter.storeSmartAccount({
          id: `${normalized}-${chainId}`, // Composite key
          eoaAddress: normalized,
          smartAccountAddress,
          chainId,
          deploymentTxHash: receipt.hash,
          createdAt: new Date(),
          lastUsedAt: new Date(),
        });

        this.log(`💾 Smart Account stored in database`);
      }

      return deployment;
    } catch (error: any) {
      console.error(`❌ Error deploying Smart Account for ${eoaAddress}:`, error);
      throw new Error(`Failed to deploy Smart Account: ${error.message}`);
    }
  }

  /**
   * Prepare a gasless transaction with multiple calls
   * @param smartAccountAddress Smart Account address
   * @param calls Array of calls to execute
   * @returns Gasless transaction ready for relayer submission
   */
  async prepareGaslessTransaction(
    smartAccountAddress: string,
    calls: Call[]
  ): Promise<GaslessTransaction> {
    try {
      const normalized = ethers.getAddress(smartAccountAddress);

      this.log(`📝 Preparing gasless transaction for Smart Account ${normalized}`, {
        numCalls: calls.length,
      });

      // Validate Smart Account exists
      const code = await this.provider.getCode(normalized);
      if (code === "0x") {
        throw new Error(`Smart Account ${normalized} is not deployed`);
      }

      // Get Smart Account contract instance
      const smartAccount = new ethers.Contract(
        normalized,
        this.smartAccountAbi,
        this.provider
      );

      // Get current nonce
      const nonce = await smartAccount.getNonce();

      this.log(`🔢 Smart Account nonce: ${nonce}`);

      // For now, we'll create a placeholder signature
      // In a real implementation, this would be signed by the EOA owner
      const signature = "0x" + "00".repeat(65); // Placeholder signature

      const gaslessTransaction: GaslessTransaction = {
        smartAccountAddress: normalized,
        calls,
        nonce: Number(nonce),
        signature,
      };

      this.log(`✅ Gasless transaction prepared`, {
        smartAccountAddress: normalized,
        numCalls: calls.length,
        nonce: Number(nonce),
      });

      return gaslessTransaction;
    } catch (error: any) {
      console.error(`❌ Error preparing gasless transaction:`, error);
      throw new Error(`Failed to prepare gasless transaction: ${error.message}`);
    }
  }

  /**
   * Get Smart Account balance
   * @param smartAccountAddress Smart Account address
   * @returns Balance in wei
   */
  async getBalance(smartAccountAddress: string): Promise<bigint> {
    try {
      const normalized = ethers.getAddress(smartAccountAddress);
      const balance = await this.provider.getBalance(normalized);

      this.log(`💰 Smart Account ${normalized} balance: ${ethers.formatEther(balance)} FLR`);

      return balance;
    } catch (error: any) {
      console.error(`❌ Error getting Smart Account balance:`, error);
      throw new Error(`Failed to get Smart Account balance: ${error.message}`);
    }
  }

  /**
   * Check if user should use Smart Account based on FLR balance
   * @param eoaAddress User's EOA address
   * @param requiredGas Estimated gas required in wei
   * @returns True if should route through Smart Account
   */
  async shouldUseSmartAccount(
    eoaAddress: string,
    requiredGas: bigint = ethers.parseEther("0.01") // Default 0.01 FLR
  ): Promise<boolean> {
    try {
      const normalized = ethers.getAddress(eoaAddress);

      // Check EOA balance
      const eoaBalance = await this.provider.getBalance(normalized);

      this.log(`💰 EOA ${normalized} balance: ${ethers.formatEther(eoaBalance)} FLR`);

      // If EOA has insufficient balance, check if Smart Account exists
      if (eoaBalance < requiredGas) {
        this.log(`⚠️ EOA has insufficient balance (${ethers.formatEther(eoaBalance)} < ${ethers.formatEther(requiredGas)})`);

        const smartAccount = await this.getSmartAccount(normalized);
        if (smartAccount) {
          this.log(`✅ Smart Account available, should use gasless transaction`);
          return true;
        } else {
          this.log(`❌ No Smart Account available, cannot use gasless transaction`);
          return false;
        }
      }

      this.log(`✅ EOA has sufficient balance, no need for Smart Account`);
      return false;
    } catch (error: any) {
      console.error(`❌ Error checking if should use Smart Account:`, error);
      // Default to false on error
      return false;
    }
  }

  /**
   * Clear Smart Account cache
   */
  clearCache(): void {
    this.smartAccountCache.clear();
    this.log(`🗑️ Smart Account cache cleared`);
  }

  /**
   * Log message if logging is enabled
   * @param message Message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: any): void {
    if (this.loggingEnabled) {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }
}

/**
 * Storage adapter interface for persisting Smart Account data
 */
export interface SmartAccountStorageAdapter {
  /**
   * Store Smart Account record
   */
  storeSmartAccount(record: SmartAccountRecord): Promise<void>;

  /**
   * Get Smart Account record by EOA and chain ID
   */
  getSmartAccount(eoaAddress: string, chainId: number): Promise<SmartAccountRecord | null>;

  /**
   * Update last used timestamp
   */
  updateLastUsed(eoaAddress: string, chainId: number): Promise<void>;
}
