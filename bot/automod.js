const Server = require('./models/Server');

// Küfür/argo kelimeler (örnek, panelden de çekilebilir)
const defaultBadwords = ['küfür1', 'küfür2', 'örnek'];

// Spam ve flood kontrolü için Map'ler
const userMessages = new Map(); // Son mesajları tutmak için
const userMessageTimes = new Map(); // Mesaj zamanlarını tutmak için
const warningCooldowns = new Map(); // Uyarı mesajları için cooldown

async function applyPunishment(message, punishment, reason) {
    try {
        // Önce mesajı sil
        await message.delete().catch(console.error);
        console.log('Mesaj silindi:', message.content);

        // Ceza türüne göre işlem yap
        switch (punishment) {
            case 'delete':
                // Sadece mesaj silindi, başka işlem yok
                break;

            case 'delete_warn':
                // Cooldown kontrolü
                const cooldownKey = `${message.guild.id}-${message.channel.id}`;
                const lastWarning = warningCooldowns.get(cooldownKey) || 0;
                const now = Date.now();

                // Eğer son uyarıdan bu yana 10 saniye geçmediyse uyarı verme
                if (now - lastWarning < 10000) {
                    return;
                }

                // Mesaj silindi ve uyarı verildi
                await message.channel.send({
                    content: `${message.author} ${reason}`
                }).then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 5000);
                });

                // Cooldown'u güncelle
                warningCooldowns.set(cooldownKey, now);
                break;

            case 'timeout':
                // Timeout uygula (5 dakika)
                await message.member.timeout(5 * 60 * 1000, reason);
                await message.channel.send({
                    content: `${message.author} ${reason} - 5 dakika timeout uygulandı.`
                }).then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 5000);
                });
                break;

            case 'kick':
                // Kullanıcıyı sunucudan at
                await message.member.kick(reason);
                await message.channel.send({
                    content: `${message.author.tag} ${reason} - Sunucudan atıldı.`
                }).then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 5000);
                });
                break;

            case 'ban':
                // Kullanıcıyı sunucudan yasakla
                await message.member.ban({ reason });
                await message.channel.send({
                    content: `${message.author.tag} ${reason} - Sunucudan yasaklandı.`
                }).then(msg => {
                    setTimeout(() => msg.delete().catch(console.error), 5000);
                });
                break;
        }
    } catch (error) {
        console.error('Ceza uygulanırken hata:', error);
    }
}

function isIgnored(message, ignoredChannels = [], ignoredRoles = []) {
    if (ignoredChannels.includes(message.channel.id)) return true;
    if (message.member && message.member.roles.cache.some(role => ignoredRoles.includes(role.id))) return true;
    return false;
}

