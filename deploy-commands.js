import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

const commands = [];

// Komut dosyalarını commands klasöründen oku
const commandsPath = path.resolve('./commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const commandModule = await import(`./commands/${file}`);

    // Hem "export const data" hem de "export default { data }" formatlarını destekle
    const cmdData = commandModule.data || commandModule.default?.data;
    if (cmdData) {
      commands.push(cmdData.toJSON());
      console.log(`✅ Komut yüklendi: ${cmdData.name}`);
    } else {
      console.warn(`⚠️ Komut yüklenemedi: ${file} (data bulunamadı)`);
    }
  }
} else {
  console.warn("⚠️ 'commands' klasörü bulunamadı. Komutlar yüklenmeyecek.");
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Slash komutlarını kaydet
(async () => {
  try {
    console.log(`🔁 ${commands.length} komut Discord’a yükleniyor...`);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Komutlar başarıyla yüklendi!');
  } catch (error) {
    console.error('❌ Komut yüklenirken hata oluştu:', error);
  }
})();
