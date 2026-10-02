const axios = require("axios");

module.exports = {
  name: "Arah Kiblat",
  desc: "Hitung derajat kompas arah Kiblat dari koordinat lat/lon.",
  category: "Info",
  path: "/api/islami/arah-kiblat?apikey=&lat=-6.2088&lon=106.8456",
  async run(req, res) {
    const { apikey, lat, lon } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!lat) {
      return res.status(400).json({ status: false, error: "Parameter 'lat' wajib diisi" });
    }
    if (!lon) {
      return res.status(400).json({ status: false, error: "Parameter 'lon' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api.aladhan.com/v1/qibla/${lat}/${lon}`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.data });
    } catch (error) {
      console.error("Arah Kiblat Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
