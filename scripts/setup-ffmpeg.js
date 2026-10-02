// Dijalankan otomatis lewat "postinstall" di package.json.
// Memastikan ffmpeg tersedia. Tidak pernah membuat npm install gagal.
const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");
const { execFileSync } = require("child_process");

const BIN_DIR = path.join(__dirname, "..", "bin");
const TARGET = path.join(BIN_DIR, "ffmpeg");

function works(bin) {
  try {
    execFileSync(bin, ["-version"], { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function download(url, dest, redirects = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        res.resume();
        return resolve(download(res.headers.location, dest, redirects - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error("HTTP " + res.statusCode));
      }
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on("finish", () => out.close(resolve));
      out.on("error", reject);
    }).on("error", reject);
  });
}

(async () => {
  try {
    if (process.env.VERCEL) return console.log("[setup-ffmpeg] Vercel terdeteksi, pakai ffmpeg-static.");
    if (process.platform !== "linux") return console.log("[setup-ffmpeg] Bukan Linux, dilewati.");

    if (fs.existsSync(TARGET) && works(TARGET)) return console.log("[setup-ffmpeg] bin/ffmpeg sudah ada.");

    try {
      const p = require("ffmpeg-static");
      if (p && fs.existsSync(p) && works(p)) return console.log("[setup-ffmpeg] ffmpeg-static OK.");
    } catch (e) {}

    if (works("ffmpeg")) return console.log("[setup-ffmpeg] ffmpeg sistem ditemukan.");

    const arch = process.arch === "arm64" ? "arm64" : "amd64";
    const url = `https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-${arch}-static.tar.xz`;
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ffdl-"));
    const archive = path.join(tmp, "ffmpeg.tar.xz");

    console.log("[setup-ffmpeg] Mengunduh ffmpeg dari", url);
    await download(url, archive);
    execFileSync("tar", ["-xJf", archive, "-C", tmp, "--wildcards", "*/ffmpeg", "--strip-components=1"]);

    fs.mkdirSync(BIN_DIR, { recursive: true });
    fs.copyFileSync(path.join(tmp, "ffmpeg"), TARGET);
    fs.chmodSync(TARGET, 0o755);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log("[setup-ffmpeg] Selesai:", TARGET);
  } catch (e) {
    console.warn("[setup-ffmpeg] Gagal (diabaikan):", e.message);
  }
})();
