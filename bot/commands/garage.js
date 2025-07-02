const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const UserInventory = require('../models/UserInventory');
const Car = require('../models/Car');

const GARAGE_COOLDOWNS = {
  basic: 24 * 60 * 60 * 1000, // 24 hours
  premium: 12 * 60 * 60 * 1000, // 12 hours
  luxury: 6 * 60 * 60 * 1000 // 6 hours
};

const GARAGE_RARITIES = {
  basic: ['common'],
  premium: ['common', 'rare'],
  luxury: ['common', 'rare', 'epic']
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('garage')
    .setDescription('Garage management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all your garages'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('open')
        .setDescription('Claim a car from your garage')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Type of garage to claim from')
            .setRequired(true)
            .addChoices(
              { name: 'Basic Garage', value: 'basic' },
              { name: 'Premium Garage', value: 'premium' },
              { name: 'Luxury Garage', value: 'luxury' }
            ))),

  async execute(interaction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    const userInventory = await UserInventory.findOne({ userId: interaction.user.id });

    if (!userInventory) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Error')
        .setDescription('You don\'t have any inventory yet!');

      return interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'list') {
      if (!userInventory.garages || userInventory.garages.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🏪 Your Garages')
          .setDescription('You don\'t have any garages yet!\nUse `/shop` to buy a garage.');

        return interaction.editReply({ embeds: [embed] });
      }

      // Count garages by type
      const garageCounts = {
        basic: 0,
        premium: 0,
        luxury: 0
      };

      userInventory.garages.forEach(garage => {
        garageCounts[garage.type]++;
      });

      const embed = new EmbedBuilder()
        .setColor('#6366f1')
        .setTitle('🏪 Your Garages')
        .setDescription('Here are all your garages:')
        .addFields(
          {
            name: '🏠 Basic Garages',
            value: `Count: ${garageCounts.basic}\n• 1 car every 24h\n• Common cars only`,
            inline: true
          },
          {
            name: '🏠 Premium Garages',
            value: `Count: ${garageCounts.premium}\n• 1 car every 12h\n• Rare cars included`,
            inline: true
          },
          {
            name: '🏠 Luxury Garages',
            value: `Count: ${garageCounts.luxury}\n• 1 car every 6h\n• Epic cars included`,
            inline: true
          }
        )
        .setFooter({ text: 'Use /shop to buy more garages!' });

      return interaction.editReply({ embeds: [embed] });
    } else if (subcommand === 'open') {
      const garageType = interaction.options.getString('type');
      const garage = userInventory.garages.find(g => g.type === garageType);

      if (!garage) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Error')
          .setDescription(`You don't have a ${garageType} garage!`);

        return interaction.editReply({ embeds: [embed] });
      }

      const now = new Date();
      const lastClaimed = new Date(garage.lastClaimed);
      const timeSinceLastClaim = now - lastClaimed;
      const cooldown = GARAGE_COOLDOWNS[garageType];

      if (timeSinceLastClaim < cooldown) {
        const remainingHours = Math.ceil((cooldown - timeSinceLastClaim) / (60 * 60 * 1000));
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('⏳ Not Ready')
          .setDescription(`You need to wait ${remainingHours} more hours before claiming another car from your ${garageType} garage!`);

        return interaction.editReply({ embeds: [embed] });
      }

      // Determine car rarity based on garage type
      const possibleRarities = GARAGE_RARITIES[garageType];
      const selectedRarity = possibleRarities[Math.floor(Math.random() * possibleRarities.length)];
      const cars = await Car.find({ rarity: selectedRarity });
      const reward = cars[Math.floor(Math.random() * cars.length)];

      userInventory.cars.push({
        carId: reward._id,
        upgrades: [],
        isActive: false
      });

      garage.lastClaimed = now;
      await userInventory.save();

      const embed = new EmbedBuilder()
        .setTitle('🏎️ Garage Car Claimed!')
        .setColor(getRarityColor(selectedRarity))
        .setDescription(`You got a new car from your ${garageType} garage!`)
        .addFields(
          { name: 'Car', value: reward.name, inline: true },
          { name: 'Rarity', value: selectedRarity.toUpperCase(), inline: true },
          { name: 'Speed', value: `${reward.baseStats.speed}`, inline: true },
          { name: 'Power', value: `${reward.baseStats.power}`, inline: true },
          { name: 'Handling', value: `${reward.baseStats.handling}`, inline: true }
        );

      return interaction.editReply({ embeds: [embed] });
    }
  }
};

function getRarityColor(rarity) {
  const colors = {
    common: '#808080',
    rare: '#4169E1',
    epic: '#9932CC',
    legendary: '#FFD700'
  };
  return colors[rarity] || '#808080';
} 