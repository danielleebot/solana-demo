import { decodeBase58, encodeBase58 } from 'ethers';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { generateSigner, keypairIdentity, percentAmount, PublicKey } from '@metaplex-foundation/umi';
import {
  burnV1,
  createNft,
  fetchDigitalAsset,
  findMetadataPda,
  mplTokenMetadata,
  TokenStandard,
  transferV1,
  verifyCollectionV1,
  fetchAllDigitalAssetByOwner,
  fetchAllDigitalAssetByVerifiedCollection,
} from '@metaplex-foundation/mpl-token-metadata3';

import {
  fetchInscriptionMetadata,
  findInscriptionMetadataPda,
  findMintInscriptionPda,
  initializeFromMint,
  writeData,
} from '@metaplex-foundation/mpl-inscription';

export class SolInscribeService {
  private umi;

  constructor(privateKey: string, endpoint: string) {
    this.umi = createUmi(endpoint).use(mplTokenMetadata());

    const signer = this.umi.eddsa.createKeypairFromSecretKey(
      Uint8Array.from(Buffer.from(decodeBase58(privateKey).toString(16), 'hex')),
    );
    this.umi.use(keypairIdentity(signer));
  }

  public async getSigner() {
    return this.umi.payer.publicKey;
  }

  public async createNFTCollection(params: { name: string; symbol: string; uri: string }) {
    console.log('createNFTCollection params', params);
    const { name, symbol, uri } = params;
    const collectionMintSigner = generateSigner(this.umi);

    const { signature } = await createNft(this.umi, {
      mint: collectionMintSigner,
      name,
      symbol,
      uri,
      sellerFeeBasisPoints: percentAmount(0),
      isMutable: false,
      isCollection: true,
    }).sendAndConfirm(this.umi);

    const signatureString = encodeBase58(signature);
    console.log('createNFTCollection success.', `https://solscan.io/tx/${signatureString}`);

    return {
      mintAddress: collectionMintSigner.publicKey,
      signature: signatureString,
    };
  }

  public async createNFT(params: { name: string; symbol: string; uri: string; collectionAddress: PublicKey }) {
    console.log('createNFT params', params);
    const { name, symbol, uri, collectionAddress } = params;
    const nftMintSigner = generateSigner(this.umi);

    const { signature } = await createNft(this.umi, {
      mint: nftMintSigner,
      name,
      symbol,
      uri,
      isMutable: false,
      collection: {
        verified: false,
        key: collectionAddress,
      },
      sellerFeeBasisPoints: percentAmount(0),
    }).sendAndConfirm(this.umi);

    const signatureString = encodeBase58(signature);
    console.log('createNFT success.', `https://solscan.io/tx/${signatureString}`);

    return { mintAddress: nftMintSigner.publicKey, signature: signatureString };
  }

  public async verifyCollection(params: { nftMintAddress: PublicKey; collectionMintAddress: PublicKey }) {
    console.log('verifyCollection params', params);
    const { nftMintAddress, collectionMintAddress } = params;

    const nftMetadata = findMetadataPda(this.umi, {
      mint: nftMintAddress,
    });

    const { signature } = await verifyCollectionV1(this.umi, {
      metadata: nftMetadata,
      collectionMint: collectionMintAddress,
    }).sendAndConfirm(this.umi);

    const signatureString = encodeBase58(signature);
    console.log('verifyCollection success.', `https://solscan.io/tx/${signatureString}`);
    return signatureString;
  }

  public async transferNFT(params: { nftMintAddress: PublicKey; destinationOwner: PublicKey }) {
    console.log('transferNFT params', params);

    const { nftMintAddress, destinationOwner } = params;

    const { signature } = await transferV1(this.umi, {
      mint: nftMintAddress,
      authority: this.umi.payer,
      tokenOwner: this.umi.payer.publicKey,
      destinationOwner,
      tokenStandard: TokenStandard.NonFungible,
    }).sendAndConfirm(this.umi);

    const signatureString = encodeBase58(signature);
    console.log('transferNFT success.', `https://solscan.io/tx/${signatureString}`);
    return signatureString;
  }

  public async burnNFT(params: { nftMintAddress: PublicKey; collectionMintAddress?: PublicKey }) {
    console.log('burnNFT params', params);
    const { nftMintAddress, collectionMintAddress } = params;

    const collectionMetadata = collectionMintAddress
      ? findMetadataPda(this.umi, { mint: collectionMintAddress })
      : undefined;

    const { signature } = await burnV1(this.umi, {
      mint: nftMintAddress,
      authority: this.umi.payer,
      tokenOwner: this.umi.payer.publicKey,
      tokenStandard: TokenStandard.NonFungible,
      collectionMetadata,
    }).sendAndConfirm(this.umi);

    const signatureString = encodeBase58(signature);
    console.log('burnNFT success.', `https://solscan.io/tx/${signatureString}`);
    return signatureString;
  }

  public async burnToken(params: { mintAddress: PublicKey; amount: number | bigint }) {
    console.log('burnToken params', params);
    const { mintAddress, amount } = params;

    const { signature } = await burnV1(this.umi, {
      mint: mintAddress,
      authority: this.umi.payer,
      tokenOwner: this.umi.payer.publicKey,
      amount,
      tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(this.umi);

    const signatureString = encodeBase58(signature);
    console.log('burnToken success.', `https://solscan.io/tx/${signatureString}`);
    return signatureString;
  }

  public async inscribe(params: { nftMintAddress: PublicKey; inscription: string }) {
    console.log('inscribe params', params);
    const { nftMintAddress, inscription } = params;

    const inscriptionAccount = findMintInscriptionPda(this.umi, {
      mint: nftMintAddress,
    });
    const inscriptionMetadataAccount = findInscriptionMetadataPda(this.umi, {
      inscriptionAccount: inscriptionAccount[0],
    });

    const { signature } = await initializeFromMint(this.umi, {
      mintAccount: nftMintAddress,
    })
      .add(
        writeData(this.umi, {
          inscriptionAccount,
          inscriptionMetadataAccount,
          value: Buffer.from(inscription),
          associatedTag: null,
          offset: 0,
        }),
      )
      .sendAndConfirm(this.umi);

    const signatureString = encodeBase58(signature);
    console.log('inscribe success.', `https://solscan.io/tx/${signatureString}`);

    const inscriptionMetadata = await fetchInscriptionMetadata(this.umi, inscriptionMetadataAccount);
    console.log('Inscription Number: ', inscriptionMetadata.inscriptionRank.toString());

    return signatureString;
  }

  public async fetchNFT(mintAddress: PublicKey) {
    return await fetchDigitalAsset(this.umi, mintAddress);
  }

  public async fetchAllDigitalAssetByOwner(owner: PublicKey) {
    return await fetchAllDigitalAssetByOwner(this.umi, owner);
  }

  public async fetchAllDigitalAssetByVerifiedCollection(collectionAddress: PublicKey) {
    return await fetchAllDigitalAssetByVerifiedCollection(this.umi, collectionAddress);
  }
}
