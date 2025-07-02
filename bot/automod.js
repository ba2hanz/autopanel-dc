const Server = require('./models/Server');

// Varsayılan yasaklı kelimeler
const defaultBadwords = ['kelime1', 'kelime2', 'örnek'];

// Spam ve flood kontrolü için Map'ler
const userMessages = new Map(); // Son mesajları tutmak için
const userMessageTimes = new Map(); // Mesaj zamanlarını tutmak için
const warningCooldowns = new Map(); // Uyarı mesajları için cooldown
const userWarnings = new Map(); // Kullanıcı uyarılarını tutmak için

const defaultSettings = {
  enableBadwordsFilter: true,
  enableSpamFilter: true,
  enableFloodFilter: true,
  enableCapsFilter: true,
  enableLinkFilter: true,
  badwordsList: ['küfür1', 'küfür2'],
  badwordsIgnoredChannels: [],
  badwordsIgnoredRoles: [],
  spamIgnoredChannels: [],
  spamIgnoredRoles: [],
  floodIgnoredChannels: [],
  floodIgnoredRoles: [],
  capsIgnoredChannels: [],
  capsIgnoredRoles: [],
  linkIgnoredChannels: [],
  linkIgnoredRoles: [],
  spamPunishment: 'delete',
  floodPunishment: 'delete',
  capsPunishment: 'delete',
  linkPunishment: 'delete',
  spamThreshold: 5,
  floodThreshold: 5,
  capsThreshold: 70,
  spamTimeWindow: 5000,
  floodTimeWindow: 5000,
  warningSystem: {
    enabled: true,
    punishments: [
      { warnings: 3, punishment: 'timeout', duration: 3600000 }, // 3 uyarıda 1 saat timeout
      { warnings: 5, punishment: 'kick' }, // 5 uyarıda kick
      { warnings: 7, punishment: 'ban' } // 7 uyarıda ban
    ],
    warningExpiry: 86400000 // 24 saat
  }
};

async function applyPunishment(message, punishment, reason) {
  const member = message.member;
  if (!member) return;

  try {
    switch (punishment) {
      case 'delete':
        await message.delete();
        break;
      case 'timeout':
        const timeoutDuration = defaultSettings.warningSystem.punishments
          .find(p => p.punishment === 'timeout')?.duration || 3600000;
        await member.timeout(timeoutDuration, reason);
        break;
      case 'kick':
        await member.kick(reason);
        break;
      case 'ban':
        await member.ban({ reason });
        break;
    }
  } catch (error) {
    console.error('Ceza uygulanırken hata:', error);
  }
}

async function handleWarning(message, reason) {
  if (!defaultSettings.warningSystem.enabled) return;

  const userId = message.author.id;
  const now = Date.now();

  // Kullanıcının uyarılarını al veya oluştur
  if (!userWarnings.has(userId)) {
    userWarnings.set(userId, []);
  }

  const warnings = userWarnings.get(userId);

  // Süresi dolmuş uyarıları temizle
  const validWarnings = warnings.filter(warning => 
    now - warning.timestamp < defaultSettings.warningSystem.warningExpiry
  );
  userWarnings.set(userId, validWarnings);

  // Yeni uyarı ekle
  validWarnings.push({
    reason,
    timestamp: now
  });

  // Uyarı sayısını kontrol et ve uygun cezayı bul
  const currentWarnings = validWarnings.length;
  const punishment = defaultSettings.warningSystem.punishments
    .sort((a, b) => b.warnings - a.warnings) // En yüksek uyarı sayısından başla
    .find(p => currentWarnings >= p.warnings);

  if (punishment) {
    // Ceza uygula
    const punishmentType = {
      timeout: 'geçici olarak susturuldu',
      kick: 'sunucudan atıldı',
      ban: 'sunucudan yasaklandı'
    }[punishment.punishment];

    const durationText = punishment.punishment === 'timeout' 
      ? ` (${punishment.duration / 3600000} saat)` 
      : '';

    await applyPunishment(
      message, 
      punishment.punishment, 
      `${punishment.warnings} uyarı limitine ulaşıldı. Son uyarı: ${reason}`
    );

    // Uyarıları sıfırla
    userWarnings.set(userId, []);

    // Kullanıcıya bilgi ver
    try {
      await message.channel.send(
        `${message.author} ${punishment.warnings} uyarı aldığı için ${punishmentType}${durationText}.`
      );
    } catch (error) {
      console.error('Uyarı mesajı gönderilirken hata:', error);
    }
  } else {
    // Uyarı mesajı gönder
    try {
      const nextPunishment = defaultSettings.warningSystem.punishments
        .sort((a, b) => a.warnings - b.warnings) // En düşük uyarı sayısından başla
        .find(p => currentWarnings < p.warnings);

      const nextWarningText = nextPunishment 
        ? `\nSonraki ceza: ${nextPunishment.warnings} uyarıda ${
            nextPunishment.punishment === 'timeout' 
              ? `${nextPunishment.duration / 3600000} saat timeout` 
              : nextPunishment.punishment
          }`
        : '';

      await message.channel.send(
        `${message.author} uyarıldı (${currentWarnings} uyarı). Sebep: ${reason}${nextWarningText}`
      );
    } catch (error) {
      console.error('Uyarı mesajı gönderilirken hata:', error);
    }
  }
}

