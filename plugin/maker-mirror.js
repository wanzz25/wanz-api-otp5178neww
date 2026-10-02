const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { fetchImageBuffer } = require("./lib/canvas-common");

async function draw(axis, url) {
  const buffer = await fetchImageBuffer(url);
  const img = await loadImage(buffer);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  if (String(axis || "horizontal") === "vertical") {
    ctx.translate(0, H);
    ctx.scale(1, -1);
  } else {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(img, 0, 0, W, H);

  return canvas.encode("png");
}

module.exports = {
  name: "Mirror Image",
  desc: "Balik gambar dari URL secara horizontal atau vertikal (axis=horizontal|vertical, default horizontal).",
  category: "Image Creator",
  path: "/api/maker/mirror?apikey=&url=&axis=horizontal",
  async run(req, res) {
    const { apikey, url, axis } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const buffer = await draw(axis, url);
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Mirror Image Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
