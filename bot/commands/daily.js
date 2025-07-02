const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const UserInventory = require('../models/UserInventory');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),

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

      // Check if user has already claimed today's reward
      const lastDaily = userInventory.lastDaily || 0;
      const now = Date.now();
      const timeLeft = 24 * 60 * 60 * 1000 - (now - lastDaily); // 24 hours in milliseconds

      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('⏳ Daily Reward')
          .setDescription(`You've already claimed your daily reward!\nCome back in ${hours}h ${minutes}m`);

        return interaction.editReply({ embeds: [embed] });
      }

      // Base reward
      const baseReward = 1000;
      
      // Streak bonus (1% per day, max 50%)
      const streak = userInventory.dailyStreak || 0;
      const streakBonus = Math.min(streak * 0.01, 0.5);
      
      // Calculate total reward
      const totalReward = Math.floor(baseReward * (1 + streakBonus));

      // Update user's balance and streak
      userInventory.balance = (userInventory.balance || 0) + totalReward;
      userInventory.dailyStreak = streak + 1;
      userInventory.lastDaily = now;

      // 10% chance for a bonus crate
      let bonusCrate = null;
      if (Math.random() < 0.1) {
        const crateTypes = ['common', 'rare', 'epic', 'legendary'];
        const weights = [0.6, 0.25, 0.1, 0.05];
        
        let random = Math.random();
        let selectedType;
        for (let i = 0; i < weights.length; i++) {
          if (random < weights[i]) {
            selectedType = crateTypes[i];
            break;
          }
          random -= weights[i];
        }
        
        bonusCrate = selectedType;
        userInventory.crates.push({
          type: selectedType,
          opened: false
        });
      }

      await userInventory.save();

      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('💰 Daily Reward')
        .setDescription(`You've claimed your daily reward!`)
        .addFields(
          { name: '💵 Base Reward', value: `${baseReward} coins`, inline: true },
          { name: '🔥 Streak Bonus', value: `${(streakBonus * 100).toFixed(0)}%`, inline: true },
          { name: '💎 Total Reward', value: `${totalReward} coins`, inline: true }
        );

      if (bonusCrate) {
        embed.addFields(
          { name: '🎁 Bonus Reward', value: `You found a ${bonusCrate.toUpperCase()} crate!` }
        );
      }

      embed.addFields(
        { name: '📊 Current Streak', value: `${userInventory.dailyStreak} days` }
      );

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in daily command:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
      } else {
        await interaction.editReply({ content: 'An error occurred while processing your request.' });
      }
    }
  }
}; 