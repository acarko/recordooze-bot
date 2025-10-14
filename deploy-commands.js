import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

const commands = [];
const addedNames = new Set(); // 👈 Tekrar kontrolü için eklendi
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  const cmd = command.data || command.default?.data;

  if (cmd) {
    if (addedNames.has(cmd.name)) {
      console.warn(`⚠️ Uyarı: '${cmd.name}' komutu zaten eklendi, ${file} atlanıyor.`);
      continue;
    }
    commands.push(cmd.toJSON());
    addedNames.add(cmd.name);
    console.log(`✅ Komut bulundu: ${cmd.name}`);
  } else {
    console.warn(`⚠️ Uyarı: ${file} içinde 'data' export'u yok, atlanıyor.`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
  console.log('🔁 Komutlar Discord\'a yükleniyor...');
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log('✅ Komutlar başarıyla yüklendi!');
} catch (error) {
  console.error('❌ Yükleme hatası:', error);
}
