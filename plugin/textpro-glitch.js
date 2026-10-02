const { createCanvas } = require("@napi-rs/canvas");

const W = 900;
const H = 420;

function draw(text) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  let fontSize = 130;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  while (ctx.measureText(text).width > W - 100 && fontSize > 30) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  }

  const cx = W / 2;
  const cy = H / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#00ffff";
  ctx.fillText(text, cx - 7, cy);
  ctx.fillStyle = "#ff0055";
  ctx.fillText(text, cx + 7, cy);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, cx, cy);

  // potongan horizontal digeser acak (khas glitch)
  const textWidth = ctx.measureText(text).width + 40;
  const sliceX = cx - textWidth / 2;
  for (let i = 0; i < 8; i++) {
    const sy = cy - fontSize / 1.6 + Math.random() * fontSize * 1.3;
    const sh = 4 + Math.random() * 10;
    const shift = (Math.random() - 0.5) * 30;
    const slice = ctx.getImageData(sliceX, sy, textWidth, sh);
    ctx.putImageData(slice, sliceX + shift, sy);
  }

  // noise garis scan tipis
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = "#ffffff";
  for (let y = 0; y < H; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return canvas.encode("png");
}

module.exports = {
  name: "TextPro Glitch",
  desc: "Buat teks efek glitch digital (pecahan warna cyan/magenta, garis distorsi).",
  category: "Image Creator",
  path: "/api/textpro/glitch?apikey=&text=",
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
      console.error("TextPro Glitch Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
