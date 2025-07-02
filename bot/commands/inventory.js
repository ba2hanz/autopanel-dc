const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const UserInventory = require('../models/UserInventory');
const Car = require('../models/Car');
const Upgrade = require('../models/Upgrade');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your inventory')
    .addSubcommand(subcommand =>
      subcommand
        .setName('cars')
        .setDescription('View your cars'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('upgrades')
        .setDescription('View your upgrades')),

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

    if (subcommand === 'cars') {
      await handleViewCars(interaction, userInventory);
    } else if (subcommand === 'upgrades') {
      await handleViewUpgrades(interaction, userInventory);
    }
  }
};

async function handleViewCars(interaction, userInventory) {
  if (!userInventory.cars || userInventory.cars.length === 0) {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('🚗 Your Cars')
      .setDescription('You don\'t have any cars yet!\nUse `/shop` to buy crates or garages.');

    return interaction.editReply({ embeds: [embed] });
  }

  const embed = new EmbedBuilder()
    .setColor('#6366f1')
    .setTitle('🚗 Your Cars')
    .setDescription('Here are all your cars:');

  for (const carData of userInventory.cars) {
    const car = await Car.findById(carData.carId);
    if (!car) continue;

    const upgrades = carData.upgrades.map(u => u.upgradeId);
    const upgradeDetails = await Upgrade.find({ _id: { $in: upgrades } });

    const totalStats = {
      speed: car.baseStats.speed,
      power: car.baseStats.power,
      handling: car.baseStats.handling
    };

    upgradeDetails.forEach(upgrade => {
      totalStats.speed += upgrade.buffs.speed || 0;
      totalStats.power += upgrade.buffs.power || 0;
      totalStats.handling += upgrade.buffs.handling || 0;
    });

    embed.addFields({
      name: `${car.name} ${carData.isActive ? '⭐' : ''}`,
      value: `Rarity: ${car.rarity.toUpperCase()}\n` +
        `Speed: ${totalStats.speed}\n` +
        `Power: ${totalStats.power}\n` +
        `Handling: ${totalStats.handling}\n` +
        `Upgrades: ${upgradeDetails.length}`
    });
  }

  return interaction.editReply({ embeds: [embed] });
}

async function handleViewUpgrades(interaction, userInventory) {
  const storedUpgrades = userInventory.storedUpgrades || [];
  const activeCar = userInventory.cars.find(c => c.isActive);
  let activeCarUpgrades = [];
  
  if (activeCar) {
    const car = await Car.findById(activeCar.carId);
    if (car) {
      activeCarUpgrades = await Upgrade.find({ _id: { $in: activeCar.upgrades.map(u => u.upgradeId) } });
    }
  }

  if (storedUpgrades.length === 0 && activeCarUpgrades.length === 0) {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('🔧 Your Upgrades')
      .setDescription('You don\'t have any upgrades yet!\nUse `/shop` to buy crates.');

    return interaction.editReply({ embeds: [embed] });
  }

  const embed = new EmbedBuilder()
    .setColor('#6366f1')
    .setTitle('🔧 Your Upgrades');

  if (activeCarUpgrades.length > 0) {
    embed.addFields({
      name: '🚗 Installed Upgrades',
      value: activeCarUpgrades.map(upgrade => {
        const buffs = Object.entries(upgrade.buffs)
          .filter(([_, value]) => value > 0)
          .map(([stat, value]) => `+${value} ${stat}`)
          .join(', ');
        const nerfs = Object.entries(upgrade.nerfs)
          .filter(([_, value]) => value > 0)
          .map(([stat, value]) => `-${value} ${stat}`)
          .join(', ');
        return `${upgrade.name} (${upgrade.rarity.toUpperCase()})\nEffects: ${buffs}${nerfs ? ` | ${nerfs}` : ''}`;
      }).join('\n\n')
    });
  }

  if (storedUpgrades.length > 0) {
    const storedUpgradeDetails = await Upgrade.find({ _id: { $in: storedUpgrades.map(u => u.upgradeId) } });
    embed.addFields({
      name: '📦 Stored Upgrades',
      value: storedUpgradeDetails.map(upgrade => {
        const buffs = Object.entries(upgrade.buffs)
          .filter(([_, value]) => value > 0)
          .map(([stat, value]) => `+${value} ${stat}`)
          .join(', ');
        const nerfs = Object.entries(upgrade.nerfs)
          .filter(([_, value]) => value > 0)
          .map(([stat, value]) => `-${value} ${stat}`)
          .join(', ');
        return `${upgrade.name} (${upgrade.rarity.toUpperCase()})\nEffects: ${buffs}${nerfs ? ` | ${nerfs}` : ''}`;
      }).join('\n\n')
    });
  }

  return interaction.editReply({ embeds: [embed] });
} 