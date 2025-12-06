#!/usr/bin/env node

const { Wallet, JsonRpcProvider } = require('ethers');

const privateKey = '0xa69ef6411c7274e99ee750f2faa815e5719904ee07ae0d70e3e09d9462431cde';
const rpcUrl = 'https://coston2-api.flare.network/ext/C/rpc';

async function checkBalance() {
  console.log('\n' + '='.repeat(70));
  console.log('RELAYER BALANCE KONTROLU');
  console.log('='.repeat(70));
  
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  
  console.log('\nAddress:', wallet.address);
  console.log('Network: Coston2 Testnet');
  console.log('\nBalance kontrol ediliyor...\n');
  
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    const balanceInC2FLR = Number(balance) / 1e18;
    
    console.log('Balance:', balanceInC2FLR.toFixed(4), 'C2FLR');
    
    if (balanceInC2FLR === 0) {
      console.log('\n⚠️  Balance 0! Token almak icin:');
      console.log('   https://faucet.flare.network/');
    } else if (balanceInC2FLR < 1) {
      console.log('\n⚠️  Balance düşük! Daha fazla token alabilirsiniz.');
    } else {
      console.log('\n✅ Balance yeterli! Flare entegrasyonunu test edebilirsiniz.');
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
  } catch (error) {
    console.error('\n❌ Hata:', error.message);
    console.log('\nRPC baglantisi kontrol edin veya tekrar deneyin.\n');
    console.log('='.repeat(70) + '\n');
  }
}

checkBalance();
