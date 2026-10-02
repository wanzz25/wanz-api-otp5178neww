const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { fetchImageBuffer } = require("./lib/canvas-common");

async function draw(deg, url) {
  const buffer = await fetchImageBuffer(url);
  const img = await loadImage(buffer);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const angle = ((parseFloat(deg) || 90) * Math.PI) / 180;
  const sin = Math.abs(Math.sin(angle));
  const cos = Math.abs(Math.cos(angle));
  const newW = Math.round(W * cos + H * sin);
  const newH = Math.round(W * sin + H * cos);
  const rCanvas = createCanvas(newW, newH);
  const rCtx = rCanvas.getContext("2d");
  rCtx.translate(newW / 2, newH / 2);
  rCtx.rotate(angle);
  rCtx.drawImage(img, -W / 2, -H / 2, W, H);
  return rCanvas.encode("png");

  return canvas.encode("png");
}

module.exports = {
  name: "Rotate Image",
  desc: "Putar gambar dari URL sejumlah derajat (deg, default 90).",
  category: "Image Creator",
  path: "/api/maker/rotate?apikey=&url=&deg=90",
  async run(req, res) {
    const { apikey, url, deg } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const buffer = await draw(deg, url);
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Rotate Image Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
