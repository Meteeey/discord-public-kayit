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
  name: "kayıtsız",
  description: "Kullanıcıyı kayıtsız yapar, kayıt rollerini kaldırır.",
  async execute(client, message, args, { ayarDB, kayitDB }) {
    const ayarlar = await ayarDB.get(message.guild.id);
    if (!ayarlar || !ayarlar.aktif) return message.reply("Kayıt sistemi aktif değil.");

    if (!ayarlar.kayitsizRol)
      return message.reply("Kayıtsız rolü ayarlanmamış.");

    if (!message.member.permissions.has("ManageRoles"))
      return message.reply("Rolleri yönetme yetkin yok.");

    const member = message.mentions.members.first();
    if (!member) return message.reply("Lütfen kayıtsız yapılacak kullanıcıyı etiketle.");

    const kayitsizRolId = extractRoleId(ayarlar.kayitsizRol);
    const erkekRolId = extractRoleId(ayarlar.erkekRol);
    const kizRolId = extractRoleId(ayarlar.kizRol);


    if (member.roles.cache.has(erkekRolId)) {
      await member.roles.remove(erkekRolId).catch(console.error);
    }
    if (member.roles.cache.has(kizRolId)) {
      await member.roles.remove(kizRolId).catch(console.error);
    }


    if (!member.roles.cache.has(kayitsizRolId)) {
      await member.roles.add(kayitsizRolId).catch(console.error);
    }

    
    const kayitlar = (await kayitDB.get(message.guild.id)) || {};
    if (kayitlar[member.id]) {
      delete kayitlar[member.id];
      await kayitDB.set(message.guild.id, kayitlar);
    }

   

    if (ayarlar.logKanal) {
      const logChannelId = extractChannelId(ayarlar.logKanal);
      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle("Kullanıcı Kayıtsız Yapıldı")
          .setColor("Orange")
          .setDescription(`
${member.user} kullanıcısı **${message.author.tag}** tarafından kayıtsız yapıldı.

**Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>
          `)
          .setTimestamp();

        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
      }
    }
  },
};
