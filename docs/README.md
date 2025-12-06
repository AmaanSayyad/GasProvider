# Gas Provider Treasury Demo System Documentation

Welcome to the Gas Provider Treasury Demo System documentation! This directory contains comprehensive guides for deploying, configuring, and using the system.

---

## 📚 Documentation Index

### For Users

- **[User Guide](./USER_GUIDE.md)** - Complete guide for using the Gas Provider platform
  - Getting started
  - Making deposits
  - Tracking transactions
  - Troubleshooting
  - FAQ

### For Developers

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
  - Prerequisites
  - Environment setup
  - Smart contract deployment
  - Backend and frontend deployment
  - Testing and verification

- **[Environment Variables](./ENVIRONMENT_VARIABLES.md)** - Complete reference for all environment variables
  - Backend configuration
  - Frontend configuration
  - Contract deployment variables
  - Example .env files

### For Operators

- **[Treasury Addresses](./TREASURY_ADDRESSES.md)** - All deployed Treasury contract addresses
  - Contract addresses for all chains
  - Block explorer links
  - Configuration examples
  - Verification commands

- **[Exchange Rate Configuration](./EXCHANGE_RATE_CONFIGURATION.md)** - Exchange rate management
  - Rate structure
  - Configuration format
  - Update procedures
  - Adding new tokens/chains

---

## 🚀 Quick Start

### For Users
1. Read the [User Guide](./USER_GUIDE.md)
2. Connect your wallet
3. Get testnet tokens from faucets
4. Make your first deposit!

### For Developers
1. Review [Prerequisites](./DEPLOYMENT_GUIDE.md#prerequisites)
2. Follow the [Deployment Guide](./DEPLOYMENT_GUIDE.md)
3. Configure [Environment Variables](./ENVIRONMENT_VARIABLES.md)
4. Deploy and test!

### For Operators
1. Check [Treasury Addresses](./TREASURY_ADDRESSES.md)
2. Review [Exchange Rates](./EXCHANGE_RATE_CONFIGURATION.md)
3. Monitor Treasury balances
4. Update rates as needed

---

## 📖 Documentation Structure

```
docs/
├── README.md                           # This file
├── USER_GUIDE.md                       # End-user documentation
├── DEPLOYMENT_GUIDE.md                 # Deployment instructions
├── ENVIRONMENT_VARIABLES.md            # Configuration reference
├── TREASURY_ADDRESSES.md               # Contract addresses
└── EXCHANGE_RATE_CONFIGURATION.md      # Rate management
```

---

## 🔗 Related Documentation

### In Repository

- **Backend**: `backend/README.md` - Backend API documentation
- **Frontend**: `frontend/README.md` - Frontend application documentation
- **Contracts**: `contracts/README.md` - Smart contract documentation
- **Specs**: `.kiro/specs/treasury-demo-system/` - System specifications
  - `requirements.md` - System requirements
  - `design.md` - System design
  - `tasks.md` - Implementation tasks

### External Resources

- **Flare Documentation**: https://docs.flare.network/
- **Hardhat Documentation**: https://hardhat.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **React Documentation**: https://react.dev/

---

## 🎯 Common Tasks

### Deploying the System

```bash
# 1. Setup environment
cd backend && cp .env.example .env
cd ../frontend && touch .env
cd ../contracts && cp .env.example .env

# 2. Deploy contracts
cd contracts
npm run deploy:all

# 3. Start backend
cd ../backend
npm run dev

# 4. Start frontend
cd ../frontend
npm run dev
```

See [Deployment Guide](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

### Checking Treasury Balances

```bash
cd contracts
npm run verify:balances
```

See [Treasury Addresses](./TREASURY_ADDRESSES.md) for more details.

---

### Updating Exchange Rates

```bash
cd backend/src/config
nano exchangeRates.json
# Update rates and save
npm run validate-config
```

See [Exchange Rate Configuration](./EXCHANGE_RATE_CONFIGURATION.md) for more details.

---

### Troubleshooting

Common issues and solutions:

1. **Contract deployment fails**
   - Check wallet has testnet funds
   - Verify RPC endpoint is responding
   - See [Deployment Guide - Troubleshooting](./DEPLOYMENT_GUIDE.md#troubleshooting)

2. **Backend won't start**
   - Verify database connection
   - Check environment variables
   - See [Environment Variables](./ENVIRONMENT_VARIABLES.md)

3. **Transactions failing**
   - Check Treasury balances
   - Verify gas estimates
   - See [User Guide - Troubleshooting](./USER_GUIDE.md#troubleshooting)

---

## 📊 System Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                    - Wallet Connection                           │
│                    - Chain Selection                             │
│                    - Transaction Tracking                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTPS/WebSocket
                     │
┌────────────────────▼────────────────────────────────────────────┐
│              Backend API (Fastify + Prisma)                      │
│                    - Intent Management                           │
│                    - Treasury Distribution                       │
│                    - Transaction Execution                       │
│                    - Price Calculation                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────────┐
│   PostgreSQL  │         │  Treasury Smart  │
│   Database    │         │    Contracts     │
│               │         │  (11 Testnets)   │
└───────────────┘         └──────────────────┘
```

### Supported Chains

- Flare Coston2
- Ethereum Sepolia
- Polygon Amoy
- Arbitrum Sepolia
- Optimism Sepolia
- Base Sepolia
- World Sepolia
- Zora Sepolia
- Scroll Sepolia
- Avalanche Fuji
- BSC Testnet

See [Treasury Addresses](./TREASURY_ADDRESSES.md) for complete list.

---

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd backend
npm run test

# Contract tests
cd contracts
npm run test

# Integration tests
cd backend
npm run test:integration
```

### Building for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build

# Contracts
cd contracts
npm run compile
```

---

## 🔐 Security

### Important Security Notes

- Never commit private keys to version control
- Use environment variables for sensitive data
- Keep dependencies updated
- Review security best practices in [Deployment Guide](./DEPLOYMENT_GUIDE.md#security)

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email security@gasfountain.io
3. Include detailed description
4. Wait for response before disclosure
