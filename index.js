// ===== Recordooze Bot – Tam Dooze Asistanı (Final Sürüm) =====
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  EmbedBuilder,
  SlashCommandBuilder,
  Collection,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
} from 'discord.js';
import express from 'express';

/* -------------------- Client -------------------- */
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

/* -------------------- __dirname (ESM) -------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------- ENV / Ayarlar -------------------- */
const GUILD_IDS = [process.env.GUILD_ID, process.env.PROD_GUILD_ID].filter(Boolean);
const DEFAULT_CHANNEL_ID = (process.env.DEFAULT_CHANNEL_ID || '').trim();
const ALLOW_ROLE_IDS = (process.env.ALLOW_ROLE_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const MENTION_ROLE_ID = (process.env.MENTION_ROLE_ID || '').trim();

/* -------------------- Yardımcı Fonksiyonlar -------------------- */
function hasAllowedRole(interaction) {
  if (!ALLOW_ROLE_IDS.length) return true;
  const roles = interaction.member?.roles?.cache;
  if (!roles) return false;
  return ALLOW_ROLE_IDS.some((id) => roles.has(id));
}

function parseTRDateToYMD(tarihInput) {
  if (!tarihInput) return null;
  const first = tarihInput.split(/\s+/)[0].trim();
  const m = first.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);
  if (!m) return null;
  let d = parseInt(m[1], 10);
  let mo = parseInt(m[2], 10);
  let y = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const mm = String(mo).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return { y, mm, dd };
}

function normalizeSaat(hhmm) {
  if (!hhmm) return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function todayTR_YMD() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return { y: parseInt(get('year'), 10), mm: get('month'), dd: get('day') };
}

function buildTRDate(tarihInput, saatHHMM) {
  const hhmm = normalizeSaat(saatHHMM);
  if (!hhmm) return null;

  let y, mm, dd;
  const parsed = parseTRDateToYMD(tarihInput);
  if (parsed) ({ y, mm, dd } = parsed);
  else ({ y, mm, dd } = todayTR_YMD());

  const iso = `${y}-${mm}-${dd}T${hhmm}:00+03:00`;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  return date;
}

function bugununTarihiTR_Display() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    weekday: 'long',
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  const gun = get('day');
  const ay = get('month');
  const yil = get('year');
  const haftagun = get('weekday') || '';
  const haftagunCap = haftagun.charAt(0).toUpperCase() + haftagun.slice(1);
  return `${gun}.${ay}.${yil} / ${haftagunCap}`;
}

function buildLine(label, group, saatStr) {
  const groupText = group || 'Bos';
  const saatText = saatStr ? ` - ${saatStr}` : '';
  return `${label} --> ${groupText}${saatText}`;
}

function inferEventWord(name) {
  const s = (name || '').toLowerCase();
  if (s.includes('kayit') || s.includes('kayıt')) return 'kayıt seansi';
  if (s.includes('prova')) return 'provası';
  return 'etkinligi';
}

function buildProgramMessage({
  tarihDisplay,
  ust,
  alt,
  ustSaat,
  altSaat,
  ustProdMention,
  altProdMention,
  notStr,
}) {
  const header =
    '```ansi\n' +
    `Tarih : ${tarihDisplay}\n` +
    '```\n\n';

  const body =
    '```ansi\n' +
    `Ust Stüdyo ${buildLine('', ust, ustSaat)}\n` +
    `Alt Stüdyo ${buildLine('', alt, altSaat)}\n` +
    '```\n\n';

  const prodLines = [];
  if (ust && ustProdMention) prodLines.push(`• Ust Prod: ${ustProdMention}`);
  if (alt && altProdMention) prodLines.push(`• Alt Prod: ${altProdMention}`);
  const prodBlock = prodLines.length ? prodLines.join('\n') + '\n\n' : '';

  const note = '```ansi\n' + `Not : ${notStr || '—'}\n` + '```';

  return header + body + prodBlock + note;
}

/* -------------------- Hatırlatıcı -------------------- */
const memReminders = [];

