require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const Upgrade = require('../models/Upgrade');

const cars = [
  // Common Cars
  {
    name: 'Street Racer',
    rarity: 'common',
    baseStats: {
      speed: 60,
      power: 50,
      handling: 55
    },
    image: 'https://example.com/street_racer.png',
    description: 'A reliable street car perfect for beginners.',
    price: 1000
  },
  {
    name: 'City Cruiser',
    rarity: 'common',
    baseStats: {
      speed: 55,
      power: 45,
      handling: 60
    },
    image: 'https://example.com/city_cruiser.png',
    description: 'Great handling for city streets.',
    price: 1000
  },
  // Rare Cars
  {
    name: 'Sports Coupe',
    rarity: 'rare',
    baseStats: {
      speed: 75,
      power: 70,
      handling: 65
    },
    image: 'https://example.com/sports_coupe.png',
    description: 'A powerful sports car with great acceleration.',
    price: 2500
  },
  {
    name: 'Track Master',
    rarity: 'rare',
    baseStats: {
      speed: 70,
      power: 65,
      handling: 75
    },
    image: 'https://example.com/track_master.png',
    description: 'Excellent handling for track racing.',
    price: 2500
  },
  // Epic Cars
  {
    name: 'Super Sport',
    rarity: 'epic',
    baseStats: {
      speed: 85,
      power: 80,
      handling: 75
    },
    image: 'https://example.com/super_sport.png',
    description: 'A high-performance supercar.',
    price: 5000
  },
  {
    name: 'Racing Legend',
    rarity: 'epic',
    baseStats: {
      speed: 80,
      power: 75,
      handling: 85
    },
    image: 'https://example.com/racing_legend.png',
    description: 'A legendary racing machine.',
    price: 5000
  },
  // Legendary Cars
  {
    name: 'Hyper Beast',
    rarity: 'legendary',
    baseStats: {
      speed: 95,
      power: 90,
      handling: 85
    },
    image: 'https://example.com/hyper_beast.png',
    description: 'The ultimate racing machine.',
    price: 10000
  },
  {
    name: 'Mythic Racer',
    rarity: 'legendary',
    baseStats: {
      speed: 90,
      power: 85,
      handling: 95
    },
    image: 'https://example.com/mythic_racer.png',
    description: 'A mythical car with perfect balance.',
    price: 10000
  }
];

const upgrades = [
  // Engine Upgrades
  {
    name: 'Basic Engine Tune',
    type: 'engine',
    rarity: 'common',
    buffs: {
      power: 5,
      speed: 3
    },
    nerfs: {
      handling: 2
    },
    price: 500,
    description: 'A basic engine tune for more power.',
    image: 'https://example.com/pixelart/engine_basic.png'
  },
  {
    name: 'Performance Engine',
    type: 'engine',
    rarity: 'rare',
    buffs: {
      power: 10,
      speed: 8
    },
    nerfs: {
      handling: 5
    },
    price: 1500,
    description: 'A high-performance engine upgrade.',
    image: 'https://example.com/pixelart/engine_performance.png'
  },
  {
    name: 'Racing Engine',
    type: 'engine',
    rarity: 'epic',
    buffs: {
      power: 15,
      speed: 12
    },
    nerfs: {
      handling: 8
    },
    price: 3000,
    description: 'A professional racing engine.',
    image: 'https://example.com/pixelart/engine_racing.png'
  },
  {
    name: 'Mythic Engine',
    type: 'engine',
    rarity: 'legendary',
    buffs: {
      power: 20,
      speed: 15
    },
    nerfs: {
      handling: 10
    },
    price: 6000,
    description: 'A legendary engine with incredible power.',
    image: 'https://example.com/pixelart/engine_mythic.png'
  },
  // Tire Upgrades
  {
    name: 'Sport Tires',
    type: 'tires',
    rarity: 'common',
    buffs: {
      handling: 5,
      speed: 2
    },
    nerfs: {
      power: 1
    },
    price: 500,
    description: 'Sport tires for better grip.',
    image: 'https://example.com/pixelart/tires_sport.png'
  },
  {
    name: 'Racing Slicks',
    type: 'tires',
    rarity: 'rare',
    buffs: {
      handling: 10,
      speed: 5
    },
    nerfs: {
      power: 3
    },
    price: 1500,
    description: 'Professional racing slicks.',
    image: 'https://example.com/pixelart/tires_racing.png'
  },
  {
    name: 'Track Tires',
    type: 'tires',
    rarity: 'epic',
    buffs: {
      handling: 15,
      speed: 8
    },
    nerfs: {
      power: 5
    },
    price: 3000,
    description: 'High-performance track tires.',
    image: 'https://example.com/pixelart/tires_track.png'
  },
  {
    name: 'Mythic Tires',
    type: 'tires',
    rarity: 'legendary',
    buffs: {
      handling: 20,
      speed: 10
    },
    nerfs: {
      power: 8
    },
    price: 6000,
    description: 'Legendary tires with perfect grip.',
    image: 'https://example.com/pixelart/tires_mythic.png'
  },
  // Body Upgrades
  {
    name: 'Aero Kit',
    type: 'body',
    rarity: 'common',
    buffs: {
      handling: 3,
      speed: 5
    },
    nerfs: {
      power: 2
    },
    price: 500,
    description: 'Basic aerodynamic kit.',
    image: 'https://example.com/pixelart/body_aero.png'
  },
  {
    name: 'Race Body',
    type: 'body',
    rarity: 'rare',
    buffs: {
      handling: 8,
      speed: 10
    },
    nerfs: {
      power: 5
    },
    price: 1500,
    description: 'Professional racing body kit.',
    image: 'https://example.com/pixelart/body_race.png'
  },
  {
    name: 'Track Body',
    type: 'body',
    rarity: 'epic',
    buffs: {
      handling: 12,
      speed: 15
    },
    nerfs: {
      power: 8
    },
    price: 3000,
    description: 'High-performance track body.',
    image: 'https://example.com/pixelart/body_track.png'
  },
  {
    name: 'Mythic Body',
    type: 'body',
    rarity: 'legendary',
    buffs: {
      handling: 15,
      speed: 20
    },
    nerfs: {
      power: 10
    },
    price: 6000,
    description: 'Legendary aerodynamic body.',
    image: 'https://example.com/pixelart/body_mythic.png'
  }
];

async function seedData() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB successfully');

    // Clear existing data
    await Car.deleteMany({});
    await Upgrade.deleteMany({});

    // Insert new data
    await Car.insertMany(cars);
    await Upgrade.insertMany(upgrades);

    console.log('Data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData(); 