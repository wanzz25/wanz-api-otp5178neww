const { createCanvas } = require("@napi-rs/canvas");

const W = 900;
const H = 420;

function drawBolt(ctx, x, y, len, angle) {
  ctx.strokeStyle = "rgba(150,210,255,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  let cx = x, cy = y;
  ctx.moveTo(cx, cy);
  const segments = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < segments; i++) {
    cx += Math.cos(angle) * (len / segments) + (Math.random() - 0.5) * 20;
    cy += Math.sin(angle) * (len / segments) + (Math.random() - 0.5) * 20;
    ctx.lineTo(cx, cy);
  }
  ctx.stroke();
}

function draw(text) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#04060d");
  bg.addColorStop(1, "#0d1730");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 7; i++) {
    drawBolt(ctx, Math.random() * W, 0, 180 + Math.random() * 100, Math.PI / 2 + (Math.random() - 0.5));
  }

  let fontSize = 120;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  while (ctx.measureText(text).width > W - 100 && fontSize > 30) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  }
  const cx = W / 2;
  const cy = H / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const grad = ctx.createLinearGradient(0, cy - fontSize / 2, 0, cy + fontSize / 2);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(1, "#8fd4ff");
  ctx.shadowColor = "#4fb7ff";
  ctx.shadowBlur = 30;
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, cy);
  ctx.fillText(text, cx, cy);

  return canvas.encode("png");
}

module.exports = {
  name: "TextPro Thunder",
  desc: "Buat teks dengan efek sambaran petir elektrik biru di latar gelap.",
  category: "Image Creator",
  path: "/api/textpro/thunder?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const buffer = await draw(String(text).toUpperCase().slice(0, 30));
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TextPro Thunder Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
