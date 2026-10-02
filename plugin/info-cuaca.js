const axios = require("axios");

module.exports = {
  name: "Cuaca Kota",
  desc: "Suhu, kelembapan, kecepatan angin saat ini dan prakiraan 3 hari untuk sebuah kota (via Open-Meteo geocoding + forecast).",
  category: "Info",
  path: "/api/info/cuaca-kota?apikey=&kota=Surabaya",
  async run(req, res) {
    const { apikey, kota } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!kota) {
      return res.status(400).json({ status: false, error: "Parameter 'kota' wajib diisi" });
    }
    try {
      const geo = await axios.get("https://geocoding-api.open-meteo.com/v1/search", { params: { name: kota, count: 1, language: "id" }, timeout: 15000 });
      const place = geo.data.results && geo.data.results[0];
      if (!place) return res.status(404).json({ status: false, error: "Kota tidak ditemukan" });
      const weather = await axios.get("https://api.open-meteo.com/v1/forecast", {
        params: {
          latitude: place.latitude, longitude: place.longitude,
          current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
          daily: "temperature_2m_max,temperature_2m_min,weather_code",
          timezone: "auto", forecast_days: 3
        },
        timeout: 15000
      });
      return res.status(200).json({
        status: true,
        result: { kota: place.name, negara: place.country, lat: place.latitude, lon: place.longitude, current: weather.data.current, forecast3hari: weather.data.daily }
      });
    } catch (error) {
      console.error("Cuaca Kota Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
