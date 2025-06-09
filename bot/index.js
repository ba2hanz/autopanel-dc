require('dotenv').config();
const {Client, GatewayIntentBits, Collection, Partials, Events} = require('discord.js');
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
const Poll = require('./models/Poll');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Cache sistemi
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 dakika

// Cache temizleme fonksiyonu
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            cache.delete(key);
        }
    }
}, 60000); // Her dakika kontrol et

// MongoDB bağlantı ayarları
const mongooseOptions = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 100, // Arttırıldı
    minPoolSize: 20, // Arttırıldı
    connectTimeoutMS: 30000,
    heartbeatFrequencyMS: 10000,
    retryReads: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false, // Production'da index'leri devre dışı bırak
    maxIdleTimeMS: 60000,
    waitQueueTimeoutMS: 30000
};

// MongoDB bağlantısını yeniden deneme fonksiyonu
async function connectWithRetry(retries = 10, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`[MongoDB] Bağlantı denemesi ${i + 1}/${retries}`);
            await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
            console.log('[MongoDB] Bağlantı başarılı');
            
            // Bağlantı durumunu izle
            mongoose.connection.on('error', err => {
                console.error('[MongoDB] Bağlantı hatası:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.log('[MongoDB] Bağlantı kesildi, yeniden bağlanılıyor...');
                connectWithRetry();
            });

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

// ReactionRole modeli
const reactionRoleSchema = new mongoose.Schema({
    guildId: String,
    messageId: String,
    channelId: String,
    reactions: [{
        emoji: String,
        roleId: String
    }]
});

const ReactionRole = mongoose.model('ReactionRole', reactionRoleSchema);

// Performans optimizasyonları için ayarlar
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildPresences
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember
    ],
    rest: {
        rejectUnauthorized: false,
        timeout: 30000,
        retries: 3,
        offset: 0,
        limit: 100
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
    guildMembersTimeout: 300000,
    messageCacheMaxSize: 200,
    messageCacheLifetime: 300,
    messageSweepInterval: 300
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

// Load settings from database with caching
async function loadSettingsFromDatabase() {
    try {
        console.log('Loading settings from database...');
        
        // Cache'den kontrol et
        const cacheKey = 'server_settings';
        const cachedData = cache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
            console.log('Using cached server settings');
            return cachedData.data;
        }

        const servers = await Server.find({}).lean();
        console.log(`Found ${servers.length} servers`);

        const settings = new Map();

        for (const server of servers) {
            if (server.settings) {
                settings.set(server.guildId, server.settings);
                
                // Log channel settings
                if (server.settings.logChannel) {
                    logChannelModule.logChannels.set(server.guildId, server.settings.logChannel);
                }

                // Welcome message settings
                if (server.settings.welcomeChannel && server.settings.welcomeMessage) {
                    if (!client.welcomeSettings) client.welcomeSettings = new Map();
                    client.welcomeSettings.set(server.guildId, {
                        channelId: server.settings.welcomeChannel,
                        message: server.settings.welcomeMessage,
                        enabled: server.settings.enableWelcome
                    });
                }

                // Auto role settings
                if (server.settings.autoRole) {
                    if (!client.autoRoleSettings) client.autoRoleSettings = new Map();
                    client.autoRoleSettings.set(server.guildId, {
                        roleId: server.settings.autoRole,
                        enabled: server.settings.enableAutoRole
                    });
                }
            }
        }

        // Cache'e kaydet
        cache.set(cacheKey, {
            data: settings,
            timestamp: Date.now()
        });

        return settings;
    } catch (error) {
        console.error('Error loading settings:', error);
        return new Map();
    }
}

// Bot hazır olduğunda
client.once(Events.ClientReady, async () => {
    console.log(`Bot hazır: ${client.user.tag}`);
    
    // Sunucu sayısını ve kullanım istatistiklerini logla
    const guildCount = client.guilds.cache.size;
    const memberCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const channelCount = client.channels.cache.size;
    
    console.log(`Bot İstatistikleri:
    - Sunucu Sayısı: ${guildCount}
    - Toplam Üye: ${memberCount}
    - Kanal Sayısı: ${channelCount}
    - RAM Kullanımı: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
    `);

    // Ayarları yükle
    await loadSettingsFromDatabase();

    // Her 5 dakikada bir ayarları yenile
    setInterval(loadSettingsFromDatabase, 5 * 60 * 1000);
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
client.on(Events.Error, error => {
    console.error('Discord client error:', error);
});

client.on('warn', warning => {
    console.warn('Discord client warning:', warning);
});

client.on('debug', info => {
    console.log('Debug:', info);
});

// Rate limiter ayarları
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // IP başına limit
    message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.'
});

// Start a minimal HTTP server for panel sync
const apiApp = express();

// Güvenlik middleware'leri
apiApp.use(helmet());
apiApp.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
apiApp.use(express.json());
apiApp.use(apiLimiter);

