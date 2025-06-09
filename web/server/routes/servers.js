const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Server = require('../models/Server');
const User = require('../models/User');
const Poll = require('../models/Poll');
const ReactionRole = require('../models/ReactionRole');
const axios = require('axios');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const DISCORD_API_URL = 'https://discord.com/api/v10';
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3020';

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get user's Discord access token
const getDiscordAccessToken = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !user.discordAccessToken) {
        throw new Error('Discord access token not found');
    }
    return user.discordAccessToken;
};

// Test endpoint for Discord API
router.get('/test-discord', async (req, res) => {
    try {
        const botToken = process.env.DISCORD_BOT_TOKEN;
        console.log('Bot Token:', botToken ? 'Var' : 'Yok');

        const response = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: {
                'Authorization': `Bot ${botToken}`
            }
        });

        console.log('Bot Bilgileri:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Discord API Test Hatası:', error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

// Test endpoint for guild data
router.get('/test-guild/:guildId', async (req, res) => {
    try {
        const botToken = process.env.DISCORD_BOT_TOKEN;
        const guildId = req.params.guildId;

        console.log('Guild ID:', guildId);
        console.log('Bot Token:', botToken ? 'Var' : 'Yok');

        const response = await axios.get(`https://discord.com/api/v10/guilds/${guildId}`, {
            headers: {
                'Authorization': `Bot ${botToken}`
            }
        });

        console.log('Guild Bilgileri:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Guild API Test Hatası:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        res.status(500).json({ 
            error: error.response?.data || error.message,
            status: error.response?.status
        });
    }
});

// Test endpoint for member count
router.get('/test-members/:guildId', async (req, res) => {
    try {
        const botToken = process.env.DISCORD_BOT_TOKEN;
        const guildId = req.params.guildId;

        console.log('Guild ID:', guildId);
        console.log('Bot Token:', botToken ? 'Var' : 'Yok');

        // Önce bot'un kendisini kontrol et
        const botResponse = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: {
                'Authorization': `Bot ${botToken}`
            }
        });

        console.log('Bot bilgileri:', botResponse.data);

        // Sunucu bilgilerini al
        const guildResponse = await axios.get(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
            headers: {
                'Authorization': `Bot ${botToken}`
            }
        });

        console.log('Sunucu bilgileri:', {
            id: guildResponse.data.id,
            name: guildResponse.data.name,
            memberCount: guildResponse.data.approximate_member_count,
            presenceCount: guildResponse.data.approximate_presence_count
        });

        res.json({
            guild: {
                id: guildResponse.data.id,
                name: guildResponse.data.name,
                memberCount: guildResponse.data.approximate_member_count,
                presenceCount: guildResponse.data.approximate_presence_count
            },
            bot: botResponse.data
        });
    } catch (error) {
        console.error('Üye Sayısı Test Hatası:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        res.status(500).json({ 
            error: error.response?.data || error.message,
            status: error.response?.status
        });
    }
});

// Update server member count
const updateServerMemberCount = async (guildId) => {
    try {
        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            throw new Error('Bot token bulunamadı!');
        }

        // Sunucu bilgilerini al
        const response = await axios.get(`${DISCORD_API_URL}/guilds/${guildId}?with_counts=true`, {
            headers: {
                'Authorization': `Bot ${botToken}`
            }
        });

        console.log('Sunucu bilgileri:', {
            id: response.data.id,
            name: response.data.name,
            memberCount: response.data.approximate_member_count,
            presenceCount: response.data.approximate_presence_count
        });

        return response.data.approximate_member_count || 0;
    } catch (error) {
        console.error('Discord API Hatası:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        return 0;
    }
};

// Periyodik olarak sunucu bilgilerini güncelle
const updateAllServers = async () => {
    try {
        const servers = await Server.find({});
        console.log(`${servers.length} sunucu güncelleniyor...`);

        for (const server of servers) {
            try {
                const memberCount = await updateServerMemberCount(server.guildId);
                server.memberCount = memberCount;
                await server.save();
                console.log(`${server.name} güncellendi. Üye sayısı: ${memberCount}`);
            } catch (error) {
                console.error(`${server.name} güncellenirken hata:`, error.message);
            }
        }
    } catch (error) {
        console.error('Sunucular güncellenirken hata:', error);
    }
};

// Her 5 dakikada bir sunucuları güncelle
setInterval(updateAllServers, 5 * 60 * 1000);

// İlk çalıştırmada tüm sunucuları güncelle
updateAllServers();

