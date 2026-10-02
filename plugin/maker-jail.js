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

  const bars = 8;
  const barW = Math.max(6, W / 40);
  for (let i = 0; i < bars; i++) {
    const x = (W / bars) * i + (W / bars) / 2 - barW / 2;
    const grad = ctx.createLinearGradient(x, 0, x + barW, 0);
    grad.addColorStop(0, "#3a3a3a");
    grad.addColorStop(0.5, "#c9c9c9");
    grad.addColorStop(1, "#3a3a3a");
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, barW, H);
  }
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(0, H * 0.08, W, Math.max(8, H / 30));
  ctx.fillRect(0, H * 0.85, W, Math.max(8, H / 30));

  return canvas.encode("png");
}

module.exports = {
  name: "Jail Filter",
  desc: "Tambahkan jeruji besi (efek penjara) di atas gambar dari URL.",
  category: "Image Creator",
  path: "/api/maker/jail?apikey=&url=",
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
      console.error("Jail Filter Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
