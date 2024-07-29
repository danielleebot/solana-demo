import { IrysService } from './utils/irys';

// // devnet
// const privateKey = '';

// mainnet
const privateKey = '';

const configs = {
  mainnet: {
    url: 'https://node2.irys.xyz', // 'https://node1.irys.xyz'
    providerUrl: 'https://api.mainnet-beta.solana.com',
    token: 'solana',
  },
  devnet: {
    url: 'https://devnet.irys.xyz',
    providerUrl: 'https://api.devnet.solana.com',
    token: 'solana',
  },
};

const network = 'mainnet'; // devnet | mainnet
const filePath = './src/operations/icon.png';

(async () => {
  const { url, providerUrl, token } = configs[network];
  const inscribeService = new IrysService(url, token, providerUrl, privateKey);
  await inscribeService.uploadImage(filePath);
  return;
})();
