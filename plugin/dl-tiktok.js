const axios = require("axios");

module.exports = {
  name: "TikTok Downloader",
  desc: "Download video TikTok tanpa watermark, dengan watermark, dan audio MP3-nya.",
  category: "Downloader",
  path: "/api/dl/tiktok?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    try {
      const response = await axios.get("https://www.tikwm.com/api/", {
        params: { url },
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const d = response.data;
      if (!d || d.code !== 0 || !d.data) {
        return res.status(500).json({ status: false, error: "Gagal mengambil video, pastikan URL TikTok valid" });
      }
      return res.status(200).json({
        status: true,
        result: {
          title: d.data.title,
          author: d.data.author,
          noWatermark: d.data.play,
          watermark: d.data.wmplay,
          music: d.data.music,
          cover: d.data.cover
        }
      });
    } catch (error) {
      console.error("TikTok Downloader Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
