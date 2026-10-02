const { createCanvas } = require("@napi-rs/canvas");

const W = 900;
const H = 420;

/**
 * Render teks besar rata tengah dengan gradient warna, opsional stroke & shadow glow.
 * Ukuran font otomatis mengecil supaya muat dalam kanvas.
 */
function gradientText(text, opts = {}) {
  const {
    bgColor = "#000000",
    bgDraw = null, // (ctx) => void, untuk menggambar latar kustom (pola/gradasi)
    colors = ["#ffffff", "#cccccc"],
    angle = "horizontal", // horizontal | vertical
    shadowColor = null,
    shadowBlur = 0,
    strokeColor = null,
    strokeWidth = 0,
    italic = false,
    fontWeight = "bold",
    fontFamily = "Arial, sans-serif",
    maxFont = 140,
    afterDraw = null // (ctx, metrics) => void, elemen tambahan digambar setelah teks
  } = opts;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);
  if (bgDraw) bgDraw(ctx);

  let fontSize = maxFont;
  const style = `${italic ? "italic " : ""}${fontWeight} `;
  ctx.font = `${style}${fontSize}px ${fontFamily}`;
  while (ctx.measureText(text).width > W - 100 && fontSize > 30) {
    fontSize -= 4;
    ctx.font = `${style}${fontSize}px ${fontFamily}`;
  }

  const cx = W / 2;
  const cy = H / 2;

  const grad = angle === "vertical"
    ? ctx.createLinearGradient(0, cy - fontSize / 2, 0, cy + fontSize / 2)
    : ctx.createLinearGradient(cx - ctx.measureText(text).width / 2, 0, cx + ctx.measureText(text).width / 2, 0);
  colors.forEach((c, i) => grad.addColorStop(i / Math.max(1, colors.length - 1), c));

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (shadowColor) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.fillStyle = grad;
    ctx.fillText(text, cx, cy);
    ctx.fillText(text, cx, cy);
    ctx.shadowBlur = 0;
  }

  if (strokeColor) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.lineJoin = "round";
    ctx.strokeText(text, cx, cy);
  }

  ctx.fillStyle = grad;
  ctx.fillText(text, cx, cy);

  if (afterDraw) afterDraw(ctx, { cx, cy, fontSize, width: ctx.measureText(text).width });

  return { canvas, ctx, fontSize, cx, cy };
}

module.exports = { createCanvas, gradientText, W, H };
