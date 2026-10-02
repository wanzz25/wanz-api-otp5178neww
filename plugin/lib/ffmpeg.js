const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Cari binary ffmpeg yang benar-benar bisa dieksekusi (penting di Vercel/serverless).
// ffmpeg-static kadang kehilangan permission execute setelah deploy, jadi disalin
// ke /tmp lalu di-chmod 755.
let cached = null;

function getFfmpegPath() {
  if (cached) return cached;

  const local = path.join(__dirname, "..", "..", "bin", "ffmpeg");
  if (fs.existsSync(local)) {
    try { fs.chmodSync(local, 0o755); } catch (_) {}
    cached = local;
    return cached;
  }

  let src = null;
  try {
    src = require("ffmpeg-static");
  } catch (e) {
    src = null;
  }

  if (src && fs.existsSync(src)) {
    try {
      const dest = path.join(os.tmpdir(), "wanz-ffmpeg");
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
      fs.chmodSync(dest, 0o755);
      cached = dest;
      return cached;
    } catch (e) {
      try {
        fs.chmodSync(src, 0o755);
      } catch (_) {}
      cached = src;
      return cached;
    }
  }

  cached = "ffmpeg"; // fallback ke PATH sistem
  return cached;
}

module.exports = { getFfmpegPath };
