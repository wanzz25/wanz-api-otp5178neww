const axios = require("axios");

module.exports = {
  name: "Anime Search",
  desc: "Cari anime berdasarkan judul (MyAnimeList via Jikan).",
  category: "Anime",
  path: "/api/anime/search?apikey=&query=",
  async run(req, res) {
    const { apikey, query } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!query) {
      return res.status(400).json({ status: false, error: "Parameter 'query' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`, {
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      return res.status(200).json({ status: true, result: response.data.data });
    } catch (error) {
      console.error("Anime Search Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data anime: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
