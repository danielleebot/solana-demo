import * as dotenv from 'dotenv';
dotenv.config();

import { PublicKey } from '@solana/web3.js';
import { sleep, transferSOL, transferSOLBatch } from './utils';

const privateKey = process.env.PRIVATE_KEY || '';
const endpoint = process.env.ENDPOINT || 'https://api.mainnet-beta.solana.com';

const transferList = [
  {
    address: 'to address',
    amount: '1000000000',
  },
];

export async function doTransferSoL() {
  // transfer sol one by one
  for (let i = 0; i < transferList.length; i++) {
    const { address, amount } = transferList[i];
    const toWalletPublicKey = new PublicKey(address);

    await transferSOL({ toPubkey: toWalletPublicKey, lamports: BigInt(amount), endpoint, privateKey });

    // sleep 1s
    await sleep(1000);
  }
}

export async function doTransferSoLBatch() {
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
    await transferSOLBatch({ data: batchTransferListPerPage, endpoint, privateKey });

    page++;
    await sleep(1000);
  }
}

(async function main() {
  try {
    await doTransferSoLBatch();
  } catch (err) {
    console.log('ERROR', err);
  }
})();
