import { updateTokenMetadata } from './utils/solana';

// devnet
const privateKey = '';
const endpoint = 'https://api.devnet.solana.com';
const tokenAddress = '';
const uri = '';

// // mainnet
// const privateKey = '';
// const endpoint = 'https://api.mainnet-beta.solana.com';
// const tokenAddress = '';
// const uri = '';

(async () => {
  await updateTokenMetadata({
    tokenAddress,
    tokenName: 'ordi',
    symbol: 'ordi',
    uri,
    endpoint,
    privateKey,
  });
})();
