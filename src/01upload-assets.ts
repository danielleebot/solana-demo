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

(async () => {
  const network = 'devnet';
  const params = {
    name: 'TT1',
    symbol: 'TT1',
    description: 'this is a test token',
    image: 'https://gateway.irys.xyz/Ml6USN0ep4STMJuJwZd2HE9v5-kE6xNuUZMeEUd2i7M',
  };

  const { url, providerUrl, token } = configs[network];
  const inscribeService = new IrysService(url, token, providerUrl, privateKey);
  await inscribeService.uploadAssets(params);
})();
