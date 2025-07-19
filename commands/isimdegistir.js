import { EmbedBuilder } from "discord.js";

function extractChannelId(channelMention) {
  if (!channelMention) return null;
  const match = channelMention.match(/^<#(\d+)>$/);
  return match ? match[1] : channelMention;
}

export default {
  name: "isimdeğiştir",
  description: "Bir kullanıcının adını değiştirir.",
  async execute(client, message, args, { ayarDB }) {
    const ayarlar = await ayarDB.get(message.guild.id);
    if (!ayarlar || !ayarlar.aktif)
      return message.reply("Kayıt sistemi aktif değil.");

    if (!message.member.permissions.has("ManageNicknames"))
      return message.reply("❌ Bunu yapmak için yetkin yok!");

    const member = message.mentions.members.first();
    const newName = args.slice(1).join(" ");

    if (!member || !newName)
      return message.reply("⛔ Kullanım: `.isimdeğiştir @kullanıcı Yeniİsim`");

    try {
      await member.setNickname(newName);

      if (ayarlar.logKanal) {
        const logChannelId = extractChannelId(ayarlar.logKanal);
        const logChannel = message.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("🔤 İsim Değiştirildi")
            .setColor("Blurple")
            .setDescription(`
${member.user} kullanıcısının ismi değiştirildi.

**Yeni İsim:** \`${newName}\`
**Değiştiren:** ${message.author.tag}
**Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>
            `)
            .setTimestamp();

          logChannel.send({ embeds: [logEmbed] }).catch(console.error);
        }
      }

      message.reply(`✅ ${member} adlı kullanıcının ismi **${newName}** olarak değiştirildi.`);
    } catch (err) {
      console.error(err);
      message.reply("⚠️ İsim değiştirilemedi. Botun yetkilerini kontrol et.");
    }
  },
};
