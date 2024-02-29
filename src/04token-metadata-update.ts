import * as dotenv from 'dotenv';
dotenv.config();

import { decodeBase58 } from 'ethers';
import { Keypair, Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { createUpdateMetadataAccountV2Instruction, PROGRAM_ID, DataV2 } from '@metaplex-foundation/mpl-token-metadata';

const privateKey = process.env.PRIVATE_KEY || '';
const endpoint = process.env.ENDPOINT || 'https://api.mainnet-beta.solana.com';

async function updateTokenMetadata({
  tokenMint,
  tokenName,
  symbol,
  uri,
}: {
  tokenMint: string;
  tokenName: string;
  symbol: string;
  uri: string;
}) {
  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));
  const mint = new PublicKey(tokenMint);

  const metadataPDA = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), PROGRAM_ID.toBuffer(), mint.toBuffer()],
    PROGRAM_ID,
  )[0];

  const tokenMetadata = {
    name: tokenName,
    symbol: symbol,
    uri: uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  } as DataV2;

  const updateMetadataTransaction = new Transaction().add(
    createUpdateMetadataAccountV2Instruction(
      {
        metadata: metadataPDA,
        updateAuthority: payer.publicKey,
      },
      {
        updateMetadataAccountArgsV2: {
          data: tokenMetadata,
          updateAuthority: payer.publicKey,
          primarySaleHappened: true,
          isMutable: true,
        },
      },
    ),
  );

  const connection = new Connection(endpoint, 'confirmed');
  const signature = await sendAndConfirmTransaction(connection, updateMetadataTransaction, [payer]);
  console.log('tx:', `https://solscan.io/tx/${signature}`);

  return signature;
}

(async () => {
  await updateTokenMetadata({
    tokenMint: '4ws6W9iiEjp6to9KEQknS6SDsyYTeRF74hVmwPBMsoho',
    tokenName: 'ordi',
    symbol: 'ordi',
    uri: 'https://arweave.net/BzJfTB57fskh6VWnSmpS5z_pOyq-1jaaS6WyRpRsw04',
  });
})();
