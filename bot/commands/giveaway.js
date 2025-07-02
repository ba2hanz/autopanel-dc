const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('./logchannel');
const { isModerator } = require('../utils/permissions');
require('dotenv').config();

// Store active giveaways and history
const activeGiveaways = new Map();
const giveawayHistory = new Map();

// Helper function to parse duration
function parseDuration(duration) {
    const match = duration.match(/^(\d+)([mhdw])$/);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        case 'w': return value * 7 * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

// Helper function to format duration
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (weeks > 0) return `${weeks} week${weeks === 1 ? '' : 's'}`;
    if (days > 0) return `${days} day${days === 1 ? '' : 's'}`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new giveaway')
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Duration of the giveaway (e.g., 1h, 30m, 1d)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('Prize for the giveaway')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description of the giveaway')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('required_role')
                        .setDescription('Role required to enter the giveaway')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel a giveaway')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('ID of the giveaway message')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('finish')
                .setDescription('Finish a giveaway early')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('ID of the giveaway message')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('View giveaway history')
                .addIntegerOption(option =>
                    option.setName('page')
                        .setDescription('Page number')
                        .setRequired(false)
                        .setMinValue(1))),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'create':
                    await this.handleCreate(interaction);
                    break;
                case 'cancel':
                    await this.handleCancel(interaction);
                    break;
                case 'finish':
                    await this.handleFinish(interaction);
                    break;
                case 'history':
                    await this.handleHistory(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error in giveaway command:', error);
            return interaction.editReply('An error occurred while processing the command!');
        }
    },

    async handleCreate(interaction) {
        // Check permissions
        if (!(await isModerator(interaction))) {
            return interaction.editReply('You need to be an administrator or moderator to use this command!');
        }

        // Check premium status and limits
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const panelData = userPanels.get(`${guildId}-${userId}`);
        
        if (!panelData) {
            return interaction.editReply('You need to create a panel first! Use `/panel link` to get started.');
        }

        // Check giveaway limit
        if (!panelData.isPremium && panelData.giveawayCount >= FREE_FEATURES.maxGiveaways) {
            return interaction.editReply(`You've reached your giveaway limit (${FREE_FEATURES.maxGiveaways}). Upgrade to premium for unlimited giveaways!`);
        }

        const duration = interaction.options.getString('duration');
        const prize = interaction.options.getString('prize');
        const winners = interaction.options.getInteger('winners');
        const description = interaction.options.getString('description') || 'No description provided';
        const requiredRole = interaction.options.getRole('required_role');

        const durationMs = parseDuration(duration);
        if (!durationMs) {
            return interaction.editReply('Invalid duration format! Use format like 1h, 30m, or 1d');
        }

        const endTime = Date.now() + durationMs;

        const embed = new EmbedBuilder()
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(description)
            .addFields(
                { name: 'Prize', value: prize },
                { name: 'Winners', value: winners.toString() },
                { name: 'Ends', value: `<t:${Math.floor(endTime / 1000)}:R>` },
                { name: 'Hosted by', value: interaction.user.toString() }
            )
            .setColor('#FF0000')
            .setFooter({ text: `Hosted by ${interaction.user.tag}` })
            .setTimestamp();

        if (requiredRole) {
            embed.addFields({ name: 'Required Role', value: requiredRole.toString() });
        }

        const message = await interaction.channel.send({ embeds: [embed] });
        await message.react('🎉');

        // Store giveaway info
        activeGiveaways.set(message.id, {
            prize,
            winners,
            endTime,
            hostId: interaction.user.id,
            channelId: interaction.channel.id,
            messageId: message.id,
            requiredRole: requiredRole?.id,
            entries: new Set()
        });

        // Update giveaway count
        if (!panelData.giveawayCount) {
            panelData.giveawayCount = 0;
        }
        panelData.giveawayCount++;

        // Send log
        await sendLog(interaction.guild, {
            title: '🎉 Giveaway Started',
            description: 'A new giveaway has been started.',
            color: '#FF0000',
            fields: [
                { name: 'Prize', value: prize },
                { name: 'Winners', value: winners.toString() },
                { name: 'Duration', value: formatDuration(durationMs) },
                { name: 'Required Role', value: requiredRole ? requiredRole.toString() : 'None' },
                { name: 'Hosted By', value: interaction.user.tag },
                { name: 'Channel', value: interaction.channel.toString() }
            ]
        });

        // Set timeout to end giveaway
        setTimeout(async () => {
            await this.endGiveaway(message.id);
        }, durationMs);

        return interaction.editReply('Giveaway created successfully!');
    },

    async handleCancel(interaction) {
        // Check permissions
        if (!(await isModerator(interaction))) {
            return interaction.editReply('You need to be an administrator or moderator to use this command!');
        }

        const messageId = interaction.options.getString('message_id');
        const giveaway = activeGiveaways.get(messageId);

        if (!giveaway) {
            return interaction.editReply('No active giveaway found with that message ID!');
        }

        // Check if user is host or has admin/mod role
        if (giveaway.hostId !== interaction.user.id && !(await isModerator(interaction))) {
            return interaction.editReply('You can only cancel your own giveaways unless you are an administrator or moderator!');
        }

        const channel = await interaction.guild.channels.fetch(giveaway.channelId);
        if (!channel) {
            return interaction.editReply('Could not find the giveaway channel!');
        }

        try {
            const message = await channel.messages.fetch(messageId);
            if (message) {
                const embed = EmbedBuilder.from(message.embeds[0])
                    .setDescription('**GIVEAWAY CANCELLED**\n' + message.embeds[0].description)
                    .setColor('#808080');
                await message.edit({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error updating giveaway message:', error);
        }

        activeGiveaways.delete(messageId);
        return interaction.editReply('Giveaway cancelled successfully!');
    },

    async handleFinish(interaction) {
        // Check permissions
        if (!(await isModerator(interaction))) {
            return interaction.editReply('You need to be an administrator or moderator to use this command!');
        }

        const messageId = interaction.options.getString('message_id');
        const giveaway = activeGiveaways.get(messageId);

        if (!giveaway) {
            return interaction.editReply('No active giveaway found with that message ID!');
        }

        // Check if user is host or has admin/mod role
        if (giveaway.hostId !== interaction.user.id && !(await isModerator(interaction))) {
            return interaction.editReply('You can only end your own giveaways unless you are an administrator or moderator!');
        }

        await this.endGiveaway(messageId);
        return interaction.editReply('Giveaway ended successfully!');
    },

    async handleHistory(interaction) {
        // Check permissions
        if (!(await isModerator(interaction))) {
            return interaction.editReply('You need to be an administrator or moderator to use this command!');
        }

        const page = interaction.options.getInteger('page') ?? 1;
        const itemsPerPage = 5;
        const guildHistory = giveawayHistory.get(interaction.guild.id) || [];
        
        if (guildHistory.length === 0) {
            return interaction.editReply('No giveaway history found for this server.');
        }

        const totalPages = Math.ceil(guildHistory.length / itemsPerPage);
        if (page > totalPages) {
            return interaction.editReply(`Invalid page number. Total pages: ${totalPages}`);
        }

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = guildHistory.slice(startIndex, endIndex);

        const embed = new EmbedBuilder()
            .setTitle('🎉 Giveaway History')
            .setColor('#FF0000')
            .setFooter({ text: `Page ${page}/${totalPages}` })
            .setTimestamp();

        for (const giveaway of pageItems) {
            const host = await interaction.client.users.fetch(giveaway.hostId).catch(() => null);
            const hostName = host ? host.tag : 'Unknown User';
            
            const status = giveaway.status === 'cancelled' ? '❌ Cancelled' : 
                          giveaway.status === 'ended' ? '✅ Ended' : '❓ Unknown';
            
            const winners = giveaway.winners ? 
                giveaway.winners.map(id => `<@${id}>`).join(', ') : 
                'No winners';

            embed.addFields({
                name: `Prize: ${giveaway.prize}`,
                value: `**Status:** ${status}\n**Host:** ${hostName}\n**Winners:** ${winners}\n**Ended:** <t:${Math.floor(giveaway.endTime / 1000)}:R>`
            });
        }

        return interaction.editReply({ embeds: [embed] });
    },

    async endGiveaway(messageId) {
        const giveaway = activeGiveaways.get(messageId);
        if (!giveaway) return;

        const channel = await giveaway.client.channels.fetch(giveaway.channelId);
        if (!channel) return;

        try {
            const message = await channel.messages.fetch(messageId);
            if (!message) return;

            const reaction = message.reactions.cache.get('🎉');
            if (!reaction) return;

            const users = await reaction.users.fetch();
            const validUsers = users.filter(user => !user.bot);

            // Filter users by required role if specified
            let eligibleUsers = Array.from(validUsers.values());
            if (giveaway.requiredRole) {
                eligibleUsers = eligibleUsers.filter(user => {
                    const member = message.guild.members.cache.get(user.id);
                    return member && member.roles.cache.has(giveaway.requiredRole);
                });
            }

            // Select winners
            const winners = [];
            const winnerCount = Math.min(giveaway.winners, eligibleUsers.length);

            for (let i = 0; i < winnerCount; i++) {
                const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
                winners.push(eligibleUsers[randomIndex]);
                eligibleUsers.splice(randomIndex, 1);
            }

            const winnerMentions = winners.length > 0 
                ? winners.map(user => `<@${user.id}>`).join(', ')
                : 'No valid participants';

            const endEmbed = new EmbedBuilder()
                .setTitle('🎉 GIVEAWAY ENDED 🎉')
                .setDescription(`Prize: ${giveaway.prize}\n\nWinners: ${winnerMentions}`)
                .setColor('#00FF00')
                .setFooter({ text: 'Giveaway ended' })
                .setTimestamp();

            await message.edit({ embeds: [endEmbed] });
            await message.reply(`Congratulations ${winnerMentions}! You won: **${giveaway.prize}**`);

            // Add to history
            const guildHistory = giveawayHistory.get(giveaway.guildId) || [];
            guildHistory.unshift({
                ...giveaway,
                status: 'ended',
                winners: winners.map(user => user.id)
            });
            giveawayHistory.set(giveaway.guildId, guildHistory);

            // Send log
            await sendLog(message.guild, {
                title: '🎉 Giveaway Ended',
                description: 'A giveaway has ended.',
                color: '#00FF00',
                fields: [
                    { name: 'Prize', value: giveaway.prize },
                    { name: 'Winners', value: winners.length > 0 ? winners.map(w => w.tag).join(', ') : 'No valid winners' },
                    { name: 'Entries', value: validUsers.size.toString() },
                    { name: 'Hosted By', value: message.client.users.cache.get(giveaway.hostId)?.tag || 'Unknown' }
                ]
            });

        } catch (error) {
            console.error('Error ending giveaway:', error);
        }

        activeGiveaways.delete(messageId);
    }
};

// Export the maps
module.exports.activeGiveaways = activeGiveaways;
module.exports.giveawayHistory = giveawayHistory;


