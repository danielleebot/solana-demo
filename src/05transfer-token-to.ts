import BN from 'bignumber.js';
import { formatUnits, parseUnits } from 'ethers';
import { transferTokenBatch } from './utils/solana';

// devnet
const privateKey = '';
const endpoint = 'https://api.devnet.solana.com';
const tokenMintAddress = '';

// // mainnet
// const privateKey = '';
// const endpoint = 'https://api.mainnet-beta.solana.com';
// const tokenMintAddress = '';

const decimals = 8;

const users = [{ address: '', amount: '' }];

(async function main() {
  const totalAirdropAmount = users.reduce(
    (acc, item) => BigInt(acc) + BigInt(new BN(item.amount).times(Math.pow(10, decimals as number)).toFixed(0)),
    BigInt(0),
  );
  console.log('totalAirdropAmount', formatUnits(totalAirdropAmount, decimals));
  console.log('totalAirdropUses', users.length);

  let flag = true;
  let page = 0;
  const limit = 10;
  while (flag) {
    console.log('--------------------------page', page);
    const batchTransferListPerPage = users.slice(page * limit, (page + 1) * limit);
    if (batchTransferListPerPage.length === 0) {
      flag = false;
      console.log('batch transfer done.');
      break;
    }

    const totalTransferAmountPerPage = batchTransferListPerPage
      .map(({ amount }) => amount)
      .reduce((a, b) => BigInt(a) + parseUnits(b, 8), BigInt(0));
    console.log('totalTransferAmountPerPage', formatUnits(totalTransferAmountPerPage, 8));
    console.log('batchTransferListPerPage.length', batchTransferListPerPage.length);

    // transfer sol batch
    await transferTokenBatch({
      tokenAddress: tokenMintAddress,
      decimals,
      targetAddressList: batchTransferListPerPage,
      endpoint,
      privateKey,
    });

    page++;
    await new Promise((r) => setTimeout(r, 10000));
  }

  return;
})();