function scheduleReminder({ eventDate, channelId, groupName }) {
  if (!eventDate) return false;
  const remindAt = new Date(eventDate.getTime() - 30 * 60 * 1000);
  const now = new Date();
  if (remindAt.getTime() <= now.getTime()) return false;

  const roleMention = MENTION_ROLE_ID ? `<@&${MENTION_ROLE_ID}>` : '@here';
  const eventWord = inferEventWord(groupName);
  const text =
    `📢 ${roleMention} – ${groupName} ${eventWord} 30 dakika sonra başlıyor!\n` +
    `Hazırlıklarınızı tamamlayın. 🎶`;

  memReminders.push({ whenMs: remindAt.getTime(), channelId, text });
  return true;
}

setInterval(async () => {
  const now = Date.now();
  const due = memReminders.filter((r) => r.whenMs <= now);
  if (!due.length) return;
  for (const r of due) {
    const i = memReminders.indexOf(r);
    if (i !== -1) memReminders.splice(i, 1);
    try {
      const ch = await client.channels.fetch(r.channelId).catch(() => null);
      if (!ch?.isTextBased()) continue;
      await ch.send({ content: r.text });
    } catch {}
  }
}, 15 * 1000);

/* -------------------- Komutlar Yükleme -------------------- */
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    if (command.default?.data && command.default?.execute) {
      client.commands.set(command.default.data.name, command.default);
    }
  }
}

/* -------------------- Slash Komutları Yükle -------------------- */
client.once('ready', async () => {
  console.log(`✅ Komut yuklendi: grup`);
  console.log(`✅ Komut yuklendi: kuyruk`);
  console.log(`✅ Komut yuklendi: oynat`);
  console.log(`🌐 Web sunucusu ayakta, Render portuna baglandi!`);
});

/* -------------------- /bugun – Dooze Asistanı Başlat -------------------- */
async function wizStart(interaction) {
  try {
    // Dooze havası: başlangıç mesajı
    await interaction.reply({
      content: "✨ *Dooze düşünüyor...* Bugünkü stüdyo planını hazırlamam için birkaç küçük büyü yapmam gerekiyor! 🪄",
      ephemeral: true,
    });

    // 1️⃣ Grup seçimi
    const groupSelect = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_group')
        .setPlaceholder('🎤 Hangi grup stüdyoyu kullanacak?')
        .addOptions([
          { label: 'Echos', value: 'Echos', description: 'Ana rock grubumuz 🎶' },
          { label: 'The Wound', value: 'The Wound', description: 'Karanlık sahnenin yıldızı 🖤' },
        ])
    );

    // 2️⃣ Sanatçı seçimi
    const artistSelect = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_artist')
        .setPlaceholder('🎤 Hangi sanatçı çalışacak?')
        .addOptions([
          { label: 'Tiana Lipsey', value: 'Tiana Lipsey' },
          { label: 'Quenesha Brooks', value: 'Quenesha Brooks' },
        ])
    );

    // 3️⃣ Prodüktör seçimi
    const prodSelect = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_prod')
        .setPlaceholder('🎚️ Prodüktör / Tonmaister seç')
        .addOptions([
          { label: 'Aiden Reed', value: 'Aiden Reed' },
          { label: 'Donna Moritz', value: 'Donna Moritz' },
          { label: 'Chuck Holloway', value: 'Chuck Holloway' },
        ])
    );

    // 4️⃣ Saat seçimi
    const saatSelect = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_time')
        .setPlaceholder('🕐 Başlangıç saatini seç')
        .addOptions([
          { label: '18:00', value: '18:00' },
          { label: '18:30', value: '18:30' },
          { label: '19:00', value: '19:00' },
          { label: '19:30', value: '19:30' },
          { label: '20:00', value: '20:00' },
          { label: '20:30', value: '20:30' },
          { label: '21:00', value: '21:00' },
          { label: '21:30', value: '21:30' },
          { label: '22:00', value: '22:00' },
          { label: '22:30', value: '22:30' },
          { label: '23:00', value: '23:00' },
          { label: '23:30', value: '23:30' },
          { label: '00:00', value: '00:00' },
          { label: '00:30', value: '00:30' },
          { label: '01:00', value: '01:00' },
          { label: '01:30', value: '01:30' },
          { label: '02:00', value: '02:00' },
        ])
    );

    // Dooze panelini gönder
    await interaction.followUp({
      content: "📅 *Tamam! Şimdi büyü kitabım açık...* Sadece aşağıdaki adımları tamamla 👇",
      components: [groupSelect, artistSelect, prodSelect, saatSelect],
      ephemeral: true,
    });
  } catch (err) {
    console.error("❌ Dooze Sihirbazı Başlatılamadı:", err);
  }
}

