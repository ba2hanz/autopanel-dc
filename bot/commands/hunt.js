const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const UserInventory = require('../models/UserInventory');
const Car = require('../models/Car');
const Upgrade = require('../models/Upgrade');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('research')
    .setDescription('Research and develop new car parts and upgrades'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const userInventory = await UserInventory.findOne({ userId: interaction.user.id });

      if (!userInventory) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Error')
          .setDescription('You don\'t have a garage yet! Use `/shop` to get started.');

        return interaction.editReply({ embeds: [embed] });
      }

      // Determine what was developed (70% chance for upgrade, 20% for crate, 10% for car)
      const roll = Math.random();
      let reward;
      let rewardType;

      if (roll < 0.7) {
        // Developed an upgrade
        const upgrades = await Upgrade.find();
        reward = upgrades[Math.floor(Math.random() * upgrades.length)];
        rewardType = 'upgrade';
        
        // Add to stored upgrades
        userInventory.storedUpgrades = userInventory.storedUpgrades || [];
        userInventory.storedUpgrades.push({ upgradeId: reward._id });
      } else if (roll < 0.9) {
        // Developed a crate
        const crateTypes = ['common', 'rare', 'epic', 'legendary'];
        const weights = [0.6, 0.25, 0.1, 0.05]; // Probability weights for each type
        
        let random = Math.random();
        let selectedType;
        for (let i = 0; i < weights.length; i++) {
          if (random < weights[i]) {
            selectedType = crateTypes[i];
            break;
          }
          random -= weights[i];
        }
        
        reward = { type: selectedType };
        rewardType = 'crate';
        
        // Add crate to inventory
        userInventory.crates.push({
          type: selectedType,
          opened: false
        });
      } else {
        // Developed a car
        const cars = await Car.find();
        reward = cars[Math.floor(Math.random() * cars.length)];
        rewardType = 'car';
        
        // Add car to inventory
        userInventory.cars.push({
          carId: reward._id,
          upgrades: [],
          isActive: false
        });
      }

      await userInventory.save();

      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🔬 Research Complete')
        .setDescription('Your engineering team has made a breakthrough!');

      if (rewardType === 'upgrade') {
        const buffs = Object.entries(reward.buffs)
          .filter(([_, value]) => value > 0)
          .map(([stat, value]) => `+${value} ${stat}`)
          .join(', ');
        const nerfs = Object.entries(reward.nerfs)
          .filter(([_, value]) => value > 0)
          .map(([stat, value]) => `-${value} ${stat}`)
          .join(', ');

        embed.addFields(
          { name: '🔧 Developed', value: 'Performance Upgrade', inline: true },
          { name: '📦 Name', value: reward.name, inline: true },
          { name: '⭐ Quality', value: reward.rarity.toUpperCase(), inline: true },
          { name: '⚡ Effects', value: `${buffs}${nerfs ? ` | ${nerfs}` : ''}` }
        );
      } else if (rewardType === 'crate') {
        embed.addFields(
          { name: '🔧 Developed', value: 'Parts Package', inline: true },
          { name: '📦 Type', value: reward.type.toUpperCase(), inline: true },
          { name: '💡 Tip', value: 'Use `/crate open` to install the parts!' }
        );
      } else {
        embed.addFields(
          { name: '🔧 Developed', value: 'New Car Design', inline: true },
          { name: '🚗 Model', value: reward.name, inline: true },
          { name: '⭐ Quality', value: reward.rarity.toUpperCase(), inline: true },
          { name: '⚡ Specifications', value: `Speed: ${reward.baseStats.speed}\nPower: ${reward.baseStats.power}\nHandling: ${reward.baseStats.handling}` }
        );
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in research command:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
      } else {
        await interaction.editReply({ content: 'An error occurred while processing your request.' });
      }
    }
  }
}; 