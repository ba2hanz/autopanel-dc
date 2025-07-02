const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('./logchannel');
const { isModerator } = require('../utils/permissions');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete messages from the channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Delete messages from a specific user')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Check permissions
            if (!(await isModerator(interaction))) {
                return interaction.editReply('You need to be an administrator or moderator to use this command!');
            }

            const amount = interaction.options.getInteger('amount');
            const user = interaction.options.getUser('user');

            // Check bot permissions
            if (!interaction.channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.ManageMessages)) {
                return interaction.editReply('I need permission to manage messages in this channel!');
            }

            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            let filteredMessages = messages;

            if (user) {
                filteredMessages = messages.filter(msg => msg.author.id === user.id);
            }

            // Delete messages
            const deletedMessages = await interaction.channel.bulkDelete(filteredMessages.first(amount), true);

            // Send log
            await sendLog(interaction.guild, {
                title: '🗑️ Messages Cleared',
                description: 'Messages have been deleted from the channel.',
                color: '#FF0000',
                fields: [
                    { name: 'Amount', value: deletedMessages.size.toString() },
                    { name: 'Channel', value: interaction.channel.toString() },
                    { name: 'User Filter', value: user ? user.tag : 'None' },
                    { name: 'Cleared By', value: interaction.user.tag }
                ]
            });

            return interaction.editReply(`Successfully deleted ${deletedMessages.size} messages!`);

        } catch (error) {
            console.error('Error in clear command:', error);
            return interaction.editReply('An error occurred while deleting messages!');
        }
    }
}; 