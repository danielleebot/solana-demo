import * as dotenv from 'dotenv';
dotenv.config();

import BN from 'bignumber.js';
import { PublicKey } from '@solana/web3.js';
import { mintTokenTo } from './utils/solana';

const privateKey = process.env.PRIVATE_KEY || '';
const endpoint = process.env.ENDPOINT || 'https://api.mainnet-beta.solana.com';

const decimals = 8;
const tokenMintAddress = '4ws6W9iiEjp6to9KEQknS6SDsyYTeRF74hVmwPBMsoho';
const toAddress = '12WtyfMPWSCW4b9BkZ6fyzwkS4nYozAmrwdAy986CewR';
const mintAmount = BigInt(new BN('1768429').times(Math.pow(10, decimals)).toFixed(0));

(async function main() {
  const mint = new PublicKey(tokenMintAddress);

  // create mint token
  await mintTokenTo({
    mint,
    toAddress,
    mintAmount,
    endpoint,
    privateKey,
  });
})();
