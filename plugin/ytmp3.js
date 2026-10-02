const { downloadAudioWithFallback } = require("./lib/yt-providers");

module.exports = {
  name: "Youtube Mp3 Downloader",
  desc: "Download audio (mp3) dari video Youtube. Otomatis fallback ke provider lain kalau provider utama gagal/lambat, jadi lebih stabil & cepat.",
  category: "Downloader",
  path: "/api/download/ytmp3?apikey=&url=",
  async run(req, res) {
    const { url, apikey, quality } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    const allowedQuality = ["320", "256", "128", "64"];
    const q = allowedQuality.includes(quality) ? quality : "320"; // auto: kualitas terbaik

    try {
      const started = Date.now();
      const result = await downloadAudioWithFallback(url, q);

      return res.status(200).json({
        status: true,
        result: {
          title: result.title,
          duration: result.duration || null,
          downloadUrl: result.downloadUrl,
          provider: result.provider,
          time_ms: Date.now() - started
        }
      });
    } catch (error) {
      return res.status(502).json({
        status: false,
        error: error.message || "Semua provider gagal, coba lagi beberapa saat lagi"
      });
    }
  }
};
