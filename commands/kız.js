import { EmbedBuilder } from "discord.js";

function extractRoleId(roleMention) {
  if (!roleMention) return null;
  const match = roleMention.match(/^<@&(\d+)>$/);
  return match ? match[1] : roleMention;
}

function extractChannelId(channelMention) {
  if (!channelMention) return null;
  const match = channelMention.match(/^<#(\d+)>$/);
  return match ? match[1] : channelMention;
}

export default {
  name: "kız",
  description: "Kız olarak kayıt yapar",
  async execute(client, message, args, { ayarDB, kayitDB }) {
    const ayarlar = await ayarDB.get(message.guild.id);
    if (!ayarlar || !ayarlar.aktif) return message.reply("Kayıt sistemi aktif değil.");

    if (!ayarlar.kizRol || !ayarlar.kayitsizRol)
      return message.reply("Kız rolü veya kayıtsız rol ayarlanmamış.");

    if (!message.member.permissions.has("ManageRoles"))
      return message.reply("Rolleri yönetme yetkin yok.");

    const member = message.mentions.members.first();
    if (!member) return message.reply("Lütfen kayıt yapılacak kullanıcıyı etiketle.");

    const kayitsizRolId = extractRoleId(ayarlar.kayitsizRol);
    const kizRolId = extractRoleId(ayarlar.kizRol);

    if (member.roles.cache.has(kayitsizRolId)) {
      await member.roles.remove(kayitsizRolId).catch(console.error);
    }
    if (!member.roles.cache.has(kizRolId)) {
      await member.roles.add(kizRolId).catch(console.error);
    }


    const kayitlar = (await kayitDB.get(message.guild.id)) || {};
    kayitlar[member.id] = { cinsiyet: "kiz", kayitTarihi: Date.now(), kaydeden: message.author.id };
    await kayitDB.set(message.guild.id, kayitlar);


    if (ayarlar.logKanal) {
      const logChannelId = extractChannelId(ayarlar.logKanal);
      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle("Yeni Kayıt Yapıldı")
          .setColor("Green")
          .setDescription(`
${member.user} kullanıcısı **${message.author.tag}** tarafından kayıt edildi.

**Verilen Rol:** <@&${kizRolId}>
**Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>
          `)
          .setTimestamp();

        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
      }
    }
  },
};
