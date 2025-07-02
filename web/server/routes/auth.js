const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Server = require('../models/Server');
const auth = require('../middleware/auth');

// Discord OAuth2 configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = 'http://localhost:3000/auth/callback';
const JWT_SECRET = process.env.JWT_SECRET;

// Debug middleware for auth routes
router.use((req, res, next) => {
    console.log('\n=== Auth Route İsteği ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Auth route çalışıyor' });
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        console.log('\n=== Kullanıcı Bilgileri İsteniyor ===');
        console.log('Kullanıcı ID:', req.user.id);
        console.log('Headers:', req.headers);

        const user = await User.findById(req.user.id).populate('servers');
        
        if (!user) {
            console.log('❌ Kullanıcı bulunamadı');
            return res.status(404).json({ message: 'User not found' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Format user data
        const userData = {
            id: user._id,
            discordId: user.discordId,
            username: user.username,
            avatar: user.avatar,
            email: user.email,
            servers: user.servers,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            settings: user.settings || {
                notifications: true,
                darkMode: true,
                language: 'tr',
                twoFactor: false
            }
        };

        console.log('✅ Kullanıcı bilgileri gönderiliyor');
        res.json(userData);
    } catch (error) {
        console.error('\n❌ Kullanıcı Bilgileri Hatası:');
        console.error('Mesaj:', error.message);
        console.error('Stack:', error.stack);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Get user settings
router.get('/settings', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found',
                error: 'USER_NOT_FOUND'
            });
        }

        // Return default settings if none exist
        const settings = user.settings || {
            notifications: true,
            darkMode: true,
            language: 'tr',
            twoFactor: false
        };

        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ 
            message: 'Error fetching user settings',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
});

// Update user settings
router.post('/settings', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found',
                error: 'USER_NOT_FOUND'
            });
        }

        // Validate settings
        const validSettings = ['notifications', 'darkMode', 'language', 'twoFactor'];
        const updates = {};
        
        for (const [key, value] of Object.entries(req.body)) {
            if (validSettings.includes(key)) {
                updates[key] = value;
            }
        }

        // Update user settings
        user.settings = {
            ...user.settings,
            ...updates
        };

        await user.save();

        res.json(user.settings);
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ 
            message: 'Error updating user settings',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
});

// Get Discord OAuth2 URL
router.get('/discord', (req, res) => {
    console.log('\n=== Discord OAuth2 URL Oluşturuluyor ===');
    console.log('📝 Yapılandırma:');
    console.log('- Client ID:', DISCORD_CLIENT_ID);
    console.log('- Redirect URI:', DISCORD_REDIRECT_URI);
    
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    console.log('✅ URL Oluşturuldu:', url);
    res.json({ url });
});

// Discord OAuth2 callback
router.post('/discord/callback', async (req, res) => {
    const { code } = req.body;
    console.log('\n=== POST Callback Başladı ===');
    console.log('Code:', code);
    await handleDiscordCallback(code, res);
});

router.get('/discord/callback', async (req, res) => {
    const { code } = req.query;
    console.log('\n=== GET Callback Başladı ===');
    console.log('Code:', code);
    await handleDiscordCallback(code, res);
});

// Discord callback işleme fonksiyonu
async function handleDiscordCallback(code, res) {
    if (!code) {
        console.error('❌ Code parametresi eksik!');
        return res.status(400).json({ message: 'No code provided' });
    }

    try {
        console.log('\n🔄 Discord Token Alınıyor...');
        console.log('📝 Yapılandırma:');
        console.log('- Client ID:', DISCORD_CLIENT_ID);
        console.log('- Redirect URI:', DISCORD_REDIRECT_URI);

        // Exchange code for access token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: DISCORD_REDIRECT_URI,
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const tokens = await tokenResponse.json();
        console.log('\n📡 Discord Token Yanıtı:');
        console.log('- Status:', tokenResponse.status);
        console.log('- Response:', JSON.stringify(tokens, null, 2));

        if (!tokenResponse.ok) {
            throw new Error(`Discord API Hatası: ${tokens.error_description || tokens.error || 'Bilinmeyen hata'}`);
        }

        // Get user info
        console.log('\n👤 Kullanıcı Bilgileri Alınıyor...');
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        if (!userResponse.ok) {
            throw new Error('Discord\'dan kullanıcı bilgileri alınamadı');
        }

        const userData = await userResponse.json();
        console.log('✅ Kullanıcı Bilgileri:', JSON.stringify(userData, null, 2));

        // Get user's guilds
        console.log('\n🏰 Sunucu Bilgileri Alınıyor...');
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        if (!guildsResponse.ok) {
            throw new Error('Discord\'dan sunucu bilgileri alınamadı');
        }

        const guildsData = await guildsResponse.json();
        console.log('✅ Sunucu Sayısı:', guildsData.length);

        // Find or create user
        let user = await User.findOne({ discordId: userData.id });
        if (!user) {
            console.log('\n➕ Yeni Kullanıcı Oluşturuluyor...');
            user = new User({
                discordId: userData.id,
                username: userData.username,
                avatar: userData.avatar,
            });
            await user.save();
            console.log('✅ Kullanıcı Oluşturuldu:', user.username);
        } else {
            console.log('\n📝 Mevcut Kullanıcı Güncelleniyor...');
            user.username = userData.username;
            user.avatar = userData.avatar;
            await user.save();
            console.log('✅ Kullanıcı Güncellendi:', user.username);
        }

        // Process guilds
        console.log('\n🔄 Sunucular İşleniyor...');
        let processedGuilds = 0;
        for (const guild of guildsData) {
            if (guild.owner || (guild.permissions & 0x20) === 0x20) {
                let server = await Server.findOne({ guildId: guild.id });
                if (!server) {
                    console.log(`➕ Yeni Sunucu: ${guild.name}`);
                    server = new Server({
                        guildId: guild.id,
                        name: guild.name,
                        icon: guild.icon,
                        ownerId: user.discordId,
                    });
                    await server.save();
                }
                
                if (!user.servers.includes(server._id)) {
                    console.log(`🔗 Sunucu Kullanıcıya Eklendi: ${guild.name}`);
                    user.servers.push(server._id);
                }
                processedGuilds++;
            }
        }
        await user.save();
        console.log(`✅ İşlenen Sunucu Sayısı: ${processedGuilds}`);

        // Generate JWT
        console.log('\n🔑 JWT Token Oluşturuluyor...');
        const token = jwt.sign(
            { 
                id: user._id,
                discordId: user.discordId,
                username: user.username
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        console.log('✅ Token Oluşturuldu');

        // Return token as JSON
        console.log('\n📤 Yanıt Gönderiliyor...');
        res.json({ 
            token,
            user: {
                id: user._id,
                discordId: user.discordId,
                username: user.username,
                avatar: user.avatar,
                servers: user.servers
            }
        });
        console.log('✅ İşlem Tamamlandı!\n');

    } catch (error) {
        console.error('\n❌ HATA DETAYLARI:');
        console.error('Mesaj:', error.message);
        console.error('Stack:', error.stack);
        console.error('Code:', code);
        console.error('===================\n');
        
        res.status(500).json({ 
            message: error.message || 'Kimlik doğrulama başarısız oldu',
            details: error.stack
        });
    }
}

router.post('/logout', auth, async (req, res) => {
    try {
        // Token'ı blacklist'e ekle veya geçersiz kıl
        // Bu örnekte sadece başarılı yanıt dönüyoruz
        res.json({ message: 'Başarıyla çıkış yapıldı' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Çıkış yapılırken bir hata oluştu' });
    }
});

module.exports = router; 