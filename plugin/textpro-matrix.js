const { createCanvas } = require("@napi-rs/canvas");

const W = 900;
const H = 420;

function draw(text) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  // hujan digit biner hijau di latar
  ctx.font = "18px monospace";
  const cols = Math.ceil(W / 20);
  for (let c = 0; c < cols; c++) {
    const x = c * 20 + 8;
    const dropLen = 4 + Math.floor(Math.random() * 12);
    for (let r = 0; r < dropLen; r++) {
      const y = (r * 22 + Math.random() * 22) % H;
      const alpha = 0.15 + Math.random() * 0.35;
      ctx.fillStyle = `rgba(0,255,65,${alpha})`;
      ctx.fillText(Math.random() < 0.5 ? "0" : "1", x, y);
    }
  }

  let fontSize = 130;
  ctx.font = `bold ${fontSize}px monospace`;
  while (ctx.measureText(text).width > W - 100 && fontSize > 30) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px monospace`;
  }

  const cx = W / 2;
  const cy = H / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = "#00ff41";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#00ff41";
  ctx.fillText(text, cx, cy);
  ctx.fillText(text, cx, cy);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#c9ffd8";
  ctx.fillText(text, cx, cy);

  return canvas.encode("png");
}

module.exports = {
  name: "TextPro Matrix",
  desc: "Buat teks efek Matrix: hujan digit biner hijau di latar dengan teks utama menyala hijau neon.",
  category: "Image Creator",
  path: "/api/textpro/matrix?apikey=&text=",
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
      console.error("TextPro Matrix Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
