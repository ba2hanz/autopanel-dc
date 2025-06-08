const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('./logchannel');
const { userPanels, FREE_FEATURES } = require('./panel');
require('dotenv').config();

// Store active word watches
const activeWatches = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('watchword')
        .setDescription('Watch for a specific word or phrase in selected channels')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('Word or phrase to watch for')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channels')
                .setDescription('Channels to watch (can select multiple)')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('case_sensitive')
                .setDescription('Whether the search should be case sensitive')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && 
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ID)) {
                return interaction.editReply('You need to be an administrator or moderator to use this command!');
            }

            const word = interaction.options.getString('word');
            const channels = interaction.options.getChannel('channels');
            const caseSensitive = interaction.options.getBoolean('case_sensitive') || false;

            // Validate channels
            if (!channels.isTextBased()) {
                return interaction.editReply('Selected channel must be a text channel!');
            }

            // Check if user is already watching this word
            const watchKey = `${interaction.guild.id}-${interaction.user.id}-${word.toLowerCase()}`;
            if (activeWatches.has(watchKey)) {
                return interaction.editReply('You are already watching this word/phrase!');
            }

            // Store the watch
            activeWatches.set(watchKey, {
                word,
                caseSensitive,
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                channelIds: [channels.id]
            });

            // Send log
            await sendLog(interaction.guild, {
                title: '👀 Word Watch Set Up',
                description: 'A new word watch has been set up.',
                color: '#00FF00',
                fields: [
                    { name: 'Word/Phrase', value: word },
                    { name: 'Case Sensitive', value: caseSensitive ? 'Yes' : 'No' },
                    { name: 'Channels', value: channels.toString() },
                    { name: 'Set By', value: interaction.user.tag }
                ]
            });

            return interaction.editReply('Word watch set up successfully! You will be notified when the word/phrase is mentioned in the selected channels.');

        } catch (error) {
            console.error('Error in watchword command:', error);
            return interaction.editReply('An error occurred while setting up the word watch!');
        }
    }
};

// Export the activeWatches map and a function to check messages
module.exports.activeWatches = activeWatches;

// Function to check messages for watched words
module.exports.checkMessage = async function(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check each active watch
    for (const [userId, watch] of activeWatches.entries()) {
        // Check if message is in a watched channel
        if (!watch.channels.includes(message.channel.id)) continue;

        // Check if the word is in the message
        const messageContent = watch.caseSensitive ? message.content : message.content.toLowerCase();
        const watchWord = watch.caseSensitive ? watch.word : watch.word.toLowerCase();

        if (messageContent.includes(watchWord)) {
            try {
                // Get the user
                const user = await message.client.users.fetch(userId);
                if (!user) continue;

                // Create message link
                const messageLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;

                // Send DM to user
                await user.send(`🔔 Your watched word "${watch.word}" was mentioned in ${message.channel}!\n${messageLink}`);

                // Send log
                await sendLog(message.guild, {
                    title: '🔔 Word Watch Triggered',
                    description: 'A watched word has been mentioned.',
                    color: '#FFA500',
                    fields: [
                        { name: 'Word/Phrase', value: watch.word },
                        { name: 'Channel', value: message.channel.toString() },
                        { name: 'Message Link', value: messageLink },
                        { name: 'Mentioned By', value: message.author.tag },
                        { name: 'Watching User', value: user.tag }
                    ]
                });
            } catch (error) {
                console.error('Error sending word watch notification:', error);
            }
        }
    }
}; 