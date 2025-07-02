const { PermissionFlagsBits } = require('discord.js');
const Server = require('../../web/server/models/Server');

async function isModerator(interaction) {
  if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const server = await Server.findOne({ guildId: interaction.guild.id });
  if (!server || !server.settings || !Array.isArray(server.settings.moderatorRoles)) return false;
  return interaction.member.roles.cache.some(role => server.settings.moderatorRoles.includes(role.id));
}

module.exports = { isModerator }; 