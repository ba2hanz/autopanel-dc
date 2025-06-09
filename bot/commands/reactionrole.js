const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Bir mesaja emoji ile rol verme sistemi kur')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('Rol verilecek mesajın ID\'si')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Verilecek rol')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Kullanılacak emoji (örn: 😀 veya :custom_emoji:)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const messageId = interaction.options.getString('message_id');
    const role = interaction.options.getRole('role');
    const emoji = interaction.options.getString('emoji');
    const channel = interaction.channel;

    // Mesajı bul
    let message;
    try {
      message = await channel.messages.fetch(messageId);
    } catch (err) {
      return interaction.reply({ content: 'Mesaj bulunamadı. Lütfen doğru kanal ve mesaj ID\'si girin.', ephemeral: true });
    }

    // Emoji ekle
    try {
      await message.react(emoji);
    } catch (err) {
      return interaction.reply({ content: 'Emoji eklenemedi. Lütfen geçerli bir emoji girin.', ephemeral: true });
    }

    // Reaction event handler için veritabanı veya memory'de eşleşme kaydedilmeli (örnek: memory)
    if (!interaction.client.reactionRoles) interaction.client.reactionRoles = new Map();
    interaction.client.reactionRoles.set(`${message.id}-${emoji}`, role.id);

    await interaction.reply({ content: `Başarılı! ${emoji} emojisine tıklayanlara <@&${role.id}> rolü verilecek.`, ephemeral: true });
  }
}; 