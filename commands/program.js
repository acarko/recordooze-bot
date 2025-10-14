import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('program')
  .setDescription('📅 Belirli bir tarihe kayıt/prova programı oluşturur.')
  .addStringOption(o =>
    o.setName('tarih').setDescription('YYYY-MM-DD').setRequired(true)
  )
  .addStringOption(o =>
    o.setName('aciklama').setDescription('Kısa not').setRequired(false)
  );

export async function execute(interaction) {
  const tarih = interaction.options.getString('tarih');
  const aciklama = interaction.options.getString('aciklama') || '—';
  await interaction.reply({
    content: `🗓️ **${tarih}** için not alındı.\n📝 ${aciklama}`,
    ephemeral: true,
  });
}
