import * as dotenv from 'dotenv';
dotenv.config();

import { PublicKey } from '@solana/web3.js';
import { createAssociatedTokenAccount } from './utils/solana';

const privateKey = process.env.PRIVATE_KEY || '';
const endpoint = process.env.ENDPOINT || 'https://api.mainnet-beta.solana.com';

const tokenMintAddress = '4ws6W9iiEjp6to9KEQknS6SDsyYTeRF74hVmwPBMsoho';
const addressList = [''];

(async function main() {
  const mint = new PublicKey(tokenMintAddress);

  await createAssociatedTokenAccount({ mint, addresses: addressList, endpoint, privateKey });
})();