async function checkAutomod(message, settings) {
    if (message.author.bot || !message.guild) return;

    // Sunucu ayarlarını çek
    const serverData = await Server.findOne({ guildId: message.guild.id }).lean();
    const serverSettings = serverData?.settings || defaultSettings;

    const {
        enableBadwordsFilter,
        enableSpamFilter,
        enableLinkFilter,
        enableCapsFilter,
        enableFloodFilter,
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
        capsIgnoredChannels = [],
        capsIgnoredRoles = [],
        floodIgnoredChannels = [],
        floodIgnoredRoles = [],
        spamIgnoredChannels = [],
        spamIgnoredRoles = [],
    } = serverSettings;

    console.log('--- Automod Debug ---');
    console.log('enableBadwordsFilter:', enableBadwordsFilter);
    console.log('enableSpamFilter:', enableSpamFilter);
    console.log('enableFloodFilter:', enableFloodFilter);
    console.log('enableCapsFilter:', enableCapsFilter);
    console.log('enableLinkFilter:', enableLinkFilter);
    console.log('badwordsList:', badwordsList);
    console.log('badwordsIgnoredChannels:', badwordsIgnoredChannels);
    console.log('badwordsIgnoredRoles:', badwordsIgnoredRoles);
    console.log('Mesaj içeriği:', message.content);
    console.log('Mesaj kanalı:', message.channel.id);
    console.log('Mesaj rolleri:', message.member ? message.member.roles.cache.map(r => r.id) : []);

    // 1. Yasaklı Kelime Filtresi
    if (enableBadwordsFilter && !isIgnored(message, badwordsIgnoredChannels, badwordsIgnoredRoles)) {
        const matched = badwordsList.find(word => message.content.toLowerCase().includes(word));
        console.log('Yasaklı kelime filtresi aktif, matched:', matched);
        if (matched) {
            console.log('Yasaklı kelime filtresi tetiklendi, silme fonksiyonu çağrılıyor!');
            await message.delete();
            await handleWarning(message, 'Küfür kullanımı');
            console.log('Mesaj silindi:', message.content);
            return;
        }
    }

    // 2. Link Filtresi
    if (enableLinkFilter && !isIgnored(message, linkIgnoredChannels, linkIgnoredRoles)) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const hasLink = urlRegex.test(message.content);

        if (hasLink) {
            console.log('Link filtresi aktif, matched:', message.content);
            console.log('Link filtresi tetiklendi, silme fonksiyonu çağrılıyor!');
            await message.delete();
            await handleWarning(message, 'Link paylaşımı');
            console.log('Mesaj silindi:', message.content);
            return;
        }
    }

    // 3. Spam Filtresi
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

                await handleWarning(message, 'Spam yapma');
                return;
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

    // 4. Flood Filtresi
    if (enableFloodFilter && !isIgnored(message, floodIgnoredChannels, floodIgnoredRoles)) {
        const userId = message.author.id;
        const now = Date.now();
        
        if (!userMessageTimes.has(userId)) {
            userMessageTimes.set(userId, []);
        }
        
        const userTimes = userMessageTimes.get(userId);
        userTimes.push(now);
        
        // Belirli bir süre öncesindeki mesajları temizle
        const cutoffTime = now - serverSettings.floodTimeWindow;
        while (userTimes.length > 0 && userTimes[0] < cutoffTime) {
            userTimes.shift();
        }
        
        if (userTimes.length >= serverSettings.floodThreshold) {
            console.log('Flood filtresi aktif, kullanıcı flood yapıyor!');
            console.log('Flood filtresi tetiklendi, silme fonksiyonu çağrılıyor!');
            
            // Kullanıcının son mesajlarını topla
            const messages = await message.channel.messages.fetch({ limit: serverSettings.floodThreshold });
            const userMessages = messages.filter(m => 
                m.author.id === userId && 
                now - m.createdTimestamp <= serverSettings.floodTimeWindow
            );
            
            // Tüm flood mesajlarını tek seferde sil
            if (userMessages.size > 0) {
                await message.channel.bulkDelete(userMessages);
                console.log(`${userMessages.size} adet flood mesajı silindi`);
            }
            
            // Kullanıcının mesaj zamanlarını sıfırla
            userMessageTimes.set(userId, []);
            await handleWarning(message, 'Flood yapma');
            return;
        }
    }

    // 5. Caps Filtresi
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
                await handleWarning(message, 'Aşırı büyük harf kullanımı');
                return;
            }
        }
    }
}

// Yardımcı fonksiyonlar
function isIgnored(message, ignoredChannels, ignoredRoles) {
    // Kanal kontrolü
    if (ignoredChannels.includes(message.channel.id)) {
        return true;
    }

    // Rol kontrolü
    if (message.member) {
        const memberRoles = message.member.roles.cache.map(role => role.id);
        return memberRoles.some(roleId => ignoredRoles.includes(roleId));
    }

    return false;
}

module.exports = { checkAutomod }; 