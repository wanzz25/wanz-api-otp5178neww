const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const { ensureCached, fetchImageBuffer, checkApikey, sendPng } = require("./lib/canvas-common");

const BG_URL = "https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/IMG-20260710-WA1772.jpg";
const FONT_URL = "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2";

let fontReady = false;

async function generateFakeGc(photoUrl, nama, anggota) {
  const bgLocal = await ensureCached(BG_URL, "fakegc_bg.jpg");
  const fontLocal = await ensureCached(FONT_URL, "fakegc_inter.woff2");

  if (!fontReady) {
    GlobalFonts.registerFromPath(fontLocal, "Inter");
    fontReady = true;
  }

  const ppBuffer = await fetchImageBuffer(photoUrl);
  const bgImg = await loadImage(bgLocal);
  const ppImg = await loadImage(ppBuffer);

  const canvas = createCanvas(bgImg.width, bgImg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.arc(538, 362, 162, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(ppImg, 538 - 162, 362 - 162, 162 * 2, 162 * 2);
  ctx.restore();

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 64px Inter, sans-serif";
  ctx.fillText(nama, 540, 602);

  const prefixText = "Grup • ";
  ctx.font = "500 37px Inter, sans-serif";
  const prefixWidth = ctx.measureText(prefixText).width;
  const totalWidth = prefixWidth + ctx.measureText(anggota).width;
  const startX = 548 - (totalWidth / 2);

  ctx.fillStyle = "#8E8E93";
  ctx.textAlign = "left";
  ctx.fillText(prefixText, startX, 684);

  ctx.fillStyle = "#34C759";
  ctx.fillText(anggota, startX + prefixWidth, 684);

  return canvas.encode("png");
}

module.exports = {
  name: "Fake GC iOS",
  desc: "Generate tampilan grup WhatsApp iOS palsu (foto grup + nama + jumlah anggota).",
  category: "Image Creator",
  path: "/api/canvas/fakegc?apikey=&photo=&nama=&anggota=",
  async run(req, res) {
    if (!checkApikey(req, res)) return;

    const { photo, nama, anggota } = req.query;
    if (!photo || !nama || !anggota) {
      return res.status(400).json({ status: false, error: "Parameter 'photo', 'nama', dan 'anggota' wajib diisi" });
    }

    try {
      const buffer = await generateFakeGc(photo, nama.trim(), anggota.trim());
      sendPng(res, buffer);
    } catch (error) {
      console.error("Fakegc Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal generate fakegc (cek url foto valid?)" });
    }
  }
};
