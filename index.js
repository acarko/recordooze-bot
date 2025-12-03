import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
} from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
const componentHandlers = [];

// ---- commands/ klasöründen yükle
const commandsPath = path.join(process.cwd(), "commands");
if (!fs.existsSync(commandsPath)) {
  console.error("❌ commands/ klasörü bulunamadı.");
  process.exit(1);
}
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const mod = await import(`file://${path.join(commandsPath, file)}`);

  const data = mod.data ?? mod.default?.data;
  const execute = mod.execute ?? mod.default?.execute;
  const handleComponent = mod.handleComponent ?? mod.default?.handleComponent;

  if (data && execute) {
    client.commands.set(data.name, { execute, name: data.name });
    console.log(`✅ Komut yüklendi: ${data.name}`);
  } else {
    console.warn(`⚠️ ${file} komut formatı eksik (data/execute).`);
  }
  if (typeof handleComponent === "function") {
    componentHandlers.push(handleComponent);
  }
}

// ---- interaction router
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      console.log(`📡 Komut çalıştırılıyor: /${interaction.commandName}`);
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      await cmd.execute(interaction, client);
      return;
    }

    if (
      interaction.isStringSelectMenu() ||
      interaction.isButton() ||
      interaction.isModalSubmit()
    ) {
      for (const handler of componentHandlers) {
        try {
          const handled = await handler(interaction, client);
          if (handled) return;
        } catch (e) {
          console.error("❌ Component handler hatası:", e);
        }
      }
    }
  } catch (err) {
    console.error("❌ Interaction hatası:", err);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Bir hata oluştu.", ephemeral: true });
      }
    } catch {}
  }
});

client.once(Events.ClientReady, () => {
  console.log("🤖 Bot aktif ve bağlı.");
});

// ---- KEEP-ALIVE (HEAD fixli)
const app = express();

// HEAD isteğine ultra hızlı cevap (UptimeRobot FREE için şart)
app.head("/", (req, res) => {
  res.status(200).end();
});

// GET isteği olursa eski mesajı döndürelim
app.get("/", (_, res) =>
  res.send("Recordooze Bot çalışıyor. (Dooze buradaydı 💜)")
);

app.listen(process.env.PORT || 3000, () =>
  console.log(`🌐 Web sunucusu ayakta: http://localhost:${process.env.PORT || 3000}`)
);

// ---- login
client.login(process.env.TOKEN);