/* -------------------- Interaction Listener -------------------- */
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(interaction, client);
      return;
    }

    // 📅 /bugun menüsü için seçim kontrolü
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;
      const value = interaction.values[0];

      // Kullanıcı seçimlerini session gibi sakla
      if (!interaction.client.session) interaction.client.session = {};
      const session = interaction.client.session;
      const userId = interaction.user.id;
      if (!session[userId]) session[userId] = {};

      // Menü türüne göre kaydet
      if (customId === 'select_group') {
        session[userId].group = value;
        await interaction.reply({ content: `🎤 Grup seçildi: **${value}**`, ephemeral: true });
      } else if (customId === 'select_artist') {
        session[userId].artist = value;
        await interaction.reply({ content: `🎶 Sanatçı seçildi: **${value}**`, ephemeral: true });
      } else if (customId === 'select_prod') {
        session[userId].prod = value;
        await interaction.reply({ content: `🎚️ Prodüktör: **${value}**`, ephemeral: true });
      } else if (customId === 'select_time') {
        session[userId].time = value;
        await interaction.reply({ content: `🕐 Saat: **${value}** olarak ayarlandı.`, ephemeral: true });

        // ✅ Tüm seçimler tamamlandığında özet gönder
        const plan = session[userId];
        if (plan.group && plan.artist && plan.prod && plan.time) {
          const embed = new EmbedBuilder()
            .setColor(0xff69b4)
            .setTitle('📜 Dooze Günlük Stüdyo Planı')
            .setDescription(
              `✨ *Dooze kaydetti!* İşte bugünkü planın özeti:\n\n` +
              `🎤 **Grup:** ${plan.group}\n` +
              `🎶 **Sanatçı:** ${plan.artist}\n` +
              `🎚️ **Prodüktör:** ${plan.prod}\n` +
              `🕐 **Saat:** ${plan.time}\n\n` +
              `📡 *Plan kaydedildi, hatırlatma 30 dakika önce yapılacak!*`
            )
            .setFooter({ text: "💾 Recordooze Studio Assistant – Dooze" })
            .setTimestamp();

          await interaction.followUp({ embeds: [embed], ephemeral: false });

          // Planı JSON dosyasına kaydet
          const dataFile = path.join(__dirname, 'data.json');
          let data = {};
          if (fs.existsSync(dataFile)) {
            try {
              data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
            } catch {
              data = {};
            }
          }
          if (!data.sessions) data.sessions = [];
          data.sessions.push({
            date: new Date().toISOString(),
            user: interaction.user.username,
            group: plan.group,
            artist: plan.artist,
            prod: plan.prod,
            time: plan.time,
          });
          fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');

          // Temizle
          delete session[userId];
        }
      }
    }
  } catch (err) {
    console.error('❌ Interaction Hatası:', err);
  }
});

/* -------------------- Express Sunucusu -------------------- */
const app = express();
app.get('/', (req, res) => res.send('✅ Recordooze Bot aktif!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Web sunucusu ayakta: http://localhost:${PORT}`));

/* -------------------- Slash Komut Dinleyici -------------------- */
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const { commandName } = interaction;

    // /bugun komutu → Dooze Asistanı başlat
    if (commandName === 'bugun') {
      if (!hasAllowedRole(interaction)) {
        return interaction.reply({
          content: '🚫 Bu komutu kullanma yetkin yok dostum. Belki kayıt odasına kahve götürebilirsin ☕️',
          ephemeral: true,
        });
      }
      await wizStart(interaction);
      return;
    }

    // Diğer komutları çalıştır
    const command = client.commands.get(commandName);
    if (command) await command.execute(interaction, client);
  } catch (err) {
    console.error('❌ Interaction Hatası:', err);

    // ✅ 40060 hatasına karşı güvenli hata cevabı
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Bir hata oluştu.', ephemeral: true });
      } else {
        console.warn('⚠️ Interaction zaten yanıtlandı, ikinci cevap gönderilmedi.');
      }
    } catch (e) {
      console.error('⚠️ Hata cevabı da gönderilemedi:', e);
    }
  }
});

/* -------------------- Botu Başlat -------------------- */
client.login(process.env.TOKEN);
