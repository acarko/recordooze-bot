// ===== Recordooze Bot v5 – Final (Ephemeral ayrımı + ayrı saat/mention + sabit kanal + hatırlatıcı) =====
import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
} from 'discord.js';

/* -------------------- Client -------------------- */
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

/* -------------------- ENV / Ayarlar -------------------- */
const GUILD_IDS = [process.env.GUILD_ID, process.env.PROD_GUILD_ID].filter(Boolean);
const DEFAULT_CHANNEL_ID = process.env.DEFAULT_CHANNEL_ID?.trim();
const ALLOW_ROLE_IDS = (process.env.ALLOW_ROLE_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const MENTION_ROLE_ID = (process.env.MENTION_ROLE_ID?.trim()) || '1334286012217819248'; // hatırlatıcı mention

if (!DEFAULT_CHANNEL_ID) {
  console.warn('⚠️ DEFAULT_CHANNEL_ID .env içinde tanımlı değil. Fallback: komutun yazıldığı kanal.');
}

/* -------------------- Yardımcılar -------------------- */
function hasAllowedRole(interaction) {
  if (!ALLOW_ROLE_IDS.length) return true; // kısıt yoksa herkes
  const roles = interaction.member?.roles?.cache;
  if (!roles) return false;
  return ALLOW_ROLE_IDS.some((id) => roles.has(id));
}

// "12.10.25 / Pazar" → { y, mm, dd }
function parseTRDateToYMD(tarihInput) {
  if (!tarihInput) return null;
  const firstPart = tarihInput.split(/\s+/)[0].trim();
  const m = firstPart.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);
  if (!m) return null;
  let d = parseInt(m[1], 10);
  let mo = parseInt(m[2], 10);
  let y = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const mm = String(mo).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return { y, mm, dd };
}

// "23:00" doğrula
function normalizeSaat(hhmm) {
  if (!hhmm) return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10),
    min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// Bugünün TR y-m-d
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

// TR datetime oluştur (tarih yoksa bugün)
function buildTRDate(tarihInput, saatHHMM) {
  const hhmm = normalizeSaat(saatHHMM);
  if (!hhmm) return null;

  let y, mm, dd;
  const parsed = parseTRDateToYMD(tarihInput);
  if (parsed) ({ y, mm, dd } = parsed);
  else ({ y, mm, dd } = todayTR_YMD());

  const iso = `${y}-${mm}-${dd}T${hhmm}:00+03:00`; // Türkiye sabit UTC+3
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  return date;
}

// "gg.aa.yy / Haftagünü" gösterimi
function bugununTarihiTR_Display() {
  const now = new Date();
  const tr = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    weekday: 'long',
  }).formatToParts(now);

  const get = (t) => tr.find((p) => p.type === t)?.value ?? '';
  const gun = get('day');
  const ay = get('month');
  const yil = get('year');
  const haftagun = get('weekday');
  const haftagunCap =
    haftagun?.charAt(0).toUpperCase() + haftagun?.slice(1) || '';

  return `${gun}.${ay}.${yil} / ${haftagunCap}`;
}

// Üst/alt satırı (ANSI kod bloğu için)
function buildLine(label, group, saatStr) {
  const groupText = group || 'Boş';
  const saatText = saatStr ? ` - ${saatStr}` : '';
  // grup varsa mor, yoksa sarı
  return `${label} --> ${group ? '\u001b[2;35m' : '\u001b[2;33m'}${groupText}\u001b[0m${saatText}`;
}

// Etkinlik kelimesi
function inferEventWord(name) {
  const s = (name || '').toLowerCase();
  if (s.includes('kayıt')) return 'kayıt seansı';
  if (s.includes('prova')) return 'provası';
  return 'etkinliği';
}

// Program mesajı (ANSI + mention satırları kod bloğu DIŞINDA)
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
    `\u001b[2;36mTarih :\u001b[0m \u001b[2;34m${tarihDisplay}\u001b[0m\n` +
    '```\n\n';

  const body =
    '```ansi\n' +
    `\u001b[2;36mÜst Stüdyo\u001b[0m ${buildLine('', ust, ustSaat)}\n` +
    `\u001b[2;36mAlt Stüdyo\u001b[0m ${buildLine('', alt, altSaat)}\n` +
    '```\n\n';

  // Mention’ları KOD BLOĞU DIŞINDA yazalım ki ping atsın
  const prodLines = [];
  if (ust && ustProdMention) prodLines.push(`• Üst Prod: ${ustProdMention}`);
  if (alt && altProdMention) prodLines.push(`• Alt Prod: ${altProdMention}`);
  const prodBlock = prodLines.length ? prodLines.join('\n') + '\n\n' : '';

  const note =
    '```ansi\n' + `\u001b[2;37mNot :\u001b[0m ${notStr || '—'}\n` + '```';

  return header + body + prodBlock + note;
}

