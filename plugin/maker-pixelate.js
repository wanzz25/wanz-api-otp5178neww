const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { fetchImageBuffer } = require("./lib/canvas-common");

async function draw(size, url) {
  const buffer = await fetchImageBuffer(url);
  const img = await loadImage(buffer);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const block = Math.min(64, Math.max(2, parseInt(size, 10) || 16));
  const smallW = Math.max(1, Math.floor(W / block));
  const smallH = Math.max(1, Math.floor(H / block));
  const smallCanvas = createCanvas(smallW, smallH);
  const smallCtx = smallCanvas.getContext("2d");
  smallCtx.drawImage(img, 0, 0, smallW, smallH);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(smallCanvas, 0, 0, smallW, smallH, 0, 0, W, H);

  return canvas.encode("png");
}

module.exports = {
  name: "Pixelate Filter",
  desc: "Buat gambar dari URL menjadi efek piksel retro. Atur ukuran blok lewat size (default 16).",
  category: "Image Creator",
  path: "/api/maker/pixelate?apikey=&url=&size=16",
  async run(req, res) {
    const { apikey, url, size } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const buffer = await draw(size, url);
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Pixelate Filter Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
