const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { getFfmpegPath } = require("./lib/ffmpeg");
const { fetchImageBuffer } = require("./lib/canvas-common");
const execFileAsync = promisify(execFile);

module.exports = {
  name: "Image Grayscale",
  desc: "Ubah gambar dari URL menjadi hitam-putih (grayscale).",
  category: "Image",
  path: "/api/tools/image-grayscale?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;

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
      const outPath = path.join(tmpDir, "out.png");
      fs.writeFileSync(inPath, buffer);

      const filterArg = "format=gray,format=rgba";

      await execFileAsync(getFfmpegPath(), [
        "-y", "-i", inPath, "-vf", filterArg, "-frames:v", "1", outPath
      ]);

      const result = fs.readFileSync(outPath);
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": result.length });
      return res.end(result);
    } catch (error) {
      console.error("Image Grayscale Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses gambar: " + String(error.stderr || error.message || error).replace(/\s+/g, " ").slice(0, 300)
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
};
