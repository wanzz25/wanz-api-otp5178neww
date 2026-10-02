const axios = require("axios");
const { writeFile } = require("node:fs/promises");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CACHE_DIR = path.join(os.tmpdir(), "wanz-canvas-cache");

async function ensureCached(url, filename) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const localPath = path.join(CACHE_DIR, filename);

  if (!fs.existsSync(localPath)) {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 20000
    });
    await writeFile(localPath, Buffer.from(res.data));
  }

  return localPath;
}

async function fetchImageBuffer(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 30000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  return Buffer.from(res.data);
}

function checkApikey(req, res) {
  const { apikey } = req.query;
  if (!apikey || !global.apikey.includes(apikey)) {
    res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    return false;
  }
  return true;
}

function sendPng(res, buffer) {
  res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
  res.end(buffer);
}

let emojiMapCache = null;
async function loadAppleEmojiMap() {
  if (emojiMapCache) return emojiMapCache;
  const url = "https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json";
  const localPath = await ensureCached(url, "emoji-apple.json");
  emojiMapCache = JSON.parse(fs.readFileSync(localPath, "utf-8"));
  return emojiMapCache;
}

module.exports = { ensureCached, fetchImageBuffer, checkApikey, sendPng, loadAppleEmojiMap, CACHE_DIR };
