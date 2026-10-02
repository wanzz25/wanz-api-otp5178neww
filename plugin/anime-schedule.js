const axios = require("axios");

module.exports = {
  name: "Anime Schedule",
  desc: "Jadwal rilis anime harian. Atur day=monday..sunday.",
  category: "Anime",
  path: "/api/anime/schedule?apikey=&day=monday",
  async run(req, res) {
    const { apikey, day } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!day) {
      return res.status(400).json({ status: false, error: "Parameter 'day' wajib diisi (monday..sunday)" });
    }
    try {
      const response = await axios.get(`https://api.jikan.moe/v4/schedules?filter=${day}`, {
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      return res.status(200).json({ status: true, result: response.data.data });
    } catch (error) {
      console.error("Anime Schedule Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data anime: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
