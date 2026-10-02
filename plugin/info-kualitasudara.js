const axios = require("axios");

module.exports = {
  name: "Kualitas Udara",
  desc: "Indeks kualitas udara (AQI, PM2.5, PM10) berdasarkan koordinat lat/lon.",
  category: "Info",
  path: "/api/info/kualitas-udara?apikey=&lat=-6.2088&lon=106.8456",
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
      const response = await axios.get("https://air-quality-api.open-meteo.com/v1/air-quality", {
        params: { latitude: lat, longitude: lon, current: "pm10,pm2_5,us_aqi" },
        timeout: 15000
      });
      return res.status(200).json({ status: true, result: response.data.current });
    } catch (error) {
      console.error("Kualitas Udara Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
