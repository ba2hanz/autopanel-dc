const { REST, Routes } = require('discord.js');
require('dotenv').config();

const GUILD_ID = '690465567445876766';

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
      { body: [] }
    );
    console.log('Sunucuya özel tüm komutlar silindi.');
  } catch (error) {
    console.error(error);
  }
})(); 