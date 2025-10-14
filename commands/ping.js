import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Dooze’un nabzını kontrol eder 🧠✨');

export async function execute(interaction) {
  await interaction.reply({ content: '📡 Dooze burada! 💜', ephemeral: true });
}
