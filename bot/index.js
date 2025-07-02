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
const Car = require('./models/Car');
const Upgrade = require('./models/Upgrade');
const { checkAutomod } = require('./automod');
const Poll = require('./models/Poll');
const ReactionRole = require('./models/ReactionRole');

// Seed data
const cars = [
  // Common Cars
  {
    name: 'Street Racer',
    rarity: 'common',
    baseStats: {
      speed: 60,
      power: 50,
      handling: 55
    },
    image: 'https://example.com/street_racer.png',
    description: 'A reliable street car perfect for beginners.',
    price: 1000
  },
  {
    name: 'City Cruiser',
    rarity: 'common',
    baseStats: {
      speed: 55,
      power: 45,
      handling: 60
    },
    image: 'https://example.com/city_cruiser.png',
    description: 'Great handling for city streets.',
    price: 1000
  },
  // Rare Cars
  {
    name: 'Sports Coupe',
    rarity: 'rare',
    baseStats: {
      speed: 75,
      power: 70,
      handling: 65
    },
    image: 'https://example.com/sports_coupe.png',
    description: 'A powerful sports car with great acceleration.',
    price: 2500
  },
  {
    name: 'Track Master',
    rarity: 'rare',
    baseStats: {
      speed: 70,
      power: 65,
      handling: 75
    },
    image: 'https://example.com/track_master.png',
    description: 'Excellent handling for track racing.',
    price: 2500
  },
  // Epic Cars
  {
    name: 'Super Sport',
    rarity: 'epic',
    baseStats: {
      speed: 85,
      power: 80,
      handling: 75
    },
    image: 'https://example.com/super_sport.png',
    description: 'A high-performance supercar.',
    price: 5000
  },
  {
    name: 'Racing Legend',
    rarity: 'epic',
    baseStats: {
      speed: 80,
      power: 75,
      handling: 85
    },
    image: 'https://example.com/racing_legend.png',
    description: 'A legendary racing machine.',
    price: 5000
  },
  // Legendary Cars
  {
    name: 'Hyper Beast',
    rarity: 'legendary',
    baseStats: {
      speed: 95,
      power: 90,
      handling: 85
    },
    image: 'https://example.com/hyper_beast.png',
    description: 'The ultimate racing machine.',
    price: 10000
  },
  {
    name: 'Mythic Racer',
    rarity: 'legendary',
    baseStats: {
      speed: 90,
      power: 85,
      handling: 95
    },
    image: 'https://example.com/mythic_racer.png',
    description: 'A mythical car with perfect balance.',
    price: 10000
  }
];

