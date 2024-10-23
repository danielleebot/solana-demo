import BN from 'bignumber.js';
import { decodeBase58 } from 'ethers';
import {
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  burn,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  setAuthority,
  AuthorityType,
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import {
  createCreateMetadataAccountV3Instruction,
  createUpdateMetadataAccountV2Instruction,
  DataV2,
  PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';

export declare interface ICreateMintTokenParams {
  tokenName: string;
  symbol: string;
  decimals: number;
  uri: string;
  initialAmount?: number | bigint;
  endpoint: string;
  privateKey: string;
}

export declare interface IMintTokenToParams {
  toAddress: string;
  tokenAddress: string;
  amount: number | bigint;
  endpoint: string;
  privateKey: string;
}

export declare interface IBurnTokenParams {
  tokenAddress: string;
  amount: number | bigint;
  endpoint: string;
  privateKey: string;
}

export declare interface IUpdateTokenMetadataParams {
  tokenAddress: string;
  tokenName: string;
  symbol: string;
  uri: string;
  endpoint: string;
  privateKey: string;
}

export declare interface ITransferSOLParams {
  toAddress: string;
  amount: number | bigint;
  endpoint: string;
  privateKey: string;
}

export declare interface ITransferTokenParams {
  toAddress: string;
  tokenAddress: string;
  decimals?: number;
  amount: number | bigint;
  endpoint: string;
  privateKey: string;
}

export declare interface ITransferTokenBatchParams {
  targetAddressList: { address: string; amount: string }[];
  tokenAddress: string;
  decimals?: number;
  endpoint: string;
  privateKey: string;
}

export declare interface IRevokeFreezeAuthorityParams {
  tokenAddress: string;
  authorityType: AuthorityType;
  endpoint: string;
  privateKey: string;
}

export async function isValidAddress(address: string) {
  return PublicKey.isOnCurve(new PublicKey(address));
}

export async function createMintToken(params: ICreateMintTokenParams) {
  const { tokenName, symbol, decimals, uri, initialAmount, endpoint, privateKey } = params;

  const connection = new Connection(endpoint, 'confirmed');

  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));

  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  const mintKeypair = Keypair.generate();

  const tokenATA = await getAssociatedTokenAddress(mintKeypair.publicKey, payer.publicKey);

  const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer()],
        PROGRAM_ID,
      )[0],
      mint: mintKeypair.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: tokenName,
          symbol: symbol,
          uri: uri,
          creators: null,
          sellerFeeBasisPoints: 0,
          uses: null,
          collection: null,
        },
        isMutable: true,
        collectionDetails: null,
      },
    },
  );

  const transactions = new Transaction();
  transactions.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      payer.publicKey,
      payer.publicKey,
      TOKEN_PROGRAM_ID,
    ),
    createAssociatedTokenAccountInstruction(payer.publicKey, tokenATA, payer.publicKey, mintKeypair.publicKey),
  );

  if (initialAmount) {
    transactions.add(createMintToInstruction(mintKeypair.publicKey, tokenATA, payer.publicKey, initialAmount));
  }

  transactions.add(createMetadataInstruction);

  const signature = await sendAndConfirmTransaction(connection, transactions, [payer, mintKeypair]);
  console.log('tx:', `https://solscan.io/tx/${signature}`);
  console.log('mint', tokenATA.toBase58());

  return { mint: tokenATA, signature };
}

export async function mintTokenTo(params: IMintTokenToParams): Promise<TransactionSignature> {
  const { toAddress, tokenAddress, amount, endpoint, privateKey } = params;
  console.log('mintTokenTo', { toAddress, tokenAddress, amount, endpoint });

  const connection = new Connection(endpoint, 'confirmed');

  // Payer of the transaction fees
  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));
  const destination = new PublicKey(toAddress);
  const mint = new PublicKey(tokenAddress);

  const transactions = new Transaction();
  const toAssociatedTokenAddress = getAssociatedTokenAddressSync(mint, destination);
  const toTokenAccountInfo = await connection.getAccountInfo(toAssociatedTokenAddress);
  if (toTokenAccountInfo === null) {
    transactions.add(
      createAssociatedTokenAccountInstruction(payer.publicKey, toAssociatedTokenAddress, destination, mint),
    );
  }
  transactions.add(createMintToInstruction(mint, toAssociatedTokenAddress, payer.publicKey, amount));

  const signature = await sendAndConfirmTransaction(connection, transactions, [payer]);
  console.log('tx:', `https://solscan.io/tx/${signature}`);

  return signature;
}

