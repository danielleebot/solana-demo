import { mintTokenTo } from './utils/solana';
import { parseUnits } from 'ethers';

// devnet
const privateKey = '';
const endpoint = 'https://api.devnet.solana.com';
const tokenMintAddress = '';

// // mainnet
// const privateKey = '';
// const endpoint = 'https://api.mainnet-beta.solana.com';
// const tokenMintAddress = '';

const decimals = 8;
const toAddress = '';
const mintAmount = parseUnits('10', decimals);

(async function main() {
  const signature = await mintTokenTo({
    toAddress,
    tokenAddress: tokenMintAddress,
    amount: mintAmount,
    endpoint,
    privateKey,
  });
  console.log('signature', signature);
})();