const upgrades = [
  // Engine Upgrades
  {
    name: 'Basic Engine Tune',
    type: 'engine',
    rarity: 'common',
    buffs: {
      power: 5,
      speed: 3
    },
    nerfs: {
      handling: 2
    },
    price: 500,
    description: 'A basic engine tune for more power.'
  },
  {
    name: 'Performance Engine',
    type: 'engine',
    rarity: 'rare',
    buffs: {
      power: 10,
      speed: 8
    },
    nerfs: {
      handling: 5
    },
    price: 1500,
    description: 'A high-performance engine upgrade.'
  },
  {
    name: 'Racing Engine',
    type: 'engine',
    rarity: 'epic',
    buffs: {
      power: 15,
      speed: 12
    },
    nerfs: {
      handling: 8
    },
    price: 3000,
    description: 'A professional racing engine.'
  },
  {
    name: 'Mythic Engine',
    type: 'engine',
    rarity: 'legendary',
    buffs: {
      power: 20,
      speed: 15
    },
    nerfs: {
      handling: 10
    },
    price: 6000,
    description: 'A legendary engine with incredible power.'
  },
  // Tire Upgrades
  {
    name: 'Sport Tires',
    type: 'tires',
    rarity: 'common',
    buffs: {
      handling: 5,
      speed: 2
    },
    nerfs: {
      power: 1
    },
    price: 500,
    description: 'Sport tires for better grip.'
  },
  {
    name: 'Racing Slicks',
    type: 'tires',
    rarity: 'rare',
    buffs: {
      handling: 10,
      speed: 5
    },
    nerfs: {
      power: 3
    },
    price: 1500,
    description: 'Professional racing slicks.'
  },
  {
    name: 'Track Tires',
    type: 'tires',
    rarity: 'epic',
    buffs: {
      handling: 15,
      speed: 8
    },
    nerfs: {
      power: 5
    },
    price: 3000,
    description: 'High-performance track tires.'
  },
  {
    name: 'Mythic Tires',
    type: 'tires',
    rarity: 'legendary',
    buffs: {
      handling: 20,
      speed: 10
    },
    nerfs: {
      power: 8
    },
    price: 6000,
    description: 'Legendary tires with perfect grip.'
  },
  // Body Upgrades
  {
    name: 'Aero Kit',
    type: 'body',
    rarity: 'common',
    buffs: {
      handling: 3,
      speed: 5
    },
    nerfs: {
      power: 2
    },
    price: 500,
    description: 'Basic aerodynamic kit.'
  },
  {
    name: 'Race Body',
    type: 'body',
    rarity: 'rare',
    buffs: {
      handling: 8,
      speed: 10
    },
    nerfs: {
      power: 5
    },
    price: 1500,
    description: 'Professional racing body kit.'
  },
  {
    name: 'Track Body',
    type: 'body',
    rarity: 'epic',
    buffs: {
      handling: 12,
      speed: 15
    },
    nerfs: {
      power: 8
    },
    price: 3000,
    description: 'High-performance track body.'
  },
  {
    name: 'Mythic Body',
    type: 'body',
    rarity: 'legendary',
    buffs: {
      handling: 15,
      speed: 20
    },
    nerfs: {
      power: 10
    },
    price: 6000,
    description: 'Legendary aerodynamic body.'
  }
];

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

// Seed data function
async function seedGameData() {
  try {
    // Check if we already have cars and upgrades
    const carCount = await Car.countDocuments();
    const upgradeCount = await Upgrade.countDocuments();

    if (carCount === 0) {
      console.log('Seeding cars...');
      await Car.insertMany(cars);
      console.log('Cars seeded successfully!');
    }

    if (upgradeCount === 0) {
      console.log('Seeding upgrades...');
      await Upgrade.insertMany(upgrades);
      console.log('Upgrades seeded successfully!');
    }
  } catch (error) {
    console.error('Error seeding game data:', error);
  }
}

// MongoDB bağlantısını yeniden deneme fonksiyonu
async function connectWithRetry(retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`[MongoDB] Bağlantı denemesi ${i + 1}/${retries}`);
            await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
            console.log('[MongoDB] Bağlantı başarılı');
            
            // Seed game data after successful connection
            await seedGameData();
            
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
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember
    ]
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
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Discord client error:', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.editReply({ content: 'There was an error while executing this command!' });
            }
        } catch (replyError) {
            console.error('Error sending error message:', replyError);
        }
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

// Polls için geçici bellek içi veri
const pollsStore = {};

// Mesaj silme olayını dinle
client.on('messageDelete', async (message) => {
    try {
        // Mesajın bir anket olup olmadığını kontrol et
        const poll = await Poll.findOne({ 
            guildId: message.guild.id,
            messageId: message.id
        });

        if (poll) {
            // Anketi veritabanından sil
            await Poll.deleteOne({ _id: poll._id });
            console.log(`Anket silindi: ${poll.question} (${message.guild.name})`);
        }
    } catch (error) {
        console.error('Anket silme hatası:', error);
    }
});

// Sunucuya ait anketleri getir
apiApp.get('/api/servers/:guildId/polls', (req, res) => {
  const { guildId } = req.params;
  if (!guildId) return res.status(400).json({ message: 'guildId gerekli' });
  if (!pollsStore[guildId]) pollsStore[guildId] = [];
  res.json(pollsStore[guildId]);
});

