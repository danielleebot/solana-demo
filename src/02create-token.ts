import { createMintToken } from './utils/solana';

// devnet
const privateKey = '';
const endpoint = 'https://api.devnet.solana.com';
const uri = 'https://gateway.irys.xyz/bkHaLtjjyz6XNNR8eiQXSW7pLUQEvZqV3r3YOH5ia4s';

// // mainnet
// const privateKey = '';
// const endpoint = 'https://api.mainnet-beta.solana.com';
// const uri = '';

const decimals = 8;

(async function main() {
  // create mint token
  await createMintToken({
    tokenName: 'TT1',
    symbol: 'TT1',
    decimals,
    uri,
    endpoint,
    privateKey,
  });
})();
