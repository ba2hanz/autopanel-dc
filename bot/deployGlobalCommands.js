const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Disable SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[UYARI] ${filePath} komut dosyasında gerekli özellikler eksik.`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`${commands.length} adet komut yükleniyor...`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`${data.length} adet komut başarıyla yüklendi.`);
  } catch (error) {
    console.error('Komut yükleme hatası:', error);
  } finally {
    // Re-enable SSL certificate verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
  }
})(); 