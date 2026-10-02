const axios = require("axios");

module.exports = {
  name: "Daftar Surah Al-Quran",
  desc: "Daftar 114 surah Al-Quran beserta arti, jumlah ayat, dan tempat turunnya.",
  category: "Info",
  path: "/api/islami/surah-list?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }

    try {
      const response = await axios.get("https://equran.id/api/v2/surat", { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.data });
    } catch (error) {
      console.error("Daftar Surah Al-Quran Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
