require('dotenv').config();
const {Client, GatewayIntentBits, Collection} = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const logChannelModule = require('./commands/logchannel');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    rest: {
        rejectUnauthorized: false,
        timeout: 30000
    },
    ws: {
        properties: {
            $browser: "Discord iOS"
        },
        version: 10,
        large_threshold: 50,
        compress: true
    },
    fetchAllMembers: true,
    memberCacheTimeout: 300000,
    guildMembersTimeout: 300000
});

client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Add message listener for watchword
client.on('messageCreate', async (message) => {
    try {
        const watchwordCommand = client.commands.get('watchword');
        if (watchwordCommand && watchwordCommand.checkMessage) {
            await watchwordCommand.checkMessage(message);
        }
    } catch (error) {
        console.error('Error in watchword message listener:', error);
    }
});

// Add error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

client.on('warn', warning => {
    console.warn('Discord client warning:', warning);
});

client.on('debug', info => {
    console.log('Debug:', info);
});

// Start a minimal HTTP server for panel sync
const apiApp = express();
apiApp.use(bodyParser.json());

// Endpoint to update log channel from panel
apiApp.post('/api/bot/logchannel', (req, res) => {
    const { guildId, channelId } = req.body;
    if (!guildId || !channelId) {
        return res.status(400).json({ message: 'guildId and channelId required' });
    }
    logChannelModule.logChannels.set(guildId, channelId);
    console.log(`[API] Log channel for guild ${guildId} set to ${channelId} via panel.`);
    res.json({ success: true });
});

// Endpoint to update all settings from panel
apiApp.post('/api/bot/settings', (req, res) => {
    const { guildId, settings } = req.body;
    if (!guildId || !settings || typeof settings !== 'object') {
        return res.status(400).json({ message: 'guildId and settings required' });
    }
    // Şimdilik sadece logChannel'ı güncelliyoruz, ileride diğer ayarlar da eklenebilir
    if (settings.logChannel) {
        logChannelModule.logChannels.set(guildId, settings.logChannel);
        console.log(`[API] [settings] Log channel for guild ${guildId} set to ${settings.logChannel} via panel.`);
    }
    // Diğer ayarlar için burada cache veya state güncellenebilir
    res.json({ success: true });
});

const PORT = process.env.BOT_API_PORT || 3020;
apiApp.listen(PORT, () => {
    console.log(`[API] Bot HTTP API listening on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);




