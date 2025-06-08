const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('./logchannel');
require('dotenv').config();

// Store active temporary roles
const activeTempRoles = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('temprole')
        .setDescription('Assign a role to a user temporarily')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to assign the role to')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to assign')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 1h, 30m, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the temporary role')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && 
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ID)) {
                return interaction.editReply('You need to be an administrator or moderator to use this command!');
            }

            const user = interaction.options.getUser('user');
            const role = interaction.options.getRole('role');
            const duration = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if the role is manageable
            if (!role.editable) {
                return interaction.editReply('I cannot assign this role! Make sure my role is above the target role.');
            }

            // Parse duration
            const durationInMs = parseDuration(duration);
            if (!durationInMs) {
                return interaction.editReply('Invalid duration format! Use format like 1h, 30m, 1d');
            }

            // Add role to user
            const member = await interaction.guild.members.fetch(user.id);
            await member.roles.add(role);

            // Store the temporary role
            const timeoutId = setTimeout(async () => {
                try {
                    await member.roles.remove(role);
                    await sendLog(interaction.guild, {
                        title: '👋 Temporary Role Removed',
                        description: 'A temporary role has been automatically removed.',
                        color: '#FF0000',
                        fields: [
                            { name: 'User', value: user.tag },
                            { name: 'Role', value: role.name },
                            { name: 'Duration', value: formatDuration(durationInMs) }
                        ]
                    });
                } catch (error) {
                    console.error('Error removing temporary role:', error);
                }
            }, durationInMs);

            activeTempRoles.set(`${interaction.guild.id}-${user.id}-${role.id}`, timeoutId);

            // Send log
            await sendLog(interaction.guild, {
                title: '🎭 Temporary Role Assigned',
                description: 'A temporary role has been assigned to a user.',
                color: '#00FF00',
                fields: [
                    { name: 'User', value: user.tag },
                    { name: 'Role', value: role.name },
                    { name: 'Duration', value: formatDuration(durationInMs) },
                    { name: 'Reason', value: reason },
                    { name: 'Assigned By', value: interaction.user.tag }
                ]
            });

            // Send DM to user
            try {
                await user.send(`You have been given the role ${role.name} in ${interaction.guild.name} for ${formatDuration(durationInMs)}.\nReason: ${reason}`);
            } catch (error) {
                console.error('Error sending DM:', error);
            }

            return interaction.editReply(`Successfully assigned ${role.name} to ${user.tag} for ${formatDuration(durationInMs)}!`);

        } catch (error) {
            console.error('Error in temprole command:', error);
            return interaction.editReply('An error occurred while assigning the temporary role!');
        }
    }
};

// Helper function to parse duration
function parseDuration(duration) {
    const match = duration.match(/^(\d+)([mhd])$/);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

// Helper function to format duration
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days === 1 ? '' : 's'}`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
} 