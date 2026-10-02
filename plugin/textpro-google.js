const { createCanvas } = require("@napi-rs/canvas");

const W = 900;
const H = 420;
const COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853", "#EA4335"];

function draw(text) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  let fontSize = 130;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  while (ctx.measureText(text).width > W - 100 && fontSize > 30) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  }

  const totalWidth = ctx.measureText(text).width;
  let x = W / 2 - totalWidth / 2;
  const y = H / 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  text.split("").forEach((ch, i) => {
    ctx.fillStyle = ch.trim() ? COLORS[i % COLORS.length] : "#000000";
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width;
  });

  return canvas.encode("png");
}

module.exports = {
  name: "TextPro Google Style",
  desc: "Buat teks dengan warna bergantian khas logo Google (biru, merah, kuning, hijau) per huruf.",
  category: "Image Creator",
  path: "/api/textpro/google?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const buffer = await draw(String(text).slice(0, 30));
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TextPro Google Style Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
