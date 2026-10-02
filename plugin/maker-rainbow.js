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

  const grad = ctx.createLinearGradient(0, 0, W, H);
  const colors = ["#ff0000", "#ff9900", "#ffee00", "#33ff00", "#0066ff", "#9900ff"];
  colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  return canvas.encode("png");
}

module.exports = {
  name: "Rainbow Overlay Filter",
  desc: "Timpa gambar dari URL dengan gradasi warna pelangi transparan.",
  category: "Image Creator",
  path: "/api/maker/rainbow?apikey=&url=",
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
      console.error("Rainbow Overlay Filter Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
