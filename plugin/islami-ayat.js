const axios = require("axios");

module.exports = {
  name: "Ayat Al-Quran",
  desc: "Teks Arab, latin, terjemahan, dan audio satu ayat tertentu. Parameter: surah, ayat.",
  category: "Info",
  path: "/api/islami/ayat?apikey=&surah=2&ayat=255",
  async run(req, res) {
    const { apikey, surah, ayat } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!surah) {
      return res.status(400).json({ status: false, error: "Parameter 'surah' wajib diisi" });
    }
    if (!ayat) {
      return res.status(400).json({ status: false, error: "Parameter 'ayat' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api.alquran.cloud/v1/ayah/${surah}:${ayat}/editions/quran-uthmani,id.indonesian,ar.alafasy`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.data });
    } catch (error) {
      console.error("Ayat Al-Quran Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
