const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('./logchannel');
const { isModerator } = require('../utils/permissions');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowchat')
        .setDescription('Set slow mode in the current channel')
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Slow mode duration in seconds (0 to disable)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600)), // Discord's maximum slow mode is 6 hours (21600 seconds)

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Yetki kontrolü
            if (!(await isModerator(interaction))) {
                return interaction.editReply('You need to be an administrator or moderator to use this command!');
            }

            const seconds = interaction.options.getInteger('seconds');

            // Check if the bot has permission to manage channels
            if (!interaction.channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.ManageChannels)) {
                return interaction.editReply('I need permission to manage channels to set slow mode!');
            }

            // Set slow mode
            await interaction.channel.setRateLimitPerUser(seconds);

            // Send log
            await sendLog(interaction.guild, {
                title: '⏱️ Slow Mode Updated',
                description: 'Channel slow mode has been updated.',
                color: seconds > 0 ? '#FFA500' : '#00FF00',
                fields: [
                    { name: 'Channel', value: interaction.channel.toString() },
                    { name: 'Slow Mode', value: seconds === 0 ? 'Disabled' : `${seconds} seconds` },
                    { name: 'Updated By', value: interaction.user.tag }
                ]
            });

            if (seconds === 0) {
                return interaction.editReply('✅ Slow mode has been disabled in this channel! Users can now send messages without any delay.');
            } else {
                return interaction.editReply(`⏱️ Slow mode has been set to ${seconds} seconds in this channel! Users must wait ${seconds} seconds between messages.`);
            }
        } catch (error) {
            console.error('Error in slowchat command:', error);
            return interaction.editReply('An error occurred while setting slow mode!');
        }
    },
}; 