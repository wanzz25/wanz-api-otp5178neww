const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const { ensureCached, fetchImageBuffer, checkApikey, sendPng, loadAppleEmojiMap } = require("./lib/canvas-common");

const BG_URL = "https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/3b1a98bd-2ebd-4035-a645-f42556300408.png";

let fontReady = false;
const emojiImageCache = new Map();

const EMOJI_DETECTOR = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u;

function emojiToUnicode(emoji) {
  return [...emoji].map(c => c.codePointAt(0).toString(16).padStart(4, "0")).join("-");
}

async function getEmojiImage(emoji, appleEmojiMap) {
  if (emojiImageCache.has(emoji)) return emojiImageCache.get(emoji);
  const base = emojiToUnicode(emoji);
  const variants = [base, base.replace(/-fe0f/gi, ""), `${base.replace(/-fe0f/gi, "")}-fe0f`, base.toUpperCase(), base.replace(/-fe0f/gi, "").toUpperCase(), base.replace(/-fe0f/gi, "").toUpperCase() + "-FE0F"];
  let b64 = null;
  for (const v of variants) {
    if (appleEmojiMap[v]) { b64 = appleEmojiMap[v]; break; }
  }
  if (!b64) return null;
  const img = await loadImage(Buffer.from(b64, "base64"));
  emojiImageCache.set(emoji, img);
  return img;
}

function parseTextAndEmojis(textStr) {
  const tokens = [];
  const chars = [...textStr];
  let currentText = "";

  for (let i = 0; i < chars.length; i++) {
    if (EMOJI_DETECTOR.test(chars[i])) {
      if (currentText) { tokens.push({ type: "text", value: currentText }); currentText = ""; }
      let emojiVal = chars[i];
      if (chars[i + 1] === "\uFE0F") { emojiVal += chars[i + 1]; i++; }
      tokens.push({ type: "emoji", value: emojiVal });
    } else {
      currentText += chars[i];
    }
  }
  if (currentText) tokens.push({ type: "text", value: currentText });
  return tokens;
}

function measureTextCustom(context, tokens, fontSize) {
  let totalWidth = 0;
  for (const token of tokens) {
    totalWidth += token.type === "emoji" ? fontSize * 1.05 : context.measureText(token.value).width;
  }
  return totalWidth;
}

async function drawTextWithEmojisCenter(canvas, context, textStr, yPos, fontSize, fontString, appleEmojiMap) {
  context.font = fontString;
  context.textBaseline = "top";

  const tokens = parseTextAndEmojis(textStr);
  const totalWidth = measureTextCustom(context, tokens, fontSize);
  let currentX = (canvas.width / 2) - (totalWidth / 2);

  for (const token of tokens) {
    if (token.type === "emoji") {
      const emojiSize = fontSize * 1.05;
      const img = await getEmojiImage(token.value, appleEmojiMap);
      if (img) {
        context.drawImage(img, currentX, yPos + (fontSize - emojiSize) / 2, emojiSize, emojiSize);
      } else {
        context.fillText(token.value, currentX, yPos);
      }
      currentX += emojiSize;
    } else {
      context.fillText(token.value, currentX, yPos);
      currentX += context.measureText(token.value).width;
    }
  }
}

async function generateFakeCall2(photoUrl, nama, durasi) {
  const boldPath = await ensureCached("https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2", "fakecall2_roboto_bold.woff2");
  const regularPath = await ensureCached("https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2", "fakecall2_roboto_regular.woff2");
  const bgLocal = await ensureCached(BG_URL, "fakecall2_bg.png");
  const appleEmojiMap = await loadAppleEmojiMap();

  if (!fontReady) {
    GlobalFonts.registerFromPath(boldPath, "RobotoWA");
    GlobalFonts.registerFromPath(regularPath, "RobotoWA");
    fontReady = true;
  }

  const ppBuffer = await fetchImageBuffer(photoUrl);
  const avImg = await loadImage(ppBuffer);
  const bgImg = await loadImage(bgLocal);

  const canvas = createCanvas(bgImg.width, bgImg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  const ppX = canvas.width / 2;
  const ppY = 728;
  const ppRadius = 220;

  ctx.save();
  ctx.beginPath();
  ctx.arc(ppX, ppY, ppRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avImg, ppX - ppRadius, ppY - ppRadius, ppRadius * 2, ppRadius * 2);
  ctx.restore();

  ctx.fillStyle = "#FFFFFF";
  await drawTextWithEmojisCenter(canvas, ctx, nama, 75, 42, "700 42px RobotoWA, sans-serif", appleEmojiMap);

  ctx.fillStyle = "#AEBAC1";
  await drawTextWithEmojisCenter(canvas, ctx, durasi, 130, 30, "400 30px RobotoWA, sans-serif", appleEmojiMap);

  return canvas.encode("png");
}

module.exports = {
  name: "Fake Call Android",
  desc: "Generate tampilan panggilan WhatsApp Android palsu (foto + nama + durasi), dukung emoji Apple.",
  category: "Image Creator",
  path: "/api/canvas/fakecall2?apikey=&photo=&nama=&durasi=",
  async run(req, res) {
    if (!checkApikey(req, res)) return;

    const { photo, nama, durasi } = req.query;
    if (!photo || !nama || !durasi) {
      return res.status(400).json({ status: false, error: "Parameter 'photo', 'nama', dan 'durasi' wajib diisi" });
    }

    try {
      const buffer = await generateFakeCall2(photo, nama.trim(), durasi.trim());
      sendPng(res, buffer);
    } catch (error) {
      console.error("Fakecall2 Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal generate fakecall2 (cek url foto valid?)" });
    }
  }
};
