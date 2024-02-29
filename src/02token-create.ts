import * as dotenv from 'dotenv';
dotenv.config();

import { createMintToken } from './utils';

const privateKey = process.env.PRIVATE_KEY || '';
const endpoint = process.env.ENDPOINT || 'https://api.mainnet-beta.solana.com';
const decimals = 8;

(async function main() {
  // create mint token
  await createMintToken({
    tokenName: 'ordi',
    symbol: 'ordi',
    decimals: decimals,
    uri: 'https://arweave.net/BzJfTB57fskh6VWnSmpS5z_pOyq-1jaaS6WyRpRsw04',
    initialAmount: BigInt(100000000000000) * BigInt(Math.pow(10, decimals)),
    endpoint,
    privateKey,
  });
})();
