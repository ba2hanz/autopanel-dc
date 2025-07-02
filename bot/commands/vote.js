const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const UserInventory = require('../models/UserInventory');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Vote for the bot and get rewards'),

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

      // Check if user has already voted in the last 12 hours
      const lastVote = userInventory.lastVote || 0;
      const now = Date.now();
      const timeLeft = 12 * 60 * 60 * 1000 - (now - lastVote); // 12 hours in milliseconds

      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('⏳ Vote Cooldown')
          .setDescription(`You've already voted!\nCome back in ${hours}h ${minutes}m`);

        return interaction.editReply({ embeds: [embed] });
      }

      // Vote reward
      const voteReward = 2000;
      
      // Update user's balance
      userInventory.balance = (userInventory.balance || 0) + voteReward;
      userInventory.lastVote = now;

      // 20% chance for a rare crate
      let bonusCrate = null;
      if (Math.random() < 0.2) {
        const crateTypes = ['rare', 'epic', 'legendary'];
        const weights = [0.6, 0.3, 0.1];
        
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
        .setTitle('🗳️ Vote Reward')
        .setDescription(`Thank you for voting! Here's your reward:`)
        .addFields(
          { name: '💎 Reward', value: `${voteReward} coins`, inline: true }
        );

      if (bonusCrate) {
        embed.addFields(
          { name: '🎁 Bonus Reward', value: `You found a ${bonusCrate.toUpperCase()} crate!` }
        );
      }

      embed.addFields(
        { name: '🔗 Vote Link', value: '[Click here to vote again](https://top.gg/bot/YOUR_BOT_ID)' }
      );

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in vote command:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
      } else {
        await interaction.editReply({ content: 'An error occurred while processing your request.' });
      }
    }
  }
}; 