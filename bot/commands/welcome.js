const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Server = require('../models/Server');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Hoş geldin mesajı ayarlarını yönet')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Hoş geldin mesajını ayarla')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Hoş geldin mesajının gönderileceği kanal')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Hoş geldin mesajı (Kullanılabilir: {user}, {server})')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Hoş geldin mesajını test et'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Hoş geldin mesajını devre dışı bırak'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Mevcut hoş geldin mesajı ayarlarını göster'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        // Önce interaction'ı defer et
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();

        try {
            let server = await Server.findOne({ guildId: interaction.guild.id });
            
            // Eğer sunucu bulunamazsa yeni bir tane oluştur
            if (!server) {
                server = new Server({
                    guildId: interaction.guild.id,
                    name: interaction.guild.name,
                    ownerId: interaction.guild.ownerId,
                    settings: {
                        welcomeMessage: 'Welcome {user} to {server}!'
                    }
                });
                await server.save();
            }

            switch (subcommand) {
                case 'set': {
                    const channel = interaction.options.getChannel('channel');
                    const message = interaction.options.getString('message');

                    // Kanal kontrolü
                    if (!channel.isTextBased()) {
                        return interaction.editReply('Lütfen bir metin kanalı seçin!');
                    }

                    // Bot izinlerini kontrol et
                    const permissions = channel.permissionsFor(interaction.client.user);
                    if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.ViewChannel)) {
                        return interaction.editReply('Bu kanala mesaj gönderme iznim yok!');
                    }

                    // Ayarları güncelle
                    server.settings.welcomeChannel = channel.id;
                    server.settings.welcomeMessage = message;
                    server.settings.enableWelcome = true;
                    await server.save();

                    // Bot'un hafızasını güncelle
                    if (!interaction.client.welcomeSettings) {
                        interaction.client.welcomeSettings = new Map();
                    }
                    interaction.client.welcomeSettings.set(interaction.guild.id, {
                        channelId: channel.id,
                        message: message,
                        enabled: true
                    });

                    await interaction.editReply(`Hoş geldin mesajı ayarlandı!\nKanal: ${channel}\nMesaj: ${message}`);
                    break;
                }

                case 'test': {
                    if (!server.settings.enableWelcome || !server.settings.welcomeChannel || !server.settings.welcomeMessage) {
                        return interaction.editReply('Hoş geldin mesajı henüz ayarlanmamış!');
                    }

                    const channel = interaction.guild.channels.cache.get(server.settings.welcomeChannel);
                    if (!channel) {
                        return interaction.editReply('Ayarlanan kanal bulunamadı!');
                    }

                    const testMessage = server.settings.welcomeMessage
                        .replace('{user}', interaction.user.toString())
                        .replace('{server}', interaction.guild.name);

                    try {
                        await channel.send(testMessage);
                        await interaction.editReply('Test mesajı gönderildi!');
                    } catch (error) {
                        console.error('Test mesajı gönderme hatası:', error);
                        await interaction.editReply('Test mesajı gönderilemedi! Kanal izinlerini kontrol edin.');
                    }
                    break;
                }

                case 'disable': {
                    server.settings.enableWelcome = false;
                    await server.save();

                    if (interaction.client.welcomeSettings) {
                        const settings = interaction.client.welcomeSettings.get(interaction.guild.id);
                        if (settings) {
                            settings.enabled = false;
                            interaction.client.welcomeSettings.set(interaction.guild.id, settings);
                        }
                    }

                    await interaction.editReply('Hoş geldin mesajı devre dışı bırakıldı!');
                    break;
                }

                case 'status': {
                    if (!server.settings.enableWelcome || !server.settings.welcomeChannel || !server.settings.welcomeMessage) {
                        return interaction.editReply('Hoş geldin mesajı ayarlanmamış!');
                    }

                    const channel = interaction.guild.channels.cache.get(server.settings.welcomeChannel);
                    const statusMessage = [
                        '**Hoş Geldin Mesajı Ayarları**',
                        `Durum: ${server.settings.enableWelcome ? '✅ Aktif' : '❌ Devre Dışı'}`,
                        `Kanal: ${channel ? channel.toString() : 'Bulunamadı'}`,
                        `Mesaj: ${server.settings.welcomeMessage}`
                    ].join('\n');

                    await interaction.editReply(statusMessage);
                    break;
                }
            }
        } catch (error) {
            console.error('Welcome command error:', error);
            await interaction.editReply('Bir hata oluştu! Lütfen daha sonra tekrar deneyin.');
        }
    }
}; 