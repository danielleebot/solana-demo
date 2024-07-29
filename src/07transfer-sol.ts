import { transferSOL } from './utils/solana';
import { parseUnits } from 'ethers';

// devnet
const privateKey = '';
const endpoint = 'https://api.devnet.solana.com';

// // mainnet
// const privateKey = '';
// const endpoint = 'https://api.mainnet-beta.solana.com';

const decimals = 8;
const amount = parseUnits('0.1', decimals);
const toAddress = '';

(async function main() {
  await transferSOL({ toAddress, amount, endpoint, privateKey });
})();
