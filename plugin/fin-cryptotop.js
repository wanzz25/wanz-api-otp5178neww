const axios = require("axios");

module.exports = {
  name: "Top Koin Kripto",
  desc: "15 koin kripto dengan kapitalisasi pasar terbesar (dalam Rupiah).",
  category: "Finance",
  path: "/api/finance/crypto-top?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }

    try {
      const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
        params: { vs_currency: "idr", order: "market_cap_desc", per_page: 15, page: 1 },
        timeout: 15000
      });
      return res.status(200).json({ status: true, result: response.data });
    } catch (error) {
      console.error("Top Koin Kripto Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
