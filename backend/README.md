# Gas Provider Backend

Backend API for Gas Provider - a service that disperses native gas tokens to multiple destination chains from a single deposit.

## Architecture

- **Escrow contracts** deployed on each chain emit `Deposited` events
- An **indexer** listens to these events and POSTs them to `POST /event`
- The **backend** processes events, creates intents, and manages dispersal status
- The **frontend** reads status via `GET /status/:intentId` and `GET /history`

## Setup

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for running with database)

### Option 1: Docker Compose (Recommended)

The easiest way to run the backend with PostgreSQL:

```bash
# Start both database and backend services
docker-compose up

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

The backend will be available at `http://localhost:3000` and PostgreSQL at `localhost:5432`.

### Option 2: Local Development

If you want to run the backend locally (requires a PostgreSQL instance):

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file (see `.env.example` for reference):
   ```bash
   # Database connection (Prisma uses DATABASE_URL)
   DATABASE_URL=postgresql://gasfountain:gasfountain123@localhost:5432/gasfountain?schema=public
   
   # Or use individual DB_* variables (will be auto-converted to DATABASE_URL)
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=gasfountain
   DB_PASSWORD=gasfountain123
   DB_NAME=gasfountain
   ```

3. **Set up PostgreSQL database:**
   ```bash
   # Create database
   psql -U postgres -c "CREATE DATABASE gasfountain;"
   ```

