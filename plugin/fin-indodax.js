const axios = require("axios");

module.exports = {
  name: "Harga Kripto Indodax",
  desc: "Harga aset kripto dalam Rupiah dari Indodax. Kirim pair, contoh: btc_idr.",
  category: "Finance",
  path: "/api/finance/crypto-indodax?apikey=&pair=btc_idr",
  async run(req, res) {
    const { apikey, pair } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!pair) {
      return res.status(400).json({ status: false, error: "Parameter 'pair' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://indodax.com/api/${pair}/ticker`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.ticker });
    } catch (error) {
      console.error("Harga Kripto Indodax Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
