import { PublicKey } from '@solana/web3.js';

export declare interface ICreateMintToken {
  tokenName: string;
  symbol: string;
  decimals: number;
  uri: string;
  initialAmount: number | bigint;
  endpoint: string;
  privateKey: string;
}

export declare interface IMintTokenTo {
  mint: PublicKey;
  toAddress: string;
  mintAmount: number | bigint;
  endpoint: string;
  privateKey: string;
}

export declare interface ITransferToken {
  mint: PublicKey;
  toWalletPublicKey: PublicKey;
  amount: number | bigint;
  endpoint: string;
  privateKey: string;
}

export declare interface ITransferTokenBatch {
  targetAddressList: {
    address: string;
    amount: string;
  }[];
  mint: PublicKey;
  endpoint: string;
  privateKey: string;
  decimals?: number;
}

export declare interface ITransferSOL {
  toPubkey: PublicKey;
  lamports: number | bigint;
  endpoint: string;
  privateKey: string;
}

export declare interface ITransferSOLBatch {
  data: {
    address: string;
    amount: string;
  }[];
  endpoint: string;
  privateKey: string;
}

export declare interface ICreateATA {
  addresses: string[];
  mint: PublicKey;
  endpoint: string;
  privateKey: string;
}
