const axios = require("axios");

module.exports = {
  name: "Anime Yeet GIF",
  desc: "GIF animasi melempar karakter ala anime.",
  category: "Anime",
  path: "/api/anime/yeet?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const response = await axios.get("https://api.waifu.pics/sfw/yeet", { timeout: 15000, headers: { "User-Agent": "Mozilla/5.0" } });
      return res.status(200).json({ status: true, result: response.data.url });
    } catch (error) {
      console.error("Anime Yeet GIF Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
