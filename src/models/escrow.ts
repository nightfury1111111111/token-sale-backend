/**
 * escrow model
 *
 * @since 1.0.0
 * @version 1.0.0
 * @package main/models/escrows
 */

import * as mongoose from 'mongoose';

const EscrowSchema = new mongoose.Schema({
      seed: {
        type: Number,
      },
      description: {
        type: String,
      },
      receiver: {
        type: String
      },
      moderator: {
        type: String
      },
      amount: {
        type: Number
      },
      milestones: {
        type: [{
          mileston: String,
          amount: Number
        }]
      },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const model = mongoose.models.Escrow || mongoose.model('Escrow', EscrowSchema);

export default model;
