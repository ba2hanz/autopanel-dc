const mongoose = require('mongoose');

const upgradeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['engine', 'tires', 'body', 'transmission', 'suspension'],
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  buffs: {
    speed: {
      type: Number,
      default: 0
    },
    power: {
      type: Number,
      default: 0
    },
    handling: {
      type: Number,
      default: 0
    }
  },
  nerfs: {
    speed: {
      type: Number,
      default: 0
    },
    power: {
      type: Number,
      default: 0
    },
    handling: {
      type: Number,
      default: 0
    }
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Upgrade', upgradeSchema); 