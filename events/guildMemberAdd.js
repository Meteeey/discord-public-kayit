import { Events, EmbedBuilder } from "discord.js";
import path from "path";
import { fileURLToPath } from "url";
import { SimpleDB } from "../SimleDB.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ayarDB = new SimpleDB(path.join(__dirname, "..", "metusbase", "ayarlar.json"));

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      const guildId = member.guild.id.toString();

      const ayarlar = await ayarDB.get(guildId);

      if (!ayarlar || !ayarlar.aktif) {
        console.log("Sunucu ayarları bulunamadı veya kayıt aktif değil.");
        return;
      }

      const hgKanalMention = ayarlar.hgKanal;
      if (!hgKanalMention) {
        console.log("Hoşgeldin kanalı ayarlanmamış.");
        return;
      }

    
      const match = hgKanalMention.match(/^<#(\d+)>$/);
      const welcomeChannelId = match ? match[1] : hgKanalMention;

      let channel = member.guild.channels.cache.get(welcomeChannelId);
      if (!channel) {
        try {
          channel = await member.guild.channels.fetch(welcomeChannelId);
        } catch {
          console.log("Hoşgeldin kanalı bulunamadı:", welcomeChannelId);
          return;
        }
      }

 if (ayarlar.kayitsizRol) {
  try {
    let roleId = ayarlar.kayitsizRol;
    const match = roleId.match(/^<@&(\d+)>$/);
    if (match) roleId = match[1];

    const role = member.guild.roles.cache.get(roleId);
    if (role) {
      await member.roles.add(role);
      console.log(`Kayıtsız rolü ${member.user.tag} kullanıcısına verildi.`);
    } else {
      console.log("Kayıtsız rolü bulunamadı veya sunucuda yok.");
    }
  } catch (err) {
    console.error("Kayıtsız rolü verirken hata:", err);
  }
} else {
  console.log("Kayıtsız rolü ayarlanmamış.");
}


 
      const embed = new EmbedBuilder()
        .setTitle(`🎉 Hoş Geldin ${member.user.username}!`)
        .setDescription(`Sunucumuza katıldığın için teşekkürler ${member}!\n\nLütfen kuralları oku ve keyifli vakit geçir!`)
        .setColor("#00ff88")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `${member.guild.name} ailesine hoş geldin!` })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
   
    } catch (error) {
      console.error("Welcome mesajı gönderilirken hata:", error);
    }
  },
};