// API endpoint'leri için authentication middleware
const authenticateRequest = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Yetkilendirme token\'ı gerekli' });
    }

    try {
        // Token doğrulama işlemi burada yapılacak
        // Örnek: const decoded = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Geçersiz token' });
    }
};

// Endpoint to update log channel from panel
apiApp.post('/api/bot/logchannel', authenticateRequest, (req, res) => {
    const { guildId, channelId } = req.body;
    if (!guildId || !channelId) {
        return res.status(400).json({ message: 'guildId and channelId required' });
    }
    logChannelModule.logChannels.set(guildId, channelId);
    console.log(`[API] Log channel for guild ${guildId} set to ${channelId} via panel.`);
    res.json({ success: true });
});

// Endpoint to update all settings from panel
apiApp.post('/api/bot/settings', authenticateRequest, (req, res) => {
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

// Tepki Rolü Sistemi
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
        console.log('\n=== Tepki Eklendi ===');
        console.log('Kullanıcı:', user.tag);
        console.log('Tepki:', reaction.emoji.toString());
        console.log('Sunucu:', reaction.message.guild?.name);
        console.log('Kanal:', reaction.message.channel.name);

        // Bot'un kendi tepkilerini yoksay
        if (user.bot) {
            console.log('Bot tepkisi, yoksayılıyor');
            return;
        }

        // Kısmi tepkileri yükle
        if (reaction.partial) {
            console.log('Kısmi tepki yükleniyor...');
            try {
                await reaction.fetch();
                console.log('Tepki yüklendi:', reaction.emoji.toString());
            } catch (error) {
                console.error('Tepki yüklenirken hata:', error);
                return;
            }
        }

        // Mesajı yükle
        let message;
        try {
            message = await reaction.message.fetch();
            console.log('Mesaj yüklendi:', {
                id: message.id,
                content: message.content.substring(0, 50) + '...'
            });
        } catch (error) {
            console.error('Mesaj yüklenirken hata:', error);
            return;
        }

        // Veritabanından tepki rolünü bul
        console.log('Tepki rolü aranıyor:', {
            guildId: message.guild.id,
            messageId: message.id
        });

        const reactionRole = await ReactionRole.findOne({
            guildId: message.guild.id,
            messageId: message.id
        });

        if (!reactionRole) {
            console.log('Tepki rolü bulunamadı');
            return;
        }

        console.log('Tepki rolü bulundu:', {
            id: reactionRole._id,
            reactionCount: reactionRole.reactions.length,
            reactions: reactionRole.reactions
        });

        // Tepkiyi bul
        const reactionData = reactionRole.reactions.find(r => {
            const isMatch = (() => {
                if (r.emoji.startsWith('<') && r.emoji.endsWith('>')) {
                    return r.emoji === reaction.emoji.toString();
                } else if (r.emoji.startsWith(':') && r.emoji.endsWith(':')) {
                    return r.emoji === `:${reaction.emoji.name}:`;
                } else {
                    return r.emoji === reaction.emoji.toString();
                }
            })();
            
            console.log('Tepki karşılaştırma:', {
                stored: r.emoji,
                received: reaction.emoji.toString(),
                isMatch
            });
            
            return isMatch;
        });

        if (!reactionData) {
            console.log('Tepki verisi bulunamadı');
            return;
        }

        console.log('Tepki verisi bulundu:', reactionData);

        // Rolü bul ve ver
        const role = message.guild.roles.cache.get(reactionData.roleId);
        if (!role) {
            console.error('Rol bulunamadı:', reactionData.roleId);
            return;
        }

        console.log('Rol bulundu:', {
            id: role.id,
            name: role.name,
            position: role.position,
            botRolePosition: message.guild.members.me.roles.highest.position
        });

        // Bot'un rolü yeterince yüksek mi kontrol et
        if (role.position >= message.guild.members.me.roles.highest.position) {
            console.error('Bot rolü yeterince yüksek değil');
            return;
        }

        // Kullanıcıya rolü ver
        const member = await message.guild.members.fetch(user.id);
        if (!member) {
            console.error('Kullanıcı bulunamadı:', user.id);
            return;
        }

        console.log('Kullanıcı bulundu:', {
            id: member.id,
            tag: member.user.tag,
            roles: member.roles.cache.map(r => r.name)
        });

        try {
            await member.roles.add(role);
            console.log('Rol başarıyla verildi:', {
                user: member.user.tag,
                role: role.name
            });
        } catch (error) {
            console.error('Rol verilirken hata:', error);
        }
    } catch (error) {
        console.error('Tepki rolü işlenirken hata:', error);
    }
});

// Test komutu
client.on(Events.MessageCreate, async message => {
    if (message.content === '!test') {
        try {
            await message.reply('Bot çalışıyor!');
            console.log('Test komutu çalıştı');
        } catch (error) {
            console.error('Test komutu hatası:', error);
        }
  }
});

// Error handling middleware
apiApp.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ 
        message: 'Bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Bot'u başlat
startBot();




