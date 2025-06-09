const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const emojiList = [
  '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Bir anket başlat')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Anket sorusu')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('options')
        .setDescription('Seçenekleri virgül ile ayır (en az 2, en fazla 10)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const optionsRaw = interaction.options.getString('options');
    const options = optionsRaw.split(',').map(opt => opt.trim()).filter(Boolean);

    if (options.length < 2 || options.length > 10) {
      return interaction.reply({ content: 'En az 2, en fazla 10 seçenek girmelisin.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🗳️ ' + question)
      .setDescription(
        options.map((opt, i) => `${emojiList[i]} ${opt}`).join('\n')
      )
      .setColor('#5865F2')
      .setFooter({ text: `Anket başlatan: ${interaction.user.tag}` })
      .setTimestamp();

    const pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(emojiList[i]);
    }
  }
}; 