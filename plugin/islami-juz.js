const axios = require("axios");

module.exports = {
  name: "Ayat per Juz",
  desc: "Seluruh daftar surah dan ayat dalam satu Juz Al-Quran. Kirim nomor juz (1-30).",
  category: "Info",
  path: "/api/islami/juz?apikey=&nomor=30",
  async run(req, res) {
    const { apikey, nomor } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!nomor) {
      return res.status(400).json({ status: false, error: "Parameter 'nomor' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api.alquran.cloud/v1/juz/${nomor}/quran-uthmani`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.data });
    } catch (error) {
      console.error("Ayat per Juz Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
