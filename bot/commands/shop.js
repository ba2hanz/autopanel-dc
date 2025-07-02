const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const UserInventory = require('../models/UserInventory');
const Car = require('../models/Car');
const Upgrade = require('../models/Upgrade');

const CRATE_PRICES = {
  common: 1000,
  rare: 2500,
  epic: 5000,
  legendary: 10000
};

const GARAGE_PRICES = {
  basic: 5000,
  premium: 15000,
  luxury: 50000
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Open the shop menu'),

  async execute(interaction) {
    await interaction.deferReply();

    let userInventory = await UserInventory.findOne({ userId: interaction.user.id });

    if (!userInventory) {
      userInventory = await UserInventory.create({
        userId: interaction.user.id,
        balance: interaction.user.id === '645289190812155917' ? 100000 : 6000
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🏎️ Racing Game Shop')
      .setColor('#6366f1')
      .setDescription(`Your Balance: ${userInventory.balance} coins\n\nReact to browse different categories:`)
      .addFields(
        { 
          name: '🏪 Buy Garage', 
          value: 'Get a garage to receive free cars periodically', 
          inline: true 
        },
        { 
          name: '🎁 Buy Crate',
          value: 'Open crates to get upgrades (no cars!)',
          inline: true 
        }
      );

    const message = await interaction.editReply({ embeds: [embed] });

    // Add reactions
    await message.react('🏪'); // Garage
    await message.react('🎁'); // Crate

    // Create reaction collector
    const filter = (reaction, user) => 
      ['🏪', '🎁'].includes(reaction.emoji.name) && user.id === interaction.user.id;

    const collector = message.createReactionCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', async (reaction, user) => {
      if (reaction.emoji.name === '🏪') {
        await handleViewGarages(interaction, userInventory);
      } else if (reaction.emoji.name === '🎁') {
        await handleViewCrates(interaction, userInventory);
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp({ content: 'No option was selected. Shop closed.', ephemeral: true });
      }
    });
  }
};

async function handleViewCrates(interaction, userInventory) {
  const crates = [
    { name: 'Common Crate', price: CRATE_PRICES.common, rarity: 'common' },
    { name: 'Rare Crate', price: CRATE_PRICES.rare, rarity: 'rare' },
    { name: 'Epic Crate', price: CRATE_PRICES.epic, rarity: 'epic' },
    { name: 'Legendary Crate', price: CRATE_PRICES.legendary, rarity: 'legendary' }
  ];

  const embed = new EmbedBuilder()
    .setTitle('🎁 Crate Shop')
    .setColor('#6366f1')
    .setDescription(`Your Balance: ${userInventory.balance} coins\n\nReact with the number to buy a crate!`)
    .addFields(
      crates.map((crate, index) => ({
        name: `${index + 1}️⃣ ${crate.name}`,
        value: `💰 Price: ${crate.price} coins\n• Only ${crate.rarity.charAt(0).toUpperCase() + crate.rarity.slice(1)} upgrades!`,
        inline: true
      }))
    );

  const message = await interaction.editReply({ embeds: [embed] });

  // Add reactions
  for (let i = 1; i <= crates.length; i++) {
    await message.react(`${i}️⃣`);
  }

  // Create reaction collector
  const filter = (reaction, user) => 
    ['1️⃣', '2️⃣', '3️⃣', '4️⃣'].includes(reaction.emoji.name) && user.id === interaction.user.id;

  const collector = message.createReactionCollector({ filter, time: 60000, max: 1 });

  collector.on('collect', async (reaction, user) => {
    const index = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'].indexOf(reaction.emoji.name);
    const selectedCrate = crates[index];

    if (userInventory.balance < selectedCrate.price) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Purchase Failed')
        .setDescription(`You don't have enough coins!\n\nRequired: ${selectedCrate.price} coins\nYour Balance: ${userInventory.balance} coins`);
      
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    userInventory.balance -= selectedCrate.price;
    userInventory.crates.push({
      type: selectedCrate.rarity,
      opened: false
    });

    await userInventory.save();

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Purchase Successful')
      .setDescription(`Successfully purchased ${selectedCrate.name}!\n\nPrice: ${selectedCrate.price} coins\nRemaining Balance: ${userInventory.balance} coins`);

    await interaction.followUp({ embeds: [successEmbed] });
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      interaction.followUp({ content: 'No crate was selected. Shop closed.', ephemeral: true });
    }
  });
}

async function handleViewGarages(interaction, userInventory) {
  const garages = [
    { name: 'Basic Garage', price: GARAGE_PRICES.basic, type: 'basic' },
    { name: 'Premium Garage', price: GARAGE_PRICES.premium, type: 'premium' },
    { name: 'Luxury Garage', price: GARAGE_PRICES.luxury, type: 'luxury' }
  ];

  const embed = new EmbedBuilder()
    .setTitle('🏪 Garage Shop')
    .setColor('#6366f1')
    .setDescription(`Your Balance: ${userInventory.balance} coins\n\nReact with the number to buy a garage!`)
    .addFields(
      garages.map((garage, index) => ({
        name: `${index + 1}️⃣ ${garage.name}`,
        value: `💰 Price: ${garage.price} coins\n• ${garage.type === 'basic' ? '1 car every 24h\n• Common cars only' : 
                garage.type === 'premium' ? '1 car every 12h\n• Rare cars included' : 
                '1 car every 6h\n• Epic cars included'}`,
        inline: true
      }))
    );

  const message = await interaction.editReply({ embeds: [embed] });

  // Add reactions
  for (let i = 1; i <= garages.length; i++) {
    await message.react(`${i}️⃣`);
  }

  // Create reaction collector
  const filter = (reaction, user) => 
    ['1️⃣', '2️⃣', '3️⃣'].includes(reaction.emoji.name) && user.id === interaction.user.id;

  const collector = message.createReactionCollector({ filter, time: 60000, max: 1 });

  collector.on('collect', async (reaction, user) => {
    const index = ['1️⃣', '2️⃣', '3️⃣'].indexOf(reaction.emoji.name);
    const selectedGarage = garages[index];

    if (userInventory.balance < selectedGarage.price) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Purchase Failed')
        .setDescription(`You don't have enough coins!\n\nRequired: ${selectedGarage.price} coins\nYour Balance: ${userInventory.balance} coins`);
      
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    userInventory.balance -= selectedGarage.price;
    userInventory.garages.push({
      type: selectedGarage.type,
      lastClaimed: new Date()
    });

    await userInventory.save();

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Purchase Successful')
      .setDescription(`Successfully purchased ${selectedGarage.name}!\n\nPrice: ${selectedGarage.price} coins\nRemaining Balance: ${userInventory.balance} coins`);

    await interaction.followUp({ embeds: [successEmbed] });
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      interaction.followUp({ content: 'No garage was selected. Shop closed.', ephemeral: true });
    }
  });
} 