/* -------------------- Hatırlatıcı -------------------- */
// In-memory (restart olursa sıfırlanır)
const reminders = []; // { whenMs, channelId, text }

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

  reminders.push({ whenMs: remindAt.getTime(), channelId, text });
  return true;
}

setInterval(async () => {
  const now = Date.now();
  const due = reminders.filter((r) => r.whenMs <= now);
  if (!due.length) return;

  for (const r of due) {
    const i = reminders.indexOf(r);
    if (i !== -1) reminders.splice(i, 1);
    try {
      const ch = await client.channels.fetch(r.channelId).catch(() => null);
      if (!ch?.isTextBased()) continue;
      await ch.send({ content: r.text });
    } catch {}
  }
}, 15 * 1000);

/* -------------------- Slash Komutları -------------------- */
const cmdPing = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Botun çalışıp çalışmadığını test eder.');

const cmdHowto = new SlashCommandBuilder()
  .setName('howto')
  .setDescription('Kullanım rehberini (embed) gösterir.');

const cmdProgram = new SlashCommandBuilder()
  .setName('program')
  .setDescription('Belirtilen tarih için program paylaşır (üst/alt opsiyonel, ayrı saat & prod).')
  .addStringOption((o) =>
    o.setName('tarih').setDescription('Tarih (örn: 12.10.25 / Pazar)').setRequired(false),
  )
  .addStringOption((o) =>
    o.setName('ust').setDescription('Üst stüdyo grup/etkinlik').setRequired(false),
  )
  .addStringOption((o) =>
    o.setName('ust_saat').setDescription('Üst saat (HH:MM)').setRequired(false),
  )
  .addUserOption((o) =>
    o.setName('ust_prod').setDescription('Üst prodüktör (kullanıcı seç)').setRequired(false),
  )
  .addStringOption((o) =>
    o.setName('alt').setDescription('Alt stüdyo grup/etkinlik').setRequired(false),
  )
  .addStringOption((o) =>
    o.setName('alt_saat').setDescription('Alt saat (HH:MM)').setRequired(false),
  )
  .addUserOption((o) =>
    o.setName('alt_prod').setDescription('Alt prodüktör (kullanıcı seç)').setRequired(false),
  )
  .addStringOption((o) =>
    o.setName('not').setDescription('Not (opsiyonel)').setRequired(false),
  );

const cmdBugun = new SlashCommandBuilder()
  .setName('bugun')
  .setDescription('Bugün için program paylaşır (üst/alt opsiyonel, ayrı saat & prod).')
  .addStringOption((o) =>
    o.setName('ust').setDescription('Üst stüdyo grup/etkinlik').setRequired(false),
  )
  .addStringOption((o) =>
    o.setName('ust_saat').setDescription('Üst saat (HH:MM)').setRequired(false),
  )
  .addUserOption((o) =>
    o.setName('ust_prod').setDescription('Üst prodüktör (kullanıcı seç)').setRequired(false),
  )
  .addStringOption((o) =>
    o.setName('alt').setDescription('Alt stüdyo grup/etkinlik').setRequired(false),
  )
  .addStringOption((o) =>
    o.setName('alt_saat').setDescription('Alt saat (HH:MM)').setRequired(false),
  )
  .addUserOption((o) =>
    o.setName('alt_prod').setDescription('Alt prodüktör (kullanıcı seç)').setRequired(false),
  )
  .addStringOption((o) =>
    o.setName('not').setDescription('Not (opsiyonel)').setRequired(false),
  );

/* -------------------- Komut Kayıt (Sadece Guild) -------------------- */
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    for (const gid of GUILD_IDS) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, gid),
        { body: [cmdPing, cmdHowto, cmdProgram, cmdBugun].map((c) => c.toJSON()) },
      );
      console.log(`✅ Komutlar yüklendi: ${gid}`);
    }
  } catch (err) {
    console.error('❌ Komut yükleme hatası:', err);
  }
})();

