const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  baseStats: {
    speed: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    power: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    handling: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    }
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Car', carSchema); 