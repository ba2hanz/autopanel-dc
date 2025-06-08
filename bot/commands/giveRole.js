const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('./logchannel');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giverole')
        .setDescription('Give or remove a role from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to manage roles for')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to give or remove')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Whether to give or remove the role')
                .setRequired(true)
                .addChoices(
                    { name: 'Give', value: 'give' },
                    { name: 'Remove', value: 'remove' }
                ))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the role change')
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
            const action = interaction.options.getString('action');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if the role is manageable
            if (!role.editable) {
                return interaction.editReply('I cannot manage this role! Make sure my role is above the target role.');
            }

            // Get the member object
            const member = await interaction.guild.members.fetch(user.id);

            // Perform the action
            if (action === 'give') {
                if (member.roles.cache.has(role.id)) {
                    return interaction.editReply(`${user.tag} already has the ${role.name} role!`);
                }
                await member.roles.add(role);
            } else {
                if (!member.roles.cache.has(role.id)) {
                    return interaction.editReply(`${user.tag} doesn't have the ${role.name} role!`);
                }
                await member.roles.remove(role);
            }

            // Send log
            await sendLog(interaction.guild, {
                title: action === 'give' ? '🎭 Role Given' : '👋 Role Removed',
                description: `A role has been ${action === 'give' ? 'given to' : 'removed from'} a user.`,
                color: action === 'give' ? '#00FF00' : '#FF0000',
                fields: [
                    { name: 'User', value: user.tag },
                    { name: 'Role', value: role.name },
                    { name: 'Action', value: action === 'give' ? 'Given' : 'Removed' },
                    { name: 'Reason', value: reason },
                    { name: 'By', value: interaction.user.tag }
                ]
            });

            return interaction.editReply(`Successfully ${action === 'give' ? 'given' : 'removed'} the ${role.name} role ${action === 'give' ? 'to' : 'from'} ${user.tag}!`);

        } catch (error) {
            console.error('Error in giverole command:', error);
            return interaction.editReply('An error occurred while managing the role!');
        }
    }
};
