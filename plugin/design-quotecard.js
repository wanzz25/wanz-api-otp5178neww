const { createCanvas } = require("@napi-rs/canvas");

const W = 1080;
const H = 1080;

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function draw(text, author) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(1, "#16213e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.font = "220px Georgia, serif";
  ctx.fillText("\u201C", 60, 260);

  ctx.textAlign = "center";
  ctx.fillStyle = "#f5f5f5";
  let fontSize = 78;
  let lines;
  do {
    ctx.font = `${fontSize}px Georgia, serif`;
    lines = wrapText(ctx, text, W - 160);
    fontSize -= 2;
  } while (lines.length * (fontSize + 14) > H - 320 && fontSize > 24);

  ctx.font = `${fontSize}px Georgia, serif`;
  const pitch = fontSize + 14;
  const startY = H / 2 - (lines.length * pitch) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * pitch);
  });

  if (author) {
    ctx.fillStyle = "#a0a0c0";
    ctx.font = "32px Arial, sans-serif";
    ctx.fillText("\u2014 " + author, W / 2, startY + lines.length * pitch + 50);
  }

  return canvas.encode("png");
}

module.exports = {
  name: "Quote Card Generator",
  desc: "Buat gambar kartu kutipan (quote card) elegan dari teks dan nama penulis.",
  category: "Design",
  path: "/api/tools/quotecard?apikey=&text=&author=",
  async run(req, res) {
    const { apikey, text, author } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const buffer = await draw(String(text).slice(0, 300), author ? String(author).slice(0, 80) : "");
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Quote Card Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat quote card: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
