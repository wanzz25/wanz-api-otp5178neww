const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Grammar Check",
  desc: "Periksa dan perbaiki tata bahasa Inggris/Indonesia dari sebuah kalimat.",
  category: "AI",
  path: "/api/ai/grammar-check?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const result = await textGen(text, { model: "openai", system: "Periksa tata bahasa kalimat berikut. Berikan versi yang sudah diperbaiki, lalu jelaskan singkat kesalahan yang ditemukan" });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Grammar Check Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
