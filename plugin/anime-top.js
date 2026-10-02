const axios = require("axios");

module.exports = {
  name: "Anime Top List",
  desc: "Daftar anime teratas. Atur filter=airing|upcoming|bypopularity|favorite (default bypopularity).",
  category: "Anime",
  path: "/api/anime/top?apikey=&filter=bypopularity",
  async run(req, res) {
    const { apikey, filter } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }

    try {
      const response = await axios.get(`https://api.jikan.moe/v4/top/anime?filter=${filter || "bypopularity"}&limit=15`, {
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      return res.status(200).json({ status: true, result: response.data.data });
    } catch (error) {
      console.error("Anime Top List Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data anime: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
