const { createCanvas } = require("@napi-rs/canvas");

const W = 1600;
const H = 1131; // rasio A4 landscape kira-kira

function draw(nama, judul, penyelenggara) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fdfaf3";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#b7862c";
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = "#7a0f20";
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 60, W - 120, H - 120);

  ctx.textAlign = "center";
  ctx.fillStyle = "#7a0f20";
  ctx.font = "bold 34px Georgia, serif";
  ctx.fillText("S E R T I F I K A T", W / 2, 190);

  ctx.fillStyle = "#8a8078";
  ctx.font = "22px Georgia, serif";
  ctx.fillText("Dengan bangga diberikan kepada", W / 2, 260);

  ctx.fillStyle = "#221a17";
  let fontSize = 96;
  ctx.font = `bold ${fontSize}px Georgia, serif`;
  while (ctx.measureText(nama).width > W - 300 && fontSize > 40) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px Georgia, serif`;
  }
  ctx.fillText(nama, W / 2, 420);

  ctx.strokeStyle = "#b7862c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 220, 460);
  ctx.lineTo(W / 2 + 220, 460);
  ctx.stroke();

  ctx.fillStyle = "#4b4137";
  ctx.font = "26px Georgia, serif";
  const wrapLines = (text, maxWidth) => {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const lines = wrapLines(judul, W - 500);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, 540 + i * 36));

  ctx.fillStyle = "#8a8078";
  ctx.font = "italic 22px Georgia, serif";
  ctx.fillText(penyelenggara, W / 2, H - 140);

  const tanggal = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
  ctx.font = "20px Georgia, serif";
  ctx.fillText(tanggal, W / 2, H - 100);

  return canvas.encode("png");
}

module.exports = {
  name: "Certificate Generator",
  desc: "Buat gambar sertifikat penghargaan/kelulusan dengan nama, judul acara, dan penyelenggara.",
  category: "Design",
  path: "/api/tools/certificate?apikey=&nama=&judul=&penyelenggara=",
  async run(req, res) {
    const { apikey, nama, judul, penyelenggara } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!nama) {
      return res.status(400).json({ status: false, error: "Parameter 'nama' wajib diisi" });
    }

    try {
      const buffer = await draw(
        String(nama).slice(0, 60),
        judul ? String(judul).slice(0, 150) : "atas partisipasinya dalam kegiatan ini",
        penyelenggara ? String(penyelenggara).slice(0, 80) : "Wanz Api"
      );
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Certificate Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat sertifikat: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
