const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { fetchImageBuffer } = require("./lib/canvas-common");

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

function drawCaption(ctx, text, W, y, align) {
  if (!text) return;
  let fontSize = Math.floor(W / 10);
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  let lines = wrapText(ctx, text.toUpperCase(), W - 40);
  while (lines.length > 3 && fontSize > 20) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    lines = wrapText(ctx, text.toUpperCase(), W - 40);
  }

  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(4, fontSize / 12);
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = "#ffffff";

  const pitch = fontSize * 1.05;
  lines.forEach((line, i) => {
    const ly = align === "top" ? y + i * pitch : y - (lines.length - 1 - i) * pitch;
    ctx.strokeText(line, W / 2, ly);
    ctx.fillText(line, W / 2, ly);
  });
}

async function draw(url, top, bottom) {
  const buffer = await fetchImageBuffer(url);
  const img = await loadImage(buffer);

  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, W, H);

  const fontSize = Math.floor(W / 10);
  drawCaption(ctx, top, W, fontSize + 10, "top");
  drawCaption(ctx, bottom, W, H - 20, "bottom");

  return canvas.encode("png");
}

module.exports = {
  name: "Meme Caption Generator",
  desc: "Tambahkan teks meme klasik (atas/bawah, kapital, outline hitam) ke gambar dari URL.",
  category: "Image Creator",
  path: "/api/maker/meme?apikey=&url=&top=&bottom=",
  async run(req, res) {
    const { apikey, url, top, bottom } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    if (!top && !bottom) {
      return res.status(400).json({ status: false, error: "Isi minimal salah satu dari 'top' atau 'bottom'" });
    }

    try {
      const buffer = await draw(url, top, bottom);
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Meme Caption Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat meme: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
