const axios = require("axios");

module.exports = {
  name: "Detail Surah",
  desc: "Seluruh ayat dalam satu surah (Arab, latin, terjemahan) beserta link audio. Kirim nomor surah.",
  category: "Info",
  path: "/api/islami/surah-detail?apikey=&nomor=36",
  async run(req, res) {
    const { apikey, nomor } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!nomor) {
      return res.status(400).json({ status: false, error: "Parameter 'nomor' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://equran.id/api/v2/surat/${nomor}`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.data });
    } catch (error) {
      console.error("Detail Surah Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
