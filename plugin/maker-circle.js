const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { fetchImageBuffer } = require("./lib/canvas-common");

async function draw(url) {
  const buffer = await fetchImageBuffer(url);
  const img = await loadImage(buffer);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const size = Math.min(W, H);
  const cCanvas = createCanvas(size, size);
  const cCtx = cCanvas.getContext("2d");
  cCtx.beginPath();
  cCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  cCtx.closePath();
  cCtx.clip();
  cCtx.drawImage(img, (size - W) / 2, (size - H) / 2, W, H);
  return cCanvas.encode("png");

  return canvas.encode("png");
}

module.exports = {
  name: "Circle Crop",
  desc: "Potong gambar dari URL menjadi bulat (PNG transparan).",
  category: "Image Creator",
  path: "/api/maker/circle?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const buffer = await draw(url);
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Circle Crop Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
