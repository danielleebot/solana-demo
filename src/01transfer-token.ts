import * as dotenv from 'dotenv';
dotenv.config();

import { PublicKey } from '@solana/web3.js';
import { sleep, transferToken, transferTokenBatch } from './utils';

const privateKey = process.env.PRIVATE_KEY || '';
const endpoint = process.env.ENDPOINT || 'https://api.mainnet-beta.solana.com';
const tokenMintAddress = '4ws6W9iiEjp6to9KEQknS6SDsyYTeRF74hVmwPBMsoho'; // ORDI

const transferList = [
  {
    address: 'to address',
    amount: '1000000000',
  },
];

export async function doTransferToken() {
  const mint = new PublicKey(tokenMintAddress);

  // transfer sol one by one
  for (let i = 0; i < transferList.length; i++) {
    const { address, amount } = transferList[i];
    const toWalletPublicKey = new PublicKey(address);

    await transferToken({ mint, toWalletPublicKey, amount: BigInt(amount), endpoint, privateKey });

    // sleep 1s
    await sleep(1000);
  }
}

export async function doTransferTokenBatch() {
  const mint = new PublicKey(tokenMintAddress);

  const totalTransferAmount = transferList
    .map(({ amount }) => amount)
    .reduce((a, b) => (Number(a) + Number(b)).toString());
  console.log('totalTransferAmount(SOL)', Number(totalTransferAmount) / 1e9);
  console.log('totalTransferAmount.length', totalTransferAmount.length);

  let flag = true;
  let page = 0;
  const limit = 20;
  while (flag) {
    console.log('--------------------------page', page);
    const batchTransferListPerPage = transferList.slice(page * limit, (page + 1) * limit);
    if (batchTransferListPerPage.length === 0) {
      flag = false;
      console.log('batch transfer SOL done.');
      break;
    }

    const totalTransferAmountPerPage = batchTransferListPerPage
      .map(({ amount }) => amount)
      .reduce((a, b) => (Number(a) + Number(b)).toString());
    console.log('totalTransferAmountPerPage(SOL)', Number(totalTransferAmountPerPage) / 1e9);
    console.log('batchTransferListPerPage.length', batchTransferListPerPage.length);

    // transfer sol batch
    await transferTokenBatch({ mint, targetAddressList: batchTransferListPerPage, endpoint, privateKey });

    page++;
    await sleep(1000);
  }
}

(async function main() {
  try {
    await doTransferTokenBatch();
  } catch (err) {
    console.log('ERROR', err);
  }
})();
