import { SolInscribeService } from './utils';

const privateKey = process.env.PRIVATE_KEY || '';
const endpoint = process.env.ENDPOINT || 'https://api.mainnet-beta.solana.com';

const collectionName = 'ordi';
const collectionSymbol = 'ordi';
const collectionUri = 'https://arweave.net/BzJfTB57fskh6VWnSmpS5z_pOyq-1jaaS6WyRpRsw04';

(async () => {
  const inscribeService = new SolInscribeService(privateKey, endpoint);
  await inscribeService.createNFTCollection({ name: collectionName, symbol: collectionSymbol, uri: collectionUri });
})();
