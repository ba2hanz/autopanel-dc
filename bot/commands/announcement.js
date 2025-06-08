const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('./logchannel');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription('Create an announcement')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Title of the announcement')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description of the announcement')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Color of the announcement (hex code)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('thumbnail')
                .setDescription('URL of the thumbnail image')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('ping_everyone')
                .setDescription('Whether to ping @everyone')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && 
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ID)) {
                return interaction.editReply('You need to be an administrator or moderator to use this command!');
            }

            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            const color = interaction.options.getString('color') || '#FF0000';
            const thumbnail = interaction.options.getString('thumbnail');
            const pingEveryone = interaction.options.getBoolean('ping_everyone') || false;

            // Check if user can ping everyone
            if (pingEveryone && !interaction.member.permissions.has(PermissionFlagsBits.MentionEveryone)) {
                return interaction.editReply('You need permission to mention @everyone!');
            }

            // Create the announcement embed
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color)
                .setTimestamp();

            if (thumbnail) {
                embed.setThumbnail(thumbnail);
            }

            // Send the announcement
            const message = await interaction.channel.send({
                content: pingEveryone ? '@everyone' : undefined,
                embeds: [embed]
            });

            // Send log
            await sendLog(interaction.guild, {
                title: '📢 Announcement Created',
                description: 'A new announcement has been created.',
                color: color,
                fields: [
                    { name: 'Title', value: title },
                    { name: 'Channel', value: interaction.channel.toString() },
                    { name: 'Created By', value: interaction.user.tag },
                    { name: 'Ping Everyone', value: pingEveryone ? 'Yes' : 'No' }
                ],
                thumbnail: thumbnail
            });

            return interaction.editReply('Announcement created successfully!');

        } catch (error) {
            console.error('Error in announcement command:', error);
            return interaction.editReply('An error occurred while creating the announcement!');
        }
    }
}; 