/**
 * User Controller
 *
 * @since 1.0.0
 * @version 1.0.0
 */

import express, { Request, Response } from "express";
import axios from "axios";

import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { Idl, seed } from "@project-serum/anchor/dist/cjs/idl";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Program, BN } from "@project-serum/anchor";
import { sign } from "tweetnacl";
import bs58 from "bs58";
import {
  getOrCreateAssociatedTokenAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
  Commitment,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
} from "@metaplex-foundation/js";
import {
  Orao,
  networkStateAccountAddress,
  randomnessAccountAddress,
  FulfillBuilder,
  InitBuilder,
} from "@orao-network/solana-vrf";
import {
  ParsedInstruction,
  PartiallyDecodedInstruction,
} from "@solana/web3.js";

import TxInfo from "../models/txInfo";

const tokenSender = Keypair.fromSecretKey(
  new Uint8Array([
    159, 121, 144, 66, 244, 52, 247, 0, 93, 243, 70, 97, 114, 136, 23, 169, 91,
    168, 115, 145, 31, 203, 197, 104, 74, 87, 60, 52, 238, 127, 237, 59, 67,
    106, 152, 215, 13, 210, 161, 158, 150, 212, 204, 129, 238, 130, 126, 216,
    250, 27, 247, 163, 122, 57, 22, 112, 240, 99, 127, 126, 116, 196, 125, 251,
  ])
);
const rpcEndpoint = "https://api.devnet.solana.com";
const tokenMint = new PublicKey("BZemhHtvSGZFMHTNj1m3nFxVJDittTjYYPgyu2d5fM7o");
const tokenPrice = 100;
const decimal = 1e4;

export const tokenSendService = async () => {
  while (true) {
    try {
      const availableTx = await TxInfo.find({
        status: "NotProcessed",
      });
      if (availableTx.length == 0) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }

      const connection = new Connection(rpcEndpoint, {
        httpAgent: false,
      });

      // send tokens to signer
      for (let i = 0; i < availableTx.length; i++) {
        const tx = availableTx[i];
        console.log("available transaction: ", tx);

        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          tokenSender,
          tokenMint,
          tokenSender.publicKey
        );

        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          tokenSender,
          tokenMint,
          new PublicKey(tx.signer)
        );
        const transaction = new Transaction().add(
          createTransferInstruction(
            fromTokenAccount.address,
            toTokenAccount.address,
            tokenSender.publicKey,
            tx.amount * tokenPrice * decimal
          )
        );

        // Sign transaction, broadcast, and confirm
        const txHash = await sendAndConfirmTransaction(
          connection,
          transaction,
          [tokenSender]
        );

        tx.tokenSendTxHash = txHash;
        tx.status = "Processed";

        tx.save();
      }
    } catch (err) {
      console.log("Token send service error", err);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};
