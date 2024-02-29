import { PublicKey } from '@metaplex-foundation/umi';
import { SolInscribeService } from './utils';

const privateKey = process.env.PRIVATE_KEY || '';
const endpoint = process.env.ENDPOINT || 'https://api.mainnet-beta.solana.com';

(async () => {
  const inscribeService = new SolInscribeService(privateKey, endpoint);

  await inscribeService.transferNFT({
    nftMintAddress: '' as PublicKey,
    destinationOwner: '' as PublicKey,
  });
})();
