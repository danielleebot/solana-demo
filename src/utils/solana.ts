import { decodeBase58 } from 'ethers';
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from '@solana/spl-token';
import { Keypair, Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import {
  ICreateATA,
  ICreateMintToken,
  IMintTokenTo,
  ITransferSOL,
  ITransferSOLBatch,
  ITransferToken,
  ITransferTokenBatch,
} from '../interfaces';
import BN from 'bignumber.js';
import { sleep } from './common';

export async function createMintToken(params: ICreateMintToken) {
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

export async function mintTokenTo(params: IMintTokenTo) {
  const { mint, toAddress, mintAmount, endpoint, privateKey } = params;

  const connection = new Connection(endpoint, 'confirmed');

  // Payer of the transaction fees
  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));

  // prepare token accounts
  const destination = new PublicKey(toAddress);

  let toTokenAccount;
  let retryTimes = 0;
  while (retryTimes < 5) {
    try {
      toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, destination);
      console.log('toTokenAccount:', toTokenAccount.address.toBase58());
      break;
    } catch (err) {
      console.log('retryTimes', retryTimes, err);
      retryTimes++;
      await sleep(3000);
    }
  }

  if (!toTokenAccount) throw new Error('toTokenAccount not found');

  console.log('mintTo', {
    fromAccount: payer.publicKey.toBase58(),
    toAccount: destination.toBase58(),
    toTokenATA: toTokenAccount.address.toBase58(),
  });

  const signature = await mintTo(connection, payer, mint, toTokenAccount.address, payer.publicKey, mintAmount);
  console.log('tx:', `https://solscan.io/tx/${signature}`);

  return signature;
}

export async function transferToken(params: ITransferToken) {
  const { mint, toWalletPublicKey, amount, endpoint, privateKey } = params;

  const connection = new Connection(endpoint, 'confirmed');

  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));

  // prepare token accounts
  const fromTokenATA = await getAssociatedTokenAddress(mint, payer.publicKey);

  let toTokenATA;
  let retryTimes = 0;
  while (retryTimes < 5) {
    try {
      const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, toWalletPublicKey);
      toTokenATA = toTokenAccount.address;
      console.log('toTokenATA:', toTokenATA.toBase58());
      break;
    } catch (err) {
      console.log('retryTimes', retryTimes, err);
      retryTimes++;
      await sleep(3000);
    }
  }

  if (!toTokenATA) throw new Error('toTokenATA not found');

  console.log({
    fromAccount: payer.publicKey.toBase58(),
    fromTokenATA: fromTokenATA.toBase58(),
    toAccount: toWalletPublicKey.toBase58(),
    toTokenATA: toTokenATA.toBase58(),
  });

  const signature = await transfer(connection, payer, fromTokenATA, toTokenATA, payer.publicKey, amount);
  console.log('tx:', `https://solscan.io/tx/${signature}`);
}

export async function transferTokenBatch(params: ITransferTokenBatch) {
  const { mint, decimals = 8, targetAddressList, endpoint, privateKey } = params;

  const connection = new Connection(endpoint, 'confirmed');

  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));

  // prepare token accounts
  const transactions = new Transaction();
  for (let i = 0; i < targetAddressList.length; i++) {
    const { address, amount: tokenAmount } = targetAddressList[i];
    const toWalletPublicKey = new PublicKey(address);
    const amount = BigInt(new BN(tokenAmount).times(Math.pow(10, decimals as number)).toFixed(0));

    // const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
    // const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, toWalletPublicKey);
    const fromTokenAddress = getAssociatedTokenAddressSync(mint, payer.publicKey);
    const toTokenAddress = getAssociatedTokenAddressSync(mint, toWalletPublicKey);

    transactions.add(
      createTransferInstruction(fromTokenAddress, toTokenAddress, payer.publicKey, amount, [payer], TOKEN_PROGRAM_ID),
    );
  }

  const signature = await sendAndConfirmTransaction(connection, transactions, [payer]);
  console.log('tx:', `https://solscan.io/tx/${signature}`);
}

export async function createAssociatedTokenAccount(params: ICreateATA) {
  const { mint, addresses, endpoint, privateKey } = params;

  const connection = new Connection(endpoint, 'confirmed');

  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));

  // prepare token accounts
  for (let i = 0; i < addresses.length; i++) {
    console.log('---------', i);
    let retryTimes = 0;
    while (retryTimes < 5) {
      try {
        const toWalletPublicKey = new PublicKey(addresses[i]);
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, toWalletPublicKey);
        console.log('toTokenAccount:', toTokenAccount.address.toBase58());
        break;
      } catch (err) {
        console.log('retryTimes', retryTimes, err);
        retryTimes++;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
}

export async function transferSOL(params: ITransferSOL) {
  const { toPubkey, lamports, endpoint, privateKey } = params;

  const connection = new Connection(endpoint, 'confirmed');

  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));

  // transfer SOL
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey,
      lamports,
    }),
  );

  // send transaction
  const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
  console.log('tx:', `https://solscan.io/tx/${signature}`);
}

export async function transferSOLBatch(params: ITransferSOLBatch) {
  const { data, endpoint, privateKey } = params;

  const connection = new Connection(endpoint, 'confirmed');

  const payerPrivateHex = decodeBase58(privateKey).toString(16);
  const payer = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payerPrivateHex, 'hex')));

  // transfer SOL
  const transactions = new Transaction();

  data.forEach(({ address, amount }) => {
    const toWalletPublicKey = new PublicKey(address);

    transactions.add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: toWalletPublicKey,
        lamports: BigInt(amount),
      }),
    );
  });

  // send transaction
  const signature = await sendAndConfirmTransaction(connection, transactions, [payer]);
  console.log('tx:', `https://solscan.io/tx/${signature}`);
}
