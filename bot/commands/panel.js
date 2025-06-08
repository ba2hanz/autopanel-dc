const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendLog } = require('./logchannel');
require('dotenv').config();

// Store user panel access data
const userPanels = new Map();

// Premium features configuration
const PREMIUM_FEATURES = {
    maxAnnouncements: Infinity,
    maxGiveaways: Infinity,
    maxWordWatches: Infinity,
    maxTempRoles: Infinity,
    customEmbedColors: true,
    prioritySupport: true
};

const FREE_FEATURES = {
    maxAnnouncements: 1,
    maxGiveaways: 0,
    maxWordWatches: 0,
    maxTempRoles: 0,
    customEmbedColors: false,
    prioritySupport: false
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Get your personal panel link'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const panelUrl = `https://autopanel.app/s/${guildId}/${userId}`;

            const embed = new EmbedBuilder()
                .setTitle('🎮 Your Panel Access')
                .setDescription(`Here's your personal panel link:\n${panelUrl}\n\nVisit the website to:\n• Check your premium status\n• Upgrade to premium\n• View your usage limits\n• Manage your settings`)
                .setColor('#00FF00')
                .setFooter({ text: 'Keep this link private!' });

            await interaction.editReply({ embeds: [embed] });

            // Send log
            await sendLog(interaction.guild, {
                title: '🎮 Panel Access',
                description: 'A user accessed their panel link.',
                color: '#00FF00',
                fields: [
                    { name: 'User', value: interaction.user.tag }
                ]
            });

        } catch (error) {
            console.error('Error in panel command:', error);
            return interaction.editReply('An error occurred while generating your panel link!');
        }
    }
};

// Export the userPanels map and feature configurations
module.exports.userPanels = userPanels;
module.exports.PREMIUM_FEATURES = PREMIUM_FEATURES;
module.exports.FREE_FEATURES = FREE_FEATURES; 