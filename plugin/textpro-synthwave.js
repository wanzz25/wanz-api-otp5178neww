const { createCanvas } = require("@napi-rs/canvas");

const W = 900;
const H = 420;

function draw(text) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // langit gradasi ungu-oranye
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
  sky.addColorStop(0, "#1a0033");
  sky.addColorStop(0.6, "#5b0e6b");
  sky.addColorStop(1, "#ff6a3d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.6);

  // matahari
  const sunY = H * 0.42;
  const sunR = 90;
  const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sunGrad.addColorStop(0, "#ffe27a");
  sunGrad.addColorStop(1, "#ff3d7f");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(W / 2, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "#1a0033";
    ctx.fillRect(W / 2 - sunR, sunY + i * 14 - 20, sunR * 2, 6);
  }

  // tanah + grid perspektif
  ctx.fillStyle = "#0d0221";
  ctx.fillRect(0, H * 0.6, W, H * 0.4);
  ctx.strokeStyle = "rgba(255,0,200,0.55)";
  ctx.lineWidth = 1.5;
  const horizonY = H * 0.6;
  for (let i = -10; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + i * 30, horizonY);
    ctx.lineTo(W / 2 + i * 140, H);
    ctx.stroke();
  }
  for (let j = 1; j <= 6; j++) {
    const y = horizonY + j * j * 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  let fontSize = 110;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  while (ctx.measureText(text).width > W - 100 && fontSize > 30) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  }
  const cx = W / 2;
  const cy = H * 0.42;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const txtGrad = ctx.createLinearGradient(0, cy - fontSize / 2, 0, cy + fontSize / 2);
  txtGrad.addColorStop(0, "#e8d8ff");
  txtGrad.addColorStop(1, "#ff2ea6");
  ctx.shadowColor = "#ff2ea6";
  ctx.shadowBlur = 25;
  ctx.strokeStyle = "#1a0033";
  ctx.lineWidth = 6;
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = txtGrad;
  ctx.fillText(text, cx, cy);

  return canvas.encode("png");
}

module.exports = {
  name: "TextPro Synthwave",
  desc: "Buat teks bertema retro 80an: matahari terbenam ungu-oranye, grid neon perspektif.",
  category: "Image Creator",
  path: "/api/textpro/synthwave?apikey=&text=",
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
      console.error("TextPro Synthwave Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
