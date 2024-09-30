/**
 * User Controller
 *
 * @since 1.0.0
 * @version 1.0.0
 */

import express, { Request, Response } from "express";
import axios from "axios";
import User from "../models/user";
import Nft from "../models/nft";
import Moderator from "../models/moderator";

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
import idl from "../idl.json";

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

class UserController {
  public async test(req: Request, res: Response) {
    // const mintListURL = `https://api.helius.xyz/v1/mintlist?api-key=40946379-d025-4242-9822-8b5008229dab`;
    // const { data } = await axios.post(mintListURL, {
    //   query: {
    //     // SMB
    //     firstVerifiedCreators: ["A6RiiUe9xPVNdK1XXiHqpW4jfbK65KvuhzRnooH6rv3m"],
    //   },
    //   options: {
    //     limit: 5000,
    //   },
    // });
    // console.log(data.result);
    const connection = new Connection(
      "https://small-thrumming-season.solana-mainnet.discover.quiknode.pro/a11c1882147be632670e122268489edc604b0917/",
      { httpAgent: false }
    );
    const wallet = Keypair.generate();
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(wallet))
      .use(bundlrStorage());

    const nfts = await metaplex.candyMachinesV2().findMintedNfts({
      candyMachine: new PublicKey(
        "BdgRfRzzFEWTa7Ka5bzWEy1QidSc5qVvn8zq7vRBrDL3"
      ),
      version: 2,
    });

