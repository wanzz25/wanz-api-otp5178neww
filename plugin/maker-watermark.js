const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { fetchImageBuffer } = require("./lib/canvas-common");

async function draw(text, url) {
  const buffer = await fetchImageBuffer(url);
  const img = await loadImage(buffer);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0, W, H);
  const fontSize = Math.max(14, Math.floor(W / 30));
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  const pad = fontSize;
  ctx.strokeText(text, W - pad, H - pad);
  ctx.fillText(text, W - pad, H - pad);

  return canvas.encode("png");
}

module.exports = {
  name: "Text Watermark",
  desc: "Tambahkan watermark teks transparan di pojok kanan bawah gambar dari URL.",
  category: "Image Creator",
  path: "/api/maker/watermark?apikey=&url=&text=",
  async run(req, res) {
    const { apikey, url, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const buffer = await draw(text, url);
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Text Watermark Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
