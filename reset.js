// ===== reset.js =====
// Bu dosya tüm slash komutlarını (global + guild) temizler.
// Kullanım: terminalde -> node reset.js

import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

async function resetCommands() {
  try {
    // 🌍 Global komutları sil
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    console.log('✅ Global komutlar temizlendi.');

    // 🏙️ Guild komutlarını sil (her iki sunucu için)
    const guilds = [process.env.GUILD_ID, process.env.PROD_GUILD_ID].filter(Boolean);
    for (const gid of guilds) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, gid), { body: [] });
      console.log(`✅ ${gid} için sunucu komutları temizlendi.`);
    }

    console.log('\n🎉 Tüm komutlar başarıyla sıfırlandı.');
    console.log('📌 Şimdi terminalde "node deploy-commands.js" ve ardından "node index.js" komutlarını çalıştır.');
  } catch (err) {
    console.error('❌ Komut sıfırlama sırasında hata oluştu:', err);
  }
}

resetCommands();
