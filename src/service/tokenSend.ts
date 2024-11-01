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
import FiatTxInfo from "../models/fiatTxInfo";

type TxType = ParsedInstruction | PartiallyDecodedInstruction;

const tokenSender = Keypair.fromSecretKey(
  new Uint8Array()
);
// const rpcEndpoint = "https://api.devnet.solana.com";
// const tokenMint = new PublicKey("BZemhHtvSGZFMHTNj1m3nFxVJDittTjYYPgyu2d5fM7o");
// const tokenPrice = 100;
// const decimal = 1e4;
// const destinatinTokenAccount = "6hfkHWtisrLpeKjDn5tbAhf1wrhuYzPzd4bjFePL1HQ5"; // token account of destination wallet

const rpcEndpoint = "https://api.mainnet-beta.solana.com";
const tokenMint = new PublicKey("AHC8Qmn4bgdYDMAJ4JCYUKhq5vxYkKh8Bh2z4daumZVS");
const tokenPrice = 1;
const decimal = 1e4;
const destinatinTokenAccount = "Cp36ZNce69A4d1VhyknZ9Mr7DkoLRCsLNYoN449RhzGV"; // token account of destination wallet

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

      console.log(availableTx.length);

      // send tokens to signer
      for (let i = 0; i < availableTx.length; i++) {
        const tx = availableTx[i];
        console.log("available transaction: ", tx);

        const rawConfig = {
          maxSupportedTransactionVersion: 0,
        };

        const transactionInfo = await connection.getParsedTransaction(
          tx.tokenReceiveTxHash,
          rawConfig
        );

        console.log(
          "transaction Info",
          transactionInfo && transactionInfo.transaction.message.instructions
        );

        if (transactionInfo) {
          let parsedTx: TxType = {} as TxType;
          for (
            let k = 0;
            k < transactionInfo.transaction.message.instructions.length;
            k++
          ) {
            console.log(
              "k",
              k,
              transactionInfo.transaction.message.instructions[k].programId
                .toString()
                .toLowerCase() == TOKEN_PROGRAM_ID.toString().toLowerCase()
            );
            if (
              transactionInfo.transaction.message.instructions[k].programId
                .toString()
                .toLowerCase() == TOKEN_PROGRAM_ID.toString().toLowerCase()
            ) {
              console.log("haha");
              parsedTx = transactionInfo.transaction.message.instructions[k];
              break;
            }
          }

          console.log("sourceAccount Info", parsedTx);

          const sourceAccountInfo = await connection.getParsedAccountInfo(
            //@ts-ignore
            new PublicKey(parsedTx.parsed.info.source)
          );
          console.log("sourceAccount here");

          //@ts-ignore
          const signer = sourceAccountInfo.value?.data.parsed.info.owner;
          //@ts-ignore
          const txType = parsedTx.parsed.type;
          //@ts-ignore
          const destination = parsedTx.parsed.info.destination;
          //@ts-ignore
          const mint = parsedTx.parsed.info.mint;
          //@ts-ignore
          const amount = parsedTx.parsed.info.tokenAmount.uiAmount;
          //@ts-ignore
          console.log(txType, destination, mint, signer, amount);

          if (
            txType == "transferChecked" &&
            destination.toString().toLowerCase() ==
            destinatinTokenAccount.toLowerCase()
          ) {
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
              new PublicKey(signer)
            );

            console.log("hahahahahaha");
            const transaction = new Transaction().add(
              createTransferInstruction(
                fromTokenAccount.address,
                toTokenAccount.address,
                tokenSender.publicKey,
                amount * tokenPrice * decimal
              )
            );

            // Sign transaction, broadcast, and confirm
            const txHash = await sendAndConfirmTransaction(
              connection,
              transaction,
              [tokenSender]
            );
            console.log("transaction sent");

            tx.signer = signer;
            tx.amount = amount;
            tx.tokenSendTxHash = txHash;
            tx.status = "Processed";

            await tx.save();
            console.log("database updated");
          }
        }
        else {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    } catch (err) {
      console.log("Token send service error", err);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};

export const tokenSendServiceForFiat = async () => {
  while (true) {
    try {
      const availableTx = await FiatTxInfo.find({
        status: "NotProcessed",
      });
      if (availableTx.length == 0) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }

      const connection = new Connection(rpcEndpoint, {
        httpAgent: false,
      });

      console.log(availableTx.length);

      // send tokens to signer
      for (let i = 0; i < availableTx.length; i++) {
        const tx = availableTx[i];
        console.log("available transaction: ", tx);

        if (
          true
        ) {
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
            new PublicKey(tx.recipient || "")
          );

          console.log("hahahahahaha");
          const transaction = new Transaction().add(
            createTransferInstruction(
              fromTokenAccount.address,
              toTokenAccount.address,
              tokenSender.publicKey,
              (tx.amount || 0) * decimal
            )
          );

          // Sign transaction, broadcast, and confirm
          const txHash = await sendAndConfirmTransaction(
            connection,
            transaction,
            [tokenSender]
          );
          console.log("transaction sent");

          tx.tokenSendTxHash = txHash;
          tx.status = "Processed";

          await tx.save();
          console.log("database updated");
        }
      }
    } catch (err) {
      console.log("Token send service error", err);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};