import { createCanvas, loadImage } from "canvas";
import {
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function drawGradientRect(ctx, x, y, width, height, colorStart, colorEnd, radius) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

function drawCircleImage(ctx, image, x, y, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, x, y, radius * 2, radius * 2);
  ctx.restore();
}

function drawCard(ctx, x, y, width, height, colorStart, colorEnd, radius) {
  drawGradientRect(ctx, x, y, width, height, colorStart, colorEnd, radius);
}

function drawTextCenter(ctx, text, x, y, maxWidth) {
  const metrics = ctx.measureText(text);
  const textX = x + maxWidth / 2 - metrics.width / 2;
  ctx.fillText(text, textX, y);
}

export default {
  name: "kayıtlı",
  description: "Sunucudaki kayıtlıları görselli olarak listeler.",
  async execute(client, message, args, { ayarDB, kayitDB }) {
    const ayarlar = await ayarDB.get(message.guild.id);
    if (!ayarlar?.aktif)
      return message.reply("Kayıt sistemi aktif değil.");

    const kayitlar = (await kayitDB.get(message.guild.id)) || {};

    const erkekler = Object.entries(kayitlar).filter(
      ([_, data]) => data.cinsiyet === "erkek"
    );
    const kizlar = Object.entries(kayitlar).filter(
      ([_, data]) => data.cinsiyet === "kiz"
    );
    const kayitsizlar = message.guild.members.cache.filter(
      (m) => !kayitlar[m.id] && !m.user.bot
    );
    const seslidekiler = message.guild.members.cache.filter(
      (m) => !m.user.bot && m.voice.channel
    );

    const toplam = erkekler.length + kizlar.length;

 
    const canvas = createCanvas(1000, 600);
    const ctx = canvas.getContext("2d");


    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Sans-serif";
    ctx.fillText("Sunucu Kayıt Durumu", 340, 50);

   
    const kartGenislik = 80;
    const kartYukseklik = 100;
    const avatarYariCap = 30;
    const avatarUstBosluk = 10;
    const isimUstBosluk = 80;
    const maxSutun = 6;
    const maxKartSayisi = 18;
    const kartArasiBosluk = 10;

    const kartlar = [
      {
        label: "Erkek",
        icon: "♂️",
        colorStart: "#2980b9",
        colorEnd: "#3498db",
        data: erkekler,
        x: 30,
      },
      {
        label: "Kız",
        icon: "♀️",
        colorStart: "#c0392b",
        colorEnd: "#e74c3c",
        data: kizlar,
        x: 350,
      },
      {
        label: "Kayıtsız",
        icon: "❓",
        colorStart: "#7f8c8d",
        colorEnd: "#95a5a6",
        data: [...kayitsizlar.values()].map((m) => [m.id]),
        x: 670,
      },
    ];


    for (const kart of kartlar) {
     
      drawGradientRect(ctx, kart.x, 90, 280, 340, kart.colorStart, kart.colorEnd, 20);

      ctx.fillStyle = "#fff";
      ctx.font = "28px Sans-serif";
      ctx.fillText(`${kart.icon} ${kart.label}`, kart.x + 20, 130);

      ctx.font = "bold 42px Sans-serif";
      ctx.fillText(kart.data.length.toString(), kart.x + 30, 180);

      let xPos = kart.x + 15;
      let yPos = 200;
      let count = 0;

      ctx.font = "14px Sans-serif";
      ctx.fillStyle = "#fff";

      for (const [id] of kart.data) {
        const member = message.guild.members.cache.get(id);
        if (!member) continue;

        const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 64 });
        const avatarImg = await loadImage(avatarURL);

        drawCard(ctx, xPos, yPos, kartGenislik, kartYukseklik, kart.colorStart, kart.colorEnd, 15);


        drawCircleImage(ctx, avatarImg, xPos + (kartGenislik / 2 - avatarYariCap), yPos + avatarUstBosluk, avatarYariCap);


        let name = member.user.username;
        if (name.length > 10) name = name.slice(0, 9) + "…";
        drawTextCenter(ctx, name, xPos, yPos + isimUstBosluk, kartGenislik);

        xPos += kartGenislik + kartArasiBosluk;
        count++;

        if (count % maxSutun === 0) {
          xPos = kart.x + 15;
          yPos += kartYukseklik + kartArasiBosluk;
        }

        if (count >= maxKartSayisi) break;
      }
    }


    ctx.fillStyle = "#1abc9c";
    ctx.font = "22px Sans-serif";
    ctx.fillText(`📋 Toplam Kayıtlı: ${toplam}`, 350, 470);


    const sonKayit = Object.entries(kayitlar).sort(
      (a, b) => b[1].kayitTarihi - a[1].kayitTarihi
    )[0];
    if (sonKayit) {
      const sonMember = message.guild.members.cache.get(sonKayit[0]);
      if (sonMember) {
        const avatarURL = sonMember.user.displayAvatarURL({
          extension: "png",
          size: 64,
        });
        const avatarImage = await loadImage(avatarURL);

        ctx.fillStyle = "#f1c40f";
        ctx.font = "22px Sans-serif";
        ctx.fillText(`👤 Son Kayıt:`, 670, 470);

        drawCircleImage(ctx, avatarImage, 670, 485, 20);

        ctx.fillStyle = "#ecf0f1";
        ctx.font = "20px Sans-serif";
        ctx.fillText(sonMember.user.tag, 710, 510);
      }
    }


    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "kayit-gorseli.png",
    });

   
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("seslidekiler_buton")
        .setLabel("🎧 Şu An Seslide Olanlar")
        .setStyle(ButtonStyle.Primary)
    );

    const msg = await message.channel.send({
      files: [attachment],
      components: [row],
    });

    
    const filter = (i) =>
      i.customId === "seslidekiler_buton" && i.user.id === message.author.id;
    const collector = msg.createMessageComponentCollector({
      filter,
      time: 60000,
    });
collector.on("collect", async (interaction) => {
  await interaction.deferUpdate();

  
  const seslidekiler = message.guild.members.cache.filter(
    (m) => !m.user.bot && m.voice.channel
  );

  if (seslidekiler.size === 0) {
    await interaction.followUp({
      content: "Şu anda seslide kimse yok.",
      ephemeral: true,
    });
    return;
  }

  let liste = "**🎧 Şu anda seslide olan kişiler:**\n\n";
  for (const member of seslidekiler.values()) {
    liste += `• **${member.user.tag}** (📢 #${member.voice.channel.name})\n`;
  }

  await interaction.followUp({ content: liste, ephemeral: true });
})
  }}