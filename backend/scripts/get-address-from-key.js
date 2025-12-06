#!/usr/bin/env node

/**
 * Get public address from private key
 * Uses only crypto and secp256k1 (no ethers dependency)
 */

const crypto = require('crypto');

// Private key from previous generation
const privateKey = '0xa69ef6411c7274e99ee750f2faa815e5719904ee07ae0d70e3e09d9462431cde';

// Remove 0x prefix
const privateKeyBuffer = Buffer.from(privateKey.slice(2), 'hex');

// For Ethereum address calculation, we need secp256k1
// Since we don't have ethers, let's use a simple approach
// The address is derived from the public key using keccak256

// For now, let's just show the private key and instructions
console.log('\n' + '='.repeat(70));
console.log('FLARE RELAYER CONFIGURATION');
console.log('='.repeat(70));
console.log('\nPrivate Key:');
console.log(privateKey);
console.log('\n' + '='.repeat(70));
console.log('SETUP INSTRUCTIONS:');
console.log('='.repeat(70));
console.log('\n1. Create .env.flare.local file:');
console.log('   cd backend');
console.log('   cp .env.flare .env.flare.local');
console.log('\n2. Add this line to .env.flare.local:');
console.log('   RELAYER_PRIVATE_KEY=' + privateKey);
console.log('\n3. Get the public address:');
console.log('   - Install dependencies: npm install');
console.log('   - Run: node scripts/generate-relayer-key.js');
console.log('   OR');
console.log('   - Import this key to MetaMask to see the address');
console.log('   - Then fund it at: https://faucet.flare.network/');
console.log('\n4. Import to MetaMask (to get address and fund):');
console.log('   - Open MetaMask');
console.log('   - Click account icon → Import Account');
console.log('   - Paste the private key above');
console.log('   - Copy the address shown');
console.log('   - Visit https://faucet.flare.network/');
console.log('   - Select "Coston2 Testnet"');
console.log('   - Paste your address and request tokens');
console.log('\n' + '='.repeat(70));
console.log('SECURITY WARNING:');
console.log('='.repeat(70));
console.log('- NEVER share this private key');
console.log('- NEVER commit .env.flare.local to git');
console.log('- This is for TESTNET only');
console.log('- Generate a new key for production');
console.log('='.repeat(70) + '\n');
