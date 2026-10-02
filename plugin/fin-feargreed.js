const axios = require("axios");

module.exports = {
  name: "Crypto Fear & Greed Index",
  desc: "Indeks sentimen pasar kripto hari ini (Extreme Fear s.d. Extreme Greed).",
  category: "Finance",
  path: "/api/finance/crypto-feargreed?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }

    try {
      const response = await axios.get("https://api.alternative.me/fng/", { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.data[0] });
    } catch (error) {
      console.error("Crypto Fear & Greed Index Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
