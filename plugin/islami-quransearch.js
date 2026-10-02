const axios = require("axios");

module.exports = {
  name: "Cari Kata di Al-Quran",
  desc: "Cari kata kunci di dalam terjemahan Al-Quran bahasa Indonesia.",
  category: "Info",
  path: "/api/islami/quran-search?apikey=&query=sabar",
  async run(req, res) {
    const { apikey, query } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!query) {
      return res.status(400).json({ status: false, error: "Parameter 'query' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/id.indonesian`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.data });
    } catch (error) {
      console.error("Cari Kata di Al-Quran Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
