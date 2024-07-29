import { burnToken } from './utils/solana';
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
const initialAmount = parseUnits('199.9896', decimals);
console.log('initialAmount', initialAmount);

(async function main() {
  // burn token
  await burnToken({
    tokenAddress: tokenMintAddress,
    amount: initialAmount,
    endpoint,
    privateKey,
  });
})();
