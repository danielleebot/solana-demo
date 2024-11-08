import { getTokenBalance } from './utils/solana';

// const endpoint = 'https://api.mainnet-beta.solana.com';
const endpoint = 'https://solana-mainnet.g.alchemy.com/v2/xxx';
const tokenMintAddress = '';
const addresses = [''];

(async function main() {
  const results = [];
  console.log('total', addresses.length);

  for (let i = 0; i < addresses.length; i++) {
    const walletAddress = addresses[i];
    if (!walletAddress) continue;

    const balance = await getTokenBalance(walletAddress, tokenMintAddress, endpoint);
    console.log('balance', i, balance);
    if (balance > 0) {
      results.push(walletAddress);
    }

    // await new Promise((r) => setTimeout(r, 100));
  }
  console.log('results', results);
})();