async function checkAutomod(message) {
    if (message.author.bot || !message.guild) return;

    // Sunucu ayarlarını çek
    const serverData = await Server.findOne({ guildId: message.guild.id }).lean();
    const settings = serverData?.settings || {};

    const {
        enableBadwordsFilter,
        enableSpamFilter,
        enableLinkFilter,
        enableCapsFilter,
        enableFloodFilter,
        blacklistWords = [],
        badwordsPunishment = 'delete_warn',
        spamPunishment = 'delete_warn',
        linkPunishment = 'delete_warn',
        capsPunishment = 'delete_warn',
        floodPunishment = 'delete_warn',
        badwordsList = defaultBadwords,
        linkIgnoredChannels = [],
        linkIgnoredRoles = [],
        badwordsIgnoredChannels = [],
        badwordsIgnoredRoles = [],
        blacklistIgnoredChannels = [],
        blacklistIgnoredRoles = [],
        capsIgnoredChannels = [],
        capsIgnoredRoles = [],
        floodIgnoredChannels = [],
        floodIgnoredRoles = [],
        spamIgnoredChannels = [],
        spamIgnoredRoles = [],
    } = settings;

    console.log('--- Automod Debug ---');
    console.log('enableBadwordsFilter:', enableBadwordsFilter);
    console.log('enableSpamFilter:', enableSpamFilter);
    console.log('enableFloodFilter:', enableFloodFilter);
    console.log('enableCapsFilter:', enableCapsFilter);
    console.log('badwordsList:', badwordsList);
    console.log('badwordsIgnoredChannels:', badwordsIgnoredChannels);
    console.log('badwordsIgnoredRoles:', badwordsIgnoredRoles);
    console.log('Mesaj içeriği:', message.content);
    console.log('Mesaj kanalı:', message.channel.id);
    console.log('Mesaj rolleri:', message.member ? message.member.roles.cache.map(r => r.id) : []);

    // 1. Küfür/Argo Filtresi
    if (enableBadwordsFilter && !isIgnored(message, badwordsIgnoredChannels, badwordsIgnoredRoles)) {
        const matched = badwordsList.find(word => message.content.toLowerCase().includes(word));
        console.log('Küfür filtresi aktif, matched:', matched);
        if (matched) {
            console.log('Küfür filtresi tetiklendi, silme fonksiyonu çağrılıyor!');
            return applyPunishment(message, badwordsPunishment, 'küfür/argo kullanmak yasak!');
        }
    }

    // 2. Spam Filtresi
    if (enableSpamFilter && !isIgnored(message, spamIgnoredChannels, spamIgnoredRoles)) {
        const userId = message.author.id;
        const userLastMessages = userMessages.get(userId) || [];
        
        // Son 5 mesajı kontrol et
        if (userLastMessages.length >= 4) {
            const lastMessages = userLastMessages.slice(-4);
            const isSpam = lastMessages.every(msg => 
                msg.content === message.content && 
                msg.channelId === message.channel.id
            );

            if (isSpam) {
                console.log('Spam filtresi tetiklendi!');
                
                // Spam olarak algılanan mesaj sayısını sil (5 mesaj)
                try {
                    const messagesToDelete = await message.channel.messages.fetch({ limit: 5 });
                    const spamMessages = messagesToDelete.filter(msg => 
                        msg.author.id === userId && 
                        msg.content === message.content
                    );
                    
                    if (spamMessages.size > 0) {
                        await message.channel.bulkDelete(spamMessages).catch(console.error);
                        console.log(`${spamMessages.size} spam mesajı silindi`);
                    }
                } catch (error) {
                    console.error('Spam mesajları silinirken hata:', error);
                }

                return applyPunishment(message, spamPunishment, 'spam yapmak yasak!');
            }
        }

        // Yeni mesajı ekle
        userLastMessages.push({
            content: message.content,
            channelId: message.channel.id,
            timestamp: Date.now()
        });

        // Son 10 mesajı tut
        if (userLastMessages.length > 10) {
            userLastMessages.shift();
        }

        userMessages.set(userId, userLastMessages);
    }

    // 3. Flood Filtresi
    if (enableFloodFilter && !isIgnored(message, floodIgnoredChannels, floodIgnoredRoles)) {
        const userId = message.author.id;
        const now = Date.now();
        const userTimes = userMessageTimes.get(userId) || [];
        
        // Son 10 saniye içindeki mesajları kontrol et
        const recentMessages = userTimes.filter(time => now - time < 10000);
        
        if (recentMessages.length >= 5) { // 10 saniye içinde 5 mesaj
            console.log('Flood filtresi tetiklendi!');
            return applyPunishment(message, floodPunishment, 'flood yapmak yasak!');
        }

        // Yeni mesaj zamanını ekle
        recentMessages.push(now);
        userMessageTimes.set(userId, recentMessages);

        // Eski mesajları temizle (10 saniyeden eski)
        const cleanedTimes = recentMessages.filter(time => now - time < 10000);
        userMessageTimes.set(userId, cleanedTimes);
    }

    // 4. Caps Filtresi
    if (enableCapsFilter && !isIgnored(message, capsIgnoredChannels, capsIgnoredRoles)) {
        // Mesaj 5 karakterden uzunsa ve sadece harflerden oluşuyorsa kontrol et
        if (message.content.length > 5 && /^[a-zA-Z\s]+$/.test(message.content)) {
            const totalLetters = message.content.replace(/\s/g, '').length;
            const uppercaseLetters = message.content.replace(/[^A-Z]/g, '').length;
            const capsPercentage = (uppercaseLetters / totalLetters) * 100;

            console.log('Caps Debug:');
            console.log('Toplam harf:', totalLetters);
            console.log('Büyük harf:', uppercaseLetters);
            console.log('Büyük harf yüzdesi:', capsPercentage);

            // Eğer büyük harf oranı %70'ten fazlaysa
            if (capsPercentage > 70) {
                console.log('Caps filtresi tetiklendi!');
                return applyPunishment(message, capsPunishment, 'çok fazla büyük harf kullanmak yasak!');
            }
        }
    }

    // ... diğer filtreler ...
}

module.exports = { checkAutomod }; 