    console.log(nfts.length);
    res.send("ok");
  }
  public async createLottery(req: Request, res: Response) {
    if (
      !process.env.CREATOR_WALLET ||
      !process.env.TREASURY_WALLET ||
      !process.env.SOLANA_USDC
    )
      return res.status(400).send("Backend env error");
    const {
      startDate,
      endDate,
      totalAmount,
      needAmount,
      cmid,
      description,
      // reward,
      rewardAmount,
      txId,
    } = req.body;
    const commitment: Commitment = "confirmed";
    const connection = new Connection("https://api.devnet.solana.com", {
      commitment,
      // wsEndpoint: "wss://api.devnet.solana.com/",
    });

    const data: any = await connection.getParsedTransaction(txId);

    const [sourceAccount] = await PublicKey.findProgramAddress(
      [
        new PublicKey(process.env.CREATOR_WALLET).toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        new PublicKey(process.env.SOLANA_USDC).toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const [destinationAccount] = await PublicKey.findProgramAddress(
      [
        new PublicKey(process.env.TREASURY_WALLET).toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        new PublicKey(process.env.SOLANA_USDC).toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    let validInput = false;
    if (
      Object.keys(data?.meta?.status)[0] === "Ok" &&
      data.transaction.message.instructions[0].parsed.type === "transfer" &&
      data.transaction.message.instructions[0].program === "spl-token" &&
      data.transaction.message.instructions[0].parsed.info.destination ===
        destinationAccount.toString() &&
      data.transaction.message.instructions[0].parsed.info.source ===
        sourceAccount.toString() &&
      data.transaction.message.instructions[0].parsed.info.amount ===
        (rewardAmount * 1e9).toString()
    ) {
      validInput = true;
    }

    if (!validInput) return res.status(400).send("Wrong tx hash");

    const lottery = new Nft({
      startDate,
      endDate,
      totalAmount,
      needAmount,
      cmid,
      description,
      // reward,
      rewardAmount,
      txId,
    });
    await lottery.save();
    return res.send(lottery);
  }
  public async fetchLottery(req: Request, res: Response) {
    const lottery = await Nft.find(
      { endDate: { $gt: Number(new Date()) } },
      { targetId: false, winner: false, rewardTxId: false }
    );
    return res.send(lottery);
  }

  public async fetchOldLottery(req: Request, res: Response) {
    console.log("fetch old data");
    const lottery = await Nft.find({
      endDate: { $lt: Number(new Date()) },
    });
    return res.send(lottery);
  }

  public async fetchForGenerateRandom(req: Request, res: Response) {
    const lottery = await Nft.find(
      {
        endDate: { $lt: Number(new Date()) + 3600 * 10 * 1000 },
        targetId: undefined,
        validCmId: true,
      },
      { targetId: false }
    ).limit(1);
    console.log(lottery);
    return res.send(lottery);
  }

  public async fetchForGenerateWinner(req: Request, res: Response) {
    const { secretKey } = req.body;
    if (secretKey !== process.env.SECRET_KEY)
      return res.status(400).send("Not admin");
    const lottery = await Nft.find({
      winner: undefined,
      targetId: { $ne: undefined },
      validCmId: true,
    }).limit(1);
    console.log(lottery);
    return res.send(lottery);
  }

  public async fetchForSendReward(req: Request, res: Response) {
    const lottery = await Nft.find({
      // endDate: { $lt: Number(new Date()) },
      winner: { $ne: undefined || "no" },
      targetId: { $ne: undefined },
      rewardTxId: undefined,
      validCmId: true,
    }).limit(1);
    console.log(lottery);
    return res.send(lottery);
  }

  public async wrongCmId(req: Request, res: Response) {
    console.log("wrong cm id");
    const { lotteryId } = req.body;
    const lottery = await Nft.findById(lotteryId);
    lottery.validCmId = false;
    await lottery.save();
    return res.send("ok");
  }

  public async fetchAvailableLottery(req: Request, res: Response) {
    if (!process.env.CREATOR_WALLET)
      return res.status(400).send("Backend env file error");
    const { signature, message } = req.body;
    const decodedMessage = bs58.decode(message);
    const decodedSignature = bs58.decode(signature);
    if (
      !sign.detached.verify(
        decodedMessage,
        decodedSignature,
        bs58.decode(process.env.CREATOR_WALLET)
      )
    )
      return res.status(400).send("Wrong signature");
    // console.log(Number(new Date()) + 2 * 3600 * 24 * 1000);
    const lottery = await Nft.find(
      { endDate: { $lt: Number(new Date()) + 2 * 3600 * 24 * 1000 } }
      // { targetId: false }
    );
    return res.send(lottery);
  }

  public async updateWinner(req: Request, res: Response) {
    const { lotteryId, winner, secretKey } = req.body;
    console.log(lotteryId, winner, secretKey);
    if (secretKey !== process.env.SECRET_KEY)
      return res.status(400).send("Not admin");
    const lottery = await Nft.findById(lotteryId);
    lottery.winner = winner;
    await lottery.save();
    return res.send("ok");
  }

  public async recordPayId(req: Request, res: Response) {
    const { lotteryId, rewardTxId, secretKey } = req.body;
    console.log(lotteryId, rewardTxId, secretKey);
    if (secretKey !== process.env.SECRET_KEY)
      return res.status(400).send("Not admin");
    const lottery = await Nft.findById(lotteryId);
    lottery.rewardTxId = rewardTxId;
    await lottery.save();
    return res.send("ok");
  }

  public async generateRandom(req: Request, res: Response) {
    const { lotteryId, totalNft, secretKey } = req.body;
    if (secretKey !== process.env.SECRET_KEY)
      return res.status(400).send("Not admin");

    if (!lotteryId) {
      return res.status(400).send("No input");
    }
    await Nft.findById(lotteryId)
      .then(async (lottery) => {
        if (!lottery) {
          return res.status(400).send("Can't find lottery");
        }

        if (lottery.needAmount > totalNft) {
          lottery.validCmId = false;
          await lottery.save();
          return res.status(400).send("Invalid need amount");
        }

        if (lottery.targetId) {
          return res.status(400).send("Already exist");
        }

        const amount = lottery.needAmount;
        // const totalNft = lottery.totalAmount;
        const commitment: Commitment = "confirmed";
        const connection = new Connection("https://api.devnet.solana.com", {
          commitment,
          // wsEndpoint: "wss://api.devnet.solana.com/",
        });

        const options = anchor.AnchorProvider.defaultOptions();
        const wallet = new NodeWallet(
          anchor.web3.Keypair.fromSecretKey(
            new Uint8Array([
              159, 121, 144, 66, 244, 52, 247, 0, 93, 243, 70, 97, 114, 136, 23,
              169, 91, 168, 115, 145, 31, 203, 197, 104, 74, 87, 60, 52, 238,
              127, 237, 59, 67, 106, 152, 215, 13, 210, 161, 158, 150, 212, 204,
              129, 238, 130, 126, 216, 250, 27, 247, 163, 122, 57, 22, 112, 240,
              99, 127, 126, 116, 196, 125, 251,
            ])
          )
        );

        const provider = new anchor.AnchorProvider(connection, wallet, options);

        anchor.setProvider(provider);
        const programID = new PublicKey(idl.metadata.address);
        const program = new Program(idl as Idl, programID, provider);
        const vrf = new Orao(provider);

        // Initial force for russian-roulette
        let force = Keypair.generate().publicKey;
        // Player state account address won't change during the tests.
        const [playerState] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("russian-roulette-player-state"),
            provider.wallet.publicKey.toBuffer(),
          ],
          program.programId
        );
        try {
          async function spinAndPullTheTrigger(
            prevForce: Buffer,
            force: Buffer
          ) {
            const prevRound = randomnessAccountAddress(prevForce);
            const random = randomnessAccountAddress(force);
            // console.log({
            //     player: provider.wallet.publicKey.toString(),
            //     playerState: playerState.toString(),
            //     prevRound: prevRound.toString(),
            //     vrf: vrf.programId.toString(),
            //     config: networkStateAccountAddress().toString(),
            //     random: random.toString(),
            // });

            await program.methods
              .spinAndPullTheTrigger([...force])
              .accounts({
                player: provider.wallet.publicKey,
                playerState,
                prevRound,
                vrf: vrf.programId,
                config: networkStateAccountAddress(),
                treasury: new PublicKey(
                  "9ZTHWWZDpB36UFe1vszf2KEpt83vwi27jDqtHQ7NSXyR"
                ),
                random,
                systemProgram: SystemProgram.programId,
              })
              .rpc();
            await wait(5000);
          }

          console.log("init vrf account");
          console.log(force.toString());
          await spinAndPullTheTrigger(Buffer.alloc(32), force.toBuffer());
          res.send("ok");

          let currentNumberOfRounds = 1;
          let prevForce = force;
          let randomArray = "";

          while (currentNumberOfRounds <= amount) {
            console.log("current round", currentNumberOfRounds);
            let [randomness] = await Promise.all([
              vrf.waitFulfilled(force.toBuffer()),
            ]);

            console.log(
              "random number",
              Math.floor(
                Number(Buffer.from(randomness.fulfilled()).readBigUInt64LE()) /
                  100000
              ) % totalNft
            );
            const newRand =
              Math.floor(
                Number(Buffer.from(randomness.fulfilled()).readBigUInt64LE()) /
                  100000
              ) % totalNft;
            let repeat = false;
            if (randomArray.split(",").indexOf(newRand.toString()) > -1) {
              repeat = true;
            }
            console.log("repeat status", repeat);
            if (!repeat) randomArray = randomArray.concat(newRand.toString());
            // if (
            //     Buffer.from(randomness.fulfilled()).readBigUInt64LE() %
            //         BigInt(6) ===
            //     BigInt(0)
            // ) {
            //     console.log("The player is dead");
            //     break;
            // } else {
            //     console.log("The player is alive");
            // }

            // Run another round
            prevForce = force;
            force = Keypair.generate().publicKey;
            console.log(prevForce.toBase58());
            console.log(force.toBase58());
            if (currentNumberOfRounds < amount) {
              await spinAndPullTheTrigger(
                prevForce.toBuffer(),
                force.toBuffer()
              );
              if (!repeat) randomArray = randomArray.concat(",");
            }
            if (!repeat) ++currentNumberOfRounds;
          }

          // reset vrf account
          console.log("reset vrf account");
          await program.methods
            .resetState()
            .accounts({
              player: provider.wallet.publicKey,
              playerState,
            })
            .rpc();
          console.log(randomArray);
          lottery.targetId = randomArray;
          await lottery.save();
        } catch (err) {
          console.log(err);
          console.log("reset vrf account");
          await program.methods
            .resetState()
            .accounts({
              player: provider.wallet.publicKey,
              playerState,
            })
            .rpc();

          // res.status(400).send("Error. Try again.");
        }
      })
      .catch((err) => {
        return res.status(400).send("Wrong lottery Id");
      });
  }

  public async reset(req: Request, res: Response) {
    try {
      const commitment: Commitment = "confirmed";
      const connection = new Connection("https://api.devnet.solana.com", {
        commitment,
        // wsEndpoint: "wss://api.devnet.solana.com/",
      });

      const options = anchor.AnchorProvider.defaultOptions();
      const wallet = new NodeWallet(
        anchor.web3.Keypair.fromSecretKey(
          new Uint8Array([
            159, 121, 144, 66, 244, 52, 247, 0, 93, 243, 70, 97, 114, 136, 23,
            169, 91, 168, 115, 145, 31, 203, 197, 104, 74, 87, 60, 52, 238, 127,
            237, 59, 67, 106, 152, 215, 13, 210, 161, 158, 150, 212, 204, 129,
            238, 130, 126, 216, 250, 27, 247, 163, 122, 57, 22, 112, 240, 99,
            127, 126, 116, 196, 125, 251,
          ])
        )
      );

      const provider = new anchor.AnchorProvider(connection, wallet, options);

      anchor.setProvider(provider);
      const programID = new PublicKey(idl.metadata.address);
      const program = new Program(idl as Idl, programID, provider);

      const [playerState] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("russian-roulette-player-state"),
          provider.wallet.publicKey.toBuffer(),
        ],
        program.programId
      );
      console.log("reset vrf account");
      await program.methods
        .resetState()
        .accounts({
          player: provider.wallet.publicKey,
          playerState,
        })
        .rpc();

      res.send("ok");
    } catch (err) {
      res.status(400).send("Error. Try again.");
    }
  }
  /**
   * Login handler
   *
   * @param req request
   * @param res Response
   */
  public async login(req: Request, res: Response) {
    let user = await User.findOne({
      where: { walletAddress: req.body.walletAddress },
    });
    let moderators = await Moderator.find();

    if (user) {
      return res.status(200).json({ user: user, moderators: moderators });
    } else {
      let newId = await User.count();

      await User.create({
        id: newId + 1,
        walletAddress: req.body.walletAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      let newUser = await User.findOne({
        walletAddress: req.body.walletAddress,
      });

      return res.status(200).json({ user: newUser, moderators: moderators });
    }
  }

  /**
   * Get User List
   *
   * @param req Request
   * @param res Response
   */
  public async list(req: Request, res: Response) {
    User.find().then((result) => {
      res.status(200).json(result);
    });
  }

  /**
   * Get a user by walletAddress
   *
   * @param req Request
   * @param res Response
   */
  public async userByWalletAddress(req: Request, res: Response) {
    let user = await User.findOne({ walletAddress: req.params.walletAddress });

    if (!user) {
      res
        .status(400)
        .json({ msg: "No users were found with this walletAddress" });
    } else {
      res.status(200).json(user);
    }
  }
}

export default UserController;
