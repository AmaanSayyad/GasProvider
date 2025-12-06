#!/usr/bin/env node

const { Wallet } = require('ethers');

const privateKey = '0xa69ef6411c7274e99ee750f2faa815e5719904ee07ae0d70e3e09d9462431cde';
const wallet = new Wallet(privateKey);

console.log('\n' + '='.repeat(70));
console.log('RELAYER WALLET BILGILERI');
console.log('='.repeat(70));
console.log('\nPublic Address:');
console.log(wallet.address);
console.log('\nPrivate Key:');
console.log(privateKey);
console.log('\n' + '='.repeat(70));
console.log('TOKEN ALMAK ICIN:');
console.log('='.repeat(70));
console.log('\n1. Bu adresi kopyalayin:', wallet.address);
console.log('\n2. Faucet\'e gidin: https://faucet.flare.network/');
console.log('\n3. "Coston2 Testnet" secin');
console.log('\n4. Adresi yapiştirin ve "Request C2FLR" tiklayin');
console.log('\n5. Birkaç saniye bekleyin, token\'lar gelecek');
console.log('\n' + '='.repeat(70));
console.log('BALANCE KONTROL:');
console.log('='.repeat(70));
console.log('\nToken\'lar geldikten sonra balance\'i kontrol edin:');
console.log('node scripts/check-balance.js');
console.log('\n' + '='.repeat(70) + '\n');
