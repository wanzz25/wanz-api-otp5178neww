const axios = require("axios");

module.exports = {
  name: "Konversi Kurs Mata Uang",
  desc: "Konversi nilai tukar mata uang dunia real-time. Parameter: from, to, amount.",
  category: "Finance",
  path: "/api/finance/kurs-konversi?apikey=&from=USD&to=IDR&amount=100",
  async run(req, res) {
    const { apikey, from: dari, to: tujuan, amount } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!dari) {
      return res.status(400).json({ status: false, error: "Parameter 'dari' wajib diisi" });
    }
    if (!tujuan) {
      return res.status(400).json({ status: false, error: "Parameter 'tujuan' wajib diisi" });
    }
    if (!amount) {
      return res.status(400).json({ status: false, error: "Parameter 'amount' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://open.er-api.com/v6/latest/${String(dari).toUpperCase()}`, { timeout: 15000 });
      const rate = response.data.rates && response.data.rates[String(tujuan).toUpperCase()];
      if (!rate) return res.status(400).json({ status: false, error: "Kode mata uang tidak ditemukan" });
      return res.status(200).json({ status: true, result: { from: dari, to: tujuan, amount: parseFloat(amount), rate, converted: parseFloat(amount) * rate } });
    } catch (error) {
      console.error("Konversi Kurs Mata Uang Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
