const axios = require("axios");

module.exports = {
  name: "BMKG Gempa M5+",
  desc: "Daftar gempa bumi magnitudo 5.0 ke atas menurut BMKG.",
  category: "Info",
  path: "/api/info/bmkg-gempa-m5?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }

    try {
      const response = await axios.get("https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json", { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.Infogempa.gempa });
    } catch (error) {
      console.error("BMKG Gempa M5+ Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