// Sunucuya yeni anket ekle
apiApp.post('/api/servers/:guildId/polls', (req, res) => {
  const { guildId } = req.params;
  const poll = req.body;
  if (!guildId || !poll) return res.status(400).json({ message: 'Eksik veri' });
  if (!pollsStore[guildId]) pollsStore[guildId] = [];
  poll.id = Date.now().toString();
  pollsStore[guildId].push(poll);
  res.json(poll);
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

// Tepki rolü işlemleri
client.on('messageReactionAdd', async (reaction, user) => {
    try {
        // Bot'un kendi tepkilerini yoksay
        if (user.bot) return;

        // Kısmi tepkileri yükle
        if (reaction.partial) {
            await reaction.fetch();
        }

        // Mesajı yükle
        const message = reaction.message;
        if (message.partial) {
            await message.fetch();
        }

        console.log('Tepki eklendi:', {
            emoji: reaction.emoji.toString(),
            userId: user.id,
            messageId: message.id,
            channelId: message.channel.id,
            guildId: message.guild.id
        });

        // Veritabanından tepki rolünü bul
        const reactionRole = await ReactionRole.findOne({
            guildId: message.guild.id,
            channelId: message.channel.id,
            messageId: message.id
        });

        if (!reactionRole) {
            console.log('Tepki rolü bulunamadı');
            return;
        }

        console.log('Tepki rolü bulundu:', reactionRole);

        // Tepkiyi bul
        const reactionData = reactionRole.reactions.find(r => {
            // Custom emoji için
            if (r.emoji.includes(':')) {
                const [name, id] = r.emoji.split(':');
                return reaction.emoji.id === id;
            }
            // Unicode emoji için
            return r.emoji === reaction.emoji.name;
        });

        if (!reactionData) {
            console.log('Tepki verisi bulunamadı');
            return;
        }

        console.log('Tepki verisi bulundu:', reactionData);

        // Rolü bul ve ver
        const member = await message.guild.members.fetch(user.id);
        const role = message.guild.roles.cache.get(reactionData.roleId);
        
        if (!role) {
            console.log('Rol bulunamadı:', reactionData.roleId);
            return;
        }

        if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role);
            console.log(`Rol verildi: ${user.tag} -> ${role.name}`);
        } else {
            console.log('Kullanıcı zaten bu role sahip');
        }
    } catch (error) {
        console.error('Tepki rolü hatası:', error);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    try {
        // Bot'un kendi tepkilerini yoksay
        if (user.bot) return;

        // Kısmi tepkileri yükle
        if (reaction.partial) {
            await reaction.fetch();
        }

        // Mesajı yükle
        const message = reaction.message;
        if (message.partial) {
            await message.fetch();
        }

        console.log('Tepki kaldırıldı:', {
            emoji: reaction.emoji.toString(),
            userId: user.id,
            messageId: message.id,
            channelId: message.channel.id,
            guildId: message.guild.id
        });

        // Veritabanından tepki rolünü bul
        const reactionRole = await ReactionRole.findOne({
            guildId: message.guild.id,
            channelId: message.channel.id,
            messageId: message.id
        });

        if (!reactionRole) {
            console.log('Tepki rolü bulunamadı');
            return;
        }

        // Tepkiyi bul
        const reactionData = reactionRole.reactions.find(r => {
            // Custom emoji için
            if (r.emoji.includes(':')) {
                const [name, id] = r.emoji.split(':');
                return reaction.emoji.id === id;
            }
            // Unicode emoji için
            return r.emoji === reaction.emoji.name;
        });

        if (!reactionData) {
            console.log('Tepki verisi bulunamadı');
            return;
        }

        // Rolü bul ve kaldır
        const member = await message.guild.members.fetch(user.id);
        const role = message.guild.roles.cache.get(reactionData.roleId);
        
        if (!role) {
            console.log('Rol bulunamadı:', reactionData.roleId);
            return;
        }

        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            console.log(`Rol kaldırıldı: ${user.tag} -> ${role.name}`);
        } else {
            console.log('Kullanıcı bu role sahip değil');
        }
    } catch (error) {
        console.error('Tepki rolü hatası:', error);
    }
});

// Load reaction roles from database
async function loadReactionRoles() {
    try {
        const reactionRoles = await ReactionRole.find({ active: true });
        console.log(`Loaded ${reactionRoles.length} active reaction roles`);
    } catch (error) {
        console.error('Error loading reaction roles:', error);
    }
}

// Call loadReactionRoles when bot starts
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await loadReactionRoles();
    await loadSettingsFromDatabase();
});

// Bot'u başlat
startBot();




