const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const { ensureCached, checkApikey, sendPng } = require("./lib/canvas-common");

const BG_URL = "https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Image/jarvismeme.png";
const FONT_URL = "https://cdn.jsdelivr.net/gh/adrienverge/copr-some-nice-fonts@master/ArialBd.ttf";
const CANVAS_SIZE = { width: 735, height: 678 };

let fontReady = false;

function drawTextInSafeZone(ctx, text, zone, initialFontSize, align) {
  let fontSize = initialFontSize;
  let lines = [];
  let lh = fontSize * 1.2;

  while (fontSize > 10) {
    lh = fontSize * 1.2;
    ctx.font = `500 ${fontSize}px ARIALBD, sans-serif`;
    lines = [];
    let fits = true;

    const paragraphs = text.split("\n");
    for (const p of paragraphs) {
      let cur = "";
      const words = p.split(" ");

      for (const w of words) {
        const t = cur ? cur + " " + w : w;
        if (ctx.measureText(t).width > zone.w) {
          if (cur) {
            lines.push(cur);
            cur = w;
            if (ctx.measureText(w).width > zone.w) {
              fits = false;
              break;
            }
          } else {
            fits = false;
            break;
          }
        } else {
          cur = t;
        }
      }
      if (!fits) break;
      lines.push(cur);
    }

    if (fits && (lines.length * lh) <= zone.h) break;

    fontSize -= 2;
  }

  ctx.font = `500 ${fontSize}px ARIALBD, sans-serif`;
  ctx.fillStyle = "#111111";
  ctx.textBaseline = "middle";
  ctx.textAlign = align;

  const drawX = align === "center" ? zone.x + zone.w / 2 : align === "right" ? zone.x + zone.w : zone.x;

  ctx.save();
  ctx.beginPath();
  ctx.rect(zone.x, zone.y, zone.w, zone.h);
  ctx.clip();

  const startY = zone.y + zone.h / 2 - (lines.length * lh) / 2 + lh / 2;
  lines.forEach((l, i) => ctx.fillText(l, drawX, startY + i * lh));
  ctx.restore();
}

async function generateJarvisMeme(text) {
  const bgLocal = await ensureCached(BG_URL, "jarvismeme_bg.png");
  const fontLocal = await ensureCached(FONT_URL, "jarvismeme_ArialBd.ttf");

  if (!fontReady) {
    GlobalFonts.registerFromPath(fontLocal, "ARIALBD");
    fontReady = true;
  }

  const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);

  const bgImg = await loadImage(bgLocal);
  ctx.drawImage(bgImg, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);

  const safeZone = { x: 20, y: 3, w: 695, h: 237 };
  drawTextInSafeZone(ctx, text, safeZone, 100, "center");

  return canvas.encode("png");
}

module.exports = {
  name: "Jarvis Meme",
  desc: "Generate meme template Jarvis dengan teks custom.",
  category: "Image Creator",
  path: "/api/canvas/jarvismeme?apikey=&text=",
  async run(req, res) {
    if (!checkApikey(req, res)) return;

    const { text } = req.query;
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const buffer = await generateJarvisMeme(text);
      sendPng(res, buffer);
    } catch (error) {
      console.error("Jarvismeme Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal generate jarvismeme" });
    }
  }
};
