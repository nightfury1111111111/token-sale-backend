/**
 * User model
 *
 * @since 1.0.0
 * @version 1.0.0
 * @package main/Models/Users
 */

// import path from 'path';
// import { Sequelize, Model, DataTypes } from 'sequelize';

// export const sequelize = new Sequelize({
//     dialect: 'sqlite',
//     storage: path.resolve(__dirname, '../db/data.db')
// });

// const User = sequelize.define('User', {
//     avatar: {
//         type: DataTypes.STRING
//     },
//     walletAddress: {
//         type: DataTypes.STRING
//     },
//     roles: {
//         type: DataTypes.STRING
//     },
//     note: {
//         type: DataTypes.STRING
//     }
// }, {
//     tableName: 'users',
//     timestamps: true
// })

// export default User;

import mongoose from "mongoose";

const NftSchema = new mongoose.Schema(
  {
    startDate: {
      type: Number,
    },
    endDate: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },
    validCmId: {
      type: Boolean,
      default: true,
    },
    needAmount: {
      type: Number,
    },
    cmid: {
      type: String,
    },
    description: {
      type: String,
    },
    // reward: {
    //   type: String,
    // },
    rewardAmount: {
      type: Number,
    },
    targetId: {
      type: String,
    },
    winner: {
      type: String,
    },
    winerGenerated: {
      type: Number,
    },
    txId: {
      type: String,
    },
    rewardTxId: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const model = mongoose.models.Nft || mongoose.model("Nft", NftSchema);

export default model;
