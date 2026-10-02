const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const { ensureCached, fetchImageBuffer, checkApikey, sendPng } = require("./lib/canvas-common");

const TTF_URL = "https://cdn.jsdelivr.net/fontsource/fonts/roboto-mono@latest/latin-700-normal.ttf";
const BG_URL = "https://raw.githubusercontent.com/ryyntwx/Image-rinn/refs/heads/main/c8ac4ffc-618c-411c-b36c-45c06c7e5a5e.png";
const FONT_NAME = "TeleRobotoMono";

let fontReady = false;

async function generateFakeTele(photoUrl, nama, nomor, bio, username) {
  const fontLocal = await ensureCached(TTF_URL, "faketele_font.ttf");
  const bgLocal = await ensureCached(BG_URL, "faketele_bg.png");

  if (!fontReady) {
    GlobalFonts.registerFromPath(fontLocal, FONT_NAME);
    fontReady = true;
  }

  const ppBuffer = await fetchImageBuffer(photoUrl);
  const bgImg = await loadImage(bgLocal);
  const ppImg = await loadImage(ppBuffer);

  const canvas = createCanvas(bgImg.width, bgImg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  const fontFamily = FONT_NAME;
  const usernameText = username.startsWith("@") ? username : "@" + username;

  const config = {
    pp: { x: 571, y: 244, r: 137 },
    nama: { y: 448, size: 50 },
    ponsel: { x: 80, y: 883, size: 35 },
    bio: { x: 83, y: 996, size: 36 },
    username: { x: 83, y: 1143, size: 38 }
  };

  ctx.save();
  ctx.beginPath();
  ctx.arc(config.pp.x, config.pp.y, config.pp.r, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(ppImg, config.pp.x - config.pp.r, config.pp.y - config.pp.r, config.pp.r * 2, config.pp.r * 2);
  ctx.restore();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${config.nama.size}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(nama, canvas.width / 2, config.nama.y);

  ctx.textAlign = "left";
  ctx.font = `${config.ponsel.size}px ${fontFamily}`;
  ctx.fillText(nomor, config.ponsel.x, config.ponsel.y);

  ctx.font = `${config.bio.size}px ${fontFamily}`;
  ctx.fillText(bio, config.bio.x, config.bio.y);

  ctx.font = `${config.username.size}px ${fontFamily}`;
  ctx.fillText(usernameText, config.username.x, config.username.y);

  return canvas.encode("png");
}

module.exports = {
  name: "Fake Telegram Profile",
  desc: "Generate tampilan profil Telegram palsu (foto + nama + nomor + bio + username).",
  category: "Image Creator",
  path: "/api/canvas/faketele?apikey=&photo=&nama=&nomor=&bio=&username=",
  async run(req, res) {
    if (!checkApikey(req, res)) return;

    const { photo, nama, nomor, bio, username } = req.query;
    if (!photo || !nama || !nomor || !bio || !username) {
      return res.status(400).json({ status: false, error: "Parameter 'photo', 'nama', 'nomor', 'bio', dan 'username' wajib diisi" });
    }

    try {
      const buffer = await generateFakeTele(photo, nama.trim(), nomor.trim(), bio.trim(), username.trim());
      sendPng(res, buffer);
    } catch (error) {
      console.error("Faketele Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal generate faketele (cek url foto valid?)" });
    }
  }
};
