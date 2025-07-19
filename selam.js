import { Client, GatewayIntentBits, Partials, Collection, Events, EmbedBuilder } from "discord.js";
import path from "path";
import { fileURLToPath } from "url";
import { SimpleDB } from "./SimleDB.js";
import fs from "fs";
import { joinVoiceChannel } from "@discordjs/voice";
import config from "./config.json" assert { type: "json" };
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message],
});

const ayarDB = new SimpleDB(path.join(__dirname, "metusbase", "ayarlar.json"));
const kayitDB = new SimpleDB(path.join(__dirname, "metusbase", "kayitlar.json"));

client.commands = new Collection();
client.events = new Collection();

const commandsPath = path.join(__dirname, "commands");
const eventsPath = path.join(__dirname, "events");

const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  client.commands.set(command.default.name, command.default);
}

const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = await import(`file://${filePath}`);
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args, { ayarDB, kayitDB, config }));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args, { ayarDB, kayitDB, config }));
  }
}
client.once(Events.ClientReady, async () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);

  
  const embed = new EmbedBuilder()
    .setTitle("🔹 Bot Aktif!")
    .setDescription(
      "```ansi\n" +
      "\x1b[2;31m\x1b[2;36mBot Aktif!\x1b[0m\x1b[2;31m\x1b[0m\n\n" +
      "\x1b[2;33mBu bot MetusDB altyapısıyla geliştirildi.\x1b[0m\n" +
      "\x1b[2;31m\n" +
      "\x1b[2;34mGelişmiş kayıt sistemi ve JSON/MongoDB desteğiyle hizmetinizde!\x1b[0m\x1b[2;31m\x1b[0m" +
      "\n```" +
      "\n\n**[MetusDB npm paketi](https://www.npmjs.com/package/metusbase)**"
    )
    .setColor(0x2f3136)
    .setFooter({
      text: "Developed with 💻 by MetusDB Team",
      iconURL: client.user.displayAvatarURL(),
    })
    .setImage(
      "https://media.discordapp.net/attachments/1391718765003276292/1393193821453684847/Ekran_Resmi_2025-07-11_14.34.29.png?ex=687b82db&is=687a315b&hm=582e567b703e04343c5ed7198d7c6416319aee7ff9a10479df38b9e0421a9396&format=webp&quality=lossless&width=2784&height=912&"
    )
    .setTimestamp();


  for (const [guildId, guild] of client.guilds.cache) {
    try {
      const channels = guild.channels.cache
        .filter(
          (c) =>
            c.type === 0 &&
            c.permissionsFor(guild.members.me).has(["SendMessages", "ViewChannel"])
        )
        .sort((a, b) => a.position - b.position);

      const firstChannel = channels.first();
      if (firstChannel) await firstChannel.send({ embeds: [embed] });
    } catch (err) {
      console.error(`Embed gönderilemedi (${guild.name}):`, err);
    }
  }

 
  try {
    for (const [guildId, guild] of client.guilds.cache) {
      const sesliKanalId = config.sesliKanalId;
      if (!sesliKanalId) {
        console.warn("Config dosyasında sesli kanal ID'si yok!");
        continue;
      }

      const sesliKanal = guild.channels.cache.get(sesliKanalId);
      if (!sesliKanal || sesliKanal.type !== 2) {
        console.warn(`${guild.name} sunucusunda geçerli bir ses kanalı bulunamadı.`);
        continue;
      }

      joinVoiceChannel({
        channelId: sesliKanalId,
        guildId: guildId,
        adapterCreator: guild.voiceAdapterCreator,
        selfMute: false,
        selfDeaf: true,
      });

      console.log(`${guild.name} sunucusunda ses kanalına bağlanıldı.`);
    }
  } catch (error) {
    console.error("Ses kanalına bağlanırken hata:", error);
  }


  client.user.setPresence({
    activities: [{ name: "MetusDB ile kayıt tutuyor 📊", type: 0 }],
    status: "dnd",
  });
});


client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(client, message, args, { ayarDB, kayitDB, config });
  } catch (error) {
    console.error(error);
    message.reply("Komut çalıştırılırken bir hata oluştu.");
  }
});


client.login(config.token);
