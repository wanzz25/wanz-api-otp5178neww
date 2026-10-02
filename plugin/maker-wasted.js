const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { fetchImageBuffer } = require("./lib/canvas-common");

async function draw(url) {
  const buffer = await fetchImageBuffer(url);
  const img = await loadImage(buffer);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.filter = "grayscale(1)";
  ctx.drawImage(img, 0, 0, W, H);
  ctx.filter = "none";

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, H * 0.42, W, H * 0.16);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.floor(W / 6)}px Arial, sans-serif`;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = Math.max(4, W / 120);
  ctx.fillStyle = "#c40000";
  ctx.strokeText("WASTED", W / 2, H / 2);
  ctx.fillText("WASTED", W / 2, H / 2);

  return canvas.encode("png");
}

module.exports = {
  name: "Wasted Filter",
  desc: "Efek 'WASTED' gaya GTA V: hitam-putih dengan teks merah bertumpuk di tengah.",
  category: "Image Creator",
  path: "/api/maker/wasted?apikey=&url=",
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
      console.error("Wasted Filter Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
