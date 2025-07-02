const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const UserInventory = require('../models/UserInventory');
const Car = require('../models/Car');
const Upgrade = require('../models/Upgrade');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crate')
    .setDescription('Crate management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all your crates'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('open')
        .setDescription('Open a crate')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Type of crate to open')
            .setRequired(true)
            .addChoices(
              { name: 'Common Crate', value: 'common' },
              { name: 'Rare Crate', value: 'rare' },
              { name: 'Epic Crate', value: 'epic' },
              { name: 'Legendary Crate', value: 'legendary' }
            ))),

  async execute(interaction) {
    try {
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
        if (!userInventory.crates || userInventory.crates.length === 0) {
          const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🎁 Your Crates')
            .setDescription('You don\'t have any crates yet!\nUse `/shop` to buy some crates.');

          return interaction.editReply({ embeds: [embed] });
        }

        // Count crates by type
        const crateCounts = {
          common: { total: 0, opened: 0 },
          rare: { total: 0, opened: 0 },
          epic: { total: 0, opened: 0 },
          legendary: { total: 0, opened: 0 }
        };

        userInventory.crates.forEach(crate => {
          crateCounts[crate.type].total++;
          if (crate.opened) {
            crateCounts[crate.type].opened++;
          }
        });

        const embed = new EmbedBuilder()
          .setColor('#6366f1')
          .setTitle('🎁 Your Crates')
          .setDescription('Here are all your crates:')
          .addFields(
            {
              name: '📦 Common Crates',
              value: `Total: ${crateCounts.common.total}\nUnopened: ${crateCounts.common.total - crateCounts.common.opened}`,
              inline: true
            },
            {
              name: '📦 Rare Crates',
              value: `Total: ${crateCounts.rare.total}\nUnopened: ${crateCounts.rare.total - crateCounts.rare.opened}`,
              inline: true
            },
            {
              name: '📦 Epic Crates',
              value: `Total: ${crateCounts.epic.total}\nUnopened: ${crateCounts.epic.total - crateCounts.epic.opened}`,
              inline: true
            },
            {
              name: '📦 Legendary Crates',
              value: `Total: ${crateCounts.legendary.total}\nUnopened: ${crateCounts.legendary.total - crateCounts.legendary.opened}`,
              inline: true
            }
          )
          .setFooter({ text: 'Use /shop to buy more crates!' });

        return interaction.editReply({ embeds: [embed] });
      } else if (subcommand === 'open') {
        const crateType = interaction.options.getString('type');
        const crate = userInventory.crates.find(c => c.type === crateType && !c.opened);

        if (!crate) {
          const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Error')
            .setDescription(`You don't have any unopened ${crateType} crates!`);

          return interaction.editReply({ embeds: [embed] });
        }

        // Mark crate as opened
        crate.opened = true;

        // Artık sadece upgrade çıkacak
        const upgrades = await Upgrade.find({ rarity: crateType });
        const reward = upgrades[Math.floor(Math.random() * upgrades.length)];
        // Add upgrade to active car or store for later
        const activeCar = userInventory.cars.find(c => c.isActive);
        if (activeCar) {
          activeCar.upgrades.push({ upgradeId: reward._id });
        } else {
          userInventory.storedUpgrades = userInventory.storedUpgrades || [];
          userInventory.storedUpgrades.push({ upgradeId: reward._id });
        }

        await userInventory.save();

        const embed = new EmbedBuilder()
          .setTitle('🎁 Crate Opened!')
          .setColor(getRarityColor(crateType))
          .setDescription('You got an upgrade!')
          .setThumbnail(reward.image || null)
          .addFields(
            { name: 'Item', value: reward.name, inline: true },
            { name: 'Rarity', value: crateType.toUpperCase(), inline: true },
            { name: 'Type', value: 'Upgrade', inline: true }
          );
        const buffs = Object.entries(reward.buffs)
          .filter(([_, value]) => value > 0)
          .map(([stat, value]) => `+${value} ${stat}`)
          .join(', ');
        const nerfs = Object.entries(reward.nerfs)
          .filter(([_, value]) => value > 0)
          .map(([stat, value]) => `-${value} ${stat}`)
          .join(', ');
        embed.addFields({ name: 'Effects', value: `${buffs}${nerfs ? ` | ${nerfs}` : ''}` });

        return interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in crate command:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
      } else {
        await interaction.editReply({ content: 'An error occurred while processing your request.' });
      }
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