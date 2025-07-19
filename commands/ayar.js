import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

export default {
  name: "ayar",
  description: "Kayıt sistemi ayarlarını yönetir",
  async execute(client, message, args, { ayarDB }) {

    let ayarlar = await ayarDB.get(message.guild.id);
    if (!ayarlar) {
      ayarlar = {
        aktif: false,
        kizRol: null,
        erkekRol: null,
        kayitsizRol: null,
        hgKanal: null,
        logKanal: null, 
      };
      await ayarDB.set(message.guild.id, ayarlar);
    }

    
    const createEmbed = () =>
      new EmbedBuilder()
        .setTitle("Kayıt Sistemi Ayarları")
        .setColor(ayarlar.aktif ? "Green" : "Red")
        .setDescription(`
**Aktif:** ${ayarlar.aktif ? "✅" : "❌"}
**Kız Rolü:** ${ayarlar.kizRol ? `<@&${ayarlar.kizRol}>` : "Ayarlanmadı"}
**Erkek Rolü:** ${ayarlar.erkekRol ? `<@&${ayarlar.erkekRol}>` : "Ayarlanmadı"}
**Kayıtsız Rolü:** ${ayarlar.kayitsizRol ? `<@&${ayarlar.kayitsizRol}>` : "Ayarlanmadı"}
**Hoşgeldin Kanalı:** ${ayarlar.hgKanal ? `<#${ayarlar.hgKanal}>` : "Ayarlanmadı"}
**Log Kanalı:** ${ayarlar.logKanal ? `<#${ayarlar.logKanal}>` : "Ayarlanmadı"}
      `)
        .setImage(
          "https://media.discordapp.net/attachments/1391718765003276292/1393193821453684847/Ekran_Resmi_2025-07-11_14.34.29.png?ex=687b82db&is=687a315b&hm=582e567b703e04343c5ed7198d7c6416319aee7ff9a10479df38b9e0421a9396&=&format=webp&quality=lossless&width=2784&height=912"
        );


    const createButtons = () => [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("toggleAktif")
          .setLabel(ayarlar.aktif ? "Devre Dışı Bırak" : "Aktifleştir")
          .setStyle(ayarlar.aktif ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("ayarlaKizRol")
          .setLabel("Kız Rolü Ayarla")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("ayarlaErkekRol")
          .setLabel("Erkek Rolü Ayarla")
          .setStyle(ButtonStyle.Primary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ayarlaKayitsizRol")
          .setLabel("Kayıtsız Rolü Ayarla")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("ayarlaHgKanal")
          .setLabel("Hoşgeldin Kanalı Ayarla")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("ayarlaLogKanal")
          .setLabel("Log Kanalı Ayarla")
          .setStyle(ButtonStyle.Primary)
      ),
    ];


    const sentMessage = await message.channel.send({
      embeds: [createEmbed()],
      components: createButtons(),
    });

 
    const filter = (i) => i.user.id === message.author.id;
    const collector = sentMessage.createMessageComponentCollector({ filter, time: 3600000 });

    collector.on("collect", async (interaction) => {
      try {
        if (interaction.customId === "toggleAktif") {
          ayarlar.aktif = !ayarlar.aktif;
          await ayarDB.set(message.guild.id, ayarlar);

          await interaction.update({
            embeds: [createEmbed()],
            components: createButtons(),
          });

        } else if (interaction.customId.startsWith("ayarla")) {
          await interaction.reply({
            content: "Lütfen ayarlamak istediğiniz ID'yi gönderin (rol veya kanal ID'si).",
            ephemeral: true,
          });

          const filterMsg = (m) => m.author.id === message.author.id && m.channel.id === interaction.channel.id;
          const collected = await interaction.channel.awaitMessages({ filter: filterMsg, max: 1, time: 30000, errors: ["time"] }).catch(() => {
            interaction.followUp({ content: "Zaman aşımı. Ayar yapılmadı.", ephemeral: true });
            return null;
          });

          if (!collected) return;

          const id = collected.first().content.trim();


          switch (interaction.customId) {
            case "ayarlaKizRol":
              ayarlar.kizRol = id;
              break;
            case "ayarlaErkekRol":
              ayarlar.erkekRol = id;
              break;
            case "ayarlaKayitsizRol":
              ayarlar.kayitsizRol = id;
              break;
            case "ayarlaHgKanal":
              ayarlar.hgKanal = id;
              break;
            case "ayarlaLogKanal":
              ayarlar.logKanal = id;
              break;
          }

          await ayarDB.set(message.guild.id, ayarlar);

          await interaction.followUp({ content: "Ayar kaydedildi!", ephemeral: true });

  
          await sentMessage.edit({
            embeds: [createEmbed()],
            components: createButtons(),
          });
        }
      } catch (error) {
        console.error("Ayar paneli hata:", error);
        if (!interaction.replied)
          await interaction.followUp({ content: "Bir hata oluştu.", ephemeral: true });
      }
    });

    collector.on("end", () => {

      sentMessage.edit({ components: [] }).catch(() => {});
    });
  },
};