export async function burnToken(params: IBurnTokenParams) {
  const { tokenAddress, amount, endpoint, privateKey } = params;
  console.log('burnToken', { tokenAddress, amount, endpoint });

  const connection = new Connection(endpoint, 'confirmed');
  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));
  const mint = new PublicKey(tokenAddress);
  const associatedTokenAddress = await getAssociatedTokenAddress(mint, payer.publicKey);

  const signature = await burn(connection, payer, associatedTokenAddress, mint, payer, amount);
  console.log('tx:', `https://solscan.io/tx/${signature}`);

  return signature;
}

export async function updateTokenMetadata(params: IUpdateTokenMetadataParams) {
  const { tokenAddress, tokenName, symbol, uri, endpoint, privateKey } = params;
  console.log({ tokenAddress, tokenName, symbol, uri });

  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));
  const mint = new PublicKey(tokenAddress);

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

export async function transferSOL(params: ITransferSOLParams) {
  const { toAddress, amount, endpoint, privateKey } = params;

  const connection = new Connection(endpoint, 'confirmed');

  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));
  const toPubkey = new PublicKey(toAddress);

  // transfer SOL
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey,
      lamports: amount,
    }),
  );

  // send transaction
  const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
  console.log('tx:', `https://solscan.io/tx/${signature}`);
}

export async function transferToken(params: ITransferTokenParams) {
  const { tokenAddress, decimals = 8, toAddress, amount: toAmount, endpoint, privateKey } = params;

  const connection = new Connection(endpoint, 'confirmed');

  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));
  const mint = new PublicKey(tokenAddress);

  // prepare token accounts
  const transactions = new Transaction();
  const toWalletPublicKey = new PublicKey(toAddress);

  const fromAssociatedTokenAddress = getAssociatedTokenAddressSync(mint, payer.publicKey);
  const toAssociatedTokenAddress = getAssociatedTokenAddressSync(mint, toWalletPublicKey);
  const amount = BigInt(new BN(toAmount.toString()).times(Math.pow(10, decimals as number)).toFixed(0));

  const toTokenAccountInfo = await connection.getAccountInfo(toAssociatedTokenAddress);
  if (toTokenAccountInfo === null) {
    transactions.add(
      createAssociatedTokenAccountInstruction(payer.publicKey, toAssociatedTokenAddress, toWalletPublicKey, mint),
    );
  }

  transactions.add(
    createTransferInstruction(
      fromAssociatedTokenAddress,
      toAssociatedTokenAddress,
      payer.publicKey,
      amount,
      [payer],
      TOKEN_PROGRAM_ID,
    ),
  );

  const signature = await sendAndConfirmTransaction(connection, transactions, [payer]);
  console.log('tx:', `https://solscan.io/tx/${signature}`);

  return signature;
}

export async function transferTokenBatch(params: ITransferTokenBatchParams) {
  const { tokenAddress, decimals = 8, targetAddressList, endpoint, privateKey } = params;

  const connection = new Connection(endpoint, 'confirmed');

  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));
  const mint = new PublicKey(tokenAddress);

  // prepare token accounts
  const transactions = new Transaction();
  for (let i = 0; i < targetAddressList.length; i++) {
    const { address, amount: tokenAmount } = targetAddressList[i];
    const toWalletPublicKey = new PublicKey(address);

    const fromAssociatedTokenAddress = getAssociatedTokenAddressSync(mint, payer.publicKey);
    const toAssociatedTokenAddress = getAssociatedTokenAddressSync(mint, toWalletPublicKey);
    const amount = BigInt(new BN(tokenAmount).times(Math.pow(10, decimals as number)).toFixed(0));

    const toTokenAccountInfo = await connection.getAccountInfo(toAssociatedTokenAddress);
    if (toTokenAccountInfo === null) {
      transactions.add(
        createAssociatedTokenAccountInstruction(payer.publicKey, toAssociatedTokenAddress, toWalletPublicKey, mint),
      );
    }

    transactions.add(
      createTransferInstruction(
        fromAssociatedTokenAddress,
        toAssociatedTokenAddress,
        payer.publicKey,
        amount,
        [payer],
        TOKEN_PROGRAM_ID,
      ),
    );
  }

  const signature = await sendAndConfirmTransaction(connection, transactions, [payer]);
  console.log('tx:', `https://solscan.io/tx/${signature}`);

  return signature;
}

export async function revokeFreezeAuthority(params: IRevokeFreezeAuthorityParams) {
  const { tokenAddress, authorityType, endpoint, privateKey } = params;
  console.log('revokeFreezeAuthority', { tokenAddress, authorityType, endpoint });

  const connection = new Connection(endpoint, 'confirmed');
  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));
  const mint = new PublicKey(tokenAddress);

  const signature = await setAuthority(connection, payer, mint, payer.publicKey, authorityType, null);
  console.log('tx:', `https://solscan.io/tx/${signature}`);

  return signature;
}
