/**
 * User Controller
 *
 * @since 1.0.0
 * @version 1.0.0
 */

import express, { Request, Response } from "express";
import axios from "axios";
import TxInfo from "../models/txInfo";
import FiatTxInfo from "../models/fiatTxInfo";

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

    await TxInfo.create({
      tokenReceiveTxHash: signature,
      status: "NotProcessed",
    });

    return res.status(200).json("ok");
  }

  public async handleFiatTx(req: Request, res: Response) {
    try {
      const event = req.body;
      await FiatTxInfo.create({
        tokenReceiveTxId: event.data.object.id,
        amount: event.data.object.amount_total,
        recipient: event.data.object.client_reference_id,
        status: "NotProcessed",
      });
    } catch (err) {
      console.log(err)
    }
    return res.status(200).json("ok");
  }
}

export default TokenController;
