const axios = require("axios");

module.exports = {
  name: "Anime Recommendations",
  desc: "Daftar anime serupa/rekomendasi berdasarkan MyAnimeList ID.",
  category: "Anime",
  path: "/api/anime/recommendations?apikey=&id=",
  async run(req, res) {
    const { apikey, id } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!id) {
      return res.status(400).json({ status: false, error: "Parameter 'id' (MyAnimeList ID) wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api.jikan.moe/v4/anime/${id}/recommendations`, {
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      return res.status(200).json({ status: true, result: response.data.data });
    } catch (error) {
      console.error("Anime Recommendations Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data anime: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
