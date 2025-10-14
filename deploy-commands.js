import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commands = [];

// commands klasöründeki tüm .js dosyalarını al
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔁 Komutlar Discord’a yükleniyor...');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log(`✅ ${commands.length} komut başarıyla yüklendi!`);
  } catch (error) {
    console.error('❌ Komut yüklenirken hata oluştu:', error);
  }
})();
