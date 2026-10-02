const { createCanvas } = require("@napi-rs/canvas");

const W = 900;
const H = 420;

function draw(text) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#dfe6ee";
  ctx.fillRect(0, 0, W, H);

  let fontSize = 120;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  while (ctx.measureText(text).width > W - 160 && fontSize > 30) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  }
  const cx = W / 2 - 8;
  const cy = H / 2 - 8;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const depth = 18;
  for (let i = depth; i >= 1; i--) {
    const shade = 40 + Math.floor((i / depth) * 60);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillText(text, cx + i, cy + i);
  }

  ctx.fillStyle = "#f5f7fa";
  ctx.strokeStyle = "#20232a";
  ctx.lineWidth = 2;
  ctx.strokeText(text, cx, cy);
  ctx.fillText(text, cx, cy);

  return canvas.encode("png");
}

module.exports = {
  name: "TextPro 3D Box",
  desc: "Buat teks balok 3D padat (extruded text) dengan bayangan berlapis.",
  category: "Image Creator",
  path: "/api/textpro/3d-box?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const buffer = await draw(String(text).toUpperCase().slice(0, 30));
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TextPro 3D Box Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
