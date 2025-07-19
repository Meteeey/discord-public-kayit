import { EmbedBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import path from "path";
import fs from "fs";

export default {
  name: "yardım",
  description: "Kayıt sistemi komutlarını ve açıklamalarını listeler",

  async execute(client, message) {
    const width = 900;
    const rowHeight = 60;
    const commands = [
      { cmd: ".ayar", desc: "Bot ayarlarını yapılandırır", usage: ".ayar" },
      { cmd: ".erkek", desc: "Erkek kullanıcıyı kayıt eder", usage: ".erkek @kullanıcı" },
      { cmd: ".kız", desc: "Kız kullanıcıyı kayıt eder", usage: ".kız @kullanıcı" },
      { cmd: ".isimdeğiştir", desc: "Kullanıcının ismini değiştirir", usage: ".isimdeğiştir @kullanıcı Yeniİsim" },
      { cmd: ".kayıtlı", desc: "Kayıtlı kullanıcıları listeler", usage: ".kayıtlı" },
      { cmd: ".kayıtsız", desc: "Kayıtsız kullanıcıları listeler", usage: ".kayıtsız" },
      { cmd: ".help", desc: "Yardım menüsünü gösterir", usage: ".help" },
    ];
    const cmdCount = commands.length;


    const height = 90 + rowHeight * cmdCount + 140; 

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#2C2F33");
    gradient.addColorStop(1, "#23272A");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#5865F2";
    ctx.font = "bold 32px Arial";
    ctx.fillText("📘 Metus Kayıt Sistemi Komutları", 30, 50);

    
    const cmdX = 50;
    const descX = 220;
    const usageXDefault = 650;
    const usageXIsimdegistir = 620;


    for (let i = 0; i < cmdCount; i++) {
      ctx.fillStyle = "rgba(88, 101, 242, 0.3)";
      ctx.fillRect(30, 90 + i * rowHeight, width - 60, rowHeight - 10);

      const y = 90 + i * rowHeight + rowHeight / 2 + 7;

   
      ctx.fillStyle = "white";
      ctx.font = "bold 20px Arial";
      ctx.fillText(commands[i].cmd, cmdX, y);


      ctx.font = "normal 18px Arial";
      ctx.fillText(commands[i].desc, descX, y);


      ctx.font = "italic 18px Arial";
      const usageX = commands[i].cmd === ".isimdeğiştir" ? usageXIsimdegistir : usageXDefault;
      ctx.fillText(commands[i].usage, usageX, y);
    }

    try {
      const avatarURL = client.user.displayAvatarURL({ extension: "png", size: 128 });
      const avatar = await loadImage(avatarURL);

      
      const avatarY = 90 + cmdCount * rowHeight + 20; 

  
      const avatarX = width / 2 - 50; 

      ctx.drawImage(avatar, avatarX, avatarY, 100, 100);
    } catch (error) {
      console.log("Avatar yüklenemedi:", error);
    }

 
    const buffer = canvas.toBuffer("image/png");

    
    const filePath = path.join(process.cwd(), "assets", "yardim_temp.png");
    fs.writeFileSync(filePath, buffer);


    const attachment = new AttachmentBuilder(buffer, { name: "yardim.png" });

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("📘 Metus Kayıt Sistemi Komut Yardımı")
      .setDescription(
        "Aşağıda tüm kayıt komutları detaylıca ve görselli olarak sunulmuştur.\n\n📌 **Görseldeki tüm komutlar aktif çalışmaktadır.**"
      )
      .setImage("attachment://yardim.png")

      .setTimestamp();

    message.channel.send({
      embeds: [embed],
      files: [attachment],
    });
  },
};
