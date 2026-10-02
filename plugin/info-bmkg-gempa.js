const axios = require("axios");

module.exports = {
  name: "BMKG Gempa Terbaru",
  desc: "Data gempa bumi terbaru dari BMKG lengkap dengan peta Shakemap.",
  category: "Info",
  path: "/api/info/bmkg-gempa?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }

    try {
      const response = await axios.get("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json", { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.Infogempa.gempa });
    } catch (error) {
      console.error("BMKG Gempa Terbaru Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
