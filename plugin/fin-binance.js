const axios = require("axios");

module.exports = {
  name: "Harga Kripto Binance",
  desc: "Harga pasar kripto global dari Binance. Kirim symbol, contoh: BTCUSDT.",
  category: "Finance",
  path: "/api/finance/crypto-binance?apikey=&symbol=BTCUSDT",
  async run(req, res) {
    const { apikey, symbol } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!symbol) {
      return res.status(400).json({ status: false, error: "Parameter 'symbol' wajib diisi" });
    }
    try {
      const response = await axios.get("https://api.binance.com/api/v3/ticker/24hr", { params: { symbol: String(symbol).toUpperCase() }, timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data });
    } catch (error) {
      console.error("Harga Kripto Binance Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
