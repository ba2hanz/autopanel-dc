const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const UserInventory = require('../models/UserInventory');

// Quest types and their requirements
const QUEST_TYPES = {
  RACE_WINS: {
    name: 'Race Champion',
    description: 'Win {count} races',
    rewards: {
      coins: 500,
      xp: 100
    }
  },
  UPGRADES_INSTALLED: {
    name: 'Car Tuner',
    description: 'Install {count} upgrades',
    rewards: {
      coins: 300,
      xp: 50
    }
  },
  CRATES_OPENED: {
    name: 'Treasure Hunter',
    description: 'Open {count} crates',
    rewards: {
      coins: 400,
      xp: 75
    }
  },
  RESEARCH_COMPLETED: {
    name: 'Innovator',
    description: 'Complete {count} research projects',
    rewards: {
      coins: 600,
      xp: 150
    }
  }
};

// Quest difficulties and their requirements
const QUEST_DIFFICULTIES = {
  EASY: { count: 3, multiplier: 1 },
  MEDIUM: { count: 5, multiplier: 1.5 },
  HARD: { count: 10, multiplier: 2 }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quest')
    .setDescription('View and manage your daily quests')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your current quests'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('claim')
        .setDescription('Claim quest rewards')),

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

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'view') {
        // Initialize quests if they don't exist
        if (!userInventory.quests) {
          userInventory.quests = generateQuests();
          await userInventory.save();
        }

        // Check if quests need to be reset (24 hours)
        const lastQuestReset = userInventory.lastQuestReset || 0;
        if (Date.now() - lastQuestReset > 24 * 60 * 60 * 1000) {
          userInventory.quests = generateQuests();
          userInventory.lastQuestReset = Date.now();
          await userInventory.save();
        }

        const embed = new EmbedBuilder()
          .setColor('#6366f1')
          .setTitle('📜 Daily Quests')
          .setDescription('Complete these quests to earn rewards!');

        userInventory.quests.forEach((quest, index) => {
          const questType = QUEST_TYPES[quest.type];
          const difficulty = QUEST_DIFFICULTIES[quest.difficulty];
          const progress = Math.min(quest.progress, difficulty.count);
          const isCompleted = progress >= difficulty.count;

          embed.addFields({
            name: `${index + 1}. ${questType.name} (${quest.difficulty})`,
            value: `${questType.description.replace('{count}', difficulty.count)}\n` +
                  `Progress: ${progress}/${difficulty.count}\n` +
                  `Rewards: ${Math.floor(questType.rewards.coins * difficulty.multiplier)} coins, ` +
                  `${Math.floor(questType.rewards.xp * difficulty.multiplier)} XP\n` +
                  `${isCompleted ? '✅ Completed!' : '⏳ In Progress'}`
          });
        });

        return interaction.editReply({ embeds: [embed] });
      } else if (subcommand === 'claim') {
        if (!userInventory.quests) {
          const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Error')
            .setDescription('You don\'t have any quests!');

          return interaction.editReply({ embeds: [embed] });
        }

        let totalCoins = 0;
        let totalXp = 0;
        let claimedCount = 0;

        userInventory.quests.forEach(quest => {
          const questType = QUEST_TYPES[quest.type];
          const difficulty = QUEST_DIFFICULTIES[quest.difficulty];

          if (quest.progress >= difficulty.count && !quest.claimed) {
            totalCoins += Math.floor(questType.rewards.coins * difficulty.multiplier);
            totalXp += Math.floor(questType.rewards.xp * difficulty.multiplier);
            quest.claimed = true;
            claimedCount++;
          }
        });

        if (claimedCount === 0) {
          const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Error')
            .setDescription('You don\'t have any completed quests to claim!');

          return interaction.editReply({ embeds: [embed] });
        }

        // Update user's balance and XP
        userInventory.balance = (userInventory.balance || 0) + totalCoins;
        userInventory.xp = (userInventory.xp || 0) + totalXp;
        await userInventory.save();

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('🎉 Quest Rewards Claimed')
          .setDescription(`You claimed rewards from ${claimedCount} quests!`)
          .addFields(
            { name: '💎 Coins Earned', value: `${totalCoins}`, inline: true },
            { name: '⭐ XP Earned', value: `${totalXp}`, inline: true }
          );

        return interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in quest command:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
      } else {
        await interaction.editReply({ content: 'An error occurred while processing your request.' });
      }
    }
  }
};

function generateQuests() {
  const quests = [];
  const types = Object.keys(QUEST_TYPES);
  const difficulties = Object.keys(QUEST_DIFFICULTIES);

  // Generate 3 random quests
  for (let i = 0; i < 3; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    quests.push({
      type,
      difficulty,
      progress: 0,
      claimed: false
    });
  }

  return quests;
} 