/* -------------------- Olaylar -------------------- */
client.once('ready', () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    // Rol kontrolü
    if (!hasAllowedRole(interaction)) {
      // Herkese açık yanıt
      return interaction.reply({ content: '⛔ Bu komutu kullanma yetkin yok.' });
    }

    // Hedef kanal (sabit → yoksa komut kanalı)
    let targetChannel = null;
    try {
      if (DEFAULT_CHANNEL_ID) targetChannel = await client.channels.fetch(DEFAULT_CHANNEL_ID);
    } catch {}
    if (!targetChannel?.isTextBased()) targetChannel = interaction.channel;

    /* /ping – herkese açık */
    if (interaction.commandName === 'ping') {
      // hızlı yanıt
      return interaction.reply({ content: '✅ Bot çalışıyor!' });
    }

    /* /howto – herkese açık embed */
    if (interaction.commandName === 'howto') {
      const emb = new EmbedBuilder()
        .setColor(0x2b6cb0)
        .setTitle('📘 Recordooze Bot – Kullanım Rehberi')
        .setDescription([
          '🔧 **/ping** – Botun durumunu test eder (herkese açık).',
          '📅 **/bugun** – Bugün için program paylaşır (ephemeral).',
          '🗓️ **/program** – Belirtilen tarih için program paylaşır (ephemeral).',
          '',
          '👑 **Rol Kontrolü:** Sadece yetkili roller komut çalıştırabilir.',
          '🔔 **Hatırlatıcı:** Üst/alt için ayrı ayrı **30 dk önce** otomatik bildirim.',
          '📢 **Hatırlatma Formatı:**',
          '`📢 @<rol> – <Grup> provası/kayıt seansı 30 dakika sonra başlıyor!`',
          '`Hazırlıklarınızı tamamlayın. 🎶`',
          '',
          '🧭 **Mesajlar:** Her zaman sabit kanala gönderilir (DEFAULT_CHANNEL_ID).',
        ].join('\n'))
        .addFields(
          {
            name: '📅 /bugun',
            value: [
              '**Parametreler (opsiyonel):**',
              '• `ust`, `ust_saat (HH:MM)`, `ust_prod (kullanıcı)`',
              '• `alt`, `alt_saat (HH:MM)`, `alt_prod (kullanıcı)`',
              '• `not`',
              '⏰ Saat verilirse 30 dk önce hatırlatıcı kurulur (üst/alt ayrı).',
            ].join('\n'),
          },
          {
            name: '🗓️ /program',
            value: [
              '**Parametreler (opsiyonel):**',
              '• `tarih` – `gg.aa.yy / Haftagünü` (boşsa bugün)',
              '• `ust`, `ust_saat (HH:MM)`, `ust_prod (kullanıcı)`',
              '• `alt`, `alt_saat (HH:MM)`, `alt_prod (kullanıcı)`',
              '• `not`',
            ].join('\n'),
          },
          {
            name: 'ℹ️ Notlar',
            value: [
              '• Üst/alt tamamen opsiyonel; sadece biri doldurulabilir.',
              '• Saat `HH:MM` biçiminde olmalı (örn: 23:00).',
              '• 30 dk’tan az kalmışsa hatırlatıcı kurulmaz.',
              '• `/bugun` ve `/program` yanıtları **ephemeral** (sadece kullanan görür).',
            ].join('\n'),
          },
        )
        .setFooter({ text: 'Recordooze • stüdyo asistanı' });

      return interaction.reply({ embeds: [emb] });
    }

    /* /program – ephemeral */
    if (interaction.commandName === 'program') {
      await interaction.deferReply({ ephemeral: true }); // zaman aşımı önle

      const tarihInput = interaction.options.getString('tarih');

      const ust = interaction.options.getString('ust') || '';
      const ustSaat = interaction.options.getString('ust_saat') || '';
      const ustProd = interaction.options.getUser('ust_prod');
      const ustProdMention = ustProd ? `<@${ustProd.id}>` : '';

      const alt = interaction.options.getString('alt') || '';
      const altSaat = interaction.options.getString('alt_saat') || '';
      const altProd = interaction.options.getUser('alt_prod');
      const altProdMention = altProd ? `<@${altProd.id}>` : '';

      const notStr = interaction.options.getString('not') || '—';

      if (!ust && !alt) {
        return interaction.editReply({
          content: '❌ En az **üst** veya **alt** için bir bilgi girmelisin (isim/saat).',
        });
      }

      const tarihDisplay = tarihInput?.trim() || bugununTarihiTR_Display();

      const ustDate = ustSaat ? buildTRDate(tarihInput, ustSaat) : null;
      const altDate = altSaat ? buildTRDate(tarihInput, altSaat) : null;

      const content = buildProgramMessage({
        tarihDisplay,
        ust,
        alt,
        ustSaat,
        altSaat,
        ustProdMention,
        altProdMention,
        notStr,
      });

      const sent =
        (await targetChannel.send({ content }).catch(() => null)) ||
        (await interaction.channel.send({ content }));

      const sUst = ust && ustDate
        ? scheduleReminder({
            eventDate: ustDate,
            channelId: sent.channelId,
            groupName: ust,
          })
        : false;

      const sAlt = alt && altDate
        ? scheduleReminder({
            eventDate: altDate,
            channelId: sent.channelId,
            groupName: alt,
          })
        : false;

      const status = [];
      if (ust)
        status.push(
          `Üst: ${
            sUst ? '⏰ kuruldu' : ustSaat ? '⏰ kurulmadı (<30dk)' : '⏰ saat yok'
          }`,
        );
      if (alt)
        status.push(
          `Alt: ${
            sAlt ? '⏰ kuruldu' : altSaat ? '⏰ kurulmadı (<30dk)' : '⏰ saat yok'
          }`,
        );

      return interaction.editReply({
        content: `✅ Program paylaşıldı. ${status.join(' • ') || ''}`,
      });
    }

    /* /bugun – ephemeral */
    if (interaction.commandName === 'bugun') {
      await interaction.deferReply({ ephemeral: true }); // zaman aşımı önle

      const ust = interaction.options.getString('ust') || '';
      const ustSaat = interaction.options.getString('ust_saat') || '';
      const ustProd = interaction.options.getUser('ust_prod');
      const ustProdMention = ustProd ? `<@${ustProd.id}>` : '';

      const alt = interaction.options.getString('alt') || '';
      const altSaat = interaction.options.getString('alt_saat') || '';
      const altProd = interaction.options.getUser('alt_prod');
      const altProdMention = altProd ? `<@${altProd.id}>` : '';

      const notStr = interaction.options.getString('not') || '—';

      if (!ust && !alt) {
        return interaction.editReply({
          content: '❌ En az **üst** veya **alt** için bir bilgi girmelisin (isim/saat).',
        });
      }

      const tarihDisplay = bugununTarihiTR_Display();

      const ustDate = ustSaat ? buildTRDate(null, ustSaat) : null;
      const altDate = altSaat ? buildTRDate(null, altSaat) : null;

      const content = buildProgramMessage({
        tarihDisplay,
        ust,
        alt,
        ustSaat,
        altSaat,
        ustProdMention,
        altProdMention,
        notStr,
      });

      const sent =
        (await targetChannel.send({ content }).catch(() => null)) ||
        (await interaction.channel.send({ content }));

      const sUst = ust && ustDate
        ? scheduleReminder({
            eventDate: ustDate,
            channelId: sent.channelId,
            groupName: ust,
          })
        : false;

      const sAlt = alt && altDate
        ? scheduleReminder({
            eventDate: altDate,
            channelId: sent.channelId,
            groupName: alt,
          })
        : false;

      const status = [];
      if (ust)
        status.push(
          `Üst: ${
            sUst ? '⏰ kuruldu' : ustSaat ? '⏰ kurulmadı (<30dk)' : '⏰ saat yok'
          }`,
        );
      if (alt)
        status.push(
          `Alt: ${
            sAlt ? '⏰ kuruldu' : altSaat ? '⏰ kurulmadı (<30dk)' : '⏰ saat yok'
          }`,
        );

      return interaction.editReply({
        content: `✅ Bugünün programı paylaşıldı. ${status.join(' • ') || ''}`,
      });
    }
  } catch (err) {
    console.error('❌ Komut çalıştırma hatası:', err);
    if (interaction.isRepliable()) {
      try {
        await interaction.reply({
          content: '❌ Bir hata oluştu. Lütfen tekrar deneyin.',
        });
      } catch {}
    }
  }
});

/* -------------------- Login -------------------- */
client.login(process.env.DISCORD_TOKEN);

import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("✅ Recordooze Bot aktif ve çalışıyor!");
});

app.listen(3000, () => {
  console.log("🌐 Web sunucusu ayakta, Render portuna bağlandı!");
});

