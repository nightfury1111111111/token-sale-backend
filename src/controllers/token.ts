/**
 * User Controller
 *
 * @since 1.0.0
 * @version 1.0.0
 */

import express, { Request, Response } from "express";
import axios from "axios";
import TxInfo from "../models/txInfo";

import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { Idl, seed } from "@project-serum/anchor/dist/cjs/idl";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Program, BN } from "@project-serum/anchor";
import { sign } from "tweetnacl";
import bs58 from "bs58";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
  Commitment,
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
import idl from "../idl.json";

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

const destinatinTokenAccount = "6hfkHWtisrLpeKjDn5tbAhf1wrhuYzPzd4bjFePL1HQ5"; // token account of destination wallet

type TxType = ParsedInstruction | PartiallyDecodedInstruction;

class TokenController {
  public async test(req: Request, res: Response) {
    res.send("ok");
  }

  /**
   * Login handler
   *
   * @param req request
   * @param res Response
   */
  public async send(req: Request, res: Response) {
    const { signature } = req.body;
    if (!signature) {
      return res.status(400).json("signature needed");
    }

    try {
      const connection = new Connection("https://api.devnet.solana.com", {
        httpAgent: false,
      });

      const rawConfig = {
        maxSupportedTransactionVersion: 0,
      };

      const transaction = await connection.getParsedTransaction(
        signature,
        rawConfig
      );

      if (transaction) {
        let parsedTx: TxType = {} as TxType;
        transaction.transaction.message.instructions.map((tx) => {
          if (
            tx.programId.toString().toLowerCase() ==
            TOKEN_PROGRAM_ID.toString().toLowerCase()
          ) {
            parsedTx = tx;
          }
        });

        //@ts-ignore
        const txType = parsedTx.parsed.type;
        //@ts-ignore
        const destination = parsedTx.parsed.info.destination;
        //@ts-ignore
        const mint = parsedTx.parsed.info.mint;
        //@ts-ignore
        const signer = parsedTx.parsed.info.signers[0];
        //@ts-ignore
        const amount = parsedTx.parsed.info.tokenAmount.uiAmount;
        //@ts-ignore
        console.log(txType, destination, mint, signer, amount);

        if (
          txType == "transferChecked" &&
          destination.toString().toLowerCase() ==
            destinatinTokenAccount.toLowerCase()
        ) {
          await TxInfo.create({
            tokenReceiveTxHash: signature,
            signer,
            amount,
            status: "NotProcessed",
          });
          console.log("Correct transaction.");
          return res.status(200).json("ok");
        } else {
          console.log("Wrong transaction.");
          return res.status(400).json("Wrong transaction.");
        }
      } else {
        console.log("Transaction not found.");
        return res.status(400).json("Transaction not found.");
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json("Sent Wrong transaction signature");
    }
  }
}

export default TokenController;
