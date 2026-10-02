const axios = require("axios");

module.exports = {
  name: "Advice Slip (English)",
  desc: "Saran kehidupan singkat acak dalam bahasa Inggris.",
  category: "Fun",
  path: "/api/fun/advice-en?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }

    try {
      const response = await axios.get("https://api.adviceslip.com/advice", { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.slip.advice });
    } catch (error) {
      console.error("Advice Slip (English) Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
