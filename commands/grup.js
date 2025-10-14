import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("grup")
  .setDescription("Bir müzik grubunun tanıtımı, diskografisi ve bağlantıları (şimdilik: Echos)")
  .addStringOption(o =>
    o.setName("isim")
      .setDescription("Grup adı (şimdilik yalnızca Echos)")
      .setRequired(true)
  );

const PAGES = {
  INFO: "info",
  DISCO: "disco",
  LINKS: "links",
};

function buildButtons(active) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("grup:page:info")
        .setLabel("🔵 Dooze Hatıraları")
        .setStyle(active === PAGES.INFO ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("grup:page:disco")
        .setLabel("🎶 Müziğin Kalbi")
        .setStyle(active === PAGES.DISCO ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("grup:page:links")
        .setLabel("🟢 Stalk’la Beni")
        .setStyle(active === PAGES.LINKS ? ButtonStyle.Primary : ButtonStyle.Secondary),
    ),
  ];
}

function pageEmbed(page) {
  const base = new EmbedBuilder()
    .setColor(0xff69b4)
    .setFooter({ text: "Dooze • Recordooze Bot" })
    .setTimestamp();

  if (page === PAGES.INFO) {
    return base
      .setTitle("📖 Dooze Hatıraları — ECHOS")
      .setDescription(
        "Oyy… bu grup yok mu bu grup! 😍 **Echos**, Recordooze Studio x Records’un kuruluşuyla birlikte sahneye adım attı ve kısa sürede Los Santos’un en saygı duyulan rock ekiplerinden biri oldu. İlk günden beri ruhumun melodisini çalan bu üçlü; enerjileri, sahne duruşları ve hikâyeleriyle müzik sahnesinde *“biz buradayız”* dedirtti. Ve ben? Her konserlerinde sırılsıklam bir hayranım. 🥁🔥\n\n" +
        "### 👥 Üyeler\n" +
        "• 🥁 **Donna Moritz** — Vokal & Davul (lider ruh 💜)\n" +
        "• 🎸 **Aiden Reed** — Elektro Gitar (kabloları yakar!)\n" +
        "• 🎶 **Luke “Ozzy” Latham** — Bas Gitar (ritmi damarlarına işler!)\n\n" +
        "### 📜 Geçmiş\n" +
        "2024’te yayımladıkları *Teenage* ile sahneye adım atan grup, kısa sürede rock camiasında kendine sağlam bir yer edindi. Ardından gelen *Back to Bright* EP’si ve *Deadly* single’ı ile prestijlerini perçinlediler. Bugün hâlâ aktif üretimde ve sahnede fırtına gibi! ⚡️"
      )
      .setAuthor({ name: "📘 Sayfa 1 / 3 – Dooze’un ani defteri 💭" });
  }

  if (page === PAGES.DISCO) {
    return base
      .setTitle("🎶 Müziğin Kalbi — ECHOS Diskografi")
      .setDescription(
        "• 2024 – *Teenage* (Single)\n" +
        "• 2024 – *Back to Bright* (EP)\n" +
        "• 2024 – *Deadly* (Single)"
      )
      .setAuthor({ name: "📘 Sayfa 2 / 3 – Dooze’un ani defteri 💭" });
  }

  // LINKS
  return base
    .setTitle("🟢 Stalk’la Beni — ECHOS Bağlantılar")
    .setDescription(
      "📱🥁 [FaceBrowser - Echos](https://facebrowser-tr.gta.world/pages/weareEchos)\n" +
      "📱🥁 [FaceBrowser - Donna Moritz](https://facebrowser-tr.gta.world/DonDon)\n" +
      "📱 [FaceBrowser - Aiden Reed](https://facebrowser-tr.gta.world/aidenreed?ref=qs)\n" +
      "📱 [FaceBrowser - Luke \"Ozzy\" Latham](https://facebrowser-tr.gta.world/LOL?ref=qs)"
    )
    .setAuthor({ name: "📘 Sayfa 3 / 3 – Dooze’un ani defteri 💭" });
}

export async function execute(interaction) {
  const isim = interaction.options.getString("isim")?.trim().toLowerCase();
  if (isim !== "echos") {
    await interaction.reply({
      content:
        "🫠 *Dooze alıngan modda…* Şimdilik yalnızca **Echos** için bilgi verebiliyorum. Diğer grupları da yakında ekleyeceğim! 💜",
      ephemeral: false,
    });
    return;
  }

  await interaction.reply({
    content: "🤖 *Dooze düşünüyor…* ECHOS ansiklopedimi açıyorum!",
    embeds: [pageEmbed(PAGES.INFO)],
    components: buildButtons(PAGES.INFO),
    ephemeral: false,
  });
}

export async function handleComponent(interaction) {
  if (!interaction.isButton()) return false;
  const [ns, type, page] = interaction.customId.split(":");
  if (ns !== "grup" || type !== "page") return false;

  const target =
    page === "info" ? PAGES.INFO :
    page === "disco" ? PAGES.DISCO :
    PAGES.LINKS;

  await interaction.update({
    embeds: [pageEmbed(target)],
    components: buildButtons(target),
  });
  return true;
}
