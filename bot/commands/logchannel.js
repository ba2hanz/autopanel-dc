const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();
const { isModerator } = require('../utils/permissions');

// Store log channels for each guild
const logChannels = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logchannel')
        .setDescription('Set up or manage the bot\'s logging channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the logging channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send logs to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove the logging channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check the current logging channel status')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Check permissions
            if (!(await isModerator(interaction))) {
                return interaction.editReply('You need to be an administrator or moderator to use this command!');
            }

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'set':
                    await this.handleSet(interaction);
                    break;
                case 'remove':
                    await this.handleRemove(interaction);
                    break;
                case 'status':
                    await this.handleStatus(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error in logchannel command:', error);
            return interaction.editReply('An error occurred while processing the command!');
        }
    },

    async handleSet(interaction) {
        const channel = interaction.options.getChannel('channel');

        // Validate channel
        if (!channel.isTextBased()) {
            return interaction.editReply('The selected channel must be a text channel!');
        }

        // Check bot permissions
        const permissions = channel.permissionsFor(interaction.client.user);
        const requiredPermissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory
        ];

        const missingPermissions = requiredPermissions.filter(perm => !permissions.has(perm));
        
        if (missingPermissions.length > 0) {
            const missingPermsList = missingPermissions.map(perm => {
                switch (perm) {
                    case PermissionFlagsBits.ViewChannel: return 'View Channel';
                    case PermissionFlagsBits.SendMessages: return 'Send Messages';
                    case PermissionFlagsBits.EmbedLinks: return 'Embed Links';
                    case PermissionFlagsBits.AttachFiles: return 'Attach Files';
                    case PermissionFlagsBits.ReadMessageHistory: return 'Read Message History';
                    default: return 'Unknown Permission';
                }
            }).join(', ');

            return interaction.editReply(`I need the following permissions in ${channel}:\n${missingPermsList}`);
        }

        // Store the log channel in memory
        logChannels.set(interaction.guild.id, channel.id);

        // Also update the log channel in the database
        try {
            const Server = require('../../web/server/models/Server');
            const server = await Server.findOne({ guildId: interaction.guild.id });
            if (server) {
                server.settings.logChannel = channel.id;
                await server.save();
            }
        } catch (err) {
            console.error('Error updating logChannel in DB:', err);
        }

        // Send confirmation message
        await interaction.editReply(`Logging channel set to ${channel}!`);
        
        // Send a test log message
        try {
            await this.sendLog(interaction.guild, {
                title: '📝 Logging System',
                description: 'Logging system has been set up in this channel.',
                color: '#00FF00',
                fields: [
                    { name: 'Set By', value: interaction.user.tag },
                    { name: 'Channel', value: channel.toString() }
                ]
            });
        } catch (error) {
            console.error('Error sending test log:', error);
            await interaction.followUp({ content: 'Warning: Could not send test log message. Please check my permissions in the selected channel.', ephemeral: true });
        }
    },

    async handleRemove(interaction) {
        if (!logChannels.has(interaction.guild.id)) {
            return interaction.editReply('No logging channel is currently set up!');
        }

        const channelId = logChannels.get(interaction.guild.id);
        const channel = interaction.guild.channels.cache.get(channelId);

        // Remove the log channel
        logChannels.delete(interaction.guild.id);

        // Send confirmation message
        await interaction.editReply(`Logging channel has been removed${channel ? ` from ${channel}` : ''}!`);
    },

    async handleStatus(interaction) {
        const channelId = logChannels.get(interaction.guild.id);
        
        if (!channelId) {
            return interaction.editReply('No logging channel is currently set up!');
        }

        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) {
            logChannels.delete(interaction.guild.id);
            return interaction.editReply('The previously set logging channel no longer exists!');
        }

        // Check bot permissions
        const permissions = channel.permissionsFor(interaction.client.user);
        const requiredPermissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory
        ];

        const missingPermissions = requiredPermissions.filter(perm => !permissions.has(perm));
        
        if (missingPermissions.length > 0) {
            const missingPermsList = missingPermissions.map(perm => {
                switch (perm) {
                    case PermissionFlagsBits.ViewChannel: return 'View Channel';
                    case PermissionFlagsBits.SendMessages: return 'Send Messages';
                    case PermissionFlagsBits.EmbedLinks: return 'Embed Links';
                    case PermissionFlagsBits.AttachFiles: return 'Attach Files';
                    case PermissionFlagsBits.ReadMessageHistory: return 'Read Message History';
                    default: return 'Unknown Permission';
                }
            }).join(', ');

            return interaction.editReply(`Current logging channel: ${channel}\n\n⚠️ Warning: I am missing the following permissions:\n${missingPermsList}`);
        }

        return interaction.editReply(`Current logging channel: ${channel}\n\n✅ All required permissions are set up correctly.`);
    }
};

// Helper function to send logs
async function sendLog(guild, logData) {
    let channelId = logChannels.get(guild.id);
    console.log(`[sendLog] Called for guild: ${guild.id}`);

    // If not in memory, check the database
    if (!channelId) {
        try {
            const Server = require('../../web/server/models/Server');
            const server = await Server.findOne({ guildId: guild.id });
            if (server && server.settings && server.settings.logChannel) {
                channelId = server.settings.logChannel;
                logChannels.set(guild.id, channelId);
                console.log(`[sendLog] Loaded channelId from DB: ${channelId}`);
            } else {
                console.log('[sendLog] No logChannel found in DB');
            }
        } catch (err) {
            console.error('[sendLog] Error fetching logChannel from DB:', err);
        }
    } else {
        console.log(`[sendLog] Loaded channelId from memory: ${channelId}`);
    }

    if (!channelId) {
        console.log('[sendLog] No channelId found, aborting log');
        return;
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
        console.log(`[sendLog] Channel not found in guild cache: ${channelId}`);
        logChannels.delete(guild.id);
        return;
    } else {
        console.log(`[sendLog] Channel found: ${channel.id} (${channel.name})`);
    }

    try {
        // Check permissions before sending
        const permissions = channel.permissionsFor(guild.client.user);
        if (!permissions.has(PermissionFlagsBits.ViewChannel) ||
            !permissions.has(PermissionFlagsBits.SendMessages) ||
            !permissions.has(PermissionFlagsBits.EmbedLinks)) {
            console.error('[sendLog] Missing permissions in log channel:', channel.id);
            return;
        }

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setTitle(logData.title)
            .setDescription(logData.description)
            .setColor(logData.color || '#FF0000')
            .setTimestamp();
        if (logData.fields) {
            embed.addFields(logData.fields);
        }
        await channel.send({ embeds: [embed] });
        console.log('[sendLog] Log message sent successfully');
    } catch (err) {
        console.error('[sendLog] Error sending log message:', err);
    }
}

// Export the logChannels map and sendLog function
module.exports.logChannels = logChannels;
module.exports.sendLog = sendLog; 