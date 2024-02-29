import * as dotenv from 'dotenv';
dotenv.config();

import { PublicKey } from '@metaplex-foundation/umi';
import { sleep, SolInscribeService } from './utils';

const privateKey = process.env.PRIVATE_KEY || '';
const endpoint = process.env.ENDPOINT || 'https://api.mainnet-beta.solana.com';

const inscribeName = 'ordi';
const inscribeSymbol = 'ordi';
const inscribeUri = 'https://arweave.net/BzJfTB57fskh6VWnSmpS5z_pOyq-1jaaS6WyRpRsw04';
const collectionMintAddress = '';
const inscription = '{"p":"ordi","op":"mint","tick":"ordi","amt":"10"}';

(async () => {
  const inscribeService = new SolInscribeService(privateKey, endpoint);

  for (let i = 0; i < 10; i++) {
    console.log('-------------------', i);

    const stepStatus = { step1: false, step2: false, step3: false };
    let retryTimes = 0;
    let mintAddress;
    while (retryTimes < 3) {
      try {
        if (!stepStatus.step1) {
          const res = await inscribeService.createNFT({
            name: inscribeName,
            symbol: inscribeSymbol,
            uri: inscribeUri,
            collectionAddress: collectionMintAddress as PublicKey,
          });

          mintAddress = res.mintAddress;
          console.log('mintAddress:', mintAddress);

          stepStatus.step1 = true;
        }

        if (!mintAddress) throw new Error('mintAddress is null');

        if (!stepStatus.step2) {
          // verify collection
          await inscribeService.verifyCollection({
            nftMintAddress: mintAddress as PublicKey,
            collectionMintAddress: collectionMintAddress as PublicKey,
          });

          stepStatus.step2 = true;
        }

        if (!stepStatus.step3) {
          // inscribe
          await inscribeService.inscribe({
            nftMintAddress: mintAddress as PublicKey,
            inscription,
          });

          stepStatus.step3 = true;
        }

        if (stepStatus.step1 && stepStatus.step2 && stepStatus.step3) break;
      } catch (err) {
        console.warn('retryTimes', retryTimes, err);
        retryTimes++;
        await sleep(5000);
      }
    }
  }
})();
