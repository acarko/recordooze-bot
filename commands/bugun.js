import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

// Planın gönderileceği kanal
const TARGET_CHANNEL_ID = "1392979113681096714";

// Kullanıcı başına seçimleri tutar
const sessions = new Map(); // userId -> { group, artist, prod, hour }

export const data = new SlashCommandBuilder()
  .setName("bugun")
  .setDescription("📅 Dooze Asistanı ile bugünkü kayıt/prova planını oluştur!");

// ---- UI parçaları
function buildMenus() {
  const groupMenu = new StringSelectMenuBuilder()
    .setCustomId("bugun:group")
    .setPlaceholder("🎤 Grup seç (opsiyonel)")
    .setMinValues(0)
    .setMaxValues(1)
    .addOptions(
      { label: "Echos", value: "Echos" },
      { label: "The Wound", value: "The Wound" },
    );

  const artistMenu = new StringSelectMenuBuilder()
    .setCustomId("bugun:artist")
    .setPlaceholder("🎙️ Sanatçı seç (opsiyonel)")
    .setMinValues(0)
    .setMaxValues(1)
    .addOptions(
      { label: "Donna Moritz", value: "Donna Moritz" },
      { label: "Aiden Reed", value: "Aiden Reed" },
      { label: "Chuck Holloway", value: "Chuck Holloway" },
      { label: "Dylan Sutter", value: "Dylan Sutter" },
      { label: "Elias Reira", value: "Elias Reira" },
      { label: "Lucas Aldgride", value: "Lucas Aldgride" },
      { label: "Luke \"Ozzy\" Latham", value: "Luke \"Ozzy\" Latham" },
      { label: "Quenesha Brooks", value: "Quenesha Brooks" },
      { label: "Thomas Richardson", value: "Thomas Richardson" },
      { label: "Tiana Lipsey", value: "Tiana Lipsey" },
    );

  const prodMenu = new StringSelectMenuBuilder()
    .setCustomId("bugun:prod")
    .setPlaceholder("🎚️ Prodüktör / Tonmaister seç (zorunlu)")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      { label: "Donna Moritz", value: "Donna Moritz" },
      { label: "Aiden Reed", value: "Aiden Reed" },
      { label: "Chuck Holloway", value: "Chuck Holloway" },
    );

  const hours = [
    "18:00","18:30","19:00","19:30","20:00","20:30",
    "21:00","21:30","22:00","22:30","23:00","23:30",
    "00:00","00:30","01:00","01:30","02:00",
  ];
  const hourMenu = new StringSelectMenuBuilder()
    .setCustomId("bugun:hour")
    .setPlaceholder("⏱️ Saat seç (zorunlu)")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(hours.map(h => ({ label: h, value: h })));

  const confirmBtn = new ButtonBuilder()
    .setCustomId("bugun:confirm")
    .setLabel("🧠 Dooze’a Bildir!")
    .setStyle(ButtonStyle.Success);

  return {
    rows: [
      new ActionRowBuilder().addComponents(groupMenu),
      new ActionRowBuilder().addComponents(artistMenu),
      new ActionRowBuilder().addComponents(prodMenu),
      new ActionRowBuilder().addComponents(hourMenu),
      new ActionRowBuilder().addComponents(confirmBtn),
    ],
  };
}

// ---- Komut çalıştır
export async function execute(interaction/*, client*/) {
  // kullanıcı için boş oturum başlat
  sessions.set(interaction.user.id, { group: null, artist: null, prod: null, hour: null });

  await interaction.reply({
    content: "🤖 Dooze düşünüyor... Plan sihrini başlatalım! 💫",
    ephemeral: true,
  });

  const { rows } = buildMenus();
  await interaction.followUp({
    content: "✨ Aşağıdan seçimlerini yap ve bugünkü stüdyo planını oluştur 🧠💜",
    components: rows,
    ephemeral: true,
  });
}

// ---- Bileşen işlemleri
export async function handleComponent(interaction, client) {
  if (!(interaction.isStringSelectMenu() || interaction.isButton())) return false;

  const [ns, key] = interaction.customId.split(":");
  if (ns !== "bugun") return false;

  const uid = interaction.user.id;
  const sess = sessions.get(uid) ?? { group: null, artist: null, prod: null, hour: null };

  // Seçimler
  if (interaction.isStringSelectMenu()) {
    if (key === "group") {
      sess.group = interaction.values[0] ?? null;
      sessions.set(uid, sess);
      await interaction.reply({ content: `🎤 Grup: **${sess.group ?? "—"}**`, ephemeral: true });
      return true;
    }
    if (key === "artist") {
      sess.artist = interaction.values[0] ?? null;
      sessions.set(uid, sess);
      await interaction.reply({ content: `🎙️ Sanatçı: **${sess.artist ?? "—"}**`, ephemeral: true });
      return true;
    }
    if (key === "prod") {
      sess.prod = interaction.values[0] ?? null;
      sessions.set(uid, sess);
      await interaction.reply({ content: `🎚️ Prod/Tonmaister: **${sess.prod}**`, ephemeral: true });
      return true;
    }
    if (key === "hour") {
      sess.hour = interaction.values[0] ?? null;
      sessions.set(uid, sess);
      await interaction.reply({ content: `⏱️ Saat: **${sess.hour}**`, ephemeral: true });
      return true;
    }
  }

  // Onay
  if (interaction.isButton() && key === "confirm") {
    // Zorunlu alanlar kontrolü
    if (!sess.prod || !sess.hour) {
      await interaction.reply({
        content: "❌ Prodüktör ve saat seçimi zorunludur.",
        ephemeral: true,
      });
      return true;
    }

    // Embed alanlarını dinamik kur (opsiyoneller boşsa ekleme)
    const fields = [];
    if (sess.group)  fields.push({ name: "🎤 Grup", value: sess.group, inline: true });
    if (sess.artist) fields.push({ name: "🎙️ Sanatçı", value: sess.artist, inline: true });
    fields.push({ name: "🎚️ Prodüktör", value: sess.prod, inline: true });
    fields.push({ name: "⏱️ Saat", value: sess.hour, inline: true });

    const embed = new EmbedBuilder()
      .setColor(0x9146ff)
      .setTitle("🎉 Dooze Diyor ki: Stüdyo Sizi Bekliyor!")
      .setDescription("Hmm… bakıyorum da stüdyoda işler kızışıyor 😳✨ Planı senin için hazırladım!")
      .addFields(fields)
      .setFooter({ text: "💜 Dooze Assistant" })
      .setTimestamp();

    try {
      const target = await client.channels.fetch(TARGET_CHANNEL_ID);
      if (!target || !target.send) throw new Error("Hedef kanal bulunamadı veya mesaj gönderilemiyor.");

      await target.send({ embeds: [embed] });
      await interaction.reply({ content: "✅ Plan hedef kanala gönderildi! 📡", ephemeral: true });
    } catch (err) {
      console.error("Plan gönderim hatası:", err);
      await interaction.reply({
        content: "❌ Plan hedef kanala gönderilemedi. Kanal ID’sini ve izinleri kontrol et.",
        ephemeral: true,
      });
    } finally {
      sessions.delete(uid); // oturumu temizle
    }

    return true;
  }

  return false;
}
