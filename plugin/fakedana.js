const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const { ensureCached, checkApikey, sendPng } = require("./lib/canvas-common");

const TTF_URL = "https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-600-normal.ttf";
const BG_URL = "https://raw.githubusercontent.com/ryyntwx/Image-rinn/refs/heads/main/fkedana.png";
const EYE_URL = "https://raw.githubusercontent.com/ryyntwx/Image-rinn/refs/heads/main/IMG-20260726-WA1031.jpg";

let fontReady = false;

async function generateFakeDana(nominal) {
  const fontLocal = await ensureCached(TTF_URL, "fakedana_font.ttf");
  const bgLocal = await ensureCached(BG_URL, "fakedana_bg.png");
  const eyeLocal = await ensureCached(EYE_URL, "fakedana_eye.jpg");

  if (!fontReady) {
    GlobalFonts.registerFromPath(fontLocal, "DANA");
    fontReady = true;
  }

  const bgImg = await loadImage(bgLocal);
  const eyeImg = await loadImage(eyeLocal);

  const canvas = createCanvas(bgImg.width, bgImg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  const valX = 138;
  const valY = 52;
  const maxFontSize = 37;
  const eyeGap = 7;
  const eyeScale = 1.3;

  const inputSaldo = nominal.trim();

  let currentFontSize = maxFontSize;
  const maxAllowedWidth = canvas.width - valX - 100;

  ctx.font = `600 ${currentFontSize}px DANA`;
  let textWidth = ctx.measureText(inputSaldo).width;

  while (textWidth > maxAllowedWidth && currentFontSize > 16) {
    currentFontSize -= 2;
    ctx.font = `600 ${currentFontSize}px DANA`;
    textWidth = ctx.measureText(inputSaldo).width;
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(inputSaldo, valX, valY);

  const eyeHeight = currentFontSize * eyeScale;
  const eyeWidth = (eyeImg.width / eyeImg.height) * eyeHeight;
  const eyeX = valX + textWidth + eyeGap;
  const eyeY = valY + (currentFontSize - eyeHeight) / 2;

  ctx.drawImage(eyeImg, eyeX, eyeY, eyeWidth, eyeHeight);

  return canvas.encode("png");
}

module.exports = {
  name: "Fake Saldo DANA",
  desc: "Generate gambar tampilan saldo DANA palsu (nominal custom).",
  category: "Image Creator",
  path: "/api/canvas/fakedana?apikey=&nominal=",
  async run(req, res) {
    if (!checkApikey(req, res)) return;

    const { nominal } = req.query;
    if (!nominal) {
      return res.status(400).json({ status: false, error: "Parameter 'nominal' wajib diisi" });
    }

    try {
      const buffer = await generateFakeDana(nominal);
      sendPng(res, buffer);
    } catch (error) {
      console.error("Fakedana Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal generate fakedana" });
    }
  }
};
