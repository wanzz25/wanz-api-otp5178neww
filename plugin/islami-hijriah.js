const axios = require("axios");

module.exports = {
  name: "Kalender Hijriah",
  desc: "Konversi tanggal Masehi ke Hijriah. Kirim tanggal format DD-MM-YYYY.",
  category: "Info",
  path: "/api/islami/kalender-hijriah?apikey=&tanggal=30-09-2026",
  async run(req, res) {
    const { apikey, tanggal } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!tanggal) {
      return res.status(400).json({ status: false, error: "Parameter 'tanggal' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api.aladhan.com/v1/gToH/${tanggal}`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.data });
    } catch (error) {
      console.error("Kalender Hijriah Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