// Geçersiz sunucuları temizle
const cleanupInvalidServers = async () => {
    try {
        const servers = await Server.find({});
        console.log(`${servers.length} sunucu kontrol ediliyor...`);

        for (const server of servers) {
            try {
                // Sunucunun hala geçerli olup olmadığını kontrol et
                const response = await axios.get(`${DISCORD_API_URL}/guilds/${server.guildId}`, {
                    headers: {
                        'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`
                    }
                });

                if (response.status === 200) {
                    console.log(`✅ ${server.name} geçerli`);
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log(`❌ ${server.name} artık mevcut değil, siliniyor...`);
                    await Server.findByIdAndDelete(server._id);
                } else {
                    console.error(`${server.name} kontrol edilirken hata:`, error.message);
                }
            }
        }
    } catch (error) {
        console.error('Sunucu temizleme hatası:', error);
    }
};

// Her saat başı geçersiz sunucuları temizle
setInterval(cleanupInvalidServers, 60 * 60 * 1000);

// İlk çalıştırmada temizle
cleanupInvalidServers();

// Bot'un sunucuda olup olmadığını kontrol et
const checkBotInServer = async (guildId) => {
    try {
        const response = await axios.get(`${DISCORD_API_URL}/guilds/${guildId}`, {
            headers: {
                'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
        });
        console.log(`Bot kontrolü başarılı (${guildId}): Bot var`);
        return true;
    } catch (error) {
        if (error.response?.status === 404) {
            // Bot sunucuda yok, bu normal bir durum
            console.log(`Bot kontrolü (${guildId}): Bot yok (404)`);
            return false;
        }
        // Diğer hatalar için false döndür
        console.error(`Bot kontrolü hatası (${guildId}):`, error.message);
        return false;
    }
};

// Eski hasBot alanını temizle
const cleanupOldFields = async () => {
    try {
        const servers = await Server.find({});
        console.log('Eski alanlar temizleniyor...');

        for (const server of servers) {
            // hasBot alanını kaldır
            if (server.hasBot !== undefined) {
                delete server.hasBot;
                await server.save();
                console.log(`${server.name}: hasBot alanı kaldırıldı`);
            }
        }
    } catch (error) {
        console.error('Temizleme hatası:', error);
    }
};

// İlk çalıştırmada temizle
cleanupOldFields();

// Debug endpoint for server bot status
router.get('/debug-bot-status', async (req, res) => {
    try {
        // Önce eski alanları temizle
        await cleanupOldFields();

        const servers = await Server.find({});
        console.log('Sunucular kontrol ediliyor...');

        for (const server of servers) {
            try {
                // Bot'un sunucuda olup olmadığını kontrol et
                const hasBot = await checkBotInServer(server.guildId);
                console.log(`${server.name} (${server.guildId}): Bot ${hasBot ? 'var' : 'yok'}`);
                
                // Sunucu bilgilerini güncelle
                server.needsBot = !hasBot;
                await server.save();
                
                console.log(`${server.name} güncellendi: needsBot = ${server.needsBot}`);
            } catch (error) {
                console.error(`${server.name} kontrol edilirken hata:`, error.message);
            }
        }

        const updatedServers = await Server.find({});
        res.json(updatedServers);
    } catch (error) {
        console.error('Debug hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all servers
router.get('/', auth, async (req, res) => {
    try {
        console.log('\n=== Sunucu Listesi İsteği ===');
        console.log('Kullanıcı ID:', req.user.id);
        
        const user = await User.findById(req.user.id).populate('servers');
        console.log('Kullanıcı bulundu:', user ? 'Evet' : 'Hayır');
        
        if (!user) {
            console.log('❌ Kullanıcı bulunamadı');
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Tüm sunucuları al
        const allServers = await Server.find({});
        console.log('Toplam sunucu sayısı:', allServers.length);

        // Sunucuları güncelle
        const updatedServers = await Promise.all(allServers.map(async (server) => {
            try {
                console.log(`\nGüncelleniyor: ${server.name} (${server.guildId})`);
                
                // Bot'un sunucuda olup olmadığını kontrol et
                const hasBot = await checkBotInServer(server.guildId);
                console.log(`${server.name} bot durumu: ${hasBot ? 'Var' : 'Yok'}`);
                
                // Üye sayısını güncelle
                let memberCount = server.memberCount;
                try {
                    const response = await axios.get(`${DISCORD_API_URL}/guilds/${server.guildId}?with_counts=true`, {
                        headers: {
                            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`
                        }
                    });
                    memberCount = response.data.approximate_member_count || 0;
                } catch (error) {
                    console.error(`Üye sayısı güncelleme hatası (${server.guildId}):`, error.message);
                }
                
                console.log(`${server.name} üye sayısı: ${memberCount}`);
                
                // Sunucu bilgilerini güncelle
                server.memberCount = memberCount;
                server.needsBot = !hasBot;
                await server.save();
                
                console.log(`${server.name} güncellendi: needsBot = ${server.needsBot}`);
                return server;
            } catch (error) {
                console.error(`❌ Sunucu güncelleme hatası (${server.guildId}):`, error);
                return server; // Hata durumunda mevcut sunucu bilgilerini döndür
            }
        }));

        console.log('\n✅ Sunucu listesi gönderiliyor');
        res.json(updatedServers);
    } catch (error) {
        console.error('\n❌ Sunucu Listesi Hatası:');
        console.error('Mesaj:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ message: 'Error fetching servers' });
    }
});

// Get a specific server
router.get('/:guildId', auth, async (req, res) => {
    try {
        const server = await Server.findOne({ guildId: req.params.guildId });
        if (!server) {
            return res.status(404).json({ message: 'Server not found' });
        }

        // Update member count
        const memberCount = await updateServerMemberCount(server.guildId);
        server.memberCount = memberCount;
        await server.save();

        // Check if user has access to this server
        const user = await User.findById(req.user.id);
        if (!user.servers.includes(server._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(server);
    } catch (error) {
        console.error('Get server error:', error);
        res.status(500).json({ message: 'Error fetching server' });
    }
});

// Update server settings
router.put('/:guildId', auth, async (req, res) => {
    try {
        const server = await Server.findOne({ guildId: req.params.guildId });
        if (!server) {
            return res.status(404).json({ message: 'Server not found' });
        }

        // Check if user has access to this server
        const user = await User.findById(req.user.id);
        if (!user.servers.includes(server._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update settings
        if (req.body.settings) {
            // Ensure settings object exists
            if (!server.settings) {
                server.settings = {};
            }

            // Update each setting individually
            const newSettings = req.body.settings;
            Object.keys(newSettings).forEach(key => {
                server.settings[key] = newSettings[key];
            });
        }

        await server.save();

        // Sync all settings to bot
        try {
            await axios.post(`${BOT_API_URL}/api/bot/settings`, {
                guildId: server.guildId,
                settings: server.settings
            });
            console.log(`[Panel->Bot] All settings synced for guild ${server.guildId}`);
        } catch (err) {
            console.error('[Panel->Bot] Failed to sync all settings to bot:', err.message);
        }

        res.json(server);
    } catch (error) {
        console.error('Update server error:', error);
        res.status(500).json({ 
            message: 'Error updating server',
            error: error.message 
        });
    }
});

// Update server usage
router.patch('/:guildId/usage', auth, async (req, res) => {
    try {
        const server = await Server.findOne({ guildId: req.params.guildId });
        if (!server) {
            return res.status(404).json({ message: 'Server not found' });
        }

        // Check if user has access to this server
        const user = await User.findById(req.user.id);
        if (!user.servers.includes(server._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update usage
        const { announcements, giveaways, wordWatches, tempRoles } = req.body;
        if (announcements !== undefined) server.usage.announcements = announcements;
        if (giveaways !== undefined) server.usage.giveaways = giveaways;
        if (wordWatches !== undefined) server.usage.wordWatches = wordWatches;
        if (tempRoles !== undefined) server.usage.tempRoles = tempRoles;

        await server.save();
        res.json(server);
    } catch (error) {
        console.error('Update usage error:', error);
        res.status(500).json({ message: 'Error updating usage' });
    }
});

// Get server channels and roles
router.get('/:guildId/discord-data', auth, async (req, res) => {
    try {
        console.log('\n=== Discord Verileri İsteniyor ===');
        console.log('Guild ID:', req.params.guildId);
        
        // Get user's Discord token from the database
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Get server info
        const server = await Server.findOne({ guildId: req.params.guildId });
        if (!server) {
            return res.status(404).json({ message: 'Sunucu bulunamadı' });
        }

        // Check if user has access to this server
        if (!user.servers.includes(server._id)) {
            return res.status(403).json({ message: 'Bu sunucuya erişim izniniz yok' });
        }

        // Fetch channels and roles from Discord
        const channelsResponse = await axios.get(`${DISCORD_API_URL}/guilds/${req.params.guildId}/channels`, {
            headers: {
                'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
        });

        const rolesResponse = await axios.get(`${DISCORD_API_URL}/guilds/${req.params.guildId}/roles`, {
            headers: {
                'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
        });

        const channels = channelsResponse.data;
        const roles = rolesResponse.data;

        // Filter channels to only include text channels
        const textChannels = channels.filter(channel => channel.type === 0);

        // Sort channels by position and roles by position
        textChannels.sort((a, b) => a.position - b.position);
        roles.sort((a, b) => b.position - a.position);

        console.log('Kanal sayısı:', textChannels.length);
        console.log('Rol sayısı:', roles.length);

        res.json({
            channels: textChannels.map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type
            })),
            roles: roles.map(role => ({
                id: role.id,
                name: role.name,
                color: role.color
            }))
        });
    } catch (error) {
        console.error('\n❌ Discord Veri Hatası:');
        if (error.response) {
            console.error('Discord API Hatası:', error.response.data);
            return res.status(error.response.status).json({
                message: 'Discord API hatası',
                discordError: error.response.data
            });
        }
        console.error('Mesaj:', error.message);
        res.status(500).json({ message: 'Discord verileri alınamadı', error: error.message });
    }
});

// Debug endpoint for database records
router.get('/debug/:guildId', async (req, res) => {
    try {
        const guildId = req.params.guildId;
        console.log('Guild ID:', guildId);

        // Veritabanındaki sunucu kaydını bul
        const server = await Server.findOne({ guildId });
        console.log('Veritabanı Kaydı:', server);

        // Discord API'den sunucu bilgilerini al
        const botToken = process.env.DISCORD_BOT_TOKEN;
        const response = await axios.get(`${DISCORD_API_URL}/guilds/${guildId}?with_counts=true`, {
            headers: {
                'Authorization': `Bot ${botToken}`
            }
        });

        console.log('Discord API Yanıtı:', {
            id: response.data.id,
            name: response.data.name,
            memberCount: response.data.approximate_member_count,
            presenceCount: response.data.approximate_presence_count
        });

        res.json({
            database: server,
            discord: {
                id: response.data.id,
                name: response.data.name,
                memberCount: response.data.approximate_member_count,
                presenceCount: response.data.approximate_presence_count
            }
        });
    } catch (error) {
        console.error('Debug Hatası:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        res.status(500).json({ 
            error: error.response?.data || error.message,
            status: error.response?.status
        });
    }
});

// Get server channels
router.get('/:guildId/channels', auth, async (req, res) => {
    try {
        const botToken = process.env.DISCORD_BOT_TOKEN;
        const guildId = req.params.guildId;

        const response = await axios.get(`${DISCORD_API_URL}/guilds/${guildId}/channels`, {
            headers: {
                'Authorization': `Bot ${botToken}`
            }
        });

        // Sadece text kanallarını filtrele
        const textChannels = response.data.filter(channel => channel.type === 0);
        
        res.json(textChannels);
    } catch (error) {
        console.error('Channels API Hatası:', error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

// Get server roles
router.get('/:guildId/roles', auth, async (req, res) => {
    try {
        const botToken = process.env.DISCORD_BOT_TOKEN;
        const guildId = req.params.guildId;

        const response = await axios.get(`${DISCORD_API_URL}/guilds/${guildId}/roles`, {
            headers: {
                'Authorization': `Bot ${botToken}`
            }
        });

        // @everyone rolünü filtrele ve botun rolünden daha yüksek rolleri filtrele
        const botResponse = await axios.get(`${DISCORD_API_URL}/guilds/${guildId}/members/${process.env.CLIENT_ID}`, {
            headers: {
                'Authorization': `Bot ${botToken}`
            }
        });

        const botHighestRole = Math.max(...botResponse.data.roles.map(roleId => {
            const role = response.data.find(r => r.id === roleId);
            return role ? role.position : 0;
        }));

        const filteredRoles = response.data.filter(role => 
            role.id !== guildId && // @everyone rolünü filtrele
            role.position < botHighestRole // Botun rolünden daha yüksek rolleri filtrele
        );

        res.json(filteredRoles);
    } catch (error) {
        console.error('Roles API Hatası:', error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

// Polls endpoints
router.get('/:guildId/polls', auth, async (req, res) => {
    try {
        const polls = await Poll.find({ guildId: req.params.guildId, active: true });
        res.json(polls);
    } catch (error) {
        console.error('Polls API Hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/:guildId/polls', auth, async (req, res) => {
    try {
        const { channelId, question, options, duration } = req.body;
        const guildId = req.params.guildId;
        const botToken = process.env.DISCORD_BOT_TOKEN;

        // Discord'a mesaj gönder
        const messageResponse = await axios.post(
            `${DISCORD_API_URL}/channels/${channelId}/messages`,
            {
                content: `**${question}**\n\n${options.map((opt, i) => `${['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i]} ${opt}`).join('\n')}`
            },
            {
                headers: {
                    'Authorization': `Bot ${botToken}`
                }
            }
        );

        // Her seçenek için tepki ekle
        for (let i = 0; i < options.length; i++) {
            await axios.put(
                `${DISCORD_API_URL}/channels/${channelId}/messages/${messageResponse.data.id}/reactions/${encodeURIComponent(['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i])}/@me`,
                {},
                {
                    headers: {
                        'Authorization': `Bot ${botToken}`
                    }
                }
            );
        }

        // Veritabanına kaydet
        const poll = new Poll({
            guildId,
            channelId,
            messageId: messageResponse.data.id,
            question,
            options,
            duration,
            endsAt: new Date(Date.now() + duration * 60 * 60 * 1000)
        });

        await poll.save();
        res.json(poll);
    } catch (error) {
        console.error('Poll Oluşturma Hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:guildId/polls/:pollId', auth, async (req, res) => {
    try {
        const poll = await Poll.findOne({ _id: req.params.pollId, guildId: req.params.guildId });
        if (!poll) {
            return res.status(404).json({ error: 'Anket bulunamadı' });
        }

        // Discord'dan mesajı sil
        const botToken = process.env.DISCORD_BOT_TOKEN;
        await axios.delete(
            `${DISCORD_API_URL}/channels/${poll.channelId}/messages/${poll.messageId}`,
            {
                headers: {
                    'Authorization': `Bot ${botToken}`
                }
            }
        );

        // Veritabanından sil
        await poll.deleteOne();
        res.json({ message: 'Anket başarıyla silindi' });
    } catch (error) {
        console.error('Poll Silme Hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reaction Roles endpoints
router.get('/:guildId/reactionroles', auth, async (req, res) => {
    try {
        const reactionRoles = await ReactionRole.find({ guildId: req.params.guildId, active: true });
        res.json(reactionRoles);
    } catch (error) {
        console.error('ReactionRoles API Hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/:guildId/reactionroles', auth, async (req, res) => {
    try {
        const { channelId, message, reactions } = req.body;
        const guildId = req.params.guildId;
        const botToken = process.env.DISCORD_BOT_TOKEN;

        // Discord'a mesaj gönder
        const messageResponse = await axios.post(
            `${DISCORD_API_URL}/channels/${channelId}/messages`,
            {
                content: message
            },
            {
                headers: {
                    'Authorization': `Bot ${botToken}`
                }
            }
        );

        // Her tepki için rol ekle
        for (const reaction of reactions) {
            await axios.put(
                `${DISCORD_API_URL}/channels/${channelId}/messages/${messageResponse.data.id}/reactions/${encodeURIComponent(reaction.emoji)}/@me`,
                {},
                {
                    headers: {
                        'Authorization': `Bot ${botToken}`
                    }
                }
            );
        }

        // Veritabanına kaydet
        const reactionRole = new ReactionRole({
            guildId,
            channelId,
            messageId: messageResponse.data.id,
            message,
            reactions
        });

        await reactionRole.save();
        res.json(reactionRole);
    } catch (error) {
        console.error('ReactionRole Oluşturma Hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:guildId/reactionroles/:reactionRoleId', auth, async (req, res) => {
    try {
        const reactionRole = await ReactionRole.findOne({ _id: req.params.reactionRoleId, guildId: req.params.guildId });
        if (!reactionRole) {
            return res.status(404).json({ error: 'Tepki rolü bulunamadı' });
        }

        // Discord'dan mesajı sil
        const botToken = process.env.DISCORD_BOT_TOKEN;
        await axios.delete(
            `${DISCORD_API_URL}/channels/${reactionRole.channelId}/messages/${reactionRole.messageId}`,
            {
                headers: {
                    'Authorization': `Bot ${botToken}`
                }
            }
        );

        // Veritabanından sil
        await reactionRole.deleteOne();
        res.json({ message: 'Tepki rolü başarıyla silindi' });
    } catch (error) {
        console.error('ReactionRole Silme Hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 