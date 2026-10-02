const { createCanvas } = require("@napi-rs/canvas");

const W = 900;
const H = 160;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function draw(percent, label, color) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0f0f14";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "left";
  ctx.fillStyle = "#e8e8ec";
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText(label, 20, 40);

  ctx.textAlign = "right";
  ctx.fillStyle = color;
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillText(`${percent}%`, W - 20, 40);

  const barX = 20, barY = 62, barW = W - 40, barH = 60;
  roundRect(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fillStyle = "#24242e";
  ctx.fill();

  const fillW = Math.max(barH, (barW * percent) / 100);
  ctx.save();
  roundRect(ctx, barX, barY, barW, barH, barH / 2);
  ctx.clip();
  const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "#ffffff");
  ctx.fillStyle = grad;
  roundRect(ctx, barX, barY, fillW, barH, barH / 2);
  ctx.fill();
  ctx.restore();

  return canvas.encode("png");
}

module.exports = {
  name: "Progress Bar Image",
  desc: "Buat gambar progress bar dari angka persen (0-100), dengan label dan warna kustom.",
  category: "Design",
  path: "/api/tools/progressbar?apikey=&percent=70&label=Progress&color=%2300c9a7",
  async run(req, res) {
    const { apikey, percent, label, color } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const p = parseInt(percent, 10);
    if (Number.isNaN(p) || p < 0 || p > 100) {
      return res.status(400).json({ status: false, error: "Parameter 'percent' wajib diisi, angka 0-100" });
    }

    const c = /^#?[0-9a-fA-F]{6}$/.test(color || "") ? (color.startsWith("#") ? color : "#" + color) : "#00c9a7";

    try {
      const buffer = await draw(p, label ? String(label).slice(0, 40) : "Progress", c);
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Progress Bar Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat progress bar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
