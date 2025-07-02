const mongoose = require('mongoose');

const userInventorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 1000
  },
  cars: [{
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      required: true
    },
    upgrades: [{
      upgradeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Upgrade'
      }
    }],
    isActive: {
      type: Boolean,
      default: false
    }
  }],
  garages: [{
    type: {
      type: String,
      enum: ['basic', 'premium', 'luxury'],
      required: true
    },
    lastClaimed: {
      type: Date,
      default: Date.now
    }
  }],
  crates: [{
    type: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      required: true
    },
    opened: {
      type: Boolean,
      default: false
    }
  }],
  stats: {
    racesWon: {
      type: Number,
      default: 0
    },
    racesLost: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  }
});

module.exports = mongoose.model('UserInventory', userInventorySchema); 