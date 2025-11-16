import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

const TARGET_CHANNEL_ID = "1392979113681096714";

// Kullanıcı başına seçimleri tutar
const sessions = new Map(); // userId -> { group, artists[], prod, hour }

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
      { label: "SIM", value: "SIM" }
    );

  const artistMenu = new StringSelectMenuBuilder()
    .setCustomId("bugun:artist")
    .setPlaceholder("🎙️ Sanatçı seç (0-3 arası)")
    .setMinValues(0)
    .setMaxValues(3)
    .addOptions(
      { label: "Donna Moritz", value: "Donna Moritz" },
      { label: "Aiden Reed", value: "Aiden Reed" },
      { label: "Chuck Holloway", value: "Chuck Holloway" },
      { label: "Dylan Sutter", value: "Dylan Sutter" },
      { label: "Elias Reira", value: "Elias Reira" },
      { label: "Lilija Jakstiene", value: "Lilija Jakstiene" },
      { label: "Lucas Aldgride", value: "Lucas Aldgride" },
      { label: "Luke \"Ozzy\" Latham", value: "Luke \"Ozzy\" Latham" },
      { label: "Quenesha Brooks", value: "Quenesha Brooks" },
      { label: "Thomas Richardson", value: "Thomas Richardson" },
      { label: "Tiana Lipsey", value: "Tiana Lipsey" },
    );

  const prodMenu = new StringSelectMenuBuilder()
    .setCustomId("bugun:prod")
    .setPlaceholder("🎚️ Prodüktör / Tonmaister seç (opsiyonel)")
    .setMinValues(0)
    .setMaxValues(1)
    .addOptions(
      { label: "Donna Moritz", value: "Donna Moritz" },
      { label: "Aiden Reed", value: "Aiden Reed" },
      { label: "Chuck Holloway", value: "Chuck Holloway" }
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
export async function execute(interaction) {
  sessions.set(interaction.user.id, {
    group: null,
    artists: [],
    prod: null,
    hour: null,
  });

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
  const sess = sessions.get(uid) ?? { group: null, artists: [], prod: null, hour: null };

  // Seçimler
  if (interaction.isStringSelectMenu()) {
    if (key === "group") {
      sess.group = interaction.values[0] ?? null;
      sessions.set(uid, sess);
      await interaction.reply({ content: `🎤 Grup: **${sess.group ?? "Belirtilmedi"}**`, ephemeral: true });
      return true;
    }
    if (key === "artist") {
      sess.artists = interaction.values.length > 0 ? interaction.values : [];
      sessions.set(uid, sess);
      const artistList = sess.artists.length > 0 ? sess.artists.join("\n🎙️ ") : "Belirtilmedi";
      await interaction.reply({ content: `🎙️ Sanatçılar:\n🎙️ ${artistList}`, ephemeral: true });
      return true;
    }
    if (key === "prod") {
      sess.prod = interaction.values[0] ?? null;
      sessions.set(uid, sess);
      await interaction.reply({ content: `🎚️ Prod/Tonmaister: **${sess.prod ?? "Belirtilmedi"}**`, ephemeral: true });
      return true;
    }
    if (key === "hour") {
      sess.hour = interaction.values[0] ?? null;
      sessions.set(uid, sess);
      await interaction.reply({ content: `⏱️ Saat: **${sess.hour ?? "Belirtilmedi"}**`, ephemeral: true });
      return true;
    }
  }

  // Onay butonu
  if (interaction.isButton() && key === "confirm") {
    const final = sessions.get(uid);
    if (!final.hour) {
      await interaction.reply({ content: "❌ Saat seçmeden plan oluşturamazsın!", ephemeral: true });
      return true;
    }

    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle("📅 Bugünkü Stüdyo Planı")
      .setDescription("🧠 Dooze her şeyi organize etti! İşte bugünün planı 💜")
      .addFields(
        { name: "🎤 Grup", value: final.group ?? "Belirtilmedi", inline: true },
        { name: "🎙️ Sanatçılar", value: final.artists.length > 0 ? final.artists.join("\n") : "Belirtilmedi", inline: true },
        { name: "🎚️ Prod/Tonmaister", value: final.prod ?? "Belirtilmedi", inline: true },
        { name: "⏱️ Saat", value: final.hour ?? "Belirtilmedi", inline: true }
      )
      .setFooter({ text: "Dooze • Recordooze Bot" })
      .setTimestamp();

    await client.channels.cache.get(TARGET_CHANNEL_ID)?.send({ embeds: [embed] });

    await interaction.reply({
      content: "✅ Plan başarıyla gönderildi! 💜 Dooze yine harikalar yarattı.",
      ephemeral: true,
    });
    sessions.delete(uid);
    return true;
  }

  return false;
}
