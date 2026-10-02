const axios = require("axios");

module.exports = {
  name: "Anime Pat GIF",
  desc: "GIF animasi mengelus kepala ala anime.",
  category: "Anime",
  path: "/api/anime/pat?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const response = await axios.get(`https://api.waifu.pics/sfw/pat`, {
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const data = response.data;
      const result = data.url;
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Anime Pat GIF Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
