const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { fetchImageBuffer } = require("./lib/canvas-common");

async function draw(url) {
  const buffer = await fetchImageBuffer(url);
  const img = await loadImage(buffer);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0, W, H);
  const imgData = ctx.getImageData(0, 0, W, H);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    d[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
  ctx.putImageData(imgData, 0, 0);

  return canvas.encode("png");
}

module.exports = {
  name: "Sepia Filter",
  desc: "Beri efek warna sepia klasik (foto lawas) pada gambar dari URL.",
  category: "Image Creator",
  path: "/api/maker/sepia?apikey=&url=",
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
      console.error("Sepia Filter Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
