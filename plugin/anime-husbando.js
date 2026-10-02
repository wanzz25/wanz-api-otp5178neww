const axios = require("axios");

module.exports = {
  name: "Anime Husbando",
  desc: "Ilustrasi karakter pria anime lengkap dengan nama ilustrator.",
  category: "Anime",
  path: "/api/anime/husbando?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const response = await axios.get(`https://nekos.best/api/v2/husbando`, {
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const data = response.data;
      const result = data.results[0];
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Anime Husbando Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
