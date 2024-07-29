import { AuthorityType } from '@solana/spl-token';
import { revokeFreezeAuthority } from './utils/solana';

// devnet
const privateKey = '';
const endpoint = 'https://api.devnet.solana.com';
const tokenMintAddress = '';

// // mainnet
// const privateKey = '';
// const endpoint = 'https://api.mainnet-beta.solana.com';
// const tokenMintAddress = '';

(async function main() {
  await revokeFreezeAuthority({
    authorityType: AuthorityType.MintTokens,
    tokenAddress: tokenMintAddress,
    endpoint,
    privateKey,
  });
})();
