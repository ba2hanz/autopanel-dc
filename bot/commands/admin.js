const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const UserInventory = require('../models/UserInventory');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('setbalance')
        .setDescription('Set balance for specific user')
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Amount of coins to set')
            .setRequired(true))),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true }); // Mesajı sadece komutu kullanan kişi görecek

    // Sadece belirli ID'ye sahip kullanıcı kullanabilir
    if (interaction.user.id !== '645289190812155917') {
      return interaction.editReply({ content: 'Bu komutu kullanma yetkiniz yok!', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');
    
    let userInventory = await UserInventory.findOne({ userId: interaction.user.id });
    if (!userInventory) {
      userInventory = await UserInventory.create({
        userId: interaction.user.id,
        balance: amount
      });
    } else {
      userInventory.balance = amount;
      await userInventory.save();
    }

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Bakiye Güncellendi')
      .setDescription(`Yeni bakiyeniz: ${userInventory.balance} coin`);

    return interaction.editReply({ embeds: [embed], ephemeral: true });
  }
}; 