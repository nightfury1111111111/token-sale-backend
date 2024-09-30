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

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    avatar: {
        type: String
    },
    walletAddress: {
      type: String,
    },
    roles: {
        type: String
    },
    note: {
        type: String
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const model = mongoose.models.User || mongoose.model('User', UserSchema);

export default model;