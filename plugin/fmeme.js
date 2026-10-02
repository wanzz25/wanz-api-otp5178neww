const axios = require("axios");
const FormData = require("form-data");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const { writeFile, mkdir } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const BG_URL = "https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/IMG-20260710-WA1772.jpg";
const ASSETS_DIR = path.join(os.tmpdir(), "wanz-fmeme");
const FONTS_DIR = path.join(ASSETS_DIR, "fonts");
const BG_LOCAL = path.join(ASSETS_DIR, "template_polisi.png");
const FONT_URL = "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2";
const FONT_NAME = "Inter-Bold.ttf";
const FONT_FAMILY = "MemeInterBold";

let fontReady = false;

async function uploadUguu(buffer) {
  const form = new FormData();
  form.append("files[]", buffer, "image.png");

  const { data } = await axios.post("https://uguu.se/upload.php", form, {
    headers: form.getHeaders()
  });

  return data.files[0].url;
}

async function ensureAssets() {
  await mkdir(FONTS_DIR, { recursive: true });

  const fPath = path.join(FONTS_DIR, FONT_NAME);
  if (!existsSync(fPath)) {
    const fRes = await axios.get(FONT_URL, { responseType: "arraybuffer", headers: { "User-Agent": "Mozilla/5.0" } });
    await writeFile(fPath, Buffer.from(fRes.data));
  }
  if (!fontReady) {
    GlobalFonts.registerFromPath(fPath, FONT_FAMILY);
    fontReady = true;
  }

  if (!existsSync(BG_LOCAL)) {
    const res = await axios.get(BG_URL, { responseType: "arraybuffer", headers: { "User-Agent": "Mozilla/5.0" } });
    await writeFile(BG_LOCAL, Buffer.from(res.data));
  }
}

async function generateFmeme(username, text) {
  await ensureAssets();

  const txtUsername = username.trim().startsWith("~") ? username.trim() : `~ ${username.trim()}`;
  const txtMeme = text.trim();

  const bgImg = await loadImage(BG_LOCAL);
  const canvas = createCanvas(bgImg.width, bgImg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  const paperX = 404;
  const paperY = 324;
  const paperW = 53;
  const paperH = 120;

  let fontSize = 23;
  let lineHeight = 31;

  const senderSize = 15;
  const senderOffset = 0;

  const words = txtMeme.split(/\s+/);
  const lines = [];
  for (let i = 0; i < words.length; i += 2) {
    const pair = words.slice(i, i + 2).join(" ");
    if (pair) lines.push(pair);
  }

  const safetyMargin = senderSize + senderOffset + 10;
  const maxTextHeight = paperH - safetyMargin;

  while (fontSize > 8) {
    const totalHeight = lines.length * lineHeight;
    if (totalHeight <= maxTextHeight) break;
    fontSize -= 1;
    lineHeight -= 1.2;
  }

  const centerX = paperX + (paperW / 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "#262626";
  ctx.font = `bold ${senderSize}px ${FONT_FAMILY}`;
  ctx.fillText(txtUsername, centerX, paperY + paperH - senderOffset);

  const totalTextHeight = lines.length * lineHeight;
  let startY = paperY + ((maxTextHeight - totalTextHeight) / 2);
  if (startY < paperY) startY = paperY;

  ctx.textBaseline = "top";
  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;

  lines.forEach((line, index) => {
    const currentY = startY + (index * lineHeight);
    if (currentY + fontSize <= paperY + maxTextHeight) {
      ctx.fillText(line, centerX, currentY);
    }
  });

  const canvasBuffer = await canvas.encode("png");
  const url = await uploadUguu(canvasBuffer);

  return { image_url: url, username: txtUsername, text: txtMeme };
}

module.exports = {
  name: "Fmeme (Timpa Meme)",
  desc: "Generate meme timpa-template polisi (username + teks) lalu upload ke uguu.se.",
  category: "Image Creator",
  path: "/api/canvas/fmeme?apikey=&username=&text=",
  async run(req, res) {
    const { apikey, username, text } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!username || !text) {
      return res.status(400).json({ status: false, error: "Parameter 'username' dan 'text' wajib diisi" });
    }

    try {
      const result = await generateFmeme(username, text);
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Fmeme Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses gambar fmeme" });
    }
  }
};
