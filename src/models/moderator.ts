/**
 * Moderator model
 * 
 * @since 1.0.0
 * @version 1.0.0
 * @package main/Models/Moderator
 */

import mongoose from 'mongoose';

const ModeratorSchema = new mongoose.Schema({
    walletAddress: {
      type: String,
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const model = mongoose.models.Moderator || mongoose.model('Moderator', ModeratorSchema);

export default model;
