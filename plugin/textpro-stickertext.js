const { createCanvas } = require("@napi-rs/canvas");

const SIZE = 512;
const COLORS = ["#ff3d3d", "#ffb703", "#3dd56d", "#3d9bff", "#c93dff", "#ff3d9e"];

function wrapText(ctx, text, maxWidth) {
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
}

function draw(text) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  // transparan

  let fontSize = 90;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  let lines = wrapText(ctx, text, SIZE - 80);
  while ((lines.length * (fontSize + 10) > SIZE - 100 || Math.max(...lines.map((l) => ctx.measureText(l).width)) > SIZE - 80) && fontSize > 30) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    lines = wrapText(ctx, text, SIZE - 80);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const pitch = fontSize + 14;
  const startY = SIZE / 2 - (lines.length * pitch) / 2 + pitch / 2;

  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 6;

  lines.forEach((line, li) => {
    const y = startY + li * pitch;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 18;
    ctx.strokeText(line, SIZE / 2, y);
  });

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  lines.forEach((line, li) => {
    const y = startY + li * pitch;
    ctx.fillStyle = COLORS[li % COLORS.length];
    ctx.fillText(line, SIZE / 2, y);
  });

  return canvas.encode("png");
}

module.exports = {
  name: "TextPro Sticker Text",
  desc: "Buat teks bergaya stiker WhatsApp: warna-warni cerah dengan outline putih tebal, PNG transparan 512x512.",
  category: "Image Creator",
  path: "/api/textpro/sticker-text?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const buffer = await draw(String(text).toUpperCase().slice(0, 40));
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TextPro Sticker Text Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