4. **Run Prisma migrations:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run migrations (creates tables)
   npm run prisma:migrate
   ```

5. **Run the server:**
   ```bash
   # Development mode with hot reload
   npm run dev

   # Or build and run
   npm run build
   npm start
   ```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### `GET /status/:intentId`

Get the current status of a deposit intent.

**Path Parameters:**
- `intentId` (string): The deposit transaction hash (0x-prefixed hex string)

**Response 200:**
```json
{
  "intent": {
    "id": "0x...",
    "userAddress": "0x...",
    "sourceChainId": 1,
    "sourceTxHash": "0x...",
    "amountInUsd": "100.00",
    "status": "DISPERSE_IN_PROGRESS",
    "globalPhase": "DISPERSING",
    "chainStatuses": [
      {
        "chainId": 10,
        "chainName": "Optimism",
        "nativeSymbol": "OP",
        "amountUsd": "50.00",
        "status": "CONFIRMED",
        "txHash": "0x...",
        "explorerUrl": "https://...",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `400`: Invalid intentId format
- `404`: Intent not found

### `GET /history`

Get a list of previous deposit intents.

**Query Parameters:**
- `userAddress` (optional, string): Filter by user address
- `status` (optional, enum): Filter by intent status
- `limit` (optional, number): Number of results (default: 20, max: 100)
- `cursor` (optional, string): Pagination cursor

**Response 200:**
```json
{
  "items": [
    {
      "id": "0x...",
      "userAddress": "0x...",
      "sourceChainId": 1,
      "amountInUsd": "100.00",
      "status": "DISPERSED",
      "numChains": 2,
      "chains": [...]
    }
  ],
  "nextCursor": "0x..."
}
```

### `POST /event`

Receive a deposit event from the indexer. This is the only way intents are created.

**Headers:**
- `X-Indexer-Secret` (optional for now, will be required in production)

**Request Body:**
```json
{
  "chainId": 1,
  "txHash": "0x...",
  "logIndex": 0,
  "blockNumber": 12345678,
  "blockTimestamp": 1704067200,
  "eventName": "Deposited",
  "data": {
    "user": "0x...",
    "token": "0x...",
    "amountTokenRaw": "100000000",
    "amountUsd": "100.00",
    "allocations": [
      {
        "destChainId": 10,
        "amountUsd": "50.00"
      },
      {
        "destChainId": 42161,
        "amountUsd": "50.00"
      }
    ]
  }
}
```

**Response 200:**
```json
{
  "ok": true,
  "intentId": "0x...",
  "newStatus": "DISPERSE_QUEUED"
}
```

**Errors:**
- `400`: Invalid payload or validation error
- `401`: Invalid or missing indexer secret (stubbed for now)

## Status Flow

1. **DEPOSIT_CONFIRMED**: Event received and intent created
2. **DISPERSE_QUEUED**: Dispersal jobs created for each destination chain
3. **DISPERSE_IN_PROGRESS**: At least one destination transaction broadcast
4. **DISPERSED**: All destination transactions confirmed
5. **FAILED**: Unrecoverable error occurred

## Global Phases

- **DEPOSIT_CONFIRMED**: On-chain deposit seen
- **PREPARING_SWAP**: Building transactions / getting quotes
- **SWAPPING**: Converting USDC -> native tokens
- **DISPERSING**: Sending native tokens to user on destination chains
- **COMPLETED**: All confirmed
- **FAILED**: Unrecoverable error

## Development Notes

### Current Implementation

- **Storage**: PostgreSQL database with Prisma ORM for type-safe queries
- **Dispersal**: Real blockchain calls using ethers.js to call `drip` function

### TODO for Production

1. **Dispersal Logic**: Implement actual blockchain interactions:
   - Swap service integration (USDC -> native)
   - Transaction building and broadcasting
   - Transaction confirmation tracking
3. **Indexer Authentication**: Implement `X-Indexer-Secret` header validation
4. **Error Handling**: Add retry logic and better error recovery
5. **Job Queue**: Use Bull/BullMQ for async dispersal processing
6. **Monitoring**: Add logging, metrics, and health checks

## Project Structure

```
src/
  types/          # TypeScript type definitions
  store/          # Data persistence layer (Prisma ORM)
  db/             # Database connection utilities (Prisma client)
  services/       # Business logic (status transitions, dispersal)
  routes/         # Fastify route handlers
  index.ts        # Server entry point
prisma/
  schema.prisma   # Prisma schema definition
scripts/
  init-db.sql     # Legacy SQL schema (now using Prisma migrations)
  migrate.sh      # Migration script
docker-compose.yml # Docker Compose configuration
Dockerfile        # Backend Docker image
```

## Environment Variables

### Core Configuration

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)
- `DATABASE_URL`: PostgreSQL connection string (Prisma format). If not set, will be auto-generated from `DB_*` variables
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_USER`: Database user (default: gasfountain)
- `DB_PASSWORD`: Database password (default: gasfountain123)
- `DB_NAME`: Database name (default: gasfountain)
- `INDEXER_SECRET`: Secret for indexer authentication (optional for now)
- `NODE_ENV`: Environment (development/production)

### Blockchain Configuration

- `DISTRIBUTOR_PRIVATE_KEY`: Private key of the wallet authorized to call `drip` function (required)
- `CONTRACT_ADDRESS_<CHAIN_ID>`: Escrow contract address for each chain (e.g., `CONTRACT_ADDRESS_10` for Optimism)
- `*_RPC_URL`: Optional RPC URLs for specific chains (e.g., `ETH_RPC_URL`, `OP_RPC_URL`, `ARB_RPC_URL`)

### Flare Network Configuration

The platform integrates with Flare Network's decentralized data infrastructure. See `.env.flare` for complete Flare-specific configuration.

#### Network RPC URLs

- `FLARE_RPC_URL`: Flare Mainnet RPC endpoint (Chain ID: 14)
- `COSTON2_RPC_URL`: Coston2 Testnet RPC endpoint (Chain ID: 114)

#### FTSOv2 (Flare Time Series Oracle)

FTSOv2 provides real-time, decentralized price feeds with block-latency updates (~1.8 seconds).

**Required Variables:**
- `FTSO_FAST_UPDATER_ADDRESS_COSTON2`: FastUpdater contract address on Coston2
- `FTSO_FAST_UPDATER_ADDRESS_MAINNET`: FastUpdater contract address on Flare Mainnet
- `FTSO_CONFIG_ADDRESS_COSTON2`: FastUpdatesConfiguration contract on Coston2
- `FTSO_CONFIG_ADDRESS_MAINNET`: FastUpdatesConfiguration contract on Mainnet
- `FLARE_CONTRACT_REGISTRY_COSTON2`: Contract registry for dynamic address discovery
- `FLARE_CONTRACT_REGISTRY_MAINNET`: Contract registry for Mainnet

**Feed Configuration:**
- `FTSO_FEED_ID_*`: Feed IDs for supported token pairs (e.g., `FTSO_FEED_ID_FLR_USD`, `FTSO_FEED_ID_BTC_USD`)
- `FTSO_ENABLE_FALLBACK`: Enable fallback price sources (default: true)
- `FTSO_FALLBACK_SOURCE`: Fallback source type ('chainlink', 'coingecko', 'none')
- `FTSO_CACHE_TTL`: Price cache TTL in seconds (default: 30)
- `FTSO_MAX_RETRIES`: Maximum query retries (default: 3)

#### FDC (Flare Data Connector)

FDC enables trustless verification of cross-chain transactions through cryptographic attestations.

**Required Variables:**
- `FDC_HUB_ADDRESS_COSTON2`: FDC Hub contract on Coston2
- `FDC_HUB_ADDRESS_MAINNET`: FDC Hub contract on Mainnet
- `FDC_VERIFICATION_ADDRESS_COSTON2`: FDC Verification contract on Coston2
- `FDC_VERIFICATION_ADDRESS_MAINNET`: FDC Verification contract on Mainnet
- `STATE_CONNECTOR_ADDRESS_COSTON2`: State Connector contract on Coston2
- `STATE_CONNECTOR_ADDRESS_MAINNET`: State Connector contract on Mainnet

**Service URLs:**
- `FDC_VERIFIER_URL_COSTON2`: Verifier service API for Coston2
- `FDC_VERIFIER_URL_MAINNET`: Verifier service API for Mainnet
- `FDC_DA_LAYER_URL_COSTON2`: Data Availability Layer API for Coston2
- `FDC_DA_LAYER_URL_MAINNET`: Data Availability Layer API for Mainnet

**Configuration:**
- `FDC_FIRST_VOTING_ROUND_START_TS_COSTON2`: First voting round start timestamp
- `FDC_VOTING_EPOCH_DURATION_SECONDS`: Voting epoch duration (default: 90)
- `FDC_ATTESTATION_FEE`: Attestation fee in FLR (default: 1.0)
- `FDC_ATTESTATION_TIMEOUT`: Attestation timeout in seconds (default: 180)

#### FAssets

FAssets bring non-smart contract assets (BTC, DOGE, XRP, LTC) to Flare as wrapped tokens.

**Required Variables:**
- `FASSETS_ASSET_MANAGER_ADDRESS_COSTON2`: AssetManager contract on Coston2
- `FASSETS_ASSET_MANAGER_ADDRESS_MAINNET`: AssetManager contract on Mainnet

**Token Addresses (Coston2):**
- `FASSET_FBTC_ADDRESS_COSTON2`: Wrapped Bitcoin token
- `FASSET_FXRP_ADDRESS_COSTON2`: Wrapped XRP token
- `FASSET_FDOGE_ADDRESS_COSTON2`: Wrapped Dogecoin token
- `FASSET_FLTC_ADDRESS_COSTON2`: Wrapped Litecoin token

**Token Addresses (Mainnet):**
- `FASSET_FBTC_ADDRESS_MAINNET`: Wrapped Bitcoin token
- `FASSET_FXRP_ADDRESS_MAINNET`: Wrapped XRP token
- `FASSET_FDOGE_ADDRESS_MAINNET`: Wrapped Dogecoin token
- `FASSET_FLTC_ADDRESS_MAINNET`: Wrapped Litecoin token

#### Smart Accounts

Smart Accounts enable gasless transactions through account abstraction.

**Required Variables:**
- `SMART_ACCOUNT_FACTORY_ADDRESS_COSTON2`: Factory contract on Coston2
- `SMART_ACCOUNT_FACTORY_ADDRESS_MAINNET`: Factory contract on Mainnet
- `RELAYER_PRIVATE_KEY`: Private key for relayer wallet (pays gas for users)
- `RELAYER_BALANCE_THRESHOLD`: Balance warning threshold in FLR (default: 10.0)
- `SMART_ACCOUNT_TX_TIMEOUT`: Transaction timeout in seconds (default: 120)

#### Feature Flags

- `ENABLE_FTSO`: Enable FTSO integration (default: true)
- `ENABLE_FDC`: Enable FDC attestation verification (default: true)
- `ENABLE_FASSETS`: Enable FAssets support (default: true)
- `ENABLE_SMART_ACCOUNTS`: Enable Smart Accounts (default: true)
- `ENABLE_RELAYER`: Enable relayer service (default: true)

#### Development Settings

- `USE_TESTNET`: Use Coston2 testnet for development (default: true)
- `SKIP_FDC_VERIFICATION`: Skip FDC verification in development (NOT RECOMMENDED)
- `MOCK_FTSO_RESPONSES`: Mock FTSO responses for testing
- `MOCK_FDC_RESPONSES`: Mock FDC responses for testing

### Required Environment Variables

**Core:**
- `DISTRIBUTOR_PRIVATE_KEY`: Must be set for contract interactions to work

**Flare Integration (when enabled):**
- `FTSO_FAST_UPDATER_ADDRESS_*`: Required for price feeds
- `FDC_HUB_ADDRESS_*`: Required for attestation verification
- `STATE_CONNECTOR_ADDRESS_*`: Required for proof verification
- `RELAYER_PRIVATE_KEY`: Required for Smart Account gasless transactions

### Chain-Specific Configuration

Set contract addresses for each chain using environment variables:
```bash
CONTRACT_ADDRESS_1=0x...    # Ethereum
CONTRACT_ADDRESS_10=0x...   # Optimism
CONTRACT_ADDRESS_14=0x...   # Flare Mainnet
CONTRACT_ADDRESS_114=0x...  # Coston2 Testnet
CONTRACT_ADDRESS_42161=0x... # Arbitrum
# etc.
```

Or configure them in `src/config/chains.ts`.

### Configuration Files

- `.env.example`: Template for core configuration
- `.env.flare`: Complete Flare Network configuration with detailed comments

### Generating Private Keys

To generate a new private key for the relayer:

```bash
node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"
```

**Security Warning:** Never commit private keys to version control. Always use environment variables or secure key management systems.

## Database Management with Prisma

### Prisma Studio

View and edit your database data with Prisma Studio:

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` where you can browse and edit your intents.

### Migrations

```bash
# Create a new migration (development)
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Generate Prisma Client (after schema changes)
npm run prisma:generate
```

### Schema Changes

When you modify `prisma/schema.prisma`:

1. Create a migration: `npm run prisma:migrate`
2. Prisma Client is auto-generated during migration
3. Restart your server

The schema is automatically synced with the database when using Docker Compose.
