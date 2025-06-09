require('dotenv').config();
const {Client, GatewayIntentBits, Collection, Partials} = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const logChannelModule = require('./commands/logchannel');
const cors = require('cors');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const Server = require('./models/Server');
const { checkAutomod } = require('./automod');

// MongoDB bağlantı ayarları
const mongooseOptions = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    minPoolSize: 5,
    connectTimeoutMS: 30000,
    heartbeatFrequencyMS: 10000,
    retryReads: true
};

// MongoDB bağlantısını yeniden deneme fonksiyonu
async function connectWithRetry(retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`[MongoDB] Bağlantı denemesi ${i + 1}/${retries}`);
            await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
            console.log('[MongoDB] Bağlantı başarılı');
            return true;
        } catch (err) {
            console.error(`[MongoDB] Bağlantı hatası (deneme ${i + 1}/${retries}):`, err);
            if (i < retries - 1) {
                console.log(`[MongoDB] ${delay/1000} saniye sonra tekrar denenecek...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    return false;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel],
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
    if (!command.data || !command.data.name) {
        console.warn(`[WARN] ${file} dosyasında data veya data.name eksik, atlanıyor.`);
        continue;
    }
    client.commands.set(command.data.name, command);
}

// Load settings from database
async function loadSettingsFromDatabase() {
    try {
        console.log('Loading settings from database...');
        const servers = await Server.find({}).lean();
        console.log(`Found ${servers.length} servers`);

        for (const server of servers) {
            if (server.settings) {
                // Log channel settings
                if (server.settings.logChannel) {
                    logChannelModule.logChannels.set(server.guildId, server.settings.logChannel);
                    console.log(`Loaded log channel for guild ${server.guildId}: ${server.settings.logChannel}`);
                }

                // Welcome message settings
                if (server.settings.welcomeChannel && server.settings.welcomeMessage) {
                    if (!client.welcomeSettings) client.welcomeSettings = new Map();
                    client.welcomeSettings.set(server.guildId, {
                        channelId: server.settings.welcomeChannel,
                        message: server.settings.welcomeMessage,
                        enabled: server.settings.enableWelcome
                    });
                    console.log(`Loaded welcome settings for guild ${server.guildId}`);
                }

                // Auto role settings
                if (server.settings.autoRole) {
                    if (!client.autoRoleSettings) client.autoRoleSettings = new Map();
                    client.autoRoleSettings.set(server.guildId, {
                        roleId: server.settings.autoRole,
                        enabled: server.settings.enableAutoRole
                    });
                    console.log(`Loaded auto role settings for guild ${server.guildId}`);
                }
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Call loadSettingsFromDatabase when bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    loadSettingsFromDatabase();
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
        await checkAutomod(message);
        const watchwordCommand = client.commands.get('watchword');
        if (watchwordCommand && watchwordCommand.checkMessage) {
            await watchwordCommand.checkMessage(message);
        }
    } catch (error) {
        console.error('Automod veya watchword message listener error:', error);
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
apiApp.use(cors());
apiApp.use(express.json());

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

    // Log channel update
    if (settings.logChannel) {
        logChannelModule.logChannels.set(guildId, settings.logChannel);
        console.log(`[API] [settings] Log channel for guild ${guildId} set to ${settings.logChannel} via panel.`);
    }

    // Welcome message settings
    if (settings.welcomeChannel && settings.welcomeMessage) {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
            const channel = guild.channels.cache.get(settings.welcomeChannel);
            if (channel) {
                // Store welcome settings in memory
                if (!client.welcomeSettings) client.welcomeSettings = new Map();
                client.welcomeSettings.set(guildId, {
                    channelId: settings.welcomeChannel,
                    message: settings.welcomeMessage,
                    enabled: settings.enableWelcome
                });
                console.log(`[API] [settings] Welcome settings updated for guild ${guildId}`);
            }
        }
    }

    // Auto role settings
    if (settings.autoRole) {
        if (!client.autoRoleSettings) client.autoRoleSettings = new Map();
        client.autoRoleSettings.set(guildId, {
            roleId: settings.autoRole,
            enabled: settings.enableAutoRole
        });
        console.log(`[API] [settings] Auto role settings updated for guild ${guildId}`);
    }

    res.json({ success: true });
});

// Welcome message event handler
client.on('guildMemberAdd', async (member) => {
    try {
        const settings = client.welcomeSettings?.get(member.guild.id);
        if (!settings?.enabled || !settings.channelId || !settings.message) return;

        const channel = member.guild.channels.cache.get(settings.channelId);
        if (!channel) return;

        // Replace variables in welcome message
        const welcomeMessage = settings.message
            .replace('{user}', member.toString())
            .replace('{server}', member.guild.name)
            .replace('{membercount}', member.guild.memberCount.toString());

        await channel.send(welcomeMessage);
    } catch (error) {
        console.error('Welcome message error:', error);
    }
});

// Handle auto role
client.on('guildMemberAdd', async (member) => {
    const guildId = member.guild.id;
    
    if (client.autoRoleSettings && client.autoRoleSettings.has(guildId)) {
        const autoRoleSettings = client.autoRoleSettings.get(guildId);
        if (autoRoleSettings.enabled) {
            try {
                const role = member.guild.roles.cache.get(autoRoleSettings.roleId);
                if (role) {
                    await member.roles.add(role);
                }
            } catch (error) {
                console.error(`[AutoRole] Error adding role in guild ${guildId}:`, error);
            }
        }
    }
});

// WebSocket sunucusu oluştur
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Dashboard bağlandı');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'settings_update') {
                const { guildId, settings } = data;
                
                // Veritabanını güncelle
                await Server.findOneAndUpdate(
                    { guildId },
                    { $set: { settings } },
                    { new: true }
                );

                // Bot'un hafızasını güncelle
                if (!client.welcomeSettings) {
                    client.welcomeSettings = new Map();
                }
                
                client.welcomeSettings.set(guildId, {
                    channelId: settings.welcomeChannel,
                    message: settings.welcomeMessage,
                    enabled: settings.enableWelcome
                });

                // Başarılı güncelleme mesajı gönder
                ws.send(JSON.stringify({
                    type: 'settings_updated',
                    success: true,
                    guildId
                }));
            }
        } catch (error) {
            console.error('WebSocket mesaj işleme hatası:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Ayarlar güncellenirken bir hata oluştu'
            }));
        }
    });

    ws.on('close', () => {
        console.log('Dashboard bağlantısı kapandı');
    });
});

// Bot'u başlatmadan önce MongoDB bağlantısını bekle
async function startBot() {
    try {
        // MongoDB bağlantısını dene
        const connected = await connectWithRetry();
        if (!connected) {
            console.error('[Bot] MongoDB bağlantısı başarısız oldu. Bot kapatılıyor...');
            process.exit(1);
        }

        // Bağlantı başarılı olduktan sonra ayarları yükle
        await loadSettingsFromDatabase();
        
        // Discord client'ı başlat
        await client.login(process.env.DISCORD_TOKEN);
        
        // API sunucusunu başlat
        const PORT = process.env.BOT_API_PORT || 3020;
        apiApp.listen(PORT, () => {
            console.log(`[API] Sunucu ${PORT} portunda başlatıldı`);
        });
    } catch (error) {
        console.error('[Bot] Başlatma hatası:', error);
        process.exit(1);
    }
}

// MongoDB bağlantı durumunu izle
mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Bağlantı kuruldu');
});

mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Bağlantı hatası:', err);
    console.error('[MongoDB] Hata detayları:', {
        name: err.name,
        message: err.message,
        code: err.code
    });
});

mongoose.connection.on('disconnected', () => {
    console.log('[MongoDB] Bağlantı kesildi');
    // Bağlantı kesildiğinde yeniden bağlanmayı dene
    connectWithRetry();
});

// Bot'u başlat
startBot();




