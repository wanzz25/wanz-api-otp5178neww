const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { getFfmpegPath } = require("./lib/ffmpeg");
const { fetchImageBuffer } = require("./lib/canvas-common");
const execFileAsync = promisify(execFile);

module.exports = {
  name: "Image Format Converter",
  desc: "Konversi gambar dari URL ke format lain. Kirim format=png|jpg|webp (default png).",
  category: "Image",
  path: "/api/tools/image-convert?apikey=&url=&format=webp",
  async run(req, res) {
    const { apikey, url, format } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "imgtool-"));
    try {
      const buffer = await fetchImageBuffer(url);
      const inPath = path.join(tmpDir, "in");
      const fmt = ["png", "jpg", "jpeg", "webp"].includes(String(format || "").toLowerCase()) ? String(format).toLowerCase() : "png";
      const outPath = path.join(tmpDir, "out." + (fmt === "jpg" ? "jpeg" : fmt));
      fs.writeFileSync(inPath, buffer);

      const args = fmt === "jpeg" || fmt === "jpg"
        ? ["-y", "-i", inPath, "-vf", "format=yuvj420p", "-frames:v", "1", outPath]
        : ["-y", "-i", inPath, "-vf", "format=rgba", "-frames:v", "1", outPath];
      await execFileAsync(getFfmpegPath(), args);

      const mimeMap = { png: "image/png", jpeg: "image/jpeg", jpg: "image/jpeg", webp: "image/webp" };
      const result = fs.readFileSync(outPath);
      res.writeHead(200, { "Content-Type": mimeMap[fmt], "Content-Length": result.length });
      return res.end(result);
    } catch (error) {
      console.error("Image Format Converter Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses gambar: " + String(error.stderr || error.message || error).replace(/\s+/g, " ").slice(0, 300)
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
};
