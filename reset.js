// ===== reset.js =====
import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
const CLIENT_ID = process.env.CLIENT_ID;
const GUILDS = [process.env.GUILD_ID, process.env.PROD_GUILD_ID].filter(Boolean);

async function resetCommands() {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    console.log('✅ Global komutlar temizlendi.');

    for (const gid of GUILDS) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, gid), { body: [] });
      console.log(`✅ ${gid} için sunucu komutları temizlendi.`);
    }
    console.log('\n🎉 Tüm komutlar başarıyla sıfırlandı.');
    console.log('📌 Devam: node deploy-commands.js');
  } catch (err) {
    console.error('❌ Komut sıfırlama sırasında hata:', err);
  }
}

resetCommands();
