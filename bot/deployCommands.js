require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {REST, Routes} = require('discord.js');

// Disable SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({version: '10'}).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application commands.');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            {body: commands}
        );
        console.log('Successfully reloaded application commands.');
    } catch (error) {
        console.error(error);
    } finally {
        // Re-enable SSL certificate verification
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }
})();
